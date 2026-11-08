// Deep links that open the airline and the stay already searched for, so the
// traveller lands on the exact fare or room for their own flights and dates
// instead of a homepage. Built from the plan the AI generated.
import { shiftDate } from "@/lib/calendarLinks";

const clean = (value) => String(value || "").trim();
const usableFlightNumber = (value) => {
  const text = clean(value);
  return text && !/confirm|unknown|tbd|n\/?a|pending/i.test(text) ? text : "";
};

function flightLink(trip, leg, index) {
  const date = clean(leg.date) || trip.start_date || "";
  const from = clean(leg.departs) || clean(trip.origin_city);
  const to = clean(leg.arrives) || clean(trip.destination);
  const number = usableFlightNumber(leg.flight_number);
  const airline = clean(leg.airline);

  const query = [
    number ? `${airline} ${number}`.trim() : "Flights",
    from && `from ${from}`,
    to && `to ${to}`,
    date && `on ${date}`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    kind: "flight",
    label: [leg.direction || `Flight ${index + 1}`, number].filter(Boolean).join(" "),
    detail: [from, to, date].filter(Boolean).join(" → "),
    url: `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}&curr=USD`,
  };
}

function stayLink(trip, plan) {
  const lodging = plan?.lodging || {};
  const destination = clean(plan?.destination) || clean(trip.destination);
  const name = clean(lodging.name);
  const area = clean(lodging.area);
  const start = clean(trip.start_date);
  const end = clean(trip.end_date);
  const travellers = Math.max(1, Number(trip.travelers) || 1);

  const search = name ? [name, area, destination].filter(Boolean).join(", ") : destination;

  const params = new URLSearchParams({
    ss: search,
    group_adults: String(travellers),
    no_rooms: "1",
    group_children: "0",
    selected_currency: "USD",
  });
  if (start) params.set("checkin", start);
  if (end) params.set("checkout", end);

  return {
    kind: "stay",
    label: name ? `Stay · ${name}` : `Stay in ${destination || "your destination"}`,
    detail: [area, start && `${start} → ${end || shiftDate(start, 1)}`].filter(Boolean).join(" · "),
    url: `https://www.booking.com/searchresults.html?${params.toString()}`,
  };
}

// One link per flight leg plus one for the stay the plan names.
export function bookingLinks(trip) {
  const plan = trip?.plan || {};
  const flights = (plan.flights || []).map((leg, index) => flightLink(trip, leg, index));
  const links = [...flights];
  if (plan.lodging || trip?.destination) links.push(stayLink(trip, plan));
  return links.filter((link) => link.url);
}

// Kept for plan records written before the deep links existed.
export function flightCount(trip) {
  return (trip?.plan?.flights || []).length;
}