import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const asArray = (res) => (Array.isArray(res) ? res : (res?.items ?? []));
const TOKEN_RE = /^[a-z0-9]{32}$/;

function newToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// One live link per trip; opening it again hands back the same link.
export const shareTrip = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const existing = asArray(
      await client.entities.TripShare.filter({ trip_id: data.id, revoked: false }, { limit: 1 }),
    )[0];
    if (existing) return { token: existing.token };
    const created = await client.entities.TripShare.create({
      trip_id: data.id,
      token: newToken(),
      revoked: false,
    });
    return { token: created.token };
  });

export const stopSharing = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const client = context.getBase44();
    const shares = asArray(await client.entities.TripShare.filter({ trip_id: data.id, revoked: false }));
    for (const share of shares) {
      await client.entities.TripShare.update(share.id, { revoked: true });
    }
    return { ok: true };
  });

// What a visitor with the link sees: the plan only, never payments or the
// traveller's saved profile.
export const getSharedTrip = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().max(64) }))
  .handler(async ({ data, context }) => {
    if (!TOKEN_RE.test(data.token)) return null;
    const admin = context.getBase44().asServiceRole;
    const share = asArray(
      await admin.entities.TripShare.filter({ token: data.token, revoked: false }, { limit: 1 }),
    )[0];
    if (!share) return null;
    const trip = await admin.entities.Trip.get(share.trip_id).catch(() => null);
    if (!trip) return null;
    return {
      title: trip.title,
      destination: trip.destination,
      origin_city: trip.origin_city,
      start_date: trip.start_date,
      end_date: trip.end_date,
      travelers: trip.travelers,
      budget: trip.budget,
      status: trip.status,
      plan: trip.plan,
      companions: trip.companions || [],
    };
  });