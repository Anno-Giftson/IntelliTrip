import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Car, ExternalLink, Loader2, Navigation } from "lucide-react";
import PlanSection from "@/components/trips/PlanSection";
import { Button } from "@/components/ui/button";
import { sendRouteToTesla } from "@/lib/server-fns";

export default function TeslaPanel({ trip, onUpdated }) {
  const send = useServerFn(sendRouteToTesla);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const destination = trip.plan?.destination || trip.destination || "";
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  const sent = Boolean(trip.tesla_sent_at);

  async function run() {
    setBusy(true);
    setError("");
    try {
      onUpdated(await send({ data: { id: trip.id } }));
    } catch (err) {
      setError(err?.message || "Could not reach the car just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlanSection title="Drive it yourself" hint="only if you want to">
      <p className="text-sm text-foreground/70">
        Take this route to {destination || "your destination"} in the car and let it drive the drive where autopilot is
        allowed. You stay in control the whole way.
      </p>

      {sent ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium">
          <Car className="h-4 w-4" aria-hidden="true" />
          Route queued for your car — open the navigation screen in the car to start it.
        </p>
      ) : (
        <p className="mt-3 text-sm">Want this route in your car?</p>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="rounded-full" onClick={run} disabled={busy || sent}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Car className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {sent ? "Sent" : "Yes, send to my Tesla"}
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <Navigation className="mr-2 h-4 w-4" aria-hidden="true" />
            Open the route in Google Maps
            <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </PlanSection>
  );
}