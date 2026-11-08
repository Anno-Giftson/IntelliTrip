import { Sparkles } from "lucide-react";
import UserBubble from "@/components/trips/assistant/UserBubble";
import useTypewriter from "@/components/trips/assistant/useTypewriter";

export default function AssistantMessage({ question, answer, animate = false }) {
  const { visible, typing } = useTypewriter(answer || "", animate && Boolean(answer));

  return (
    <div className="space-y-2">
      {question && <UserBubble>{question}</UserBubble>}
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tl-md border border-border bg-card/85 px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
          {visible}
          {typing && (
            <span
              className="caret-blink ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-foreground/70 align-baseline"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}