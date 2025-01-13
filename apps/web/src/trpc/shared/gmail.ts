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
  participants?: string[];
  myEmail?: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

export interface ThreadParticipant {
  email: string;
  isMe: boolean;
}

export type GmailMessageList = GmailMessage[];

export type GmailListMessagesInput = RouterInputs["gmail"]["listMessages"];
