const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Paperclip, Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addExpense } from "@/lib/expense-fns";

const CATEGORIES = ["Food", "Transit", "Stay", "Activity", "Shopping", "Other"];

export default function ExpenseForm({ tripId, onAdded, disabled }) {
  const create = useServerFn(addExpense);
  const fileInput = useRef(null);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (!label.trim() || !Number.isFinite(cents) || cents <= 0) {
      setError("Add what you bought and how much it cost.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const picked = fileInput.current?.files?.[0];
      const receipt_file_uri = picked
        ? (await db.integrations.Core.UploadPrivateFile({ file: picked })).file_uri
        : undefined;
      const created = await create({
        data: { trip_id: tripId, label: label.trim(), amount_cents: cents, category, spent_on: spentOn, receipt_file_uri },
      });
      onAdded(created);
      setLabel("");
      setAmount("");
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      setError(err?.message || "Could not save that expense.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-border bg-card/50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="text-xs" htmlFor="expense-label">What did you pay for?</Label>
          <Input
            id="expense-label"
            value={label}
            placeholder="Dinner at Time Out Market"
            className="mt-1 bg-card"
            disabled={disabled || busy}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs" htmlFor="expense-amount">Amount (USD)</Label>
          <Input
            id="expense-amount"
            inputMode="decimal"
            value={amount}
            placeholder="42.50"
            className="mt-1 bg-card"
            disabled={disabled || busy}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs" htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            value={spentOn}
            className="mt-1 bg-card"
            disabled={disabled || busy}
            onChange={(e) => setSpentOn(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory} disabled={disabled || busy}>
            <SelectTrigger className="mt-1 min-h-[44px] bg-card" aria-label="Expense category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs" htmlFor="expense-receipt">
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" aria-hidden="true" />
              Receipt (optional)
            </span>
          </Label>
          <Input id="expense-receipt" type="file" accept="image/*,.pdf" ref={fileInput} className="mt-1 bg-card" disabled={disabled || busy} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="sm" className="rounded-full" disabled={disabled || busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="mr-2 h-4 w-4" aria-hidden="true" />}
        Add expense
      </Button>
    </form>
  );
}