import { createFileRoute } from "@tanstack/react-router";
import PreferencesForm from "@/components/profile/PreferencesForm";
import SavedTravelers from "@/components/profile/SavedTravelers";
import DeleteAccount from "@/components/profile/DeleteAccount";
import { getProfile } from "@/lib/server-fns";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/_authed/profile")({
  ssr: false,
  loader: () => getProfile(),
  head: () => ({ meta: [{ title: "Preferences" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = Route.useLoaderData();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Your preferences</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Answer as much or as little as you like. These answers shape every destination, hotel and meal the
          planner suggests — and you can edit them whenever your tastes change.
        </p>
      </header>
      <PreferencesForm profile={profile} defaultName={user?.full_name || ""} />
      <SavedTravelers companions={profile?.companions || []} />
      <DeleteAccount />
    </div>
  );
}