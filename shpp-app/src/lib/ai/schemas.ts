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

export type EmailImportance = z.infer<typeof EmailImportanceSchema>;
