// Custom activities the traveller adds themselves. Kept on the Trip record in
// `custom_events`, keyed by the itinerary date so they survive a plan rebuild
// only when the day still exists.
export const CATEGORIES = ["Transit", "Activity", "Rest", "Dining"];

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;
const CLOCK_FINDER = /\b(\d{1,2}):(\d{2})\s*(am|pm)?|\b(\d{1,2})\s*(am|pm)\b/gi;

export const timeToMinutes = (value) => {
  const match = String(value || "").match(CLOCK);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const formatClock = (minutes) => {
  if (!Number.isFinite(minutes)) return "";
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

// Any clock time written in the plan's prose ("9:00", "09:30", "6pm").
export function proseMinutes(text) {
  const found = [];
  for (const match of String(text || "").matchAll(CLOCK_FINDER)) {
    if (match[1]) {
      const hour = Number(match[1]);
      const minute = Number(match[2]);
      const meridiem = match[3]?.toLowerCase();
      const value = meridiem === "pm" && hour < 12 ? hour + 12 : meridiem === "am" && hour === 12 ? 0 : hour;
      if (value < 24) found.push(value * 60 + minute);
    } else if (match[4]) {
      const hour = Number(match[4]);
      const meridiem = match[5].toLowerCase();
      const value = meridiem === "pm" && hour < 12 ? hour + 12 : meridiem === "am" && hour === 12 ? 0 : hour;
      if (value < 24) found.push(value * 60);
    }
  }
  return [...new Set(found)].sort((a, b) => a - b);
}

// The window an AI-authored day covers, when its prose states one.
export function aiDayWindow(day) {
  const times = proseMinutes(`${day?.title || ""} ${day?.details || ""}`);
  if (!times.length) return null;
  if (times.length === 1) return { start: Math.max(0, times[0] - 45), end: Math.min(1439, times[0] + 45) };
  return { start: times[0], end: times[times.length - 1] };
}

export function flightWindow(flight) {
  const from = proseMinutes(flight?.departs_at || flight?.departs);
  const to = proseMinutes(flight?.arrives_at || flight?.arrives);
  if (!from.length && !to.length) return null;
  const start = from.length ? from[0] : Math.max(0, to[0] - 120);
  const end = to.length ? to[0] : Math.min(1439, start + 120);
  return { start, end: end > start ? end : Math.min(1439, start + 90) };
}

const overlaps = (a, b) => a.start < b.end && b.start < a.end;

export const eventsForDate = (events, date) =>
  (events || []).filter((event) => event.date === date).sort((a, b) => (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0));

// Blocks a new event may not run into: other custom events, flight legs and the
// AI day block when the plan states its own hours.
export function findConflict({ start, end, events, flights, day }) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Add a start and end time.";
  if (end <= start) return "The end time has to be after the start time.";

  for (const other of events || []) {
    const otherStart = timeToMinutes(other.start_time);
    const otherEnd = timeToMinutes(other.end_time);
    if (Number.isFinite(otherStart) && Number.isFinite(otherEnd) && overlaps({ start, end }, { start: otherStart, end: otherEnd })) {
      return `That clashes with “${other.title}” (${other.start_time}–${other.end_time}).`;
    }
  }

  for (const flight of flights || []) {
    const window = flightWindow(flight);
    if (window && overlaps({ start, end }, window)) {
      const label = [flight.direction || "Flight", flight.airline, flight.flight_number].filter(Boolean).join(" ");
      return `That clashes with ${label} (${formatClock(window.start)}–${formatClock(window.end)}).`;
    }
  }

  const block = day ? aiDayWindow(day) : null;
  if (block && proseMinutes(`${day?.title || ""} ${day?.details || ""}`).length > 1 && overlaps({ start, end }, block)) {
    return `That clashes with the plan's own block for this day (${formatClock(block.start)}–${formatClock(block.end)}).`;
  }

  return "";
}

// AI block plus the traveller's own events, in chronological order.
export function dayTimeline(day, events) {
  const items = [];
  if (day?.title || day?.details) {
    const times = proseMinutes(`${day.title || ""} ${day.details || ""}`);
    items.push({ kind: "ai", key: `ai-${day.date}`, start: times[0] ?? null, day });
  }
  for (const event of events || []) {
    items.push({ kind: "custom", key: event.id || `${event.title}-${event.start_time}`, start: timeToMinutes(event.start_time), event });
  }
  return items.sort((a, b) => (a.start ?? -1) - (b.start ?? -1));
}