// Builds the clean payload our Google Cloud OAuth gateway turns into calendar
// events: trip dates, flight times and the places involved. Pure data only, so
// the same object can be stored, exported or posted to the gateway.
import { shiftDate } from "@/lib/calendarLinks";

const clean = (value) => String(value || "").trim();
const timeOf = (value) => {
  const match = clean(value).match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
};
const isoDate = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(clean(value)) ? clean(value) : "");

function flightEvents(trip) {
  const plan = trip.plan || {};
  return (plan.flights || []).flatMap((leg) => {
    const date = isoDate(leg.date) || isoDate(trip.start_date);
    if (!date) return [];
    const departs = timeOf(leg.departs_at) || timeOf(leg.departs);
    const arrives = timeOf(leg.arrives_at) || timeOf(leg.arrives);
    const overnight = Boolean(departs && arrives && arrives < departs);
    const endDate = overnight ? shiftDate(date, 1) : date;
    const title = [leg.direction || "Flight", leg.airline, leg.flight_number].filter(Boolean).join(" ");

    return [
      {
        summary: clean(title) || "Flight",
        location: [clean(leg.departs), clean(leg.arrives)].filter(Boolean).join(" → "),
        description: [leg.stops && `${leg.stops}`, leg.duration && `${leg.duration}`, leg.cost].filter(Boolean).join(" · "),
        start: departs ? `${date}T${departs}:00` : date,
        end: arrives ? `${endDate}T${arrives}:00` : shiftDate(date, 1),
        all_day: !departs,
      },
    ];
  });
}

function stayEvents(trip) {
  const lodging = trip.plan?.lodging;
  const start = isoDate(trip.start_date);
  if (!lodging || !start) return [];
  return [
    {
      summary: clean(lodging.name) || `Staying in ${clean(trip.destination) || "your destination"}`,
      location: [clean(lodging.name), clean(lodging.area), clean(trip.destination)].filter(Boolean).join(", "),
      description: [lodging.nights && `${lodging.nights} nights`, lodging.notes].filter(Boolean).join(" · "),
      start,
      end: shiftDate(isoDate(trip.end_date) || start, 1),
      all_day: true,
    },
  ];
}

function dayEvents(trip) {
  return (trip.plan?.itinerary || []).flatMap((day) => {
    const date = isoDate(day.date);
    if (!date) return [];
    return [
      {
        summary: clean(day.title) || clean(day.day) || "Trip day",
        location: clean(trip.destination),
        description: clean(day.details),
        start: date,
        end: shiftDate(date, 1),
        all_day: true,
      },
    ];
  });
}

export function calendarPackage(trip) {
  const events = [...flightEvents(trip), ...stayEvents(trip), ...dayEvents(trip)];
  return {
    kind: "trip_calendar_package",
    version: 1,
    trip_id: trip.id,
    title: clean(trip.title) || clean(trip.destination) || "Trip",
    destination: clean(trip.plan?.destination) || clean(trip.destination),
    time_zone: clean(trip.time_zone) || "UTC",
    travelers: Number(trip.travelers) || 1,
    start_date: clean(trip.start_date),
    end_date: clean(trip.end_date),
    calendar: {
      summary: `${clean(trip.title) || clean(trip.destination) || "Trip"} · ${clean(trip.start_date)}`,
      description: clean(trip.plan?.summary),
      time_zone: clean(trip.time_zone) || "UTC",
    },
    events,
  };
}