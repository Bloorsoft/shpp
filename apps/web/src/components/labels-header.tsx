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

export function LabelsHeader({
  currentLabel,
  currEmail,
}: {
  currentLabel: string;
  currEmail: string;
}) {
  const { data: labels } = api.gmail.listLabels.useQuery();

  const visibleLabels =
    labels
      ?.filter((label) => label.id && !label.id.startsWith("CATEGORY_"))
      .slice(0, 2) ?? [];

  return (
    <header className="z-100 sticky top-0 flex h-12 items-center justify-between bg-white px-4 py-8">
      <div className="flex items-center gap-8">
        <Sidebar currentLabel={currentLabel} currEmail={currEmail} />
        <nav className="flex items-center gap-2">
          {visibleLabels.map((label) => (
            <Button
              key={label.id}
              variant="ghost"
              className="flex items-center gap-2"
            >
              {label.name}{" "}
              <span className="text-xs text-gray-400">
                {label.messagesTotal ?? 0}
              </span>
            </Button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {[
            { icon: Settings, label: "Settings" },
            { icon: PenLine, label: "Compose" },
            { icon: Search, label: "Search" },
          ].map(({ icon: Icon, label }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
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
