import { isoToday, shiftDate } from "@/lib/calendarLinks";

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
export const tripDayCount = (start, end) => Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;

export function tripDateError(start, end, timeZone = "UTC") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || "") || shiftDate(start, 0) !== start ||
      !/^\d{4}-\d{2}-\d{2}$/.test(end || "") || shiftDate(end, 0) !== end) return "Choose valid departure and return dates.";
  if (start < isoToday(timeZone)) return "This departure date is in the past. Choose today or a future date before rebuilding or finalizing.";
  if (end < start) return "The return date must be on or after the departure date.";
  if (tripDayCount(start, end) > 60) return "Please plan up to 60 days at a time.";
  return "";
}

export function assertTripDates(trip) {
  const error = tripDateError(trip.start_date, trip.end_date, trip.time_zone || "UTC");
  if (error) throw new Error(error);
}

export function datedPlan(plan, trip) {
  const count = tripDayCount(trip.start_date, trip.end_date);
  if (plan.itinerary?.length !== count) throw new Error("The planner did not cover every new travel day. Your previous plan is unchanged; please try updating the dates again.");
  const directions = new Set();
  return {
    ...plan,
    itinerary: plan.itinerary.map((day, index) => ({ ...day, day: `Day ${index + 1}`, date: shiftDate(trip.start_date, index) })),
    flights: (plan.flights || []).map((leg) => {
      const direction = /return|inbound/i.test(leg.direction) ? "return" : "outbound";
      const anchor = direction === "return" ? trip.end_date : trip.start_date;
      const first = !directions.has(direction);
      directions.add(direction);
      const valid = /^\d{4}-\d{2}-\d{2}$/.test(leg.date || "") && shiftDate(leg.date, 0) === leg.date;
      return { ...leg, date: !first && valid && leg.date >= anchor && leg.date <= shiftDate(anchor, 2) ? leg.date : anchor };
    }),
    lodging: plan.lodging ? { ...plan.lodging, nights: String(Math.max(0, count - 1)) } : undefined,
  };
}

export function hasPastPlanDates(trip, today) {
  return Boolean(today) && [trip.start_date, ...(trip.plan?.flights || []).map((leg) => leg.date),
    ...(trip.plan?.itinerary || []).map((day) => day.date)]
    .some((date) => /^\d{4}-\d{2}-\d{2}$/.test(date || "") && date < today);
}