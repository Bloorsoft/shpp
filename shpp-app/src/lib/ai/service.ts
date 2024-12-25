import { generateObject, generateText } from "ai";
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

  const model = openai("gpt-4o-mini", {
    structuredOutputs: true,
  });

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

export async function generateEmailDraft(input: {
  subject?: string;
  outline?: string;
  tone?: "professional" | "casual" | "friendly";
  modifications?: string;
  previousDraft?: string;
}) {
  const model = openai("gpt-4o");

  let prompt = "";
  if (input.modifications && input.previousDraft) {
    prompt = `Please modify this email draft according to the following request:

Previous draft:
${input.previousDraft}

Requested modifications:
${input.modifications}`;
  } else {
    prompt = `Write a clear and concise email${
      input.tone ? ` in a ${input.tone} tone` : ""
    }${input.subject ? ` about: ${input.subject}` : ""}.${
      input.outline ? `\n\nIncorporate these points:\n${input.outline}` : ""
    }`;
  }

  const { text } = await generateText({
    model,
    system: `You are an expert email writer who helps users draft effective emails.
Your emails should be:
- Clear and concise
- Well-structured
- Professional yet approachable
- Free of fluff and unnecessary words`,
    prompt,
  });

  return text;
}
