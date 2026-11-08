import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PlanSection from "@/components/trips/PlanSection";
import { saveProfile } from "@/lib/server-fns";

const FIELDS = [
  { key: "full_name", label: "Your name", placeholder: "Alex Rivera" },
  { key: "home_city", label: "You usually travel from", placeholder: "New York" },
  { key: "likes", label: "What you like", textarea: true, placeholder: "Long walks, small towns, live music, swimming, markets" },
  { key: "dislikes", label: "What you don't like", textarea: true, placeholder: "Crowds, early flights, tourist traps, long queues" },
  { key: "dietary", label: "Food needs", placeholder: "Vegetarian, no shellfish" },
  { key: "pace", label: "Preferred pace", placeholder: "Relaxed — two things a day" },
  { key: "stay_style", label: "Where you'd rather stay", placeholder: "Small boutique places, walkable areas" },
  { key: "avoid", label: "Anything to avoid", textarea: true, placeholder: "Extreme heat, very long drives" },
  { key: "notes", label: "Anything else the planner should know", textarea: true, placeholder: "Travelling with my sister; I get motion sick" },
];

export default function PreferencesForm({ profile, defaultName }) {
  const save = useServerFn(saveProfile);
  const [values, setValues] = useState(() => {
    const start = { full_name: defaultName || "" };
    FIELDS.forEach((f) => {
      start[f.key] = profile?.[f.key] ?? "";
    });
    return start;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    if (!values.full_name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await save({ data: values });
      toast("Preferences saved", { description: "Every new plan will follow them." });
    } catch (err) {
      setError(err?.message || "Could not save your answers.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4">
        <PlanSection title="About you" hint="edit these anytime">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.key} className={field.textarea ? "sm:col-span-2" : ""}>
                <Label htmlFor={`pref-${field.key}`}>{field.label}</Label>
                {field.textarea ? (
                  <Textarea
                    id={`pref-${field.key}`}
                    value={values[field.key]}
                    rows={2}
                    placeholder={field.placeholder}
                    className="mt-1"
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={`pref-${field.key}`}
                    value={values[field.key]}
                    placeholder={field.placeholder}
                    className="mt-1 bg-card"
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </PlanSection>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="rounded-full" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}
          Save my answers
        </Button>
      </form>
    </div>
  );
}