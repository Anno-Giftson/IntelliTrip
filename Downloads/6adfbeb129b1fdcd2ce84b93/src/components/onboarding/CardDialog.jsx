import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const brandOf = (digits) => {
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6/.test(digits)) return "Discover";
  return "Card";
};

const formatNumber = (raw) =>
  raw
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();

export default function CardDialog({ open, onClose, onSaved }) {
  const [values, setValues] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [error, setError] = useState("");
  const digits = values.number.replace(/\D/g, "");

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  function submit(event) {
    event.preventDefault();
    if (!values.name.trim()) return setError("Add the name printed on the card.");
    if (digits.length < 13) return setError("That card number looks too short.");
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(values.expiry.trim())) return setError("Expiry should look like 04/28.");
    if (values.cvc.replace(/\D/g, "").length < 3) return setError("The security code is the 3 or 4 digits on the back.");
    setError("");
    // The number, expiry and code stay in this window — only the brand is kept.
    setValues({ name: "", number: "", expiry: "", cvc: "" });
    onSaved({ card_added: true, card_brand: brandOf(digits) });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a card</DialogTitle>
          <DialogDescription>
            Saved for one-tap checkout. Nothing is charged unless you confirm a payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="card-name">Name on card</Label>
            <Input
              id="card-name"
              value={values.name}
              autoComplete="cc-name"
              placeholder="Alex Rivera"
              className="mt-1"
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="card-number">Card number</Label>
            <Input
              id="card-number"
              value={values.number}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              className="mt-1"
              onChange={(e) => set("number", formatNumber(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="card-expiry">Expiry</Label>
              <Input
                id="card-expiry"
                value={values.expiry}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="04/28"
                className="mt-1"
                onChange={(e) => set("expiry", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="card-cvc">Security code</Label>
              <Input
                id="card-cvc"
                value={values.cvc}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                className="mt-1"
                onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-foreground/60">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Card details are never written into your trip plan.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full">
              Save card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}