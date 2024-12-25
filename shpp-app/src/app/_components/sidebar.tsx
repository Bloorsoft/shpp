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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoginButton } from "@/app/_components/login-button";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "o") {
        event.preventDefault();
        setIsDrawerOpen((prev) => !prev);
      }
    };

    if (window && typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyPress);
    }
    return () => {
      if (window && typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeyPress);
      }
    };
  }, []);

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
            className="absolute left-4 top-4 rounded-lg p-2 hover:bg-gray-100 cursor-pointer"
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
