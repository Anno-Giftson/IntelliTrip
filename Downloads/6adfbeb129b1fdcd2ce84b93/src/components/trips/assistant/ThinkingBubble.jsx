import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STEPS = {
  ask: ["Reading your plan…", "Checking the timings…", "Writing the answer…"],
  apply: ["Reading your plan…", "Reworking your days…", "Saving the new plan…"],
};

// The wait is the part travellers stare at, so it says what is happening and
// moves: a pulsing mark, a changing line and three bouncing dots.
export default function ThinkingBubble({ kind = "ask" }) {
  const labels = STEPS[kind] || STEPS.ask;
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, labels.length - 1)), 2400);
    return () => clearInterval(timer);
  }, [kind, labels.length]);

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-foreground" aria-hidden="true" />
      </span>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-border bg-card/85 px-3.5 py-2.5 text-sm text-foreground/75 shadow-sm">
        <span>{labels[step]}</span>
        <span className="flex items-end gap-1" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40"
              style={{ animationDelay: `${dot * 140}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}