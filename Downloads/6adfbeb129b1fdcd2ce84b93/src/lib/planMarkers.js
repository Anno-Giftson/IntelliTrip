// Turns a trip's plan JSON into spatial markers the map can draw. Coordinates
// live on the trip (map_points, one entry per plan item in the same order); the
// labels, dates and prices always come from the plan itself so the map can never
// show stale text.
const EARTH_KM = 6371;

export const hasCoords = (point) =>
  Boolean(point) &&
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 &&
  Math.abs(point.lng) <= 180 &&
  !(point.lat === 0 && point.lng === 0);

// Great-circle distance in kilometres.
export function distanceKm(a, b) {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// City walking and driving averages, enough to say "12 min walk, 4 min drive".
export function travelEstimate(km) {
  if (!Number.isFinite(km)) return null;
  return { walkMin: Math.max(1, Math.round((km / 4.8) * 60)), driveMin: Math.max(1, Math.round((km / 32) * 60)) };
}

export const formatKm = (km) =>
  !Number.isFinite(km) ? "" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

export function parsePlanMarkers(trip) {
  const plan = trip?.plan || {};
  const coords = trip?.map_points || {};

  const destination = hasCoords(coords.destination)
    ? {
        kind: "destination",
        label: plan.destination || trip?.destination || "Destination",
        lat: coords.destination.lat,
        lng: coords.destination.lng,
      }
    : null;

  const lodging = hasCoords(coords.lodging)
    ? {
        kind: "lodging",
        label: plan.lodging?.name || plan.lodging?.area || "Your stay",
        area: plan.lodging?.area || "",
        lat: coords.lodging.lat,
        lng: coords.lodging.lng,
      }
    : null;

  const days = (plan.itinerary || [])
    .map((entry, index) => ({ entry, index, point: coords.days?.[index] }))
    .filter((row) => hasCoords(row.point))
    .map(({ entry, index, point }) => ({
      kind: "day",
      index,
      day: entry.day || `Day ${index + 1}`,
      date: entry.date || "",
      title: entry.title || "",
      details: entry.details || "",
      lat: point.lat,
      lng: point.lng,
    }));

  const food = (plan.food || [])
    .map((entry, index) => ({ entry, point: coords.food?.[index] }))
    .filter((row) => hasCoords(row.point))
    .map(({ entry, point }, index) => ({
      kind: "food",
      index,
      name: entry.name || "Recommended stop",
      cuisine: entry.cuisine || "",
      must_try: entry.must_try || "",
      cost: entry.cost || "",
      lat: point.lat,
      lng: point.lng,
    }));

  return { destination, lodging, days, food, route: days.map((day) => [day.lat, day.lng]) };
}

// Recommended places near the active day, nearest first, with walk/drive times.
export function nearbyFood(markers, activeIndex, limit = 4) {
  const anchor = markers?.days?.[activeIndex] || markers?.destination;
  if (!anchor) return [];
  return (markers.food || [])
    .map((place) => {
      const km = distanceKm(anchor, place);
      return { ...place, km, ...(travelEstimate(km) || {}) };
    })
    .filter((place) => Number.isFinite(place.km))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}