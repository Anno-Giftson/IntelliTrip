import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PlanSection from "@/components/trips/PlanSection";
import { saveProfileCompanions } from "@/lib/server-fns";

const FIELDS = [
  { key: "full_name", label: "Name", placeholder: "Sam Rivera" },
  { key: "home_city", label: "Travels from", placeholder: "Boston" },
  { key: "likes", label: "Likes", placeholder: "Museums, long lunches" },
  { key: "dislikes", label: "Dislikes", placeholder: "Early starts, crowds" },
  { key: "dietary", label: "Food needs", placeholder: "Gluten free" },
];

const EMPTY = { full_name: "", home_city: "", likes: "", dislikes: "", dietary: "" };

// The people you usually travel with, kept here so every new plan already
// knows who is coming and what they want.
export default function SavedTravelers({ companions }) {
  const save = useServerFn(saveProfileCompanions);
  const [people, setPeople] = useState(companions || []);
  const [busy, setBusy] = useState(false);

  const edit = (index, key, value) =>
    setPeople((list) => list.map((person, i) => (i === index ? { ...person, [key]: value } : person)));

  async function submit() {
    const clean = people.filter((person) => (person.full_name || "").trim());
    setBusy(true);
    try {
      await save({ data: { companions: clean } });
      setPeople(clean);
      toast("Travellers saved", { description: "Every new plan is built for everyone you listed." });
    } catch (err) {
      toast.error(err?.message || "Could not save your travellers.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlanSection title="Who you travel with" hint="used in every new plan">
      {people.length === 0 && (
        <p className="text-sm text-foreground/70">
          Add the people you usually travel with — their likes, dislikes and food needs — and the planner balances
          every new trip for all of you.
        </p>
      )}

      <ul className="space-y-4">
        {people.map((person, index) => (
          <li key={`saved-traveller-${index}`} className="rounded-xl border border-border bg-card/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{person.full_name || `Traveller ${index + 1}`}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove this traveller"
                disabled={busy}
                onClick={() => setPeople((list) => list.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key}>
                  <Label className="text-xs" htmlFor={`saved-${index}-${field.key}`}>
                    {field.label}
                  </Label>
                  <Input
                    id={`saved-${index}-${field.key}`}
                    value={person[field.key] || ""}
                    placeholder={field.placeholder}
                    className="mt-1 bg-card"
                    disabled={busy}
                    onChange={(event) => edit(index, field.key, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={busy || people.length >= 9}
          onClick={() => setPeople((list) => [...list, { ...EMPTY }])}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add a traveller
        </Button>
        <Button type="button" size="sm" className="rounded-full" disabled={busy} onClick={submit}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Save travellers
        </Button>
      </div>
    </PlanSection>
  );
}