import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Compass, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import SetupChecklist from "@/components/onboarding/SetupChecklist";
import TripCard from "@/components/trips/TripCard";
import { getProfile, getUserSetup, listTrips } from "@/lib/server-fns";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/_authed/")({
  ssr: false,
  loader: async () => {
    const [trips, profile, setup] = await Promise.all([listTrips(), getProfile(), getUserSetup()]);
    return { trips, profile, setup };
  },
  head: () => ({ meta: [{ title: "My trips" }] }),
  component: TripsHome,
});

function TripsHome() {
  const { trips, profile, setup } = Route.useLoaderData();
  const { user } = useAuth();
  const router = useRouter();
  const firstName = (profile?.full_name || user?.full_name || "").split(" ")[0];
  const inProgress = trips.filter((t) => t.status !== "finalized");
  const finished = trips.filter((t) => t.status === "finalized");

  return (
    <PullToRefresh onRefresh={() => router.invalidate()}>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {firstName ? `Hello, ${firstName}` : "Your trips"}
            </h1>
            <p className="mt-1 text-sm text-foreground/70">
              Plans are saved as you go — start one, leave it, come back to it.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/trips/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Plan a new trip
            </Link>
          </Button>
        </header>

        <SetupChecklist setup={setup} profile={profile} />

        {!profile && (
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-5 backdrop-blur transition hover:bg-card/90"
          >
            <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="text-sm">
              <span className="font-semibold">Answer a few questions about your likes and dislikes.</span>{" "}
              Every plan is built around them — and you can change them anytime.
            </span>
          </Link>
        )}

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">In progress</h2>
          {inProgress.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-sm text-foreground/70">
              Nothing in progress yet.{" "}
              <Link to="/trips/new" className="font-medium underline">
                Roll a random destination
              </Link>{" "}
              or pick your own.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {inProgress.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>

        {finished.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">Finalized</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {finished.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        <p className="flex items-center gap-2 text-xs text-foreground/55">
          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          IntelliTrip builds the whole plan — flights, stay, food, packing and what it all costs.
        </p>
      </div>
    </PullToRefresh>
  );
}