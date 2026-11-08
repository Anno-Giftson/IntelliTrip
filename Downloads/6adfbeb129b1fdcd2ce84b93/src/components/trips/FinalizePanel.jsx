import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlanSection from "@/components/trips/PlanSection";
import SendReminderButton from "@/components/trips/SendReminderButton";
import { finalizeTrip } from "@/lib/server-fns";

const DAY_OPTIONS = [1, 2, 3, 7];

export default function FinalizePanel({ trip, onUpdated, beforeFinalize, disabled }) {
  const finalize = useServerFn(finalizeTrip);
  const saved = trip.prefs || {};
  const [prefs, setPrefs] = useState({
    reminders: saved.reminders ?? true,
    mute_notifications: saved.mute_notifications ?? false,
    notify_before_days: saved.notify_before_days ?? 2,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      await beforeFinalize?.();
      onUpdated(await finalize({ data: { id: trip.id, prefs } }));
    } catch (err) {
      setError(err?.message || "Could not finalize just now.");
    } finally {
      setBusy(false);
    }
  }

  if (trip.status === "finalized") {
    return (
      <PlanSection title="Ready to go">
        <p className="flex items-center gap-2 text-sm font-medium">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          Finalized — this trip is all set on the technical side.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-foreground/75">
          <li>· Reminders: {prefs.reminders ? `on, ${prefs.notify_before_days} day(s) before` : "off"}</li>
          <li>· Notifications during the trip: {prefs.mute_notifications ? "quiet" : "on"}</li>
          <li>· Payments: pay in the app with your saved card, or on the airline and hotel pages above.</li>
        </ul>

        <div className="mt-4">
          <SendReminderButton tripId={trip.id} />
        </div>
      </PlanSection>
    );
  }

  return (
    <PlanSection title="Finalize" hint="autosaved — you can come back anytime">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <Label htmlFor="pref-reminders" className="text-sm font-normal">
            Send me reminders before the trip
          </Label>
          <Switch
            id="pref-reminders"
            checked={prefs.reminders}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, reminders: v }))}
          />
        </div>

        {prefs.reminders && (
          <div className="flex items-center justify-between gap-3 pl-1">
            <span className="text-sm text-foreground/70">How many days before?</span>
            <Select
              value={String(prefs.notify_before_days)}
              onValueChange={(value) => setPrefs((p) => ({ ...p, notify_before_days: Number(value) }))}
            >
              <SelectTrigger className="min-h-[44px] w-32" aria-label="Days before the trip">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} day{d === 1 ? "" : "s"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <Label htmlFor="pref-mute" className="text-sm font-normal">
            Turn unnecessary notifications off while I'm away
          </Label>
          <Switch
            id="pref-mute"
            checked={prefs.mute_notifications}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, mute_notifications: v }))}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {disabled && <p className="text-sm text-foreground/70">Reschedule the past-dated plan before finalizing.</p>}
        <Button className="rounded-full" disabled={busy || disabled} onClick={run}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Finalize this trip
        </Button>
        <div>
          <SendReminderButton tripId={trip.id} />
        </div>
      </div>
    </PlanSection>
  );
}