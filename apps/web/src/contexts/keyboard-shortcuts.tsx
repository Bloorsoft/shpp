"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

type ShortcutHandler = (e: KeyboardEvent) => void;
type ShortcutOptions = {
  ignoreInputs?: boolean;
  requireModifier?: boolean;
  onlyInPaths?: string[];
};

interface ShortcutsContextType {
  registerShortcut: (
    key: string,
    handler: ShortcutHandler,
    options?: ShortcutOptions,
  ) => void;
  unregisterShortcut: (key: string) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

export function KeyboardShortcutsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const shortcuts = new Map<
    string,
    { handler: ShortcutHandler; options?: ShortcutOptions }
  >();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const shortcut = shortcuts.get(e.key.toLowerCase());
      if (!shortcut) return;

      const isInInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if (
        shortcut.options?.onlyInPaths &&
        !shortcut.options.onlyInPaths.includes(pathname)
      ) {
        return;
      }

      if (
        (shortcut.options?.ignoreInputs || !isInInput) &&
        (!shortcut.options?.requireModifier || e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        shortcut.handler(e);
      }
    };

    // Register default shortcuts
    shortcuts.set("c", {
      handler: () => router.push("/compose"),
    });
    shortcuts.set("/", { handler: () => router.push("/search") });
    shortcuts.set("Tab", {
      // TODO: fix tab shortcut on labels header
      handler: (e) => {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        )
          return;

        e.preventDefault();
        const defaultLabels = ["INBOX", "SENT"];
        const currentLabel =
          new URLSearchParams(window.location.search).get("label") ?? "INBOX";
        const currentIndex = defaultLabels.indexOf(currentLabel);
        const nextLabel =
          defaultLabels[(currentIndex + 1) % defaultLabels.length];
        router.push(`/?label=${nextLabel}`);
      },
      options: { onlyInPaths: ["/"] },
    });

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router, pathname, shortcuts]);

  return (
    <ShortcutsContext.Provider
      value={{
        registerShortcut: (key, handler, options) =>
          shortcuts.set(key.toLowerCase(), { handler, options }),
        unregisterShortcut: (key) => shortcuts.delete(key.toLowerCase()),
      }}
    >
      {children}
    </ShortcutsContext.Provider>
  );
}

export const useKeyboardShortcuts = () => {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcuts must be used within a KeyboardShortcutsProvider",
    );
  }
  return context;
};
