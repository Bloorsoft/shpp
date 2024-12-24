"use client";

import { api } from "@/trpc/react";
import { formatEmailDate } from "@/lib/utils";
import type { GmailMessage } from "@/trpc/shared/gmail";

interface ThreadViewProps {
  initialThread: GmailMessage[];
}

export function ThreadView({ initialThread }: ThreadViewProps) {
  const { data: thread = initialThread } = api.gmail.getThread.useQuery(
    { threadId: initialThread[0]?.threadId ?? "" },
    { refetchInterval: 30000 },
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{thread[0]?.subject}</h1>

      <div className="space-y-6">
        {thread.map((message) => (
          <div key={message.id} className="rounded-lg border p-4">
            <div className="flex justify-between border-b pb-2">
              <div>
                <div className="font-medium">{message.from}</div>
                <div className="text-sm text-gray-500">
                  {formatEmailDate(message.date)}
                </div>
              </div>
            </div>
            <div className="mt-4">
              {message.htmlContent ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: message.htmlContent }}
                  className="prose max-w-none overflow-x-auto [&_pre]:overflow-x-auto [&_pre]:p-4 [&_code]:whitespace-pre-wrap"
                />
              ) : (
                <div className="whitespace-pre-wrap overflow-x-auto">
                  {message.plainContent || message.snippet}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
