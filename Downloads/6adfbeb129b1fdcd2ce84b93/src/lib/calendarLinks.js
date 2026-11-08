// Calendar helpers built from the plan alone: no sign-in, no permissions, no third party.

const pad = (value) => String(value).padStart(2, "0");

// Shifts a YYYY-MM-DD string by whole days, in UTC so no timezone can move the date.
export function shiftDate(date, days) {
  const [year, month, day] = String(date || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

// Today as YYYY-MM-DD, so a plan item can be compared with the day it happens.
export function isoToday(timeZone) {
  const now = new Date();
  if (timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const value = (type) => parts.find((part) => part.type === type).value;
    return `${value("year")}-${value("month")}-${value("day")}`;
  }
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isPastDay(date) {
  const today = isoToday();
  return Boolean(date) && String(date) < today;
}

// One all-day entry for the whole trip, plus one per itinerary day.
export function tripCalendarEvents(trip) {
  const plan = trip?.plan || {};
  const start = trip?.start_date || "";
  if (!start) return [];
  const end = trip?.end_date || start;

  const events = [
    {
      key: "trip",
      summary: `Trip: ${trip.title || plan.destination || "Trip"}`,
      details: [
        plan.summary,
        trip.destination || plan.destination,
        `${trip.travelers || 1} traveller(s)`,
        trip.budget && `Budget ${trip.budget}`,
        plan.booking_note,
      ]
        .filter(Boolean)
        .join("\n\n"),
      location: plan.destination || trip.destination || "",
      start,
      end,
      label: "The whole trip",
      when: `${start} to ${end}`,
    },
  ];

  (plan.itinerary || []).forEach((day, index) => {
    const date = day.date || shiftDate(start, index);
    if (!date || date < start || date > end) return;
    events.push({
      key: `day-${index}`,
      summary: [day.day || `Day ${index + 1}`, day.title].filter(Boolean).join(": "),
      details: day.details || "",
      location: "",
      start: date,
      end: date,
      label: day.title || `Day ${index + 1}`,
      when: date,
    });
  });

  return events;
}

// RFC 5545 wants long lines folded at 75 octets.
export function foldIcs(line) {
  if (line.length <= 73) return line;
  const parts = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = rest.slice(73);
  }
  parts.push(rest);
  return parts.join("\r\n ");
}

// Google Calendar's pre-filled event form. All-day end dates are exclusive, hence the +1.
export function googleCalendarUrl(event) {
  const start = event.start.replace(/-/g, "");
  const end = shiftDate(event.end, 1).replace(/-/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.summary,
    dates: `${start}/${end}`,
    details: event.details || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}