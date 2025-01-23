import { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export class GmailService {
  private supabase;
  private gmail;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    accessToken: string,
    refreshToken: string
  ) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    this.gmail = google.gmail({ version: "v1", auth });
  }

  async setupWatch(userId: string, mailAccountId: string) {
    try {
      // Setup Gmail push notifications
      const response = await this.gmail.users.watch({
        userId: "me",
        requestBody: {
          labelIds: ["INBOX"],
          topicName: `projects/${process.env.GOOGLE_PROJECT_ID}/topics/gmail-notifications`,
        },
      });

      // Update mail account with watch details
      await this.supabase
        .from("mail_accounts")
        .update({
          watch_expiration: response.data.expiration,
          history_id: response.data.historyId,
        })
        .eq("id", mailAccountId);

      return response.data;
    } catch (error) {
      console.error("Failed to setup watch:", error);
      throw error;
    }
  }

  async syncMessages(userId: number, mailAccountId: number, historyId: string) {
    try {
      const response = await this.gmail.users.history.list({
        userId: "me",
        startHistoryId: historyId,
      });

      const history = response.data.history || [];

      for (const item of history) {
        if (item.messagesAdded) {
          for (const message of item.messagesAdded) {
            if (!message.message) continue;

            const messageDetails = await this.gmail.users.messages.get({
              userId: "me",
              id: message.message.id!,
            });

            // Insert into threads and messages tables
            const { data: thread } = await this.supabase
              .from("threads")
              .upsert({
                provider_thread_id: messageDetails.data.threadId!,
                mail_account_id: mailAccountId,
                subject: messageDetails.data.payload?.headers?.find(
                  (h) => h.name === "Subject"
                )?.value,
                snippet: messageDetails.data.snippet,
              })
              .select()
              .single();

            if (!thread) throw new Error("Thread not found");

            await this.supabase.from("messages").insert({
              thread_id: thread.id,
              provider_message_id: messageDetails.data.id!,
              sender: messageDetails.data.payload?.headers?.find(
                (h) => h.name === "From"
              )?.value,
              recipients: messageDetails.data.payload?.headers?.find(
                (h) => h.name === "To"
              )?.value,
              body: messageDetails.data.snippet,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to sync messages:", error);
      throw error;
    }
  }
}
