import { ArrowUp, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AssistantComposer({ value, onChange, onAsk, onRewrite, busy, disabled }) {
  const ready = Boolean(value.trim()) && !busy && !disabled;

  return (
    <div className="border-t border-border/70 bg-card/70 p-3">
      <div className="rounded-2xl border border-border bg-background/70 p-2 shadow-sm transition-colors focus-within:border-foreground/40">
        <Textarea
          value={value}
          rows={2}
          placeholder="Ask about this trip…"
          aria-label="Ask the trip assistant"
          disabled={disabled || busy}
          className="min-h-0 resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus-visible:ring-0"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (ready) onAsk();
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-xs text-foreground/70"
            disabled={!ready}
            onClick={onRewrite}
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Rewrite plan
          </Button>
          <Button
            size="icon"
            className="rounded-full"
            aria-label="Send question"
            disabled={!ready}
            onClick={onAsk}
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-foreground/45">Enter to send · Shift + Enter for a new line</p>
    </div>
  );
}