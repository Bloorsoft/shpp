import type { RouterInputs } from "../react";

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  htmlContent?: string;
  plainContent?: string;
}

export type GmailMessageList = GmailMessage[];

export type GmailListMessagesInput = RouterInputs["gmail"]["listMessages"];
