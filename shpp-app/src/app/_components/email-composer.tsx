"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { AIDraftDialog } from "@/app/_components/ai-draft-dialog";
import { cn } from "@/lib/utils";
import type { GmailMessage } from "@/trpc/shared/gmail";
import { type EmailDraft } from "@/lib/ai/schemas";
import { formatDraft } from "@/lib/utils";

interface EmailComposerProps {
  to?: string;
  subject?: string;
  initialContent?: string;
  onSubmit: (data: {
    to: string;
    subject: string;
    content: EmailDraft | string;
  }) => void;
  onDiscard: () => void;
  isPending?: boolean;
  isReply?: boolean;
  threadMessages?: GmailMessage[];
}

export function EmailComposer({
  to = "",
  subject = "",
  initialContent = "",
  onSubmit,
  onDiscard,
  isPending = false,
  isReply = false,
  threadMessages,
}: EmailComposerProps) {
  const [toValue, setToValue] = useState(to);
  const [subjectValue, setSubjectValue] = useState(subject);
  const [content, setContent] = useState(initialContent);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({ to: toValue, subject: subjectValue, content });
    },
    [onSubmit, toValue, subjectValue, content],
  );

  const handleAiDialogOpen = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setAiDialogOpen(true);
    },
    [],
  );

  useEffect(() => {
    registerShortcut(
      "Enter",
      (e) => {
        if (e.metaKey || e.ctrlKey) {
          handleSubmit(new Event("submit") as unknown as React.FormEvent);
        }
      },
      { ignoreInputs: true },
    );

    registerShortcut(
      ",",
      (e) => {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
          e.preventDefault();
          onDiscard();
        }
      },
      { ignoreInputs: true, requireModifier: true },
    );

    registerShortcut(
      "j",
      (e) => {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          handleAiDialogOpen(
            e as unknown as React.MouseEvent<HTMLButtonElement>,
          );
        }
      },
      { ignoreInputs: true, requireModifier: true },
    );

    return () => {
      unregisterShortcut("Enter");
      unregisterShortcut(",");
      unregisterShortcut("j");
    };
  }, [
    registerShortcut,
    unregisterShortcut,
    handleSubmit,
    onDiscard,
    handleAiDialogOpen,
  ]);

  return (
    <div
      className={cn(
        !isReply && "fixed inset-0 flex justify-center bg-gray-100",
        "w-full",
      )}
    >
      <div
        className={cn(
          isReply && "w-full rounded-lg border p-8",
          "mx-auto w-full max-w-3xl",
        )}
      >
        {!isReply && (
          <h2 className="mx-auto w-full max-w-xl text-xl font-semibold">
            New Message
          </h2>
        )}
        <form
          onSubmit={handleSubmit}
          className={cn(
            !isReply &&
              "mx-auto mt-4 w-full max-w-xl space-y-4 bg-gray-100 p-4 shadow-lg backdrop-blur-xl",
            "w-full",
          )}
        >
          {!isReply && (
            <>
              <Input
                type="email"
                placeholder="To"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
                className="border-0 bg-transparent p-2 px-0 shadow-none focus-visible:ring-0"
                required
              />

              <Input
                type="text"
                placeholder="Subject"
                value={subjectValue}
                onChange={(e) => setSubjectValue(e.target.value)}
                className="border-0 bg-transparent p-2 px-0 shadow-none focus-visible:ring-0"
              />
            </>
          )}

          <Textarea
            placeholder={
              isReply ? "Write your reply..." : "Write your message..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            required
          />
          <TooltipProvider>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      disabled={isPending}
                      variant="ghost"
                      className="px-0 text-xs"
                    >
                      Send
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="flex items-center gap-1.5">
                    <p>Send</p>
                    <KBD>
                      {navigator.userAgent.toLowerCase().includes("mac")
                        ? "⌘"
                        : "Ctrl"}
                    </KBD>
                    <KBD>enter</KBD>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="px-2 text-xs"
                      onClick={handleAiDialogOpen}
                    >
                      ai
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="flex items-center gap-1.5">
                    <p>Write with AI</p>
                    <KBD>
                      {navigator.userAgent.toLowerCase().includes("mac")
                        ? "⌘"
                        : "Ctrl"}
                    </KBD>
                    <KBD>j</KBD>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="px-2 text-xs"
                      onClick={onDiscard}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="flex items-center gap-1.5">
                    <p>Discard</p>
                    <KBD>
                      {navigator.userAgent.toLowerCase().includes("mac")
                        ? "⌘"
                        : "Ctrl"}
                    </KBD>
                    <KBD>shift</KBD>
                    <KBD>,</KBD>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </form>
      </div>
      <AIDraftDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        subject={subjectValue}
        threadMessages={threadMessages}
        onAccept={(draft: EmailDraft) => {
          setContent(formatDraft(draft));
          setSubjectValue(draft.subject);
          setAiDialogOpen(false);
        }}
      />
    </div>
  );
}

function KBD({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-800">
      {children}
    </kbd>
  );
}
