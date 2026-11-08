import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, CalendarPlus, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { prepareCalendarInvite } from "@/lib/server-fns";
import { connectTripToGoogleCalendar, warmUpGoogleIdentity } from "@/lib/googleCalendarClient";

// Signs in with Google straight from the page and writes the trip's dates,
// flight times and places into the traveller's own calendar.
export default function CalendarHook({ trip, onUpdated }) {
  const prepare = useServerFn(prepareCalendarInvite);
  const [on, setOn] = useState(Boolean(trip.calendar_package_prepared_at));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Google's sign-in script is fetched ahead of time so the toggle can open its
  // pop-up immediately when tapped.
  useEffect(() => {
    warmUpGoogleIdentity().catch(() => {});
  }, []);

  async function toggle(enabled) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      if (!enabled) {
        const result = await prepare({ data: { id: trip.id, enabled: false } });
        setOn(false);
        onUpdated?.(result.trip);
        return;
      }

      const created = await connectTripToGoogleCalendar(trip);
      const result = await prepare({ data: { id: trip.id, enabled: true } });
      setOn(true);
      onUpdated?.(result.trip);
      setNote(
        created.length
          ? `${created.length} event${created.length === 1 ? "" : "s"} added to your Google Calendar.`
          : "No events to add yet — build the full plan first.",
      );
    } catch (err) {
      setError(err?.message || "Could not add the trip to Google Calendar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor="google-calendar" className="flex items-center gap-2 text-sm font-semibold">
            {on ? (
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            )}
            Add Trip to Google Calendar
          </Label>
          <p className="mt-1 text-xs text-foreground/65">
            Connect your own Google Calendar and your dates, flight times and addresses are written straight
            into it. Nothing else is shared.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-foreground/60" aria-hidden="true" />}
          <Switch
            id="google-calendar"
            checked={on}
            disabled={busy}
            onCheckedChange={toggle}
            aria-label="Add trip to Google Calendar"
          />
        </div>
      </div>
      {note && <p className="mt-3 text-xs font-medium text-foreground/70">{note}</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}