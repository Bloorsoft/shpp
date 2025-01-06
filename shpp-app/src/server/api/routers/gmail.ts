import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  formatMessage,
  getMessageContent,
  GmailClient,
} from "@/server/helpers/gmail";
import type { GmailMessage } from "@/trpc/shared/gmail";

const emailInput = z.object({
  to: z.string(),
  subject: z.string(),
  content: z.string(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(), // base64 encoded file content
        mimeType: z.string(),
      }),
    )
    .optional(),
});

export const gmailRouter = createTRPCRouter({
  listMessages: protectedProcedure
    .input(z.object({ labelId: z.string().default("INBOX") }))
    .output(z.array(z.custom<GmailMessage>()))
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const { labelId } = input;

      if (!session?.accessToken || !session?.refreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing authentication tokens",
        });
      }

      try {
        const gmail = GmailClient.getInstance(
          session.accessToken,
          session.refreshToken,
        );

        await gmail.refreshTokenIfNeeded();

        const res = await gmail.client.users.threads.list({
          userId: "me",
          maxResults: 20,
          labelIds: [labelId],
        });

        const threads = res.data.threads ?? [];

        const messagesWithDetails = await Promise.all(
          threads.map(async (thread) => {
            if (!thread.id) return null;

            const threadDetails = await gmail.client.users.threads.get({
              userId: "me",
              id: thread.id,
              format: "metadata",
              metadataHeaders: ["Subject", "From", "Date"],
            });

            const latestMessage = threadDetails.data.messages?.[0];
            if (!latestMessage) return null;

            return formatMessage({
              ...latestMessage,
              threadId: thread.id,
            });
          }),
        );

        return messagesWithDetails.filter(
          (msg): msg is NonNullable<typeof msg> => msg !== null,
        );
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
  getThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const { threadId } = input;

      if (!session?.accessToken || !session?.refreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing authentication tokens",
        });
      }

      try {
        const gmail = GmailClient.getInstance(
          session.accessToken,
          session.refreshToken,
        ).client;

        const thread = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: "full",
        });

        const messages = thread.data.messages ?? [];
        const profile = await gmail.users.getProfile({ userId: "me" });
        const myEmail = profile.data.emailAddress;

        const participants = new Set<string>();
        messages.forEach((message) => {
          const headers = message.payload?.headers ?? [];
          const fromHeader = headers.find((h) => h.name === "From")?.value;
          const toHeader = headers.find((h) => h.name === "To")?.value;

          const emailRegex = /<(.+?)>|([^,\s]+@[^,\s]+)/g;
          let match;

          if (fromHeader) {
            while ((match = emailRegex.exec(fromHeader)) !== null) {
              const email = match[1] ?? match[2];
              if (email && email !== myEmail) {
                participants.add(email);
              }
            }
          }

          if (toHeader) {
            while ((match = emailRegex.exec(toHeader)) !== null) {
              const email = match[1] ?? match[2];
              if (email && email !== myEmail) {
                participants.add(email);
              }
            }
          }
        });

        const messagesWithParticipants = messages.map((msg) => ({
          ...getMessageContent(msg),
          participants: Array.from(participants),
          myEmail,
        }));

        return messagesWithParticipants;
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
  listLabels: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    if (!session?.accessToken || !session?.refreshToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Missing authentication tokens",
      });
    }

    try {
      const gmail = GmailClient.getInstance(
        session.accessToken,
        session.refreshToken,
      ).client;
      const res = await gmail.users.labels.list({ userId: "me" });
      return res.data.labels ?? [];
    } catch (err) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }),
  sendEmail: protectedProcedure
    .input(emailInput)
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { to, subject, content, attachments } = input;

      if (!session?.accessToken || !session?.refreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing authentication tokens",
        });
      }

      try {
        const gmail = GmailClient.getInstance(
          session.accessToken,
          session.refreshToken,
        ).client;

        const boundary = "boundary" + Date.now().toString();
        const htmlContent = content.replace(/\n/g, "<br>");

        const messageParts = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: multipart/mixed; boundary="' + boundary + '"',
          "MIME-Version: 1.0",
          "",
          `--${boundary}`,
          "Content-Type: text/html; charset=utf-8",
          "",
          htmlContent,
        ];

        // Add attachments if any
        if (attachments?.length) {
          attachments.forEach((attachment) => {
            messageParts.push(
              `--${boundary}`,
              `Content-Type: ${attachment.mimeType}`,
              `Content-Transfer-Encoding: base64`,
              `Content-Disposition: attachment; filename="${attachment.filename}"`,
              "",
              attachment.content,
            );
          });
        }

        messageParts.push(`--${boundary}--`);

        const message = messageParts.join("\r\n");
        const encodedMessage = Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });

        return { success: true };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { messageId } = input;

      if (!session?.accessToken || !session?.refreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing authentication tokens",
        });
      }

      try {
        const gmail = GmailClient.getInstance(
          session.accessToken,
          session.refreshToken,
        ).client;

        await gmail.users.messages.trash({
          userId: "me",
          id: messageId,
        });

        return { success: true };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
  searchMessages: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        maxResults: z.number().default(20),
      }),
    )
    .output(z.array(z.custom<GmailMessage>()))
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const { query, maxResults } = input;

      if (!session?.accessToken || !session?.refreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing authentication tokens",
        });
      }

      try {
        const gmail = GmailClient.getInstance(
          session.accessToken,
          session.refreshToken,
        ).client;

        const res = await gmail.users.threads.list({
          userId: "me",
          maxResults,
          q: query,
        });

        const threads = res.data.threads ?? [];

        const threadsWithDetails = await Promise.all(
          threads.map(async (thread) => {
            if (!thread.id) return null;

            const threadDetails = await gmail.users.threads.get({
              userId: "me",
              id: thread.id,
              format: "metadata",
              metadataHeaders: ["Subject", "From", "Date"],
            });

            const latestMessage = threadDetails.data.messages?.[0];
            if (!latestMessage) return null;

            return formatMessage({
              ...latestMessage,
              threadId: thread.id,
            });
          }),
        );

        return threadsWithDetails.filter(
          (msg): msg is NonNullable<typeof msg> => msg !== null,
        );
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
  sendReply: protectedProcedure
    .input(emailInput.extend({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { threadId, to, subject, content, attachments } = input;

      if (!session?.accessToken || !session?.refreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing authentication tokens",
        });
      }

      try {
        const gmail = GmailClient.getInstance(
          session.accessToken,
          session.refreshToken,
        ).client;

        const thread = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
        });

        const lastMessage =
          thread.data.messages?.[thread.data.messages.length - 1];
        if (!lastMessage) throw new Error("No messages in thread");

        const boundary = "boundary" + Date.now().toString();
        const htmlContent = content.replace(/\n/g, "<br>");

        const messageParts = [
          `To: ${to}`,
          `Subject: ${subject}`,
          `In-Reply-To: ${lastMessage.id}`,
          `References: ${lastMessage.threadId}`,
          'Content-Type: multipart/mixed; boundary="' + boundary + '"',
          "MIME-Version: 1.0",
          "",
          `--${boundary}`,
          "Content-Type: text/html; charset=utf-8",
          "",
          htmlContent,
        ];

        if (attachments?.length) {
          attachments.forEach((attachment) => {
            messageParts.push(
              `--${boundary}`,
              `Content-Type: ${attachment.mimeType}`,
              `Content-Transfer-Encoding: base64`,
              `Content-Disposition: attachment; filename="${attachment.filename}"`,
              "",
              attachment.content,
            );
          });
        }

        messageParts.push(`--${boundary}--`);

        const message = messageParts.join("\r\n");
        const encodedMessage = Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
            threadId,
          },
        });

        return { success: true };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
  getAttachment: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        attachmentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const { messageId, attachmentId } = input;

      if (!session?.accessToken || !session?.refreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing authentication tokens",
        });
      }

      try {
        const gmail = GmailClient.getInstance(
          session.accessToken,
          session.refreshToken,
        ).client;

        const attachment = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId,
          id: attachmentId,
        });

        return attachment.data;
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
});
