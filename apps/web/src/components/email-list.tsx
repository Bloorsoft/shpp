"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const [localMessages, setLocalMessages] = useState<GmailMessage[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const utils = api.useUtils();
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDelete = useCallback(
    (messageId: string) => {
      setDeletingId(messageId);

      setTimeout(() => {
        setLocalMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        deleteEmail({ messageId });
        setDeletingId(null);
      }, 300);
    },
    [deleteEmail],
  );

  useEffect(() => {
    containerRef.current?.focus();
    if (messages.length > 0 && selectedIndex === -1) {
      setSelectedIndex(0);
    }

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
        handleDelete(message.id);
      }
    });

    registerShortcut("j", () => {
      setSelectedIndex((prev) =>
        prev < messages.length - 1 ? prev + 1 : prev,
      );
    });

    registerShortcut("k", () => {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    });

    return () => {
      unregisterShortcut("ArrowDown");
      unregisterShortcut("ArrowUp");
      unregisterShortcut("Enter");
      unregisterShortcut("d");
      unregisterShortcut("j");
      unregisterShortcut("k");
    };
  }, [
    messages.length,
    selectedIndex,
    router,
    handleDelete,
    registerShortcut,
    unregisterShortcut,
    messages,
  ]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const importanceColors = {
    high: "bg-red-50 ring-red-200",
    medium: "bg-yellow-50 ring-yellow-200",
    low: "bg-green-50 ring-green-200",
  } as Record<EmailImportance["importance"], string>;

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full overflow-y-auto outline-none"
    >
      {localMessages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul className="space-y-2">
          {localMessages.map((msg, index) => (
            <li
              key={msg.id}
              onClick={() => router.push(`/thread/${msg.threadId}`)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex cursor-pointer flex-col gap-2 rounded p-4 transition-all duration-300 ${
                deletingId === msg.id
                  ? "-translate-x-full transform opacity-0"
                  : ""
              } ${
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
