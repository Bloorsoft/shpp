import { z } from "zod";

export const EmailImportanceSchema = z.object({
  importance: z
    .enum(["high", "medium", "low"])
    .describe(
      "high = red (important), medium = yellow (might be important), low = green (can be deleted)",
    ),
  reason: z
    .string()
    .describe("One sentence explanation for the importance classification"),
});

export const EmailDraftSchema = z.object({
  subject: z.string().describe("The subject of the email"),
  greeting: z.string().describe("The greeting of the email"),
  body: z.string().describe("The body of the email"),
  closing: z.string().describe("The closing of the email"),
  signature: z.string().describe("The signature of the email"),
});

export type EmailImportance = z.infer<typeof EmailImportanceSchema>;
export type EmailDraft = z.infer<typeof EmailDraftSchema>;
