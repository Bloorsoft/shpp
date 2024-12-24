"use client";

import { api } from "@/trpc/react";
import type { GmailMessage } from "@/trpc/shared/gmail";
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

  const { data: messages = initialMessages } = api.gmail.listMessages.useQuery(
    { labelId: currentLabel },
    {
      initialData: initialMessages,
      refetchInterval: 30000,
    },
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h2 className="mb-4 text-2xl capitalize">
        {currentLabel.toLowerCase().replace("_", " ")}
      </h2>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((msg) => (
            <li
              key={msg.id}
              onClick={() => router.push(`/thread/${msg.threadId}`)}
              className="flex cursor-pointer justify-between rounded bg-gray-50 p-4 hover:bg-gray-100"
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
