import { createFileRoute } from "@tanstack/react-router";
import PlanView from "@/components/trips/PlanView";
import { getSharedTrip } from "@/lib/share-fns";

export const Route = createFileRoute("/share/$token")({
  loader: async ({ params }) => ({ trip: await getSharedTrip({ data: { token: params.token } }) }),
  head: () => ({
    meta: [
      { title: "Shared trip plan" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedTripPage,
});

function SharedTripPage() {
  const { trip } = Route.useLoaderData();

  if (!trip) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">This link is no longer active</h1>
        <p className="mt-2 text-sm text-foreground/70">
          The traveller stopped sharing this plan, or the link was mistyped.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Shared trip plan</p>
        <h1 className="text-3xl font-semibold tracking-tight">{trip.title || trip.destination}</h1>
        <p className="text-sm text-foreground/70">
          {trip.destination || "Destination to be chosen"} · {trip.start_date} to {trip.end_date} ·{" "}
          {trip.travelers || 1} traveller{(trip.travelers || 1) === 1 ? "" : "s"}
          {trip.budget ? ` · ${trip.budget}` : ""}
        </p>
      </header>

      <PlanView plan={trip.plan} trip={trip} />

      <p className="border-t border-border pt-4 text-xs text-foreground/55">
        This is a read-only copy of a plan made with IntelliTrip. Prices and availability are estimates — confirm
        before booking.
      </p>
    </main>
  );
}