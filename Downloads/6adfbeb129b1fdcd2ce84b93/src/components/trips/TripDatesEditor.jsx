import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PlanSection from "@/components/trips/PlanSection";
import useLocalToday from "@/hooks/useLocalToday";
import { localTimeZone, tripDateError } from "@/lib/tripDates";

export default function TripDatesEditor({ trip, onSave }) {
  const today = useLocalToday();
  const [start, setStart] = useState(trip.start_date || "");
  const [end, setEnd] = useState(trip.end_date || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const timeZone = localTimeZone();
    const problem = tripDateError(start, end, timeZone);
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    try { await onSave({ start_date: start, end_date: end, time_zone: timeZone, rebuild_dates: true }); }
    catch (err) { setError(err.message || "The dates could not be updated. Your old plan is unchanged."); }
    finally { setBusy(false); }
  }
  return (
    <PlanSection title="Travel dates" hint="updates the whole plan">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="trip-start">Start</Label><Input id="trip-start" type="date" min={today || undefined} value={start} onChange={(e) => setStart(e.target.value)} required disabled={busy} className="mt-1 bg-card" /></div>
          <div><Label htmlFor="trip-end">End</Label><Input id="trip-end" type="date" min={start > today ? start : today || undefined} value={end} onChange={(e) => setEnd(e.target.value)} required disabled={busy} className="mt-1 bg-card" /></div>
        </div>
        <p className="text-xs text-foreground/70">Both dates are saved together. Flights, daily activities, stay length, packing and costs are rebuilt for these dates; existing calendar entries update too. Actual bookings are not changed.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="rounded-full">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Rebuilding for the new dates…" : "Update dates & rebuild plan"}</Button>
      </form>
    </PlanSection>
  );
}