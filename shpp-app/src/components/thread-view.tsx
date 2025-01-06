"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  decodeHTMLEntities,
  formatDraft,
  formatEmailDate,
  formatBytes,
} from "@/lib/utils";
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

  const getReplyRecipient = () => {
    if (!lastMessage?.participants?.length || !lastMessage.myEmail) return null;

    if (lastMessage.from === lastMessage.myEmail) {
      return lastMessage.participants[0];
    }

    return lastMessage.from;
  };

  const replyTo = getReplyRecipient();

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

              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Attachments:
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={`/api/gmail/attachment?messageId=${message.id}&attachmentId=${attachment.id}`}
                        download={attachment.filename}
                        className="inline-flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        <span>{attachment.filename}</span>
                        <span className="text-xs text-gray-500">
                          ({formatBytes(attachment.size)})
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showReply && (
        <EmailComposer
          to={replyTo ?? ""}
          subject={`Re: ${thread[0]?.subject}`}
          onSubmit={({ content }) => {
            if (!replyTo) return;
            sendReply({
              threadId: thread[0]?.threadId ?? "",
              content: formatDraft(content as EmailDraft),
              to: replyTo,
              subject: `Re: ${thread[0]?.subject}`,
            });
          }}
          onDiscard={() => setShowReply(false)}
          isPending={isPending}
          isReply
          threadMessages={thread.map((message) => ({
            ...message,
            plainContent: decodeHTMLEntities(
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
