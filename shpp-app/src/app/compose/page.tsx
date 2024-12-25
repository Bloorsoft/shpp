"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
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

export default function ComposePage() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  const { mutate: sendEmail, isPending } = api.gmail.sendEmail.useMutation({
    onSuccess: () => {
      router.push("/");
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendEmail({ to, subject, content });
    },
    [sendEmail, to, subject, content],
  );

  const handleDiscard = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      router.push("/");
    },
    [router],
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
          handleDiscard(e as unknown as React.MouseEvent<HTMLButtonElement>);
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
    handleDiscard,
    handleAiDialogOpen,
  ]);

  return (
    <div className="fixed inset-0 flex justify-center bg-gray-100">
      <div className="w-full max-w-3xl rounded-lg p-8 shadow-xl">
        <h2 className="mx-auto w-full max-w-xl text-xl font-semibold">
          New Message
        </h2>
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-4 w-full max-w-xl space-y-4 bg-gray-100 p-4 shadow-lg backdrop-blur-xl"
        >
          <Input
            type="email"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border-0 bg-transparent p-2 px-0 shadow-none focus-visible:ring-0"
            required
          />

          <Input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border-0 bg-transparent p-2 px-0 shadow-none focus-visible:ring-0"
          />

          <Textarea
            placeholder="Write your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
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
                      onClick={handleDiscard}
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
        subject={subject}
        onAccept={(content) => {
          setContent(content);
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
