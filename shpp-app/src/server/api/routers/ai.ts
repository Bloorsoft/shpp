import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { analyzeEmailImportance, generateEmailDraft } from "@/lib/ai/service";

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
      }),
    )
    .mutation(async ({ input }) => {
      return await generateEmailDraft(input);
    }),
});
