const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import ExpenseForm from "@/components/trips/ExpenseForm";
import PlanSection from "@/components/trips/PlanSection";
import { deleteExpense, listExpenses } from "@/lib/expense-fns";

const usd = (cents) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const budgetCents = (budget) => {
  const parsed = Number(String(budget || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
};

export default function SpendTracker({ trip, disabled }) {
  const load = useServerFn(listExpenses);
  const remove = useServerFn(deleteExpense);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let alive = true;
    load({ data: { trip_id: trip.id } })
      .then((list) => alive && setExpenses(list))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [trip.id]);

  const spent = expenses.reduce((sum, item) => sum + (item.amount_cents || 0), 0);
  const budget = budgetCents(trip.budget);

  async function openReceipt(expense) {
    const { signed_url } = await db.integrations.Core.CreateFileSignedUrl({ file_uri: expense.receipt_file_uri });
    window.open(signed_url, "_blank", "noopener,noreferrer");
  }

  async function drop(expense) {
    setBusyId(expense.id);
    try {
      await remove({ data: { id: expense.id } });
      setExpenses((list) => list.filter((item) => item.id !== expense.id));
    } finally {
      setBusyId("");
    }
  }

  return (
    <PlanSection title="What you've spent" hint="receipts kept with the trip">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-2xl font-semibold tabular-nums">{usd(spent)}</p>
        {budget != null && (
          <p className="text-sm text-foreground/70">
            of {usd(budget)} planned ·{" "}
            <span className={spent > budget ? "text-destructive" : "text-foreground/70"}>
              {spent > budget ? `${usd(spent - budget)} over` : `${usd(budget - spent)} left`}
            </span>
          </p>
        )}
      </div>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-foreground/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading your expenses…
        </p>
      ) : expenses.length > 0 ? (
        <ul className="mt-3 divide-y divide-border">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{expense.label}</p>
                <p className="text-xs text-foreground/55">
                  {expense.category || "Other"}
                  {expense.spent_on ? ` · ${expense.spent_on}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {expense.receipt_file_uri && (
                  <Button type="button" variant="ghost" size="icon" aria-label="Open receipt" onClick={() => openReceipt(expense)}>
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
                <span className="min-w-[72px] text-right text-sm font-medium tabular-nums">
                  {usd(expense.amount_cents || 0)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete expense"
                  disabled={disabled || busyId === expense.id}
                  onClick={() => drop(expense)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-foreground/70">Nothing logged yet — add the first thing you paid for.</p>
      )}

      <ExpenseForm
        tripId={trip.id}
        disabled={disabled}
        onAdded={(created) => setExpenses((list) => [created, ...list])}
      />
    </PlanSection>
  );
}