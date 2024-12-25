"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const shortcuts = [
  { key: "E", description: "to Mark Done" },
  { key: "H", description: "to set a reminder" },
  { key: "C", description: "to compose" },
  { key: "/", description: "to search" },
  { key: "⌘ K", description: "for Superhuman++ Command" },
];

export function KeyboardShortcutsFooter() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hidden = localStorage.getItem("shortcuts-footer-hidden");
    if (hidden) setIsVisible(false);
  }, []);

  const hideFooter = () => {
    setIsVisible(false);
    localStorage.setItem("shortcuts-footer-hidden", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-gray-50/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4 w-full justify-center">
          {shortcuts.map(({ key, description }, index) => (
            <div
              key={key}
              className="flex items-center gap-1 text-sm text-gray-600"
            >
              <kbd className="rounded bg-white px-2 py-0.5 font-mono text-xs shadow">
                {key}
              </kbd>
              <span>{description}</span>
              {index < shortcuts.length - 1 && (
                <span className="ml-2 text-gray-300">•</span>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={hideFooter}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
