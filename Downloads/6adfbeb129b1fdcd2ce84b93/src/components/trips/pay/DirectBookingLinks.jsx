import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { bookingLinks } from "@/lib/bookingLinks";

// The exact fare and room for this plan: flight numbers, dates and the stay the
// AI named, filled into the airline's and hotel's own search.
export default function DirectBookingLinks({ trip, onPay }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const links = bookingLinks(trip);

  async function done() {
    setBusy(true);
    setError("");
    try {
      await onPay({ method: "link", label: "Booked directly with the airline and hotel" });
    } catch (err) {
      setError(err?.message || "That could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  if (links.length === 0) {
    return (
      <p className="text-sm text-foreground/70">
        Build the full plan first — the flight and stay links open once the planner has named them.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={`${link.kind}-${link.label}-${link.url}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-3 py-2.5 hover:bg-card"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{link.label}</span>
                {link.detail && (
                  <span className="block truncate text-xs text-foreground/60">{link.detail}</span>
                )}
              </span>
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-foreground/60">
        Each link opens in a new tab on the exact flight number and stay dates from your plan. You pay
        the airline or hotel directly, so the booking stays in your name.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button variant="outline" className="rounded-full" onClick={done} disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        I've finished booking
      </Button>
    </div>
  );
}