import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { GmailService } from "@shpp/database";
import { TRPCError } from "@trpc/server";

export const gmailRouter = createTRPCRouter({
  listMessages: protectedProcedure
    .input(z.object({ labelId: z.string().default("INBOX") }))
    .query(async ({ ctx }) => {
      const { supabase } = ctx;

      const { data: messages } = await supabase
        .from("messages")
        .select(
          `
          id,
          provider_message_id,
          sender,
          recipients,
          body,
          thread: threads (
            id,
            subject,
            snippet
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(20);

      return messages;
    }),

  setupWatch: protectedProcedure.mutation(async ({ ctx }) => {
    const { session, supabase } = ctx;

    const { data: mailAccount } = await supabase
      .from("mail_accounts")
      .select("id")
      .eq("user_id", parseInt(session.user.id))
      .single();

    if (!mailAccount)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Mail account not found",
      });

    const gmailService = new GmailService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      session.accessToken!,
      session.refreshToken!,
    );

    await gmailService.setupWatch(session.user.id, mailAccount.id.toString());
    return { success: true };
  }),
});
