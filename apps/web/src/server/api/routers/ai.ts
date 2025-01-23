import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { analyzeEmailImportance, generateEmailDraft } from "@/lib/ai/service";
import type { GmailMessage } from "@/trpc/shared/gmail";
import { EmailDraftSchema } from "@/lib/ai/schemas";
import { DomainInfoSchema, digTool } from "@/lib/ai/tools/dig";
import { openai } from "@ai-sdk/openai";
import type { ToolExecutionOptions } from "ai";

export const aiRouter = createTRPCRouter({
  analyzeEmailImportance: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        from: z.string(),
        snippet: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await analyzeEmailImportance(input);
    }),

  generateDraft: protectedProcedure
    .input(
      z.object({
        subject: z.string().optional(),
        outline: z.string().optional(),
        tone: z.enum(["professional", "casual", "friendly"]).optional(),
        modifications: z.string().optional(),
        previousDraft: z.string().optional(),
        threadMessages: z.array(z.custom<GmailMessage>()).optional(),
        userContext: z
          .object({
            name: z.string(),
            email: z.string(),
            additionalInfo: z.string().optional(),
          })
          .optional(),
      }),
    )
    .output(EmailDraftSchema)
    .mutation(async ({ input }) => {
      return await generateEmailDraft(input);
    }),

  getDomainInfo: protectedProcedure
    .input(
      z.object({
        domain: z.string(),
      }),
    )
    .output(DomainInfoSchema)
    .query(async ({ input }) => {
      const options: ToolExecutionOptions = {
        toolCallId: `dig-${input.domain}`,
        messages: [],
      };
      return await digTool.execute({ domain: input.domain }, options);
    }),
});
