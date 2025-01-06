"use client";

import { useEffect, useState, Suspense } from "react";
import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { EmailList } from "@/components/email-list";
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const { data: messages = [] } = api.gmail.searchMessages.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  useEffect(() => {
    const input = document.querySelector("input");
    if (input) {
      input.focus();
    }
  }, []);

  useEffect(() => {
    registerShortcut("escape", () => router.push("/"));

    return () => {
      unregisterShortcut("escape");
    };
  }, [registerShortcut, unregisterShortcut, router]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="relative flex min-h-screen flex-col items-center p-4">
        <div className="w-full max-w-3xl">
          <div className="mb-8">
            <Input
              type="search"
              placeholder="Search emails..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 bg-transparent p-2 px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <EmailList
            initialMessages={[]}
            currentMessages={messages}
            hideLabel={true}
          />
        </div>
      </main>
    </Suspense>
  );
}
