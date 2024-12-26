"use client";

import { api } from "@/trpc/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Menu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LoginButton } from "@/app/_components/login-button";
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar({
  currentLabel,
  currEmail,
}: {
  currentLabel: string;
  currEmail: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    registerShortcut(
      "o",
      (e) => {
        e.preventDefault();
        setIsDrawerOpen((prev) => !prev);
      },
      { requireModifier: true },
    );

    registerShortcut("escape", () => setIsDrawerOpen(false));

    return () => {
      unregisterShortcut("o");
      unregisterShortcut("escape");
    };
  }, [registerShortcut, unregisterShortcut]);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const { data: labels } = api.gmail.listLabels.useQuery();

  const defaultLabels = [
    { id: "INBOX", name: "Inbox" },
    { id: "SENT", name: "Sent" },
    { id: "DRAFT", name: "Drafts" },
    { id: "TRASH", name: "Trash" },
  ];

  const handleLabelClick = (labelId: string) => {
    router.push(`/?label=${labelId}`);
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="left">
      <DrawerTrigger asChild>
        <SidebarButton setIsDrawerOpen={setIsDrawerOpen} />
      </DrawerTrigger>
      <DrawerContent className="h-full max-w-sm rounded-none">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <p>{currEmail}</p>
            <LoginButton />
          </DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto p-4">
          <nav className="space-y-1">
            {defaultLabels.map((label) => (
              <button
                key={label.id}
                onClick={() => handleLabelClick(label.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 ${currentLabel === label.id ? "bg-gray-100" : ""}`}
              >
                {label.name}
              </button>
            ))}

            {labels
              ?.filter((label) => label.id && !label.id.startsWith("CATEGORY_"))
              .map((label) => (
                <button
                  key={label.id}
                  onClick={() => handleLabelClick(label.id!)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 ${currentLabel === label.id ? "bg-gray-100" : ""}`}
                >
                  {label.name}
                </button>
              ))}
          </nav>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function SidebarButton({
  setIsDrawerOpen,
}: {
  setIsDrawerOpen: (open: boolean) => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute left-4 top-4 cursor-pointer rounded-lg p-2 hover:bg-gray-100"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Folders</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
