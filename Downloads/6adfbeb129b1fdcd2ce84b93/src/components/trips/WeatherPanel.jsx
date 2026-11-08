import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanSection from "@/components/trips/PlanSection";
import WeatherDay from "@/components/trips/WeatherDay";
import { getTripWeather } from "@/lib/server-fns";

const HINTS = {
  forecast: "live forecast for your dates",
  typical: "typical weather for these dates",
  recorded: "what the weather did on these dates",
};

export default function WeatherPanel({ trip }) {
  const load = useServerFn(getTripWeather);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [today, setToday] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setResult(null);
    setError("");
    setToday(new Date().toISOString().slice(0, 10));
    load({ data: { id: trip.id } })
      .then((res) => alive && setResult(res))
      .catch((err) => alive && setError(err?.message || "The weather is unavailable right now."));
    return () => {
      alive = false;
    };
  }, [trip.id, trip.start_date, trip.end_date, attempt]);

  return (
    <PlanSection title="Weather" hint={result ? HINTS[result.mode] || "" : "loading"}>
      {!result && !error && (
        <p className="flex items-center gap-2 text-sm text-foreground/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking {trip.destination || "your destination"}…
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result?.mode === "unavailable" && <p className="text-sm text-foreground/70">{result.message}</p>}

      {result?.days?.length > 0 && (
        <>
          {result.mode === "typical" && (
            <p className="mb-3 text-sm text-foreground/70">
              Your trip is still too far out for a live forecast, so this is what the weather usually does.
            </p>
          )}
          <ul className="scroll-container -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {result.days.map((day) => (
              <WeatherDay
                key={day.date}
                day={day}
                active={result.mode === "forecast" && day.date === today}
              />
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-foreground/55">{result.place}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAttempt((n) => n + 1)}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </>
      )}
    </PlanSection>
  );
}