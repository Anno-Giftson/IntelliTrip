import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents, packageBreakdown } from "@/lib/packagePricing";
import { createPackageCheckout } from "@/lib/server-fns";

// Option 3: one Stripe checkout for the whole package. The total is recalculated
// on the server from the saved plan, never taken from the browser.
export default function PackageCheckout({ trip, beforePay }) {
  const createCheckout = useServerFn(createPackageCheckout);
  const { items, totalCents } = packageBreakdown(trip.plan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setError("");
    // Open the tab inside the click itself so popup blockers keep the user's intent.
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open("", "_blank") : null;
    if (isFramed && !checkoutTab) {
      setError("Allow pop-ups for this site to continue to secure checkout.");
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    setBusy(true);
    try {
      await beforePay?.();
      const { url } = await createCheckout({ data: { id: trip.id } });
      if (checkoutTab) checkoutTab.location.replace(url);
      else window.location.assign(url);
    } catch (err) {
      checkoutTab?.close();
      setError(err?.message || "Secure checkout could not be started. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        <ul className="divide-y divide-black/10 rounded-xl border border-border bg-card/60 px-3">
          {items.map((item) => (
            <li
              key={`${item.label}-${item.detail}`}
              className="flex items-baseline justify-between gap-3 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">{item.label}</span>
                {item.detail && (
                  <span className="block truncate text-xs text-foreground/60">{item.detail}</span>
                )}
              </span>
              <span className="text-sm font-medium tabular-nums">{formatCents(item.cents)}</span>
            </li>
          ))}
          <li className="flex items-baseline justify-between gap-3 py-2.5">
            <span className="text-sm font-semibold">Package total</span>
            <span className="text-sm font-semibold tabular-nums">{formatCents(totalCents)}</span>
          </li>
        </ul>
      ) : (
        <p className="text-sm text-foreground/70">
          The planner has not priced the flights and stay yet. Build the full plan first and the
          package total appears here.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button className="rounded-full" onClick={start} disabled={busy || !totalCents}>
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Opening secure checkout…" : "Instant AI Booking (1-Click Package Upgrade)"}
      </Button>
      <p className="text-xs text-foreground/60">
        You pay the package total once through Stripe. As soon as the payment clears, the seats and
        rooms are requested automatically from our booking partner — no forms, no calls.
      </p>
    </div>
  );
}