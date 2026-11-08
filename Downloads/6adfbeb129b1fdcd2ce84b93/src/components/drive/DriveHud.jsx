import { CornerUpLeft, CornerUpRight, Loader2, MapPin, Navigation, RefreshCw, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function StepIcon({ step }) {
  if (!step) return <Navigation className="h-6 w-6 text-primary" aria-hidden="true" />;
  if (step.type === "arrive") return <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />;
  if (step.type === "turn" && /left/i.test(step.instruction)) {
    return <CornerUpLeft className="h-6 w-6 text-primary" aria-hidden="true" />;
  }
  if (step.type === "turn") return <CornerUpRight className="h-6 w-6 text-primary" aria-hidden="true" />;
  return <Navigation className="h-6 w-6 text-primary" aria-hidden="true" />;
}

export default function DriveHud({
  stop,
  index,
  total,
  step,
  path,
  loading,
  error,
  geoError,
  onReroute,
  onNext,
  onExit,
}) {
  const km = path ? (path.distance / 1000).toFixed(1) : null;
  const minutes = path ? Math.max(1, Math.round(path.duration / 60)) : null;

  return (
    <>
      <div className="safe-top absolute inset-x-0 top-0 z-[500] p-3">
        <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
          <div className="flex items-start gap-3">
            {loading ? <Loader2 className="mt-1 h-6 w-6 animate-spin text-primary" aria-hidden="true" /> : <StepIcon step={step} />}
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-snug">
                {step?.instruction || (loading ? "Planning your route…" : "Waiting for your location…")}
              </p>
              <p className="mt-1 truncate text-sm text-foreground/70">
                {stop ? `${stop.day || "Next stop"}${stop.title ? ` · ${stop.title}` : ""}` : "No stop selected"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="safe-bottom absolute inset-x-0 bottom-0 z-[500] p-3">
        <div className="space-y-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground/70">Stop {index + 1} of {total}</p>
            <p className="text-sm font-semibold tabular-nums">
              {km ? `${km} km · ${minutes} min` : "—"}
            </p>
          </div>

          {geoError && <p className="text-sm text-destructive">{geoError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" className="flex-1 rounded-full" onClick={onNext} disabled={index + 1 >= total}>
              <SkipForward className="mr-2 h-4 w-4" aria-hidden="true" />
              Next stop
            </Button>
            <Button type="button" variant="outline" size="lg" className="rounded-full" onClick={onReroute}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Re-route
            </Button>
            <Button type="button" variant="ghost" size="lg" className="rounded-full" onClick={onExit}>
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
              Exit
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}