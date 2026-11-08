import PlanSection from "@/components/trips/PlanSection";

export default function PlanFlights({ flights }) {
  const legs = flights || [];
  if (legs.length === 0) return null;

  return (
    <PlanSection title="Your flights" hint={`${legs.length} leg${legs.length === 1 ? "" : "s"}`}>
      <ul className="space-y-3">
        {legs.map((leg, i) => (
          <li key={`${leg.flight_number}-${i}`} className="rounded-xl border border-border bg-card/70 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">
                {leg.airline}
                {leg.flight_number ? ` · ${leg.flight_number}` : ""}
              </p>
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">
                {[leg.direction, leg.date].filter(Boolean).join(" · ")}
              </p>
            </div>

            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Departs</p>
                <p className="font-medium">{leg.departs || "—"}</p>
                {leg.departs_at && <p className="text-foreground/70">{leg.departs_at}</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Arrives</p>
                <p className="font-medium">{leg.arrives || "—"}</p>
                {leg.arrives_at && <p className="text-foreground/70">{leg.arrives_at}</p>}
              </div>
            </div>

            {(leg.duration || leg.stops || leg.cost) && (
              <p className="mt-2 text-xs text-foreground/60">
                {[leg.duration, leg.stops, leg.cost].filter(Boolean).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-foreground/60">
        These are the usual flights on this route — confirm the exact schedule and fare when you book.
      </p>
    </PlanSection>
  );
}