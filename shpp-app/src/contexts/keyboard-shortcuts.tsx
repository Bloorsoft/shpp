"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutsContextType {
  registerShortcut: (key: string, handler: ShortcutHandler) => void;
  unregisterShortcut: (key: string) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

export function KeyboardShortcutsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const shortcuts = new Map<string, ShortcutHandler>();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const handler = shortcuts.get(e.key.toLowerCase());
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    shortcuts.set("c", () => router.push("/compose"));

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router]);

  return (
    <ShortcutsContext.Provider
      value={{
        registerShortcut: (key, handler) =>
          shortcuts.set(key.toLowerCase(), handler),
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
