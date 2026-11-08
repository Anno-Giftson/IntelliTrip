import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import useLocalToday from "@/hooks/useLocalToday";
import { hasPastPlanDates } from "@/lib/tripDates";

export default function PastTripNotice({ trip, onReschedule, onKeep, onDelete, disabled }) {
  const today = useLocalToday();
  if (trip.status === "finalized" || !hasPastPlanDates(trip, today)) return null;
  return (
    <section role="alert" className="rounded-2xl border border-border bg-card/90 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><CalendarClock className="h-5 w-5" />{trip.keep_as_reference ? "Kept as a past reference" : "This unfinished plan has past dates"}</h2>
      <p className="mt-2 text-sm text-foreground/75">{trip.start_date < today ? "The departure date has already passed." : "Some flights or activities still have old dates."} Choose current or future dates and rebuild before finalizing. Past events will not be added to Google Calendar.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="rounded-full" onClick={onReschedule} disabled={disabled}>Choose new dates</Button>
        {!trip.keep_as_reference && <Button variant="outline" className="rounded-full" onClick={onKeep} disabled={disabled}>Keep as reference</Button>}
        <Button variant="ghost" className="rounded-full" onClick={onDelete} disabled={disabled}>Delete this trip</Button>
      </div>
    </section>
  );
}