import { digTool } from "./dig";

export const tools = {
  dig: digTool,
} as const;

export type AITools = typeof tools;
