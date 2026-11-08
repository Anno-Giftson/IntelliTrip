import { lazy, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Compass, Loader2, RefreshCw } from "lucide-react";
import PlanSection from "@/components/trips/PlanSection";
import { Button } from "@/components/ui/button";
import { formatKm, nearbyFood, parsePlanMarkers } from "@/lib/planMarkers";
import { mapTripPlan } from "@/lib/server-fns";

const TripMap = lazy(() => import("@/components/trips/TripMap"));

export default function MapPanel({ trip, onUpdated }) {
  const locate = useServerFn(mapTripPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);

  const itinerary = trip.plan?.itinerary || [];
  if (!itinerary.length) return null;

  const points = trip.map_points;
  // A plan that changed shape (new days, new stop) needs fresh coordinates.
  const stale = !points || points.days?.length !== itinerary.length || points.food?.length !== (trip.plan?.food || []).length;
  const markers = parsePlanMarkers(trip);
  const day = markers.days[active];
  const nearby = nearbyFood(markers, active, 4);

  async function run(refresh) {
    setBusy(true);
    setError("");
    try {
      const result = await locate({ data: { id: trip.id, refresh } });
      onUpdated?.(result.trip);
    } catch (err) {
      setError(err?.message || "The map could not be built just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlanSection title="The trip on a map" hint={day ? day.day : "day by day"}>
      {stale ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground/70">
            Place every stop of this plan on a map, in order, with the places to eat nearest each day.
          </p>
          <Button className="rounded-full" disabled={busy} onClick={() => run(Boolean(points))}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Compass className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {busy ? "Placing the trip…" : "Show this trip on the map"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="scroll-container -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {markers.days.map((entry, index) => (
              <button
                key={`chip-${entry.index}`}
                type="button"
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  index === active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card/70 text-foreground/75"
                }`}
              >
                {entry.day}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <ClientOnly fallback={<div className="h-[380px] w-full animate-pulse bg-muted" />}>
              <TripMap markers={markers} activeIndex={active} />
            </ClientOnly>
          </div>

          {day && (
            <div>
              <p className="text-sm font-medium">{day.title}</p>
              {day.details && <p className="mt-1 text-sm text-foreground/70">{day.details}</p>}
            </div>
          )}

          {nearby.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Near {day?.day || "your day"}
              </p>
              <ul className="mt-2 space-y-2">
                {nearby.map((place) => (
                  <li key={`near-${place.index}`} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium">{place.name}</span>
                      {place.cuisine && <span className="text-foreground/60"> · {place.cuisine}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-foreground/60">
                      {formatKm(place.km)} · {place.walkMin} min walk · {place.driveMin} min drive
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button variant="ghost" size="sm" className="rounded-full" disabled={busy} onClick={() => run(true)}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Re-place the pins
          </Button>
        </div>
      )}

      {stale && error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </PlanSection>
  );
}