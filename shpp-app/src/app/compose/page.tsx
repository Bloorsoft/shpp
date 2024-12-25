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

export default function ComposePage() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

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

    return () => {
      unregisterShortcut("Enter");
    };
  }, [registerShortcut, unregisterShortcut, handleSubmit, router]);

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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    disabled={isPending}
                    variant="ghost"
                    className="text-xs"
                  >
                    Send
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex items-center gap-1.5">
                  <p>Send</p>
                  <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-800">
                    {navigator.userAgent.toLowerCase().includes("mac")
                      ? "⌘"
                      : "Ctrl"}
                  </kbd>
                  <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-800">
                    enter
                  </kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </form>
      </div>
    </div>
  );
}
