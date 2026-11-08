import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Dices, Loader2, ListChecks, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTrip } from "@/lib/server-fns";
import { localTimeZone } from "@/lib/tripDates";
import useLocalToday from "@/hooks/useLocalToday";

const TYPES = [
  "Beach & islands",
  "Big city",
  "Mountains & hiking",
  "History & culture",
  "Food & wine",
  "Nature & wildlife",
  "Anywhere remarkable",
];

export default function TripSetupForm({ profile }) {
  const today = useLocalToday();
  const navigate = useNavigate();
  const create = useServerFn(createTrip);
  const [mode, setMode] = useState("");
  const [form, setForm] = useState({
    destination: "",
    destination_type: "",
    details: "",
    origin_city: profile?.home_city || "",
    start_date: "",
    end_date: "",
    travelers: 1,
    budget: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // A ref, not state: it is set before the next tap can arrive, so a second
  // click or Enter while the layout is being built never creates a second trip.
  const inFlight = useRef(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const trip = await create({ data: { mode, ...form, time_zone: localTimeZone(), travelers: Number(form.travelers) || 1 } });
      navigate({ to: "/trips/$tripId", params: { tripId: trip.id } });
    } catch (err) {
      inFlight.current = false;
      setError(err?.message || "Could not sketch a layout just now.");
      setBusy(false);
    }
  }

  if (!mode) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("random")}
          className="rounded-2xl border border-border10 bg-card/70 p-6 text-left backdrop-blur transition hover:-translate-y-0.5 hover:bg-card/90"
        >
          <Dices className="h-6 w-6" aria-hidden="true" />
          <p className="mt-3 text-lg font-semibold">Random Destination</p>
          <p className="mt-1 text-sm text-foreground/70">
            Let the planner pick somewhere that suits you and sketch a basic layout.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode("typed")}
          className="rounded-2xl border border-border10 bg-card/70 p-6 text-left backdrop-blur transition hover:-translate-y-0.5 hover:bg-card/90"
        >
          <ListChecks className="h-6 w-6" aria-hidden="true" />
          <p className="mt-3 text-lg font-semibold">Choose Destination Type</p>
          <p className="mt-1 text-sm text-foreground/70">
            Tell me where and what you want, and I'll build a basic frame from your details.
          </p>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border10 bg-card/70 p-6 backdrop-blur">
      <button
        type="button"
        onClick={() => setMode("")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-foreground/70 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Choose again
      </button>
      <p className="text-lg font-semibold">
        {mode === "random" ? "Random Destination" : "Choose Destination Type"}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {mode === "random" ? (
          <div className="sm:col-span-2">
            <Label htmlFor="destination_type">What kind of place?</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set("destination_type", form.destination_type === type ? "" : type)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    form.destination_type === type
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border20 bg-card/70 hover:bg-card"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <Label htmlFor="destination">Where do you want to go?</Label>
            <Input
              id="destination"
              value={form.destination}
              placeholder="Kyoto, Japan"
              className="mt-1 bg-card"
              onChange={(e) => set("destination", e.target.value)}
              required
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <Label htmlFor="details">What do you want there?</Label>
          <Textarea
            id="details"
            value={form.details}
            rows={3}
            placeholder="Quiet mornings, one big museum, a cooking class, nowhere too touristy, easy trains."
            className="mt-1"
            onChange={(e) => set("details", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="origin_city">Leaving from</Label>
          <Input
            id="origin_city"
            value={form.origin_city}
            placeholder="New York"
            className="mt-1 bg-card"
            onChange={(e) => set("origin_city", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="travelers">Travellers</Label>
          <Input
            id="travelers"
            type="number"
            min={1}
            max={20}
            value={form.travelers}
            className="mt-1 bg-card"
            onChange={(e) => set("travelers", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="start_date">Leaving on</Label>
          <Input
            id="start_date"
            type="date"
            min={today || undefined}
            value={form.start_date}
            className="mt-1 bg-card"
            onChange={(e) => set("start_date", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_date">Coming back</Label>
          <Input
            id="end_date"
            type="date"
            min={form.start_date > today ? form.start_date : today || undefined}
            value={form.end_date}
            className="mt-1 bg-card"
            onChange={(e) => set("end_date", e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="budget">Budget</Label>
          <Input
            id="budget"
            value={form.budget}
            placeholder="$3,000 for two"
            className="mt-1 bg-card"
            onChange={(e) => set("budget", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-5 rounded-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {busy ? "Sketching your layout…" : "Create the basic layout"}
      </Button>
      {busy && <p className="mt-2 text-sm text-foreground/70">This takes a few seconds.</p>}
    </form>
  );
}