import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { EmailDraft } from "@/lib/ai/schemas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEmailDate(dateStr: string) {
  const messageDate = new Date(dateStr.replace(/\./g, ""));
  if (isNaN(messageDate.getTime())) return "Invalid date";

  const now = new Date();
  const isToday = messageDate.toDateString() === now.toDateString();
  const isCurrentYear = messageDate.getFullYear() === now.getFullYear();

  if (isToday) {
    return messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    ...(isCurrentYear ? {} : { year: "numeric" }),
  });
}

export function formatDraft(draft: EmailDraft | string) {
  if (typeof draft === "string") {
    return draft.replace(/\r\n/g, "\n");
  }

  const parts = [];
  if (draft.greeting) parts.push(draft.greeting);
  if (draft.body) parts.push(draft.body);
  if (draft.closing) parts.push(draft.closing);
  if (draft.signature) parts.push(draft.signature);

  return parts.join("\n\n").replace(/\r\n/g, "\n").trim();
}

export function decodeHTMLEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function extractNameFromEmail(emailString: string): string {
  const nameEmailRegex = /(.*?)\s*<.*>/;
  const match = nameEmailRegex.exec(emailString);
  if (match?.[1]) {
    return match[1].trim();
  }

  if (emailString.includes("@")) {
    return emailString.split("@")[0] ?? emailString;
  }

  return emailString;
}
