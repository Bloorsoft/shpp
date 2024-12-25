import { generateObject, type LanguageModel } from "ai";
import { type EmailImportance, EmailImportanceSchema } from "./schemas";
import { openai } from "@ai-sdk/openai";

const cache = new Map<string, EmailImportance>();

export async function analyzeEmailImportance(email: {
  subject: string;
  from: string;
  snippet: string;
}) {
  const cacheKey = `${email.subject}-${email.from}-${email.snippet}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const model = openai("gpt-4o-mini", {
    structuredOutputs: true,
  }) as LanguageModel;

  const { object } = (await generateObject({
    model,
    schema: EmailImportanceSchema,
    prompt: `Analyze this email and determine if it's important or can be deleted:
Subject: ${email.subject}
From: ${email.from}
Preview: ${email.snippet}

You must provide both an importance level and a reason for the classification.
For low importance emails, explain why they can be safely deleted.`,
    schemaDescription: "Email importance classification with explanation",
  })) satisfies { object: EmailImportance };

  cache.set(cacheKey, object);
  return object;
}
