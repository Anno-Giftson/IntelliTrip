import { useState } from "react";
import { Link, createFileRoute, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Navigation, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/layout/BackButton";
import ExpensesPanel from "@/components/trips/ExpensesPanel";
import FinalizePanel from "@/components/trips/FinalizePanel";
import MapPanel from "@/components/trips/MapPanel";
import PaymentChannels from "@/components/trips/PaymentChannels";
import PlanEditor from "@/components/trips/PlanEditor";
import PlanView from "@/components/trips/PlanView";
import ShareTripButton from "@/components/trips/ShareTripButton";
import SpendTracker from "@/components/trips/SpendTracker";
import TeslaPanel from "@/components/trips/TeslaPanel";
import TravelParty from "@/components/trips/TravelParty";
import TripChatPanel from "@/components/trips/TripChatPanel";
import WeatherPanel from "@/components/trips/WeatherPanel";
import { buildFullPlan, deleteTrip, getTrip, rescheduleTrip } from "@/lib/server-fns";
import PastTripNotice from "@/components/trips/PastTripNotice";
import TripDatesEditor from "@/components/trips/TripDatesEditor";
import useTripDraft from "@/hooks/useTripDraft";
import useLocalToday from "@/hooks/useLocalToday";
import { hasPastPlanDates, localTimeZone } from "@/lib/tripDates";

export const Route = createFileRoute("/_authed/trips/$tripId")({
  ssr: false,
  // Show this screen's own loading state straight away instead of leaving the
  // previous page on screen until the trip arrives.
  pendingMs: 0,
  pendingComponent: TripLoading,
  loader: async ({ params }) => {
    const trip = await getTrip({ data: { id: params.tripId } });
    if (!trip) throw notFound();
    return { trip };
  },
  head: () => ({ meta: [{ title: "Trip plan" }] }),
  component: TripPage,
});

function TripLoading() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 p-10 text-sm text-foreground/70 backdrop-blur">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      Opening your trip…
    </div>
  );
}

function TripPage() {
  const { trip: loaded } = Route.useLoaderData();
  const build = useServerFn(buildFullPlan);
  const reschedulePlan = useServerFn(rescheduleTrip);
  const remove = useServerFn(deleteTrip);
  const router = useRouter();
  const navigate = useNavigate();
  const { trip, setTrip, status, setStatus, error, setError, patch, patchPlan, flush } = useTripDraft(loaded);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = useLocalToday();
  const past = hasPastPlanDates(trip, today);
  // A finalized trip stays editable — the badge just records that it is confirmed.
  const canEdit = !busy;
  const openEditor = editing && canEdit;

  async function saveDates(dates) {
    setBusy(true); setStatus("Rebuilding for the new dates…"); setError("");
    try {
      await flush();
      setStatus("Rebuilding for the new dates…");
      setTrip(await reschedulePlan({ data: { id: trip.id, start_date: dates.start_date, end_date: dates.end_date, time_zone: dates.time_zone } }));
      setStatus("Plan rebuilt and saved");
    } catch (err) { setStatus("Dates not changed"); throw err; }
    finally { setBusy(false); }
  }

  function reschedule() {
    setEditing(true);
    setTimeout(() => { document.getElementById("trip-start")?.scrollIntoView({ behavior: "smooth", block: "center" }); document.getElementById("trip-start")?.focus(); }, 0);
  }

  async function runBuild() {
    setBusy(true);
    setStatus("Building…");
    setError("");
    try {
      await flush();
      setStatus("Building…");
      setTrip(await build({ data: { id: trip.id, time_zone: localTimeZone() } }));
      setStatus("Saved");
    } catch (err) {
      setStatus("");
      setError(err?.message || "The planner could not build the full plan just now.");
    } finally { setBusy(false); }
  }

  async function removeTrip() {
    if (!window.confirm("Delete this trip and everything in it?")) return;
    await flush();
    await remove({ data: { id: trip.id } });
    await router.invalidate();
    navigate({ to: "/" });
  }

  const deleteButton = (
    <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-foreground" onClick={removeTrip}>
      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
      Delete this trip
    </Button>
  );

  return (
    <fieldset disabled={busy} className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <BackButton label="My trips" />
        <Badge variant={trip.status === "finalized" ? "secondary" : "outline"}>
          {trip.status === "finalized" ? "Finalized" : trip.stage === "frame" ? "Basic layout" : "In progress"}
        </Badge>
        {status && <span className="text-xs text-foreground/60">{status}</span>}
        <div className="ml-auto">
          <ShareTripButton tripId={trip.id} />
        </div>
      </div>

      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{trip.title || trip.destination}</h1>
        <p className="text-sm text-foreground/70">
          {trip.destination || "Destination to be chosen"} · {trip.start_date} to {trip.end_date} ·{" "}
          {trip.travelers || 1} traveller{(trip.travelers || 1) === 1 ? "" : "s"}
          {trip.budget ? ` · ${trip.budget}` : ""}
        </p>
      </header>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <PastTripNotice trip={trip} onReschedule={reschedule} onKeep={() => patch({ keep_as_reference: true })} onDelete={removeTrip} disabled={busy} />
      {openEditor && <TripDatesEditor key={`${trip.start_date}-${trip.end_date}`} trip={trip} onSave={saveDates} />}

      {trip.stage === "frame" ? (
        <>
          <div className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
            <h2 className="text-lg font-semibold">Here's the basic layout</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Have a read. If it feels right, I'll build the whole thing — your flights, stay, food, packing, costs
              and your day-by-day. Nothing is booked or paid for until you say so.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="rounded-full" onClick={runBuild} disabled={busy || past}>
                {status === "Building…" && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {status === "Building…" ? "Building the whole plan…" : "Looks good — build the full plan"}
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => setEditing((v) => !v)}>
                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                {editing ? "Done editing" : "Adjust the brief"}
              </Button>
            </div>
            {status === "Building…" && <p className="mt-2 text-sm text-foreground/70">This takes a few seconds.</p>}
          </div>
          {editing ? (
            <PlanEditor trip={trip} patchTrip={patch} patchPlan={patchPlan} />
          ) : (
            <PlanView plan={trip.plan} trip={trip} />
          )}
          <div>{deleteButton}</div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap justify-end gap-2">
            {canEdit && (
              <Button variant="outline" className="rounded-full" onClick={() => setEditing((v) => !v)}>
                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                {editing ? "Done editing" : "Edit the plan"}
              </Button>
            )}
            {trip.map_points?.days?.length > 0 && (
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/drive/$tripId" params={{ tripId: trip.id }}>
                  <Navigation className="mr-2 h-4 w-4" aria-hidden="true" />
                  Drive mode
                </Link>
              </Button>
            )}
            <TripChatPanel trip={trip} onUpdated={(updated) => updated && setTrip(updated)} disabled={busy} />
          </div>
          {openEditor ? (
            <PlanEditor trip={trip} patchTrip={patch} patchPlan={patchPlan} />
          ) : (
            <PlanView
              plan={trip.plan}
              trip={trip}
              disabled={!canEdit}
              onEventsChange={(custom_events) => patch({ custom_events })}
              onTripUpdated={(updated) => updated && setTrip(updated)}
            />
          )}
          <WeatherPanel trip={trip} />
          <MapPanel trip={trip} onUpdated={(updated) => updated && setTrip(updated)} />
          <TravelParty trip={trip} onChange={(companions) => patch({ companions })} disabled={!canEdit} />
          <ExpensesPanel
            trip={trip}
            onChange={(shared_expenses) => patch({ shared_expenses })}
            disabled={!canEdit}
          />
          <SpendTracker trip={trip} disabled={!canEdit} />
          <PaymentChannels trip={trip} beforePay={flush} onUpdated={(updated) => updated && setTrip(updated)} />
          <TeslaPanel trip={trip} onUpdated={(updated) => updated && setTrip(updated)} />
          <div>{deleteButton}</div>
          <FinalizePanel trip={trip} onUpdated={setTrip} beforeFinalize={flush} disabled={past || busy} />
        </>
      )}
    </fieldset>
  );
}