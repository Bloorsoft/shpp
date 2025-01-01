import { generateObject } from "ai";
import {
  type EmailDraft,
  type EmailImportance,
  EmailImportanceSchema,
  EmailDraftSchema,
} from "./schemas";
import { openai } from "@ai-sdk/openai";
import type { GmailMessage } from "@/trpc/shared/gmail";

const cache = new Map<string, EmailImportance>();

export async function analyzeEmailImportance(email: {
  subject: string;
  from: string;
  snippet: string;
}): Promise<EmailImportance> {
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
  threadMessages?: GmailMessage[];
}): Promise<EmailDraft> {
  const model = openai("gpt-4o", {
    structuredOutputs: true,
  });

  const threadContext = input.threadMessages
    ?.map(
      (msg, i) =>
        `Message ${i + 1}:
From: ${msg.from}
Date: ${msg.date}
Content: ${msg.plainContent ?? msg.snippet}
---`,
    )
    .join("\n");

  const userContext = `
    The current user is Parsa Tajik. He is a software engineer at Affirm and also runs a small software development studio called Bloorsoft.
    Parsa is currently 24 years old and lives in San Francisco, CA.
    His email address is parsa1379.tajik@gmail.com.
  `;

  const systemPrompt = `
    You are an expert AI that composes or refines emails on behalf of the user. 

    ${userContext}

    The user may provide a subject, tone, outline, or modifications to an existing draft. 
    You may also see the email thread context and should reply appropriately.
    
    You should always:
    - Produce a well-structured, concise email.
    - Keep a professional but approachable tone (unless otherwise specified by the user).
    - Write in first-person as if you are the user sending the email.
    - Avoid extra fluff or overly verbose language.
    - If this is a reply, ensure it addresses the most recent message in the thread context.
  `;

  let prompt = "";
  if (input.modifications && input.previousDraft) {
    prompt = `Please modify this email draft according to the following request:

=== Previous Draft ===
${input.previousDraft}

=== Requested Modifications ===
${input.modifications}

=== Email Thread Context ===
${threadContext ?? "No previous messages"}`;
  } else {
    prompt = `Write a clear and concise email${
      input.tone ? ` in a ${input.tone} tone` : ""
    }${input.subject ? ` about: ${input.subject}` : ""}.${
      input.outline ? `\n\nIncorporate these points:\n${input.outline}` : ""
    }${
      threadContext
        ? `\nThis is a reply to the following email thread:\n${threadContext}.
        Make sure to respond based on the thread context. Prioritize the most recent message. Write the email as if you are the sender (keep the tone consistent and match the sender's style).`
        : ""
    }`;
  }

  const { object } = await generateObject({
    model,
    schema: EmailDraftSchema,
    prompt,
    system: systemPrompt,
    schemaDescription: "Email draft with structured components",
  });

  return object;
}
