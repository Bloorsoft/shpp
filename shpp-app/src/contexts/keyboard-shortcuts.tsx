"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type ShortcutHandler = (e: KeyboardEvent) => void;
type ShortcutOptions = { ignoreInputs?: boolean };

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
  const shortcuts = new Map<
    string,
    { handler: ShortcutHandler; options?: ShortcutOptions }
  >();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const shortcut = shortcuts.get(e.key.toLowerCase());
      if (!shortcut) return;

      if (
        !shortcut.options?.ignoreInputs &&
        (document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA")
      ) {
        return;
      }

      e.preventDefault();
      shortcut.handler(e);
    };

    shortcuts.set("c", { handler: () => router.push("/compose") });
    shortcuts.set("escape", { handler: () => router.push("/") });

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router]);

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
