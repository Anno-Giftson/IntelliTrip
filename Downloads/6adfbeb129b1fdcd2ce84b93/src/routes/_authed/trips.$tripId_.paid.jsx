import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CalendarHook from "@/components/trips/CalendarHook";
import { confirmPackagePayment, getTrip } from "@/lib/server-fns";
import { formatCents } from "@/lib/packagePricing";

export const Route = createFileRoute("/_authed/trips/$tripId_/paid")({
  ssr: false,
  validateSearch: (search) => ({ method: search.method, session_id: search.session_id }),
  loader: async ({ params }) => {
    const trip = await getTrip({ data: { id: params.tripId } });
    if (!trip) throw notFound();
    return { trip };
  },
  head: () => ({ meta: [{ title: "Trip confirmation" }] }),
  component: PaidPage,
});

const CHANNEL_LABEL = {
  inapp: "Paid in the in-app checkout",
  link: "Booked directly with the airline and hotel",
  stripe: "Paid in full with Instant AI Booking",
};

function PaidPage() {
  const { trip: loaded } = Route.useLoaderData();
  const { session_id, method } = Route.useSearch();
  const confirm = useServerFn(confirmPackagePayment);
  // Stripe returns the session id; if only the stored checkout is known we still
  // ask Stripe server-side rather than trusting the redirect itself.
  const pendingCheckout = session_id || (!loaded.paid_at ? loaded.payment_checkout_id : "");
  const [trip, setTrip] = useState(loaded);
  const [state, setState] = useState(
    pendingCheckout ? "checking" : loaded.paid_at ? "paid" : "unpaid",
  );
  const [error, setError] = useState("");
  const checked = useRef(false);

  useEffect(() => {
    if (!pendingCheckout || checked.current) return;
    checked.current = true;
    confirm({ data: { id: loaded.id, session_id: pendingCheckout } })
      .then((result) => {
        setTrip(result.trip || loaded);
        setState(result.paid ? "paid" : "unpaid");
      })
      .catch((err) => {
        setError(err?.message || "We could not confirm that payment yet.");
        setState("unpaid");
      });
  }, [pendingCheckout, loaded, confirm]);

  const backToTrip = (
    <Button asChild variant="outline" className="rounded-full">
      <Link to="/trips/$tripId" params={{ tripId: trip.id }}>
        Open the plan
      </Link>
    </Button>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {state === "checking" && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <p className="text-sm font-medium">Confirming your payment with Stripe…</p>
        </div>
      )}

      {state === "paid" && (
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Payment confirmed</h1>
          <p className="mt-1 text-sm text-foreground/70">
            {CHANNEL_LABEL[trip.payment_channel] || CHANNEL_LABEL[method] || "Your trip is confirmed"} —{" "}
            {trip.destination || trip.title} · {trip.start_date} to {trip.end_date}
          </p>
          <dl className="mt-4 space-y-1 text-sm">
            {trip.payment_label && (
              <div className="flex justify-between gap-4">
                <dt className="text-foreground/60">Method</dt>
                <dd className="text-right font-medium">{trip.payment_label}</dd>
              </div>
            )}
            {trip.package_total_cents ? (
              <div className="flex justify-between gap-4">
                <dt className="text-foreground/60">Package total</dt>
                <dd className="text-right font-medium tabular-nums">
                  {formatCents(trip.package_total_cents)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/60">Travellers</dt>
              <dd className="text-right font-medium">{trip.travelers || 1}</dd>
            </div>
          </dl>
        </div>
      )}

      {state === "unpaid" && (
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight">No completed payment yet</h1>
          <p className="mt-1 text-sm text-foreground/70">
            {error || "Finish one of the checkout options on your plan and the confirmation appears here."}
          </p>
        </div>
      )}

      {state === "paid" && <CalendarHook trip={trip} onUpdated={(updated) => updated && setTrip(updated)} />}

      <div className="flex flex-wrap gap-2">
        {backToTrip}
        <Button asChild variant="ghost" className="rounded-full">
          <Link to="/">My trips</Link>
        </Button>
      </div>
    </div>
  );
}