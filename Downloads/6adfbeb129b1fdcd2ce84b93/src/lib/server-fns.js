const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { bookingLinks } from "@/lib/bookingLinks";
import { isoToday } from "@/lib/calendarLinks";
import { calendarPackage } from "@/lib/calendarPackage";
import { packageBreakdown } from "@/lib/packagePricing";
import { assertTripDates, datedPlan, hasPastPlanDates, tripDayCount } from "@/lib/tripDates";
import { secrets } from "base44:runtime";

// The SDK returns either a bare array or a page ({ items }) depending on the call
// shape, so unwrap both.
const asArray = (res) => (Array.isArray(res) ? res : (res?.items ?? []));

const PLAN_JSON_SCHEMA = {
  type: "object",
  properties: {
    destination: { type: "string" },
    region: { type: "string" },
    summary: { type: "string" },
    travel: {
      type: "object",
      properties: {
        mode: { type: "string" },
        route: { type: "string" },
        cost: { type: "string" },
        notes: { type: "string" },
      },
      required: ["mode", "route", "cost", "notes"],
    },
    flights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          direction: { type: "string" },
          airline: { type: "string" },
          flight_number: { type: "string" },
          date: { type: "string" },
          departs: { type: "string" },
          departs_at: { type: "string" },
          arrives: { type: "string" },
          arrives_at: { type: "string" },
          duration: { type: "string" },
          stops: { type: "string" },
          cost: { type: "string" },
        },
        required: [
          "direction",
          "airline",
          "flight_number",
          "date",
          "departs",
          "departs_at",
          "arrives",
          "arrives_at",
          "duration",
          "stops",
          "cost",
        ],
      },
    },
    lodging: {
      type: "object",
      properties: {
        name: { type: "string" },
        area: { type: "string" },
        nights: { type: "string" },
        cost: { type: "string" },
        notes: { type: "string" },
      },
      required: ["name", "area", "nights", "cost", "notes"],
    },
    food: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          cuisine: { type: "string" },
          must_try: { type: "string" },
          cost: { type: "string" },
        },
        required: ["name", "cuisine", "must_try", "cost"],
      },
    },
    itinerary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          date: { type: "string" },
          title: { type: "string" },
          details: { type: "string" },
        },
        required: ["day", "date", "title", "details"],
      },
    },
    packing: { type: "array", items: { type: "string" } },
    budget: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, amount: { type: "string" } },
        required: ["label", "amount"],
      },
    },
    departure_brief: { type: "string" },
    booking_note: { type: "string" },
  },
  required: [
    "destination",
    "summary",
    "travel",
    "flights",
    "lodging",
    "food",
    "itinerary",
    "packing",
    "budget",
    "departure_brief",
    "booking_note",
  ],
};

function profileLine(profile) {
  if (!profile) return "No preference profile saved yet — plan for a curious, flexible traveller.";
  return [
    profile.likes && `Loves: ${profile.likes}`,
    profile.dislikes && `Dislikes: ${profile.dislikes}`,
    profile.dietary && `Food needs: ${profile.dietary}`,
    profile.pace && `Preferred pace: ${profile.pace}`,
    profile.stay_style && `Rather stays in: ${profile.stay_style}`,
    profile.avoid && `Must avoid: ${profile.avoid}`,
    profile.home_city && `Usually departs from: ${profile.home_city}`,
  ]
    .filter(Boolean)
    .join("; ");
}

// One plan can serve several travellers: the owner's saved profile plus the
// companions stored on the trip. The prompt blends all of them.
const allProfiles = (profile, trip) => {
  const saved = (profile?.companions || []).filter((person) => (person.full_name || "").trim());
  const onTrip = (trip && trip.companions) || [];
  const named = new Set(onTrip.map((person) => (person.full_name || "").trim().toLowerCase()));
  return [
    profile,
    ...saved.filter((person) => !named.has((person.full_name || "").trim().toLowerCase())),
    ...onTrip,
  ].filter(Boolean);
};

function profilesBlock(profiles) {
  const list = (profiles || []).filter(Boolean);
  if (!list.length) return "No preference profile saved yet — plan for a curious, flexible traveller.";
  if (list.length === 1) return profileLine(list[0]);
  return list
    .map((p, i) => `Traveller ${i + 1}${p.full_name ? ` (${p.full_name})` : ""} — ${profileLine(p)}`)
    .join("\n  - ");
}

async function generatePlan(base44, { trip, profiles, depth, instruction, approved }) {
  assertTripDates(trip);
  const dayCount = tripDayCount(trip.start_date, trip.end_date);
  const destinationLine =
    !trip.destination && trip.mode === "random"
      ? `Choose the destination yourself. It must match this request: "${trip.destination_type || "somewhere remarkable anywhere in the world"}".`
      : `Destination: ${trip.destination || trip.destination_type || "your choice"}.`;

  const prompt = `You are a meticulous travel planner building a plan a traveller can follow without doing any research of their own.

${
  depth === "frame"
    ? "Produce a BASIC LAYOUT only: a short outline the traveller will approve before you build the full plan. Keep every section brief — a skeleton, not the plan."
    : "Produce the COMPLETE plan. Be specific, concrete and practical. Nothing should be left for the traveller to look up."
}

Trip facts:
- ${destinationLine}
- What the traveller asked for: ${trip.details || "no extra detail given"}
- Dates: ${trip.start_date} to ${trip.end_date}
- Travellers: ${trip.travelers || 1}
- Budget for the whole trip: ${trip.budget || "not specified"}
- Departing from: ${trip.origin_city || "not specified"}
- Everyone travelling, and what each of them wants (blend these into ONE balanced plan that suits the whole group):
  - ${profilesBlock(profiles)}
${approved ? `\nThe traveller already approved this outline, so keep its destination and overall shape and expand it: ${JSON.stringify(approved)}\n` : ""}${instruction ? `\nThe traveller asked for this change, so apply it: "${instruction}"\n` : ""}
Fill in every field:
- travel: how to get there and how to get around once there, with timing and a realistic cost estimate.
- flights: refresh the outbound and return flight suggestions for the CURRENT dates, not the dates in any previous plan. Include connections as separate legs. Use direction "Outbound" or "Return". The first outbound leg departs on ${trip.start_date}; the first return leg departs on ${trip.end_date}. Connecting legs can depart on the following day if needed; use their actual local calendar date. Give airline, airport codes, local times, duration, stops and estimated fare. Flight numbers and schedules are NOT live-verified: do not fabricate a confirmed flight number or availability; use "Confirm when booking" when unknown. At the basic-layout stage keep this brief.
- lodging: a specific place or a named, real neighbourhood to stay in, how many nights, and a cost estimate.
- food: 4-6 named restaurants, cafes or dishes with cuisine, what to order, and rough cost.
- itinerary: exactly ${dayCount} entries, one per calendar day from ${trip.start_date} to ${trip.end_date} inclusive. Each entry needs its ISO date (YYYY-MM-DD). No activity or flight may be scheduled before these dates. CURRENT trip dates override every old date, weekday and duration in the approved outline or edit instruction. Reconsider opening days, seasonal activities, stay length, packing, daily logistics and total costs for this new date range.
- packing: a complete packing list of 12-20 items tuned to the destination, the season and the length of stay.
- budget: itemised cost lines that add up to roughly the stated budget.
- departure_brief: numbered step-by-step instructions for travel day — documents to have ready, check-in timing, and what to do first on arrival. Include how to prep and load an auto-driving car when relevant.
- booking_note: one short sentence naming which booking page to open first and why.
Show costs in the local currency with a USD estimate in brackets. Never invent booking URLs.`;

  const plan = await db.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      ...PLAN_JSON_SCHEMA,
      properties: { ...PLAN_JSON_SCHEMA.properties, itinerary: { ...PLAN_JSON_SCHEMA.properties.itinerary, minItems: dayCount, maxItems: dayCount } },
    },
  });
  const destination = String(plan?.destination || trip.destination || "Your destination").trim();
  return { ...datedPlan(plan, trip), destination, booking_links: bookingLinks({ ...trip, destination }) };
}

export const listTrips = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) =>
    asArray(await context.getBase44().entities.Trip.list({ sort: "-updated_date", limit: 100 })),
  );

export const getTrip = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    try {
      return await context.getBase44().entities.Trip.get(data.id);
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const found = asArray(
      await context.getBase44().entities.TravelerProfile.filter(
        { created_by_id: context.user.id },
        { limit: 1 },
      ),
    );
    return found[0] ?? null;
  });

const CompanionInput = z.object({
  full_name: z.string().max(120).optional(),
  likes: z.string().max(1200).optional(),
  dislikes: z.string().max(1200).optional(),
  dietary: z.string().max(500).optional(),
  home_city: z.string().max(120).optional(),
});

const ProfileInput = z.object({
  full_name: z.string().min(1).max(120),
  likes: z.string().max(1200).optional(),
  dislikes: z.string().max(1200).optional(),
  dietary: z.string().max(500).optional(),
  pace: z.string().max(120).optional(),
  stay_style: z.string().max(200).optional(),
  avoid: z.string().max(800).optional(),
  home_city: z.string().max(120).optional(),
  notes: z.string().max(1200).optional(),
  companions: z.array(CompanionInput).max(9).optional(),
});

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(ProfileInput)
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const existing = asArray(
      await client.entities.TravelerProfile.filter({ created_by_id: context.user.id }, { limit: 1 }),
    )[0];
    if (existing) return client.entities.TravelerProfile.update(existing.id, data);
    return client.entities.TravelerProfile.create(data);
  });

// The people the traveller usually goes away with — saved once, blended into
// every plan they generate from now on.
export const saveProfileCompanions = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ companions: z.array(CompanionInput).max(9) }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const clean = data.companions.filter((person) => (person.full_name || "").trim());
    const existing = asArray(
      await client.entities.TravelerProfile.filter({ created_by_id: context.user.id }, { limit: 1 }),
    )[0];
    if (existing) return client.entities.TravelerProfile.update(existing.id, { companions: clean });
    return client.entities.TravelerProfile.create({
      full_name: context.user.full_name || context.user.email || "Traveller",
      companions: clean,
    });
  });

const TripSetup = z.object({
  mode: z.enum(["random", "typed"]),
  destination: z.string().max(160).optional(),
  destination_type: z.string().max(160).optional(),
  details: z.string().max(4000).optional(),
  origin_city: z.string().max(160).optional(),
  start_date: z.string().min(8).max(10),
  end_date: z.string().min(8).max(10),
  time_zone: z.string().min(1).max(80).optional(),
  travelers: z.number().min(1).max(20),
  budget: z.string().max(80).optional(),
});

// A double tap on "Create", or a retried request, must not leave two identical
// trips behind: the same brief submitted moments ago is handed back as it is.
const DUPLICATE_WINDOW_MS = 3 * 60 * 1000;

const createdTime = (trip) => new Date(`${String(trip.created_date).slice(0, 19)}Z`).getTime();

async function findJustCreatedTrip(client, userId, data) {
  const recent = asArray(
    await client.entities.Trip.filter(
      { created_by_id: userId, start_date: data.start_date, end_date: data.end_date },
      { sort: "-created_date", limit: 5 },
    ),
  );
  return (
    recent.find(
      (trip) =>
        trip.stage === "frame" &&
        (trip.mode || "") === data.mode &&
        (trip.destination || "") === (data.destination || "") &&
        (trip.destination_type || "") === (data.destination_type || "") &&
        (trip.details || "") === (data.details || "") &&
        Date.now() - createdTime(trip) < DUPLICATE_WINDOW_MS,
    ) ?? null
  );
}

export const createTrip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(TripSetup)
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const alreadyCreated = await findJustCreatedTrip(client, context.user.id, data);
    if (alreadyCreated) return alreadyCreated;
    const profile = asArray(
      await client.entities.TravelerProfile.filter({ created_by_id: context.user.id }, { limit: 1 }),
    )[0];
    const plan = await generatePlan(client, { trip: data, profiles: allProfiles(profile, data), depth: "frame" });
    return client.entities.Trip.create({
      title: plan.destination,
      status: "in_progress",
      stage: "frame",
      mode: data.mode,
      destination_type: data.destination_type || "",
      destination: plan.destination,
      details: data.details || "",
      origin_city: data.origin_city || "",
      start_date: data.start_date,
      end_date: data.end_date,
      time_zone: data.time_zone || "UTC",
      travelers: data.travelers,
      budget: data.budget || "",
      plan,
      prefs: { reminders: true, mute_notifications: false, notify_before_days: 2 },
      ai_log: [],
    });
  });

export const buildFullPlan = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), time_zone: z.string().max(80).optional() }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const saved = await client.entities.Trip.get(data.id);
    const trip = { ...saved, time_zone: data.time_zone || saved.time_zone || "UTC" };
    const profile = asArray(await client.entities.TravelerProfile.filter({ created_by_id: context.user.id }, { limit: 1 }))[0];
    const plan = await generatePlan(client, { trip, profiles: allProfiles(profile, trip), depth: "full", approved: trip.plan });
    return client.entities.Trip.update(trip.id, { stage: "full", time_zone: trip.time_zone, destination: plan.destination, plan });
  });

export const updateTrip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      title: z.string().max(160).optional(),
      destination: z.string().max(160).optional(),
      details: z.string().max(4000).optional(),
      origin_city: z.string().max(160).optional(),
      start_date: z.string().max(10).optional(),
      end_date: z.string().max(10).optional(),
      time_zone: z.string().max(80).optional(),
      rebuild_dates: z.boolean().optional(),
      keep_as_reference: z.boolean().optional(),
      travelers: z.number().min(1).max(20).optional(),
      budget: z.string().max(80).optional(),
      notes: z.string().max(4000).optional(),
      plan: z.any().optional(),
      prefs: z.any().optional(),
      companions: z
        .array(
          z.object({
            full_name: z.string().max(120).optional(),
            likes: z.string().max(1200).optional(),
            dislikes: z.string().max(1200).optional(),
            dietary: z.string().max(500).optional(),
            home_city: z.string().max(120).optional(),
          }),
        )
        .max(9)
        .optional(),
      shared_expenses: z
        .array(
          z.object({
            label: z.string().max(120),
            amount_cents: z.number().min(0).max(100000000),
            split_count: z.number().min(1).max(20),
          }),
        )
        .max(60)
        .optional(),
      custom_events: z
        .array(
          z.object({
            id: z.string().min(1).max(80),
            date: z.string().min(8).max(10),
            title: z.string().min(1).max(160),
            start_time: z.string().max(5),
            end_time: z.string().max(5),
            category: z.string().max(40).optional(),
            cost: z.string().max(80).optional(),
            location: z.string().max(240).optional(),
            notes: z.string().max(1000).optional(),
          }),
        )
        .max(80)
        .optional(),
    }),
  )
  .handler(async ({ data: { id, rebuild_dates, ...patch }, context }) => {
    const client = context.getBase44();
    const previous = await client.entities.Trip.get(id);
    const next = { ...previous, ...patch };
    const datesChanged = next.start_date !== previous.start_date || next.end_date !== previous.end_date;
    // A finalized trip stays editable: the badge records that the traveller
    // confirmed it, it does not freeze the plan.
    if (datesChanged || rebuild_dates) {
      patch.plan = await rebuildForDates(client, { previous, next, userId: context.user.id });
      patch.start_date = next.start_date;
      patch.end_date = next.end_date;
      patch.keep_as_reference = false;
    }
    return client.entities.Trip.update(id, patch);
  });

// The single reschedule path: every date in the plan is rewritten from the new
// start_date, flight legs are re-anchored and lodging nights recomputed. An
// answer that doesn't cover every day is rejected and the old plan stays.
const rescheduleNote = (next) =>
  `Reschedule the entire plan to ${next.start_date} through ${next.end_date}. Preserve the destination and the traveller's choices where practical, but replace ALL old dates, flight suggestions, seasonal advice, durations and date-dependent costs.`;

async function rebuildForDates(client, { previous, next, userId }) {
  assertTripDates(next);
  const profile = asArray(
    await client.entities.TravelerProfile.filter({ created_by_id: userId }, { limit: 1 }),
  )[0];
  return generatePlan(client, {
    trip: next,
    profiles: allProfiles(profile, next),
    depth: previous.stage === "full" ? "full" : "frame",
    approved: previous.plan,
    instruction: rescheduleNote(next),
  });
}

export const rescheduleTrip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      start_date: z.string().min(8).max(10),
      end_date: z.string().min(8).max(10),
      time_zone: z.string().min(1).max(80).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const previous = await client.entities.Trip.get(data.id);
    const next = {
      ...previous,
      start_date: data.start_date,
      end_date: data.end_date,
      time_zone: data.time_zone || previous.time_zone || "UTC",
    };
    const plan = await rebuildForDates(client, { previous, next, userId: context.user.id });
    return client.entities.Trip.update(previous.id, {
      start_date: next.start_date,
      end_date: next.end_date,
      time_zone: next.time_zone,
      destination: plan.destination,
      plan,
      keep_as_reference: false,
    });
  });

// Resolves the plan's places to coordinates once and caches them on the trip.
const MAP_COORD_SCHEMA = {
  type: "object",
  properties: {
    destination: {
      type: "object",
      properties: { lat: { type: "number" }, lng: { type: "number" } },
      required: ["lat", "lng"],
    },
    lodging: {
      type: "object",
      properties: { lat: { type: "number" }, lng: { type: "number" } },
      required: ["lat", "lng"],
    },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: { lat: { type: "number" }, lng: { type: "number" } },
        required: ["lat", "lng"],
      },
    },
    food: {
      type: "array",
      items: {
        type: "object",
        properties: { lat: { type: "number" }, lng: { type: "number" } },
        required: ["lat", "lng"],
      },
    },
  },
  required: ["destination", "days", "food"],
};

const planKey = (trip) => {
  const plan = trip.plan || {};
  return [
    plan.destination || trip.destination || "",
    plan.region || "",
    plan.lodging?.name || plan.lodging?.area || "",
    ...(plan.itinerary || []).map((day) => day.title || day.day || ""),
    ...(plan.food || []).map((place) => place.name || ""),
  ]
    .join("|")
    .slice(0, 4000);
};

const usableCoord = (point) =>
  point &&
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 &&
  Math.abs(point.lng) <= 180 &&
  !(Math.round(point.lat) === 0 && Math.round(point.lng) === 0);

const pickCoord = (point, fallback) =>
  usableCoord(point) ? { lat: point.lat, lng: point.lng } : fallback;

export const mapTripPlan = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), refresh: z.boolean().optional() }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const trip = await client.entities.Trip.get(data.id);
    const key = planKey(trip);
    if (!data.refresh && trip.map_points && trip.map_key === key) {
      return { trip, points: trip.map_points };
    }

    const plan = trip.plan || {};
    const days = (plan.itinerary || []).map(
      (day, index) => `${index + 1}. ${day.title || "Activities"}${day.details ? ` — ${String(day.details).slice(0, 160)}` : ""}`,
    );
    const food = (plan.food || []).map(
      (place, index) => `${index + 1}. ${place.name || "Restaurant"}${place.cuisine ? ` (${place.cuisine})` : ""}`,
    );

    const prompt = `You are a precise geocoder. Return real WGS84 coordinates for the places below.
Destination: ${plan.destination || trip.destination || "unknown"}${plan.region ? `, ${plan.region}` : ""}
Stay: ${[plan.lodging?.name, plan.lodging?.area].filter(Boolean).join(", ") || "not specified"}

Daily activities (return one coordinate per numbered item, in the same order, for the place the activity happens):
${days.join("\n") || "none"}

Recommended places to eat and drink (one coordinate per numbered item, same order):
${food.join("\n") || "none"}

Rules: decimal degrees only, latitude between -90 and 90, longitude between -180 and 180. Use the exact venue when it is named; otherwise the neighbourhood or city it belongs to. Never return 0,0 and never invent a place outside the destination region.`;

    const raw = await client.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: MAP_COORD_SCHEMA,
    });

    const destination = usableCoord(raw?.destination)
      ? { lat: raw.destination.lat, lng: raw.destination.lng }
      : null;
    if (!destination) throw new Error("The map could not place this destination. Try again in a moment.");

    const points = {
      destination,
      lodging: pickCoord(raw?.lodging, destination),
      days: (plan.itinerary || []).map((_, index) => pickCoord(raw?.days?.[index], destination)),
      food: (plan.food || []).map((_, index) => pickCoord(raw?.food?.[index], destination)),
    };

    const updated = await client.entities.Trip.update(trip.id, { map_points: points, map_key: key });
    return { trip: updated, points };
  });

// Weather for the trip dates. Open-Meteo needs no key: a real forecast when the
// dates are close, otherwise last year's same days as a "typical" guide.
async function geocodePlace(name) {
  if (!name) return null;
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`,
    );
    if (!response.ok) return null;
    const hit = (await response.json())?.results?.[0];
    if (!hit) return null;
    return {
      lat: hit.latitude,
      lng: hit.longitude,
      label: [hit.name, hit.admin1, hit.country].filter(Boolean).join(", "),
    };
  } catch {
    return null;
  }
}

async function placeForWeather(trip) {
  const cached = trip.map_points?.destination;
  if (usableCoord(cached)) {
    return {
      lat: cached.lat,
      lng: cached.lng,
      label: trip.destination || trip.plan?.destination || "Your destination",
    };
  }
  return geocodePlace(trip.plan?.destination || trip.destination);
}

const dayOffset = (iso, from) =>
  Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

// Same calendar days one year earlier, Feb 29 included.
const shiftYear = (iso, years) => {
  const [year, month, day] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year + years, month, 0)).getUTCDate();
  return `${year + years}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
};

export const getTripWeather = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const trip = await context.getBase44().entities.Trip.get(data.id);
    const place = await placeForWeather(trip);
    if (!place) {
      return { mode: "unavailable", message: "We couldn't place this destination, so there is no weather to show yet." };
    }

    const today = new Date().toISOString().slice(0, 10);
    const toEnd = dayOffset(trip.end_date, today);
    const past = toEnd < 0;
    const live = !past && toEnd <= 15;
    const start = live || past ? trip.start_date : shiftYear(trip.start_date, -1);
    const end = live || past ? trip.end_date : shiftYear(trip.end_date, -1);

    const params = new URLSearchParams({
      latitude: String(place.lat),
      longitude: String(place.lng),
      start_date: start,
      end_date: end,
      timezone: "auto",
      temperature_unit: "fahrenheit",
      daily: live
        ? "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
        : "weather_code,temperature_2m_max,temperature_2m_min",
    });
    const host = live || past ? "https://api.open-meteo.com/v1/forecast" : "https://archive-api.open-meteo.com/v1/archive";

    let daily = null;
    try {
      const response = await fetch(`${host}?${params}`);
      if (response.ok) daily = (await response.json())?.daily;
    } catch {
      daily = null;
    }
    if (!daily?.time?.length) {
      return { mode: "unavailable", message: "The weather service has no data for these dates yet." };
    }

    return {
      mode: live ? "forecast" : past ? "recorded" : "typical",
      place: place.label,
      days: daily.time.map((date, index) => ({
        date: live || past ? date : shiftYear(date, 1),
        code: Number(daily.weather_code?.[index] ?? 0),
        high: Math.round(Number(daily.temperature_2m_max?.[index] ?? 0)),
        low: Math.round(Number(daily.temperature_2m_min?.[index] ?? 0)),
        rain: daily.precipitation_probability_max?.[index] ?? null,
      })),
    };
  });

// Posts the finalized trip to the Make.com scenario. A webhook that is down or
// misconfigured must never stop the trip from being finalized.
async function notifyMakeTripFinalized(trip) {
  const url = secrets.get("MAKE_WEBHOOK_URL");
  if (!url) return;
  const plan = trip.plan || {};
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "trip_finalized",
        trip_id: trip.id,
        title: trip.title,
        destination: trip.destination || plan.destination || "",
        origin_city: trip.origin_city || "",
        start_date: trip.start_date || "",
        end_date: trip.end_date || "",
        travelers: trip.travelers || 1,
        budget: trip.budget || "",
        summary: plan.summary || "",
        flights: plan.flights || [],
        lodging: plan.lodging || null,
        itinerary: plan.itinerary || [],
        budget_lines: plan.budget || [],
        booking_links: plan.booking_links || [],
        prefs: trip.prefs || {},
        paid_at: trip.paid_at || "",
        finalized_at: trip.finalized_at || "",
      }),
    });
  } catch {
    // Ignored on purpose: the trip is finalized either way.
  }
}

export const finalizeTrip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      prefs: z.object({
        reminders: z.boolean(),
        mute_notifications: z.boolean(),
        notify_before_days: z.number().min(0).max(30),
      }),
    }),
  )
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const previous = await client.entities.Trip.get(data.id);
    assertTripDates(previous);
    if (hasPastPlanDates(previous, isoToday(previous.time_zone || "UTC"))) throw new Error("Some flights or activities still have past dates. Use Update dates & rebuild plan before finalizing.");
    const trip = await client.entities.Trip.update(data.id, {
      prefs: data.prefs, status: "finalized", finalized_at: new Date().toISOString(), keep_as_reference: false,
    });
    await notifyMakeTripFinalized(trip);
    return trip;
  });

export const deleteTrip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await context.getBase44().entities.Trip.delete(data.id);
    return { ok: true };
  });

export const askTripAi = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), question: z.string().min(1).max(600) }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const trip = await client.entities.Trip.get(data.id);
    const prompt = `You are the assistant inside a traveller's trip app. You are happy to talk about anything — this trip, a quick travel question, a recommendation, or plain casual conversation. The plan below is background you can draw on; never announce it or summarise it unless the traveller asks. Here is the current plan as JSON:
${JSON.stringify(trip.plan || {})}

Activities the traveller added themselves — these are locked in the timeline, never suggest quietly moving them:
${(trip.custom_events || []).length
  ? (trip.custom_events || [])
      .map(
        (event) =>
          `- ${event.date} ${event.start_time}–${event.end_time}: ${event.title}${event.category ? ` [${event.category}]` : ""}${event.location ? ` at ${event.location}` : ""}${event.notes ? ` — ${event.notes}` : ""}`,
      )
      .join("\n")
  : "none"}

Trip: ${trip.destination}, ${trip.start_date} to ${trip.end_date}, ${trip.travelers} traveller(s), budget ${trip.budget || "unspecified"}, departing from ${trip.origin_city || "unspecified"}.

Read the AI day blocks and the traveller's own activities as ONE chronological timeline: check the real order, the gaps between things, and the travel time needed between the places named. When they ask whether something fits, answer with the specific times and the minutes it takes to get between the places.

The traveller says: "${data.question}"

How to answer:
- Be brief. Small talk, a yes/no or a quick opinion gets one or two short sentences — no headings, no bullet lists, no recap of their itinerary.
- Go longer only when they actually ask for detail: a comparison, a full day rebuild, a cost breakdown. Then keep it as short as the request allows.
- Answer the message in front of you, in the traveller's tone and language. Do not steer every reply back to the itinerary, and do not repeat the plan unless it directly answers them.
- Never claim the plan is locked or unchangeable — the traveller can edit or rebuild it any time.
- If they ask to clear the chat, tell them to use the Clear chat button at the top of this panel.
- Never invent booking URLs.`;
    const answer = await client.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const entry = { question: data.question, answer: String(answer), asked_at: new Date().toISOString() };
    const updated = await client.entities.Trip.update(trip.id, {
      ai_log: [...(trip.ai_log || []), entry],
    });
    return { answer: entry.answer, trip: updated };
  });

// Starting fresh: the conversation is dropped from the trip, the plan is kept.
export const clearTripChat = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) =>
    context.getBase44().entities.Trip.update(data.id, { ai_log: [] }),
  );

export const applyTripChange = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), instruction: z.string().min(1).max(600) }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const trip = await client.entities.Trip.get(data.id);
    const profile = asArray(
      await client.entities.TravelerProfile.filter({ created_by_id: context.user.id }, { limit: 1 }),
    )[0];
    const plan = await generatePlan(client, {
      trip,
      profiles: allProfiles(profile, trip),
      depth: "full",
      instruction: data.instruction,
    });
    const updated = await client.entities.Trip.update(trip.id, {
      stage: "full",
      destination: plan.destination,
      plan,
    });
    return { answer: `Plan updated — ${data.instruction}`, trip: updated };
  });

// Rebuilds one day's AI suggestion around the traveller's own activities. Their
// events are never moved; everything else is fitted to them.
export const optimizeDay = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), date: z.string().min(8).max(10) }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const trip = await client.entities.Trip.get(data.id);
    const itinerary = trip.plan?.itinerary || [];
    const index = itinerary.findIndex((day) => day.date === data.date);
    if (index < 0) throw new Error("That day is not part of this plan.");

    const events = (trip.custom_events || []).filter((event) => event.date === data.date);
    if (!events.length) throw new Error("Add your own activity to this day first — Optimize Day builds around it.");
    const flights = (trip.plan?.flights || []).filter((leg) => leg.date === data.date);
    const day = itinerary[index];

    const prompt = `You are rebuilding ONE day of an existing travel plan so it fits around activities the traveller arranged themselves.

Destination: ${trip.plan?.destination || trip.destination || "unknown"}
Day: ${day.day || `Day ${index + 1}`} · ${data.date}
Flights that day (fixed, they cannot move): ${
      flights.length
        ? flights
            .map(
              (leg) =>
                `${leg.direction || "Flight"} ${leg.airline || ""} ${leg.flight_number || ""} ${leg.departs_at || leg.departs || ""}–${leg.arrives_at || leg.arrives || ""}`.trim(),
            )
            .join("; ")
        : "none"
    }

LOCKED — the traveller's own activities. Keep every one of them exactly as written, at the same times:
${events.map((event) => `- ${event.start_time}–${event.end_time} ${event.title}${event.category ? ` [${event.category}]` : ""}${event.location ? ` at ${event.location}` : ""}${event.notes ? ` (${event.notes})` : ""}`).join("\n")}

The AI suggestion being replaced:
Title: ${day.title || ""}
Details: ${day.details || ""}

Write the new plan for this day:
- Keep the locked activities untouched and build everything else around them.
- Fill the free time so each suggestion ends before the next locked activity starts, allowing 20–30 minutes of travel inside the city.
- Never schedule anything during a locked activity or a flight.
- Give exact clock times in the details, in order, so the day reads as one timeline ("12:30 — lunch at …", "14:10 — 15 min walk to …").
- If a locked activity really cannot work with a flight, say so plainly in the details rather than pretending it fits.
- Under 120 words, no emoji, no invented booking URLs or reservation numbers.

Return JSON with "title" (at most 8 words) and "details".`;

    const result = await client.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: { title: { type: "string" }, details: { type: "string" } },
        required: ["title", "details"],
      },
    });

    const next = itinerary.map((entry, i) =>
      i === index
        ? { ...entry, title: String(result?.title || entry.title || ""), details: String(result?.details || entry.details || "") }
        : entry,
    );

    return client.entities.Trip.update(trip.id, { plan: { ...trip.plan, itinerary: next } });
  });

const SetupInput = z.object({
  terms_accepted: z.boolean().optional(),
  calendar_connected: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
  card_added: z.boolean().optional(),
  card_brand: z.string().max(40).optional(),
});

export const getUserSetup = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) =>
    asArray(
      await context.getBase44().entities.UserSetup.filter(
        { created_by_id: context.user.id },
        { limit: 1 },
      ),
    )[0] ?? null,
  );

export const saveSetup = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(SetupInput)
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const existing = asArray(
      await client.entities.UserSetup.filter({ created_by_id: context.user.id }, { limit: 1 }),
    )[0];
    if (existing) return client.entities.UserSetup.update(existing.id, data);
    return client.entities.UserSetup.create(data);
  });

// Card details never reach the server: only "a card is saved" and its brand do.
// The package total is recalculated from the saved plan on the server, so the
// browser can never choose what it pays.
export const createPackageCheckout = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const trip = await client.entities.Trip.get(data.id);
    const { items, totalCents } = packageBreakdown(trip.plan);
    if (!totalCents) {
      throw Object.assign(
        new Error("This plan has no priced flights or stay yet, so there is nothing to charge."),
        { status: 400 },
      );
    }
    const checkout = await client.asServiceRole.payments.createCheckout({
      items: items.map((item) => ({ name: item.label.slice(0, 120), amount: item.cents, quantity: 1 })),
      currency: "usd",
      success_path: `/trips/${trip.id}/paid`,
      cancel_path: `/trips/${trip.id}`,
    });
    await client.entities.Trip.update(trip.id, {
      payment_channel: "stripe",
      package_total_cents: totalCents,
      payment_checkout_id: checkout.checkout_id || "",
    });
    return { url: checkout.redirect_url, totalCents };
  });

// Asks the travel engine to reserve the seats and rooms. It goes to the app's one
// registered automation webhook, tagged by its `event` field, so no extra
// credential is needed. A booking partner that is not connected yet must never
// break the confirmation page.
async function notifyBookingEngine(trip) {
  const url = secrets.get("MAKE_WEBHOOK_URL");
  if (!url) return false;
  const plan = trip.plan || {};
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "reserve_package",
        trip_id: trip.id,
        payment_channel: trip.payment_channel || "stripe",
        paid_at: trip.paid_at || "",
        travelers: trip.travelers || 1,
        total_cents: trip.package_total_cents || 0,
        flights: (plan.flights || []).map((leg) => ({
          airline: leg.airline || "",
          flight_number: leg.flight_number || "",
          direction: leg.direction || "",
          date: leg.date || "",
          departs: leg.departs || "",
          arrives: leg.arrives || "",
          departs_at: leg.departs_at || "",
          arrives_at: leg.arrives_at || "",
        })),
        lodging: plan.lodging
          ? {
              name: plan.lodging.name || "",
              area: plan.lodging.area || "",
              checkin: trip.start_date || "",
              checkout: trip.end_date || "",
              nights: plan.lodging.nights || "",
            }
          : null,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Only the platform's payment record can mark a Stripe checkout paid.
export const confirmPackagePayment = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), session_id: z.string().min(4) }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const trip = await client.entities.Trip.get(data.id);
    if (trip.paid_at) return { paid: true, trip };
    if (trip.payment_checkout_id && trip.payment_checkout_id !== data.session_id) {
      return { paid: false, trip };
    }
    const result = await client.asServiceRole.payments.listPurchases({
      checkout_id: data.session_id,
    });
    const purchase = (result?.items || [])[0];
    const amountMatches =
      typeof purchase?.amount === "number" && trip.package_total_cents
        ? purchase.amount === trip.package_total_cents
        : true;
    if (purchase?.status !== "paid" || !amountMatches) return { paid: false, trip };

    const paid = await client.entities.Trip.update(trip.id, {
      paid_at: new Date().toISOString(),
      payment_channel: "stripe",
      payment_label: "Stripe checkout · package upgrade",
    });
    await notifyBookingEngine(paid);
    return { paid: true, trip: paid };
  });

// Records a payment the traveller completed on the airline, hotel or in the
// in-app checkout window.
export const markTripPaid = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      method: z.enum(["inapp", "link"]),
      label: z.string().max(120).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const trip = await client.entities.Trip.get(data.id);
    if (trip.paid_at) return trip;
    return client.entities.Trip.update(trip.id, {
      paid_at: new Date().toISOString(),
      payment_channel: data.method,
      payment_label:
        data.label || (data.method === "inapp" ? "In-app checkout" : "Booked with the airline and hotel"),
    });
  });

// The calendar events themselves are written from the browser straight into the
// traveller's Google Calendar; this only records that the trip was added.
export const prepareCalendarInvite = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), enabled: z.boolean() }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const trip = await client.entities.Trip.get(data.id);
    if (!data.enabled) {
      const cleared = await client.entities.Trip.update(trip.id, {
        calendar_package_prepared_at: null,
      });
      return { trip: cleared, eventCount: 0 };
    }

    const updated = await client.entities.Trip.update(trip.id, {
      calendar_package_prepared_at: new Date().toISOString(),
    });
    return { trip: updated, eventCount: calendarPackage(trip).events.length };
  });

export const sendRouteToTesla = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) =>
    context.getBase44().entities.Trip.update(data.id, {
      tesla_sent_at: new Date().toISOString(),
    }),
  );

// Removes every trace of the account in this app, then the app user record itself.
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const admin = context.getBase44().asServiceRole;
    const userId = context.user.id;
    await admin.entities.Trip.deleteMany({ created_by_id: userId });
    await admin.entities.TravelerProfile.deleteMany({ created_by_id: userId });
    await admin.entities.UserSetup.deleteMany({ created_by_id: userId });
    try {
      await admin.entities.User.delete(userId);
    } catch {
      // The sign-in record stays with the platform; the app data is already gone.
    }
    return { ok: true };
  });