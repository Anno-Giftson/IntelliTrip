import { Plus, Trash2 } from "lucide-react";
import PlanSection from "@/components/trips/PlanSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  { key: "full_name", label: "Name", placeholder: "Sam Rivera" },
  { key: "home_city", label: "Travels from", placeholder: "Boston" },
  { key: "likes", label: "Likes", placeholder: "Museums, long lunches" },
  { key: "dislikes", label: "Dislikes", placeholder: "Early starts, crowds" },
  { key: "dietary", label: "Food needs", placeholder: "Gluten free" },
];

const EMPTY = { full_name: "", home_city: "", likes: "", dislikes: "", dietary: "" };

// The owner's saved profile is always used; these are the people travelling
// with them, and the planner blends every profile into one balanced plan.
export default function TravelParty({ trip, onChange, disabled }) {
  const companions = trip.companions || [];

  const commit = (next) => onChange?.(next);
  const edit = (index, key, value) =>
    commit(companions.map((person, i) => (i === index ? { ...person, [key]: value } : person)));

  return (
    <PlanSection title="Who's travelling" hint="every profile shapes the plan">
      {companions.length === 0 && (
        <p className="text-sm text-foreground/70">
          Travelling with someone? Add their likes, dislikes and food needs and the plan is built for both of you.
        </p>
      )}

      <ul className="space-y-4">
        {companions.map((person, index) => (
          <li key={`companion-${index}`} className="rounded-xl border border-border bg-card/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{person.full_name || `Traveller ${index + 2}`}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove this traveller"
                disabled={disabled}
                onClick={() => commit(companions.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key}>
                  <Label className="text-xs" htmlFor={`companion-${index}-${field.key}`}>
                    {field.label}
                  </Label>
                  <Input
                    id={`companion-${index}-${field.key}`}
                    value={person[field.key] || ""}
                    placeholder={field.placeholder}
                    className="mt-1 bg-card"
                    disabled={disabled}
                    onChange={(event) => edit(index, field.key, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 rounded-full"
        disabled={disabled || companions.length >= 9}
        onClick={() => commit([...companions, { ...EMPTY }])}
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Add a traveller
      </Button>
    </PlanSection>
  );
}