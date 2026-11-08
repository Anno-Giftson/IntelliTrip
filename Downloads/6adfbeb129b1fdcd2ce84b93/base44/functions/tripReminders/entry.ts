const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from "npm:@base44/sdk@0.8.59";

const DAY_MS = 86400000;
const isoToday = () => new Date().toISOString().slice(0, 10);
const asArray = (res) => (Array.isArray(res) ? res : (res?.items ?? []));const daysBetween = (a, b) =>
  Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function reminderEmail(trip, daysOut, appUrl, shareUrl) {
  const plan = trip.plan || {};
  const flights = (plan.flights || [])
    .map(
      (leg) =>
        `<li style="margin:0 0 6px">${esc(leg.direction || "Flight")} · ${esc(leg.airline || "")} ${esc(
          leg.flight_number || "",
        )} — ${esc(leg.date || "")} ${esc(leg.departs_at || leg.departs || "")} → ${esc(
          leg.arrives_at || leg.arrives || "",
        )}</li>`,
    )
    .join("");
  const firstDay = (plan.itinerary || [])[0];

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#eef1ff;font-family:Helvetica,Arial,sans-serif;color:#1b1f3b">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#4338ca">IntelliTrip</p>
    <h1 style="margin:0 0 8px;font-size:24px">${esc(trip.title || trip.destination || "Your trip")} in ${daysOut} day${
      daysOut === 1 ? "" : "s"
    }</h1>
    <p style="margin:0 0 18px;color:#4b5069">${esc(trip.destination || "")} · ${esc(trip.start_date)} to ${esc(
      trip.end_date,
    )} · ${esc(trip.travelers || 1)} traveller(s)</p>

    ${flights ? `<h2 style="font-size:15px;margin:20px 0 8px">Your flights</h2><ul style="margin:0;padding-left:18px;font-size:14px">${flights}</ul>` : ""}
    ${
      plan.lodging?.name
        ? `<h2 style="font-size:15px;margin:20px 0 8px">Your stay</h2><p style="margin:0;font-size:14px">${esc(
            plan.lodging.name,
          )}${plan.lodging.area ? ` · ${esc(plan.lodging.area)}` : ""}</p>`
        : ""
    }
    ${
      firstDay
        ? `<h2 style="font-size:15px;margin:20px 0 8px">Day one</h2><p style="margin:0;font-size:14px"><strong>${esc(
            firstDay.title || "",
          )}</strong><br/>${esc(String(firstDay.details || "").slice(0, 400))}</p>`
        : ""
    }
    ${
      plan.departure_brief
        ? `<h2 style="font-size:15px;margin:20px 0 8px">Travel day</h2><p style="margin:0;font-size:14px;white-space:pre-line">${esc(
            String(plan.departure_brief).slice(0, 900),
          )}</p>`
        : ""
    }
    ${
      (plan.packing || []).length
        ? `<h2 style="font-size:15px;margin:20px 0 8px">Don't forget</h2><p style="margin:0;font-size:14px">${esc(
            (plan.packing || []).slice(0, 8).join(" · "),
          )}</p>`
        : ""
    }

    <p style="margin:26px 0 0">
      <a href="${appUrl}/trips/${trip.id}" style="display:inline-block;background:#4338ca;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">Open the full plan</a>
      ${
        shareUrl
          ? `<a href="${shareUrl}" style="display:inline-block;margin-left:8px;color:#4338ca;text-decoration:none;padding:12px 8px;font-size:14px">Share with your group</a>`
          : ""
      }
    </p>
    <p style="margin:18px 0 0;font-size:12px;color:#7a8098">You are getting this because reminders are on for this trip. Turn them off on the trip page.</p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = db.asServiceRole;

    let user = null;
    try {
      user = await db.auth.me();
    } catch {
      user = null;
    }

    const body = await req.json().catch(() => ({}));
    const requestedId = body?.trip_id;
    const appUrl = req.headers.get("x-base44-app-url") || "https://intellitrip.db.app";
    const today = isoToday();

    let trips = [];
    if (requestedId) {
      const trip = await sr.entities.Trip.get(requestedId);
      if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });
      if (user && trip.created_by_id !== user.id && user.role !== "admin") {
        return Response.json({ error: "Not allowed" }, { status: 403 });
      }
      trips = [trip];
    } else {
      const all = await sr.entities.Trip.list({ sort: "start_date", limit: 300 });
      trips = asArray(all).filter((trip) => {
        const lead = trip.prefs?.notify_before_days ?? 2;
        const days = daysBetween(trip.start_date, today);
        return (trip.prefs?.reminders ?? true) && !trip.prefs?.mute_notifications && days >= 0 && days <= lead;
      });
    }

    const sent = [];
    for (const trip of trips) {
      if (!trip?.start_date || !trip?.end_date) continue;
      if (daysBetween(trip.end_date, today) < 0) continue;

      if (!requestedId) {
        const already = asArray(
          await sr.entities.TripReminder.filter(
            { trip_id: trip.id, sent_for: trip.start_date },
            { limit: 1 },
          ),
        );
        if (already.length) continue;
      }

      let owner = null;
      try {
        owner = await sr.entities.User.get(trip.created_by_id);
      } catch {
        owner = null;
      }
      if (!owner?.email) continue;

      const share = asArray(
        await sr.entities.TripShare.filter({ trip_id: trip.id, revoked: false }, { limit: 1 }),
      )[0];
      const daysOut = Math.max(0, daysBetween(trip.start_date, today));

      try {
        await sr.integrations.Core.SendEmail({
          to: owner.email,
          from_name: "IntelliTrip",
          subject: `${trip.title || trip.destination || "Your trip"} in ${daysOut} day${daysOut === 1 ? "" : "s"}`,
          body: reminderEmail(trip, daysOut, appUrl, share ? `${appUrl}/share/${share.token}` : ""),
        });
      } catch (error) {
        console.log("reminder send failed", trip.id, error?.message);
        continue;
      }

      await sr.entities.TripReminder.create({
        trip_id: trip.id,
        sent_for: trip.start_date,
        sent_at: new Date().toISOString(),
        to_email: owner.email,
      });
      sent.push({ trip_id: trip.id, to: owner.email, days_out: daysOut });
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    console.log("tripReminders failed", error?.message);
    return Response.json({ error: error?.message || "Reminder run failed" }, { status: 500 });
  }
});