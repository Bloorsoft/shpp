import { generateObject, tool } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";

// Define a schema for the tool's response
export const DomainInfoSchema = z.object({
  domain: z.string().describe("The domain to fetch information from"),
  summary: z.string().describe("The summary of the website"),
  companyName: z.string().describe("The name of the company"),
  description: z.string().describe("The description of the company"),
  success: z.boolean().describe("Whether the operation was successful"),
  error: z.string().describe("The error message if the operation failed"),
});

export type DomainInfo = z.infer<typeof DomainInfoSchema>;

export const digTool = tool({
  description:
    "Fetch and summarize information from a company's website domain",
  parameters: z.object({
    domain: z
      .string()
      .describe("The domain to fetch information from (e.g., bloorsoft.com)"),
  }),
  execute: async ({ domain }) => {
    try {
      // Use absolute URL
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const response = await fetch(
        `${baseUrl}/api/scraper?domain=${encodeURIComponent(domain)}`,
      );
      const data = (await response.json()) as {
        title: string;
        metaDescription: string;
        ogDescription: string;
        mainContent: string;
        success: boolean;
        error: string;
      };

      if (!data.success) {
        throw new Error(data.error);
      }

      const model = openai("gpt-4o-mini", { structuredOutputs: true });
      const { object } = await generateObject({
        model,
        schema: DomainInfoSchema,
        prompt: `Analyze this website content:
Title: ${data.title}
Meta Description: ${data.metaDescription}
OG Description: ${data.ogDescription}
Main Content: ${data.mainContent}`,
        schemaDescription: "Website information structured and summarized",
      });

      return {
        ...object,
        domain,
        success: true,
      };
    } catch (error) {
      return {
        domain,
        summary: "Unable to fetch domain information",
        companyName: "",
        description: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
