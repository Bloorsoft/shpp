"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { decodeHTMLEntities, formatDraft, formatEmailDate } from "@/lib/utils";
import type { GmailMessage } from "@/trpc/shared/gmail";
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmailComposer } from "@/components/email-composer";
import type { EmailDraft } from "@/lib/ai/schemas";

interface ThreadViewProps {
  initialThread: GmailMessage[];
}

export function ThreadView({ initialThread }: ThreadViewProps) {
  const router = useRouter();
  const [showReply, setShowReply] = useState(false);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const { data: thread = initialThread } = api.gmail.getThread.useQuery(
    { threadId: initialThread[0]?.threadId ?? "" },
    { refetchInterval: 30000 },
  );

  const { mutate: sendReply, isPending } = api.gmail.sendReply.useMutation({
    onSuccess: () => {
      setShowReply(false);
    },
  });

  useEffect(() => {
    registerShortcut("Enter", (e) => {
      if (!showReply) {
        e.preventDefault();
        setShowReply(true);
      }
    });

    registerShortcut("escape", () => {
      if (showReply) {
        setShowReply(false);
      } else {
        router.back();
      }
    });

    return () => {
      unregisterShortcut("Enter");
      unregisterShortcut("escape");
    };
  }, [registerShortcut, unregisterShortcut, router, showReply]);

  const lastMessage = thread[thread.length - 1];

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
                  className="prose max-w-none overflow-x-auto [&_code]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_pre]:p-4"
                />
              ) : (
                <MessageContent message={message} />
              )}
            </div>
          </div>
        ))}
      </div>

      {showReply && (
        <EmailComposer
          to={lastMessage?.from}
          subject={`Re: ${thread[0]?.subject}`}
          onSubmit={({ content }) => {
            sendReply({
              threadId: thread[0]?.threadId ?? "",
              content: formatDraft(content as EmailDraft),
              to: lastMessage?.from ?? "",
            });
          }}
          onDiscard={() => setShowReply(false)}
          isPending={isPending}
          isReply
          threadMessages={thread.map((message) => ({
            ...message,
            plainContent: decodeHTMLEntities(
              /* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */
              message.plainContent || message.snippet,
            ),
          }))}
        />
      )}
    </div>
  );
}

function MessageContent({ message }: { message: GmailMessage }) {
  const decodedContent = decodeHTMLEntities(
    /* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */
    message.plainContent || message.snippet,
  );
  return (
    <div className="overflow-x-auto whitespace-pre-wrap">{decodedContent}</div>
  );
}
