import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Is there a cheaper way to get there?",
  "What if it rains on day 3?",
  "Find a better dinner near the hotel",
];

export default function AssistantIntro({ onPick }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/70 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-foreground" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium">I know this whole trip</p>
          <p className="text-xs text-foreground/60">Flights, stay, timings and costs — ask me anything.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="rounded-xl border border-border bg-background/60 px-3 py-2 text-left text-xs text-foreground/80 transition-colors hover:border-foreground/30 hover:bg-accent"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}