import { useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import CardFields from "@/components/trips/pay/CardFields";
import CheckoutFrame from "@/components/trips/pay/CheckoutFrame";

const digits = (value) => String(value || "").replace(/\D/g, "");
const last4 = (value) => digits(value).slice(-4);
const masked = (value) => (last4(value) ? `•••• •••• •••• ${last4(value)}` : "");

const cardComplete = (card) =>
  digits(card.number).length >= 12 &&
  /^\d{1,2}\s*\/?\s*\d{2}$/.test(card.expiry.trim()) &&
  /^\d{3,4}$/.test(card.cvc.trim()) &&
  card.name.trim().length > 1;

const EMPTY = { number: "", expiry: "", cvc: "", name: "" };

export default function InAppCheckout({ trip, onPay }) {
  const [choice, setChoice] = useState(""); // "save" or "manual"
  const [card, setCard] = useState(EMPTY);
  const [saved, setSaved] = useState(null); // the 1-click profile held in this tab's state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (key, value) => setCard((prev) => ({ ...prev, [key]: value }));

  function saveCard() {
    if (!cardComplete(card)) {
      setError("Fill in the card number, expiry, CVC and name to save it.");
      return;
    }
    setError("");
    setSaved({ last4: last4(card.number), name: card.name.trim(), expiry: card.expiry.trim() });
  }

  async function pay() {
    if (!saved && !cardComplete(card)) {
      setError("Fill in your card details in the checkout window to pay.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onPay({
        method: "inapp",
        label: saved ? "Saved card · 1-click checkout" : "Card entered at checkout",
        last4: last4(card.number),
      });
    } catch (err) {
      setError(err?.message || "That checkout could not go through.");
    } finally {
      setBusy(false);
    }
  }

  if (!choice) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card/60 p-4">
        <p className="text-sm font-medium">
          Would you like to securely save your card for 1-click checkout?
        </p>
        <p className="text-xs text-foreground/65">
          Your card stays in this browser tab only — it is never posted to our servers or stored in
          your account.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" onClick={() => setChoice("save")}>
            <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Yes, save my card
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setChoice("manual")}>
            No, I'll type it each time
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {choice === "save" && !saved && (
        <div className="space-y-3 rounded-xl border border-border bg-card/60 p-4">
          <CardFields card={card} onChange={update} />
          <Button className="rounded-full" onClick={saveCard}>
            <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
            Save card securely
          </Button>
        </div>
      )}

      {(choice === "manual" || saved) && (
        <CheckoutFrame
          title={`Secure checkout · ${trip.destination || "your trip"}`}
          subtitle={
            saved
              ? `Booking with your saved card ending ${saved.last4}. Press Autofill & Pay and we fill the form for you.`
              : "Type your details straight into the booking window below — nothing is saved."
          }
          footer={
            saved ? (
              <button
                type="button"
                className="text-xs font-medium text-foreground/60 underline"
                onClick={() => {
                  setSaved(null);
                  setCard(EMPTY);
                }}
              >
                Use a different card
              </button>
            ) : null
          }
        >
          <CardFields
            card={
              saved
                ? { number: masked(card.number), expiry: card.expiry, cvc: "•••", name: card.name }
                : card
            }
            onChange={saved ? undefined : update}
            readOnly={Boolean(saved)}
          />
          <Button className="w-full rounded-full" onClick={pay} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {busy ? "Completing checkout…" : saved ? "Autofill & Pay" : "Pay now"}
          </Button>
        </CheckoutFrame>
      )}
    </div>
  );
}