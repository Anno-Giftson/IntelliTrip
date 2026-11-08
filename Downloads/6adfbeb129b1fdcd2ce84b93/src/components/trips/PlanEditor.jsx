import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PlanSection from "@/components/trips/PlanSection";
import RowsEditor from "@/components/trips/RowsEditor";
import StringListEditor from "@/components/trips/StringListEditor";

export default function PlanEditor({ trip, patchTrip, patchPlan }) {
  const plan = trip.plan || {};
  const travel = plan.travel || {};
  const lodging = plan.lodging || {};

  return (
    <div className="space-y-4">
      <PlanSection title="Trip brief" hint="saved automatically">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="trip-title">Trip name</Label>
            <Input
              id="trip-title"
              value={trip.title || ""}
              className="mt-1 bg-card"
              onChange={(e) => patchTrip({ title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="trip-origin">Departing from</Label>
            <Input
              id="trip-origin"
              value={trip.origin_city || ""}
              className="mt-1 bg-card"
              onChange={(e) => patchTrip({ origin_city: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="trip-travelers">Travellers</Label>
            <Input
              id="trip-travelers"
              type="number"
              min={1}
              max={20}
              value={trip.travelers || 1}
              className="mt-1 bg-card"
              onChange={(e) => patchTrip({ travelers: Number(e.target.value) || 1 })}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="trip-budget">Budget</Label>
            <Input
              id="trip-budget"
              value={trip.budget || ""}
              placeholder="e.g. $3,000 for two"
              className="mt-1 bg-card"
              onChange={(e) => patchTrip({ budget: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="trip-details">What you want from this trip</Label>
            <Textarea
              id="trip-details"
              value={trip.details || ""}
              rows={2}
              className="mt-1"
              onChange={(e) => patchTrip({ details: e.target.value })}
            />
          </div>
        </div>
      </PlanSection>

      <PlanSection title="The idea">
        <Textarea
          value={plan.summary || ""}
          rows={3}
          onChange={(e) => patchPlan({ summary: e.target.value })}
          aria-label="Summary"
        />
      </PlanSection>

      <PlanSection title="Getting there">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["mode", "How"],
            ["cost", "Cost"],
          ].map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`travel-${key}`}>{label}</Label>
              <Input
                id={`travel-${key}`}
                value={travel[key] || ""}
                className="mt-1 bg-card"
                onChange={(e) => patchPlan({ travel: { ...travel, [key]: e.target.value } })}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label htmlFor="travel-route">Route</Label>
            <Input
              id="travel-route"
              value={travel.route || ""}
              className="mt-1 bg-card"
              onChange={(e) => patchPlan({ travel: { ...travel, route: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="travel-notes">Good to know</Label>
            <Textarea
              id="travel-notes"
              value={travel.notes || ""}
              rows={2}
              className="mt-1"
              onChange={(e) => patchPlan({ travel: { ...travel, notes: e.target.value } })}
            />
          </div>
        </div>
      </PlanSection>

      <PlanSection title="Your flights" hint={`${(plan.flights || []).length} legs`}>
        <RowsEditor
          rows={plan.flights || []}
          blank={{
            direction: "",
            airline: "",
            flight_number: "",
            date: "",
            departs: "",
            departs_at: "",
            arrives: "",
            arrives_at: "",
            duration: "",
            stops: "",
            cost: "",
          }}
          addLabel="Add a flight"
          fields={[
            { key: "direction", label: "Outbound or Return" },
            { key: "airline", label: "Airline" },
            { key: "flight_number", label: "Flight number" },
            { key: "date", label: "Date" },
            { key: "departs", label: "Departs (airport)" },
            { key: "departs_at", label: "Departs at" },
            { key: "arrives", label: "Arrives (airport)" },
            { key: "arrives_at", label: "Arrives at" },
            { key: "duration", label: "Flight time" },
            { key: "stops", label: "Stops" },
            { key: "cost", label: "Fare" },
          ]}
          onChange={(rows) => patchPlan({ flights: rows })}
        />
      </PlanSection>

      <PlanSection title="Where you stay">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["name", "Place"],
            ["area", "Area"],
            ["nights", "Nights"],
            ["cost", "Cost"],
          ].map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`stay-${key}`}>{label}</Label>
              <Input
                id={`stay-${key}`}
                value={lodging[key] || ""}
                className="mt-1 bg-card"
                onChange={(e) => patchPlan({ lodging: { ...lodging, [key]: e.target.value } })}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label htmlFor="stay-notes">Notes</Label>
            <Textarea
              id="stay-notes"
              value={lodging.notes || ""}
              rows={2}
              className="mt-1"
              onChange={(e) => patchPlan({ lodging: { ...lodging, notes: e.target.value } })}
            />
          </div>
        </div>
      </PlanSection>

      <PlanSection title="Day by day" hint={`${(plan.itinerary || []).length} days`}>
        <RowsEditor
          rows={plan.itinerary || []}
          blank={{ day: "", title: "", details: "" }}
          addLabel="Add a day"
          fields={[
            { key: "day", label: "Day" },
            { key: "title", label: "Plan" },
            { key: "details", label: "Detail", textarea: true, wide: true },
          ]}
          onChange={(rows) => patchPlan({ itinerary: rows })}
        />
      </PlanSection>

      <PlanSection title="Where to eat" hint={`${(plan.food || []).length} places`}>
        <RowsEditor
          rows={plan.food || []}
          blank={{ name: "", cuisine: "", must_try: "", cost: "" }}
          addLabel="Add a place"
          fields={[
            { key: "name", label: "Name" },
            { key: "cuisine", label: "Cuisine" },
            { key: "must_try", label: "What to order" },
            { key: "cost", label: "Cost" },
          ]}
          onChange={(rows) => patchPlan({ food: rows })}
        />
      </PlanSection>

      <PlanSection title="What to pack" hint={`${(plan.packing || []).length} items`}>
        <StringListEditor
          items={plan.packing || []}
          addLabel="Add an item"
          onChange={(items) => patchPlan({ packing: items })}
        />
      </PlanSection>

      <PlanSection title="What it costs">
        <RowsEditor
          rows={plan.budget || []}
          blank={{ label: "", amount: "" }}
          addLabel="Add a cost line"
          fields={[
            { key: "label", label: "Item" },
            { key: "amount", label: "Amount" },
          ]}
          onChange={(rows) => patchPlan({ budget: rows })}
        />
      </PlanSection>

      <PlanSection title="On the day — your instructions">
        <Textarea
          value={plan.departure_brief || ""}
          rows={5}
          onChange={(e) => patchPlan({ departure_brief: e.target.value })}
          aria-label="Departure instructions"
        />
      </PlanSection>
    </div>
  );
}