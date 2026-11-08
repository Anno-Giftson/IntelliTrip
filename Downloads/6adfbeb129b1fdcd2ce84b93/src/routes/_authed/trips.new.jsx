import { createFileRoute } from "@tanstack/react-router";
import TripSetupForm from "@/components/trips/TripSetupForm";
import { getProfile } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/trips/new")({
  ssr: false,
  loader: () => getProfile(),
  head: () => ({ meta: [{ title: "New trip" }] }),
  component: NewTripPage,
});

function NewTripPage() {
  const profile = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Plan a new trip</h1>
        <p className="mt-1 text-sm text-foreground/70">
          First you'll get a basic layout to agree with. Once you're happy with it, the whole plan gets built.
        </p>
      </header>
      <TripSetupForm profile={profile} />
    </div>
  );
}