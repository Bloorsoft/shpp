import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  formatMessage,
  getMessageContent,
  GmailClient,
} from "@/server/helpers/gmail";
import type { GmailMessage } from "@/trpc/shared/gmail";
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
        ).client;

        const res = await gmail.users.threads.list({
          userId: "me",
          maxResults: 20,
          labelIds: [labelId],
        });

        const threads = res.data.threads ?? [];

        const messagesWithDetails = await Promise.all(
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

        return messagesWithDetails.filter(
          (msg): msg is NonNullable<typeof msg> => msg !== null,
        );
      } catch (err) {
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

        return (thread.data.messages ?? []).map(getMessageContent);
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
    .input(
      z.object({
        to: z.string(),
        subject: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { to, subject, content } = input;

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

        const message = [
          `To: ${to}`,
          `Subject: ${subject}`,
          "Content-Type: text/html; charset=utf-8",
          "MIME-Version: 1.0",
          "",
          content,
        ].join("\r\n");

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
    .input(
      z.object({
        threadId: z.string(),
        content: z.string(),
        to: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { threadId, content, to } = input;

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

        const message = [
          `To: ${to}`,
          `In-Reply-To: ${lastMessage.id}`,
          `References: ${lastMessage.threadId}`,
          "Content-Type: text/html; charset=utf-8",
          "MIME-Version: 1.0",
          "",
          content,
        ].join("\r\n");

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
});
