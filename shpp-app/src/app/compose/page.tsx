"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export default function ComposePage() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const { mutate: sendEmail, isPending } = api.gmail.sendEmail.useMutation({
    onSuccess: () => {
      router.push("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmail({ to, subject, content });
  };

  return (
    <div className="fixed inset-0 flex justify-center bg-gray-100">
      <div className="w-full max-w-3xl rounded-lg p-8 shadow-xl">
        <h2 className="text-xl font-semibold max-w-xl mx-auto w-full">New Message</h2>
        <form
          onSubmit={handleSubmit}
          className="max-w-xl space-y-4 bg-gray-100 p-4 shadow-lg mx-auto w-full backdrop-blur-xl mt-4"
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

          <div className="flex items-center justify-between">
            <Button
              type="submit"
              disabled={isPending}
              variant="ghost"
              className="text-xs"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
