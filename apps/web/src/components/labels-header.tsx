"use client";

import { Sidebar } from "@/components/sidebar";
import { Settings, PenLine, Search } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function LabelsHeader({
  currentLabel,
  currEmail,
}: {
  currentLabel: string;
  currEmail: string;
}) {
  const { data: labels } = api.gmail.listLabels.useQuery();
  const router = useRouter();

  const defaultLabels = useMemo(
    () => [
      {
        id: "INBOX",
        name: "Inbox",
        messagesTotal: undefined,
      },
      {
        id: "SENT",
        name: "Sent",
        messagesTotal: undefined,
      },
    ],
    [],
  );

  const visibleLabels =
    labels
      ?.filter((label) => label.id && !label.id.startsWith("CATEGORY_"))
      .slice(0, 2) ?? [];

  return (
    <header className="z-100 sticky top-0 flex h-12 items-center justify-between bg-white px-4 py-8">
      <div className="flex items-center gap-8">
        <Sidebar currentLabel={currentLabel} currEmail={currEmail} />
        <nav className="flex items-center gap-2">
          {defaultLabels.map((label) => (
            <Button
              key={label.id}
              variant="ghost"
              className={cn(
                "flex items-center gap-2 focus:outline-none focus:ring-0",
                currentLabel === label.id ? "font-bold" : "font-normal",
              )}
              onClick={() => router.push(`/?label=${label.id}`)}
            >
              {label.name}{" "}
              <span className="text-xs text-gray-400">
                {label.messagesTotal ?? undefined}
              </span>
            </Button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {[
            {
              icon: Settings,
              label: "Settings",
              func: () => router.push("/profile"),
            },
            {
              icon: PenLine,
              label: "Compose",
              func: () => router.push("/compose"),
            },
            {
              icon: Search,
              label: "Search",
              func: () => router.push("/search"),
            },
          ].map(({ icon: Icon, label, func }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={func}>
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </header>
  );
}
