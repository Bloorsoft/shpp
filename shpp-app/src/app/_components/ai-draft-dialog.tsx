"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  onAccept: (content: string) => void;
}

export function AIDraftDialog({
  open,
  onOpenChange,
  subject,
  onAccept,
}: AIDraftDialogProps) {
  const [outline, setOutline] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "friendly">(
    "professional",
  );
  const [modifications, setModifications] = useState("");
  const [currentDraft, setCurrentDraft] = useState("");

  const { mutate: generateDraft, isPending } = api.ai.generateDraft.useMutation(
    {
      onSuccess: (draft) => {
        setCurrentDraft(draft);
        setModifications("");
      },
    },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Email Draft</DialogTitle>
        </DialogHeader>

        {!currentDraft ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Outline your email in brief notes..."
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              className="min-h-[100px]"
            />
            <Select value={tone} onValueChange={(v: typeof tone) => setTone(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => generateDraft({ subject, outline, tone })}
              disabled={isPending}
            >
              {isPending ? "Generating..." : "Generate Draft"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-gray-50 p-4">
              <pre className="whitespace-pre-wrap">{currentDraft}</pre>
            </div>
            <Textarea
              placeholder="Request modifications..."
              value={modifications}
              onChange={(e) => setModifications(e.target.value)}
            />
            <div className="flex justify-between">
              <Button
                onClick={() =>
                  generateDraft({
                    modifications,
                    previousDraft: currentDraft,
                  })
                }
                disabled={!modifications || isPending}
              >
                {isPending ? "Modifying..." : "Modify Draft"}
              </Button>
              <Button onClick={() => onAccept(currentDraft)}>
                Use This Draft
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
