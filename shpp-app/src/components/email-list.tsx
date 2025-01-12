"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import type { GmailMessage } from "@/trpc/shared/gmail";
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts";
import { formatEmailDate, extractNameFromEmail } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailImportance } from "@/lib/ai/schemas";

export function EmailList({
  initialMessages,
  currentMessages,
}: {
  initialMessages: GmailMessage[];
  currentMessages?: GmailMessage[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLabel = searchParams.get("label") ?? "INBOX";
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const utils = api.useUtils();

  const { data: fetchedMessages } = api.gmail.listMessages.useQuery(
    { labelId: currentLabel },
    {
      initialData: initialMessages,
      //   refetchInterval: 30000,
      enabled: !currentMessages,
    },
  );

  const messages = currentMessages ?? fetchedMessages ?? initialMessages;

  const { data: importance } = api.ai.analyzeEmailImportance.useQuery(
    selectedIndex >= 0
      ? {
          subject: messages[selectedIndex]?.subject ?? "",
          from: messages[selectedIndex]?.from ?? "",
          snippet: messages[selectedIndex]?.snippet ?? "",
        }
      : {
          subject: "",
          from: "",
          snippet: "",
        },
    {
      enabled: selectedIndex >= 0,
      staleTime: Infinity,
    },
  );

  const { mutate: deleteEmail } = api.gmail.deleteMessage.useMutation({
    onSuccess: () => {
      void utils.gmail.listMessages.invalidate();
    },
  });

  useEffect(() => {
    registerShortcut("ArrowDown", () => {
      setSelectedIndex((prev) =>
        prev < messages.length - 1 ? prev + 1 : prev,
      );
    });

    registerShortcut("ArrowUp", () => {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    });

    registerShortcut("Enter", () => {
      if (selectedIndex >= 0 && messages[selectedIndex]) {
        router.push(`/thread/${messages[selectedIndex].threadId}`);
      }
    });

    registerShortcut("d", () => {
      if (selectedIndex >= 0 && messages[selectedIndex]) {
        const message = messages[selectedIndex];
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        deleteEmail({ messageId: message.id });
      }
    });

    return () => {
      unregisterShortcut("ArrowDown");
      unregisterShortcut("ArrowUp");
      unregisterShortcut("Enter");
      unregisterShortcut("d");
    };
  }, [
    registerShortcut,
    unregisterShortcut,
    messages,
    selectedIndex,
    router,
    deleteEmail,
  ]);

  const importanceColors = {
    high: "bg-red-50 ring-red-200",
    medium: "bg-yellow-50 ring-yellow-200",
    low: "bg-green-50 ring-green-200",
  } as Record<EmailImportance["importance"], string>;

  return (
    <div className="mx-auto w-full overflow-y-auto">
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((msg, index) => (
            <li
              key={msg.id}
              onClick={() => router.push(`/thread/${msg.threadId}`)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`transition-color flex cursor-pointer flex-col rounded p-4 ${
                index === selectedIndex
                  ? importance
                    ? importanceColors[importance.importance]
                    : "bg-blue-50 ring-2 ring-blue-200"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="flex w-full items-center gap-4 text-sm">
                <p className="w-48 shrink-0 font-medium">
                  {extractNameFromEmail(msg.from)}
                </p>
                <div className="flex flex-1 gap-2 truncate">
                  <p className="truncate text-gray-700">{msg.subject}</p>
                  <p className="truncate text-gray-400">{msg.snippet}</p>
                </div>
                <span className="shrink-0 text-gray-500">
                  {formatEmailDate(msg.date)}
                </span>
              </div>
              {importance?.reason && index === selectedIndex && (
                <p className="mt-1 text-sm text-gray-500">
                  {importance.reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
