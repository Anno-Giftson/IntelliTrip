import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Loader2, MapPin, Pencil, Plus, Sparkles, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomEventDialog from "@/components/trips/CustomEventDialog";
import { dayTimeline, eventsForDate, findConflict, timeToMinutes } from "@/lib/customEvents";
import { optimizeDay } from "@/lib/server-fns";

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// One day of the plan: the AI block and the traveller's own activities merged in
// chronological order, with the controls for adding and optimising.
export default function DayTimeline({ day, date, trip, disabled, onEventsChange, onTripUpdated }) {
  const optimize = useServerFn(optimizeDay);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [optimizing, setOptimizing] = useState(false);

  const events = eventsForDate(trip.custom_events, date);
  const flights = (trip.plan?.flights || []).filter((leg) => leg.date === date);
  const items = dayTimeline({ ...day, date }, events);

  const validate = (candidate) =>
    findConflict({
      start: timeToMinutes(candidate.start_time),
      end: timeToMinutes(candidate.end_time),
      events: events.filter((event) => event.id !== candidate.id),
      flights,
      day,
    });

  function save(next) {
    const saved = { ...next, id: next.id || newId() };
    onEventsChange?.([...(trip.custom_events || []).filter((event) => event.id !== saved.id), saved]);
    setOpen(false);
    setEditing(null);
    setError("");
  }

  function remove(id) {
    onEventsChange?.((trip.custom_events || []).filter((event) => event.id !== id));
  }

  async function runOptimize() {
    setOptimizing(true);
    setError("");
    try {
      const updated = await optimize({ data: { id: trip.id, date } });
      onTripUpdated?.(updated);
    } catch (err) {
      setError(err?.message || "Could not optimise this day just now.");
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <li className="border-l-2 border-border pl-3">
      <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">
        {day.day}
        {date ? ` · ${date}` : ""}
      </p>

      <ul className="mt-1 space-y-2">
        {items.map((item) =>
          item.kind === "ai" ? (
            <li key={item.key}>
              <p className="text-sm font-medium">{item.day.title}</p>
              <p className="text-sm leading-relaxed text-foreground/70">{item.day.details}</p>
            </li>
          ) : (
            <li
              key={item.key}
              className="rounded-xl border border-border bg-card/70 p-3 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {item.event.start_time}–{item.event.end_time}
                    <span className="truncate">{item.event.title}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <User className="h-3 w-3" aria-hidden="true" />
                      User Created
                    </Badge>
                    {item.event.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.event.category}
                      </Badge>
                    )}
                    {item.event.cost && <span className="text-xs text-foreground/60">{item.event.cost}</span>}
                  </div>
                </div>
                {!disabled && (
                  <div className="flex shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${item.event.title}`}
                      onClick={() => {
                        setEditing(item.event);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${item.event.title}`}
                      onClick={() => remove(item.event.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>
              {item.event.location && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/65">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.event.location}
                </p>
              )}
              {item.event.notes && <p className="mt-1 text-xs text-foreground/65">{item.event.notes}</p>}
            </li>
          ),
        )}
      </ul>

      {!disabled && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add custom activity
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={optimizing || events.length === 0}
            title={events.length === 0 ? "Add your own activity first" : undefined}
            onClick={runOptimize}
          >
            {optimizing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {optimizing ? "Optimising…" : "Optimize day"}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}

      {!disabled && (
        <CustomEventDialog
          key={`${open}-${editing?.id || "new"}`}
          open={open}
          date={date}
          dayLabel={[day.day, date].filter(Boolean).join(" · ")}
          initial={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={save}
          validate={validate}
        />
      )}
    </li>
  );
}