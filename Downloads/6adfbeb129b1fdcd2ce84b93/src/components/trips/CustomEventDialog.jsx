import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/customEvents";

const blank = (date) => ({
  id: "",
  date,
  title: "",
  start_time: "",
  end_time: "",
  category: "Activity",
  cost: "",
  location: "",
  notes: "",
});

export default function CustomEventDialog({ open, date, dayLabel, initial, onClose, onSave, validate }) {
  const [form, setForm] = useState(() => ({ ...blank(date), ...(initial || {}) }));
  const [error, setError] = useState("");

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event) {
    event.preventDefault();
    const next = { ...form, date, title: form.title.trim() };
    if (!next.title) {
      setError("Give the activity a name.");
      return;
    }
    const problem = validate?.(next) || "";
    if (problem) {
      setError(problem);
      return;
    }
    onSave(next);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
        else setForm({ ...blank(date), ...(initial || {}) });
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card/95 backdrop-blur sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit activity" : "Add your own activity"}</DialogTitle>
          <DialogDescription>{dayLabel} · this stays yours and the AI plans around it.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="event-title">What is it?</Label>
            <Input
              id="event-title"
              value={form.title}
              placeholder="Dinner at the ramen place my friend recommended"
              className="mt-1 bg-card"
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="event-start">Starts</Label>
              <Input
                id="event-start"
                type="time"
                value={form.start_time}
                className="mt-1 bg-card"
                onChange={(e) => set("start_time", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="event-end">Ends</Label>
              <Input
                id="event-end"
                type="time"
                value={form.end_time}
                className="mt-1 bg-card"
                onChange={(e) => set("end_time", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="event-category">Category</Label>
              <Select value={form.category} onValueChange={(value) => set("category", value)}>
                <SelectTrigger id="event-category" className="mt-1 min-h-[44px] bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="event-cost">Cost</Label>
              <Input
                id="event-cost"
                value={form.cost}
                placeholder="$40 for two"
                className="mt-1 bg-card"
                onChange={(e) => set("cost", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="event-location">Where</Label>
            <Input
              id="event-location"
              value={form.location}
              placeholder="2-14 Sannomiyacho, Kobe"
              className="mt-1 bg-card"
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="event-notes">Notes</Label>
            <Textarea
              id="event-notes"
              value={form.notes}
              rows={2}
              placeholder="Booked for 7pm, ask for the counter seats."
              className="mt-1"
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" className="rounded-full" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full">
              {initial?.id ? "Save changes" : "Add to this day"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}