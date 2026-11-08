import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELD = "mt-1 rounded-xl";

// Card inputs shared by the save step and the simulated checkout window.
// Values live in React state only and are never sent to a server.
export default function CardFields({ card, onChange, readOnly = false }) {
  const set = (key) => (onChange ? (event) => onChange(key, event.target.value) : undefined);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="card-number">Card number</Label>
        <Input
          id="card-number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          value={card.number}
          onChange={set("number")}
          readOnly={readOnly}
          className={FIELD}
        />
      </div>
      <div>
        <Label htmlFor="card-expiry">Expiry</Label>
        <Input
          id="card-expiry"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM / YY"
          value={card.expiry}
          onChange={set("expiry")}
          readOnly={readOnly}
          className={FIELD}
        />
      </div>
      <div>
        <Label htmlFor="card-cvc">CVC</Label>
        <Input
          id="card-cvc"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="123"
          value={card.cvc}
          onChange={set("cvc")}
          readOnly={readOnly}
          className={FIELD}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="card-name">Name on card</Label>
        <Input
          id="card-name"
          autoComplete="cc-name"
          placeholder="Alex Rivera"
          value={card.name}
          onChange={set("name")}
          readOnly={readOnly}
          className={FIELD}
        />
      </div>
    </div>
  );
}