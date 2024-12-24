import type { RouterOutputs, RouterInputs } from "../react";

export type GmailMessage = RouterOutputs["gmail"]["listMessages"][number];
export type GmailMessageList = RouterOutputs["gmail"]["listMessages"];

export type GmailListMessagesInput = RouterInputs["gmail"]["listMessages"];

export interface GmailMessageDetails {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  htmlContent?: string;
  plainContent?: string;
}
