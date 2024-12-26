"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { EmailComposer } from "@/app/_components/email-composer";
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts";
import { useEffect } from "react";

export default function ComposePage() {
  const router = useRouter();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const { mutate: sendEmail, isPending } = api.gmail.sendEmail.useMutation({
    onSuccess: () => router.push("/"),
  });

  useEffect(() => {
    registerShortcut("escape", () => router.push("/"));
    return () => unregisterShortcut("escape");
  }, [registerShortcut, unregisterShortcut, router]);

  return (
    <EmailComposer
      onSubmit={({ to, subject, content }) =>
        sendEmail({ to, subject, content })
      }
      onDiscard={() => router.push("/")}
      isPending={isPending}
    />
  );
}
