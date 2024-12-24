import { google, type gmail_v1 } from "googleapis";

export const createAuthenticatedGmail = (
  accessToken: string,
  refreshToken: string,
) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: "v1", auth });
};

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
