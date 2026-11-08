import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DeleteTripButton from "@/components/trips/DeleteTripButton";
import PastTripCardNote from "@/components/trips/PastTripCardNote";

const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

export default function TripCard({ trip }) {
  const range = [formatDate(trip.start_date), formatDate(trip.end_date)].filter(Boolean).join(" – ");

  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur transition hover:bg-card/90">
      <Link to="/trips/$tripId" params={{ tripId: trip.id }} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight">{trip.title || trip.destination}</h3>
          <Badge variant={trip.stage === "frame" ? "outline" : "secondary"} className="shrink-0 whitespace-nowrap">
            {trip.stage === "frame" ? "Basic layout" : trip.status === "finalized" ? "Finalized" : "Full plan"}
          </Badge>
        </div>
        <div className="mt-3 space-y-1 text-sm text-foreground/70">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {trip.destination || "Destination to be chosen"}
          </p>
          {range && (
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {range}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden="true" />
            {trip.travelers || 1} traveller{(trip.travelers || 1) === 1 ? "" : "s"}
            {trip.budget ? ` · ${trip.budget}` : ""}
          </p>
        </div>
        <PastTripCardNote trip={trip} />
      </Link>
      <div className="flex justify-end border-t border-border/60 px-3 py-1">
        <DeleteTripButton tripId={trip.id} tripTitle={trip.title || trip.destination} />
      </div>
    </div>
  );
}