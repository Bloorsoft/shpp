import { forwardRef, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

const AutoResizingTextarea = forwardRef<
  HTMLTextAreaElement,
  ComponentPropsWithoutRef<typeof Textarea>
>((props, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    textarea.addEventListener("input", adjustHeight);
    adjustHeight();

    return () => textarea.removeEventListener("input", adjustHeight);
  }, []);

  return (
    <Textarea
      ref={textareaRef}
      {...props}
      className={cn("max-h-[50vh] overflow-y-auto", props.className)}
    />
  );
});
AutoResizingTextarea.displayName = "AutoResizingTextarea";

export { AutoResizingTextarea };
