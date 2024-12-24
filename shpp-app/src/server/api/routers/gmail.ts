import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createAuthenticatedGmail,
  formatMessage,
  getMessageContent,
} from "@/server/helpers/gmail";

export const gmailRouter = createTRPCRouter({
  listMessages: protectedProcedure
    .input(z.object({ labelId: z.string().default("INBOX") }))
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
        const gmail = createAuthenticatedGmail(
          session.accessToken,
          session.refreshToken,
        );

        const res = await gmail.users.messages.list({
          userId: "me",
          maxResults: 20,
          labelIds: [labelId],
        });

        const messages = res.data.messages ?? [];

        const messagesWithDetails = await Promise.all(
          messages.map(async (message) => {
            if (!message.id) return null;

            const details = await gmail.users.messages.get({
              userId: "me",
              id: message.id,
              format: "metadata",
              metadataHeaders: ["Subject", "From", "Date"],
            });

            return formatMessage(details.data);
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
        const gmail = createAuthenticatedGmail(
          session.accessToken,
          session.refreshToken,
        );

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
      const gmail = createAuthenticatedGmail(
        session.accessToken,
        session.refreshToken,
      );
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
        const gmail = createAuthenticatedGmail(
          session.accessToken,
          session.refreshToken,
        );

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
});
