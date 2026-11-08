import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CreditCard, ExternalLink, Sparkles } from "lucide-react";
import PlanSection from "@/components/trips/PlanSection";
import { Button } from "@/components/ui/button";
import InAppCheckout from "@/components/trips/pay/InAppCheckout";
import DirectBookingLinks from "@/components/trips/pay/DirectBookingLinks";
import PackageCheckout from "@/components/trips/pay/PackageCheckout";
import { markTripPaid } from "@/lib/server-fns";

const CHANNELS = [
  {
    id: "inapp",
    label: "Secure in-app checkout",
    hint: "Save a card once, then autofill and pay in the booking window.",
    Icon: CreditCard,
  },
  {
    id: "links",
    label: "Book direct",
    hint: "Opens the exact flight and hotel checkout with your dates filled in.",
    Icon: ExternalLink,
  },
  {
    id: "stripe",
    label: "Instant AI booking",
    hint: "Pay the whole package in one Stripe checkout and we reserve it.",
    Icon: Sparkles,
  },
];

export default function PaymentChannels({ trip, beforePay, onUpdated }) {
  const navigate = useNavigate();
  const markPaid = useServerFn(markTripPaid);
  const [channel, setChannel] = useState("inapp");
  const [error, setError] = useState("");

  async function finish({ method, label, last4 }) {
    setError("");
    await beforePay?.();
    const updated = await markPaid({
      data: {
        id: trip.id,
        method,
        label: [label, last4 && `····${last4}`].filter(Boolean).join(" · "),
      },
    });
    onUpdated?.(updated);
    navigate({ to: "/trips/$tripId/paid", params: { tripId: trip.id }, search: { method } });
  }

  if (trip.paid_at) {
    return (
      <PlanSection title="Confirm & pay" hint="paid">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{trip.payment_label || "Payment recorded"}</p>
            <p className="mt-1 text-xs text-foreground/65">
              Add the trip to Google Calendar and keep the confirmation from the success page.
            </p>
            <Button
              variant="outline"
              className="mt-3 rounded-full"
              onClick={() =>
                navigate({ to: "/trips/$tripId/paid", params: { tripId: trip.id }, search: {} })
              }
            >
              View confirmation
            </Button>
          </div>
        </div>
      </PlanSection>
    );
  }

  return (
    <PlanSection title="Confirm & pay" hint="three ways to finish">
      <div className="grid gap-2 sm:grid-cols-3">
        {CHANNELS.map(({ id, label, hint, Icon }) => {
          const active = channel === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setChannel(id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active
                  ? "border-foreground/60 bg-card"
                  : "border-border bg-card/50 hover:bg-card/80"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="mt-2 block text-sm font-medium">{label}</span>
              <span className="mt-1 block text-xs leading-snug text-foreground/60">{hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {error && (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {channel === "inapp" && (
          <InAppCheckout
            trip={trip}
            onPay={finish}
          />
        )}
        {channel === "links" && (
          <DirectBookingLinks
            trip={trip}
            onPay={finish}
          />
        )}
        {channel === "stripe" && <PackageCheckout trip={trip} beforePay={beforePay} />}
      </div>
    </PlanSection>
  );
}