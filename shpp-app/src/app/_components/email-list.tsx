"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import type { GmailMessage } from "@/trpc/shared/gmail";
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts";
import { formatEmailDate } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

export function EmailList({
  initialMessages,
}: {
  initialMessages: GmailMessage[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLabel = searchParams.get("label") ?? "INBOX";
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  const { data: messages = initialMessages } = api.gmail.listMessages.useQuery(
    { labelId: currentLabel },
    {
      initialData: initialMessages,
      refetchInterval: 30000,
    },
  );

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

    return () => {
      unregisterShortcut("ArrowDown");
      unregisterShortcut("ArrowUp");
      unregisterShortcut("Enter");
    };
  }, [registerShortcut, unregisterShortcut, messages, selectedIndex, router]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h2 className="mb-4 text-2xl capitalize">
        {currentLabel.toLowerCase().replace("_", " ")}
      </h2>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((msg, index) => (
            <li
              key={msg.id}
              onClick={() => router.push(`/thread/${msg.threadId}`)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex cursor-pointer justify-between rounded p-4 ${
                index === selectedIndex
                  ? "bg-blue-50 ring-2 ring-blue-200"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex flex-col">
                <p className="font-medium">{msg.from}</p>
                <p className="text-sm text-gray-600">{msg.subject}</p>
              </div>
              <div className="text-sm text-gray-500">
                {formatEmailDate(msg.date)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
