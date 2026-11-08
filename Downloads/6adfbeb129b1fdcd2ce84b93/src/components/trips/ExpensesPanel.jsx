import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import PlanSection from "@/components/trips/PlanSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents } from "@/lib/packagePricing";

const toRows = (trip) =>
  (trip.shared_expenses || []).map((line) => ({
    label: line.label || "",
    amount: line.amount_cents ? (line.amount_cents / 100).toFixed(2) : "",
    split: String(line.split_count || trip.travelers || 1),
  }));

const centsOf = (row) => Math.max(0, Math.round((Number(row.amount) || 0) * 100));

// Shared costs, split evenly or itemised line by line against the party size.
export default function ExpensesPanel({ trip, onChange, disabled }) {
  const travellers = Math.max(1, Number(trip.travelers) || 1);
  const [rows, setRows] = useState(() => toRows(trip));
  const [itemised, setItemised] = useState(() =>
    (trip.shared_expenses || []).some((line) => (line.split_count || 1) !== travellers),
  );

  const total = rows.reduce((sum, row) => sum + centsOf(row), 0);
  const perPerson = rows.reduce((sum, row) => sum + centsOf(row) / Math.max(1, Number(row.split) || 1), 0);

  function commit(next) {
    setRows(next);
    onChange?.(
      next
        .filter((row) => row.label.trim() || centsOf(row) > 0)
        .map((row) => ({
          label: row.label.trim() || "Expense",
          amount_cents: centsOf(row),
          split_count: Math.max(1, Math.min(travellers, Number(row.split) || 1)),
        })),
    );
  }

  const edit = (index, key, value) =>
    commit(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  function splitEvenly() {
    setItemised(false);
    commit(rows.map((row) => ({ ...row, split: String(travellers) })));
  }

  return (
    <PlanSection title="Split the cost" hint={`${travellers} traveller${travellers === 1 ? "" : "s"}`}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={itemised ? "outline" : "default"}
          className="rounded-full"
          disabled={disabled}
          onClick={splitEvenly}
        >
          <Users className="mr-2 h-4 w-4" aria-hidden="true" />
          Split evenly
        </Button>
        <Button
          type="button"
          size="sm"
          variant={itemised ? "default" : "outline"}
          className="rounded-full"
          disabled={disabled}
          onClick={() => setItemised(true)}
        >
          Itemise line by line
        </Button>
      </div>

      <ul className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <li key={`expense-${index}`} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <div>
              <Label className="text-xs" htmlFor={`expense-label-${index}`}>
                What for
              </Label>
              <Input
                id={`expense-label-${index}`}
                value={row.label}
                placeholder="Dinner, train tickets, museum"
                className="mt-1 bg-card"
                disabled={disabled}
                onChange={(event) => edit(index, "label", event.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs" htmlFor={`expense-amount-${index}`}>
                Amount
              </Label>
              <Input
                id={`expense-amount-${index}`}
                type="number"
                min="0"
                step="0.01"
                value={row.amount}
                placeholder="0.00"
                className="mt-1 bg-card"
                disabled={disabled}
                onChange={(event) => edit(index, "amount", event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              {itemised && (
                <div>
                  <Label className="text-xs" htmlFor={`expense-split-${index}`}>
                    People
                  </Label>
                  <Input
                    id={`expense-split-${index}`}
                    type="number"
                    min="1"
                    max={travellers}
                    value={row.split}
                    className="mt-1 w-20 bg-card"
                    disabled={disabled}
                    onChange={(event) => edit(index, "split", event.target.value)}
                  />
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove this expense"
                disabled={disabled}
                onClick={() => commit(rows.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 rounded-full"
        disabled={disabled}
        onClick={() => commit([...rows, { label: "", amount: "", split: itemised ? "1" : String(travellers) }])}
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Add a shared cost
      </Button>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <dt className="text-xs text-foreground/60">Total</dt>
          <dd className="font-medium">{formatCents(total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-foreground/60">Each person</dt>
          <dd className="font-medium">{formatCents(Math.round(perPerson))}</dd>
        </div>
      </dl>
    </PlanSection>
  );
}