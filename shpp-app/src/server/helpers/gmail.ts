import { google, type gmail_v1 } from "googleapis";
import { TRPCError } from "@trpc/server";

export class GmailClient {
  private static instances = new Map<string, GmailClient>();
  private gmail: gmail_v1.Gmail;
  private lastUsed: number;
  private instanceKey: string;
  private static readonly TIMEOUT = 5 * 60 * 1000; // 5 minutes

  private constructor(accessToken: string, refreshToken: string) {
    this.instanceKey = `${accessToken}:${refreshToken}`;

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: "v1", auth });
    this.lastUsed = Date.now();
  }

  public static getInstance(accessToken: string, refreshToken: string): GmailClient {
    const key = `${accessToken}:${refreshToken}`;
    let instance = this.instances.get(key);

    if (!instance) {
      instance = new GmailClient(accessToken, refreshToken);
      this.instances.set(key, instance);
    }

    instance.lastUsed = Date.now();
    return instance;
  }

  public static cleanup() {
    const now = Date.now();
    for (const [key, instance] of this.instances) {
      if (now - instance.lastUsed > this.TIMEOUT) {
        this.instances.delete(key);
      }
    }
  }

  public get client() {
    return this.gmail;
  }

  public async refreshTokenIfNeeded() {
    try {
      await this.gmail.users.labels.list({ userId: "me" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("invalid_grant")) {
        GmailClient.instances.delete(this.instanceKey);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session expired. Please sign in again.",
        });
      }
      throw error;
    }
  }
}

// Run cleanup every 5 minutes
setInterval(() => GmailClient.cleanup(), 5 * 60 * 1000);

export const parseMessageHeaders = (
  headers: gmail_v1.Schema$MessagePartHeader[] = [],
) => {
  return {
    subject: headers.find((h) => h.name === "Subject")?.value ?? "",
    from: headers.find((h) => h.name === "From")?.value ?? "",
    date: headers.find((h) => h.name === "Date")?.value ?? "",
  };
};

export const formatMessage = (message: gmail_v1.Schema$Message) => {
  const headers = parseMessageHeaders(message.payload?.headers);

  return {
    id: message.id ?? "",
    threadId: message.threadId ?? "",
    snippet: message.snippet ?? "",
    htmlContent: message.payload?.body?.data ?? "",
    plainContent: message.payload?.body?.data ?? "",
    ...headers,
  };
};

export function decodeMessagePart(part: gmail_v1.Schema$MessagePart): string {
  if (!part.body?.data && !part.parts) return "";

  if (part.body?.data) {
    return Buffer.from(part.body.data, "base64").toString("utf-8");
  }

  if (part.parts) {
    return part.parts.map((subPart) => decodeMessagePart(subPart)).join("\n");
  }

  return "";
}

export function getMessageContent(message: gmail_v1.Schema$Message) {
  const headers = parseMessageHeaders(message.payload?.headers);

  let htmlContent = "";
  let plainContent = "";

  if (message.payload) {
    const parts = message.payload.parts ?? [message.payload];
    parts.forEach((part) => {
      if (part.mimeType === "text/html") {
        htmlContent = decodeMessagePart(part);
      } else if (part.mimeType === "text/plain") {
        plainContent = decodeMessagePart(part);
      }
    });
  }

  return {
    id: message.id ?? "",
    threadId: message.threadId ?? "",
    snippet: message.snippet ?? "",
    htmlContent,
    plainContent,
    ...headers,
  };
}
