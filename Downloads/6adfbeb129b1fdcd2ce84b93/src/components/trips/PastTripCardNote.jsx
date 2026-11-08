import useLocalToday from "@/hooks/useLocalToday";
import { hasPastPlanDates } from "@/lib/tripDates";

export default function PastTripCardNote({ trip }) {
  const today = useLocalToday();
  if (trip.status === "finalized" || !hasPastPlanDates(trip, today)) return null;
  return <p className="mt-3 text-xs font-medium">{trip.keep_as_reference ? "Past — kept as reference." : "Past dates — open to reschedule, keep as reference, or delete."}</p>;
}