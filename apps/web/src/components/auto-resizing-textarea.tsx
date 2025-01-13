import { forwardRef, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { ComponentPropsWithoutRef } from "react";

const AutoResizingTextarea = forwardRef<
  HTMLTextAreaElement,
  ComponentPropsWithoutRef<typeof Textarea>
>((props, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener("input", adjustHeight);
    return () => textarea.removeEventListener("input", adjustHeight);
  }, []);

  // Add effect to adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [props.value]);

  return <Textarea ref={textareaRef} {...props} />;
});
AutoResizingTextarea.displayName = "AutoResizingTextarea";

export { AutoResizingTextarea };
