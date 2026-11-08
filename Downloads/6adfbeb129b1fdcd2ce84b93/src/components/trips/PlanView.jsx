import DayTimeline from "@/components/trips/DayTimeline";
import PlanFacts from "@/components/trips/PlanFacts";
import PlanFlights from "@/components/trips/PlanFlights";
import PlanSection from "@/components/trips/PlanSection";
import { shiftDate } from "@/lib/calendarLinks";

export default function PlanView({ plan, trip, onEventsChange, onTripUpdated, disabled = false }) {
  if (!plan) return null;
  const itinerary = plan.itinerary || [];
  // Only the full workspace passes the handlers; a basic layout stays read-only.
  const eventsEnabled = Boolean(onEventsChange) && !disabled;
  const food = plan.food || [];
  const packing = plan.packing || [];
  const budget = plan.budget || [];

  return (
    <div className="space-y-4">
      {plan.summary && (
        <PlanSection title="The idea">
          <p className="text-sm leading-relaxed">{plan.summary}</p>
        </PlanSection>
      )}

      <PlanFlights flights={plan.flights} />

      {plan.travel && (
        <PlanSection title="Getting there">
          <PlanFacts
            rows={[
              ["How", plan.travel.mode],
              ["Route", plan.travel.route],
              ["Cost", plan.travel.cost],
              ["Good to know", plan.travel.notes],
            ]}
          />
        </PlanSection>
      )}

      {plan.lodging && (
        <PlanSection title="Where you stay">
          <PlanFacts
            rows={[
              ["Place", plan.lodging.name],
              ["Area", plan.lodging.area],
              ["Nights", plan.lodging.nights],
              ["Cost", plan.lodging.cost],
              ["Notes", plan.lodging.notes],
            ]}
          />
        </PlanSection>
      )}

      {food.length > 0 && (
        <PlanSection title="Where to eat" hint={`${food.length} places`}>
          <ul className="divide-y divide-black/10">
            {food.map((item, i) => (
              <li key={`${item.name}-${i}`} className="py-2 first:pt-0 last:pb-0">
                <p className="text-sm font-medium">
                  {item.name}
                  {item.cuisine ? ` · ${item.cuisine}` : ""}
                </p>
                <p className="text-sm text-foreground/70">{item.must_try}</p>
                {item.cost && <p className="text-xs text-foreground/55">{item.cost}</p>}
              </li>
            ))}
          </ul>
        </PlanSection>
      )}

      {itinerary.length > 0 && (
        <PlanSection title="Day by day" hint={`${itinerary.length} days`}>
          <ol className="space-y-3">
            {itinerary.map((day, i) => (
              <DayTimeline
                key={`${day.day}-${i}`}
                day={day}
                date={day.date || (trip?.start_date ? shiftDate(trip.start_date, i) : "")}
                trip={trip}
                disabled={!eventsEnabled}
                onEventsChange={onEventsChange}
                onTripUpdated={onTripUpdated}
              />
            ))}
          </ol>
        </PlanSection>
      )}

      {packing.length > 0 && (
        <PlanSection title="What to pack" hint={`${packing.length} items`}>
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {packing.map((item, i) => (
              <li key={`${item}-${i}`} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </PlanSection>
      )}

      {budget.length > 0 && (
        <PlanSection title="What it costs">
          <ul className="divide-y divide-black/10">
            {budget.map((line, i) => (
              <li key={`${line.label}-${i}`} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
                <span className="text-sm">{line.label}</span>
                <span className="text-sm font-medium tabular-nums">{line.amount}</span>
              </li>
            ))}
          </ul>
          {plan.booking_note && <p className="mt-3 text-sm text-foreground/70">{plan.booking_note}</p>}
        </PlanSection>
      )}

      {plan.departure_brief && (
        <PlanSection title="On the day — your instructions">
          <p className="whitespace-pre-line text-sm leading-relaxed">{plan.departure_brief}</p>
        </PlanSection>
      )}

    </div>
  );
}