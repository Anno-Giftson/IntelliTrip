// Raw, self-contained Google Calendar wiring that runs entirely in the browser:
// a plain Google Identity Services token pop-up, then direct Calendar REST calls.
// Only the public OAuth client ID is needed — it comes from the frontend
// environment (VITE_GOOGLE_CLIENT_ID) or a window variable, never a secret.
import { calendarPackage } from "@/lib/calendarPackage";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// Public client ID: window override first, then the Vite frontend variable.
export function googleClientId() {
  const fromWindow =
    typeof window === "undefined"
      ? ""
      : window.GOOGLE_CLIENT_ID || window.__GOOGLE_CLIENT_ID__ || window.GOOGLE_CALENDAR_CLIENT_ID;
  const fromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  return String(fromWindow || fromEnv || "").trim();
}

let scriptPromise = null;

// Loads Google's identity script once. Called on mount so the click that opens
// the pop-up never has to wait for the network.
export function warmUpGoogleIdentity() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Google sign-in. Check your connection and try again."));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// Opens the Google sign-in pop-up and resolves with an access token.
export async function requestCalendarAccess() {
  if (!googleClientId()) {
    throw new Error(
      "Add your Google OAuth client ID as VITE_GOOGLE_CLIENT_ID (or window.GOOGLE_CLIENT_ID) to connect Google Calendar.",
    );
  }
  const google = await warmUpGoogleIdentity();
  const oauth2 = google?.accounts?.oauth2;
  if (!oauth2) throw new Error("Google sign-in is unavailable in this browser.");

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: googleClientId(),
      scope: SCOPE,
      prompt: "consent",
      callback: (response) => {
        if (response?.access_token) resolve(response.access_token);
        else reject(new Error(response?.error_description || "Google sign-in was cancelled."));
      },
      error_callback: (error) => reject(new Error(error?.message || "Google sign-in was cancelled.")),
    });
    client.requestAccessToken();
  });
}

const pad = (value) => String(value).padStart(2, "0");

// Calendar times without an offset are wall-clock times in the trip's zone.
function addHours(wallClock, hours) {
  const parsed = new Date(`${wallClock}Z`);
  if (Number.isNaN(parsed.getTime())) return wallClock;
  parsed.setUTCHours(parsed.getUTCHours() + hours);
  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}T${pad(
    parsed.getUTCHours(),
  )}:${pad(parsed.getUTCMinutes())}:00`;
}

function toGoogleEvent(event, timeZone) {
  const start = String(event.start || "");
  const end = String(event.end || "");
  const timed = /T\d{2}:\d{2}/.test(start);

  const body = { summary: event.summary || "Trip", location: event.location || "", description: event.description || "" };
  if (!timed) {
    body.start = { date: start };
    body.end = { date: end && end > start ? end : addHours(start, 24).slice(0, 10) };
  } else {
    if (!end || end <= start) body.end = addHours(start, 1);
    else body.end = end;
    body.start = { dateTime: start, timeZone };
    body.end = { dateTime: body.end, timeZone };
  }
  return body;
}

// Writes every packaged event into the signed-in user's primary calendar.
export async function addTripToGoogleCalendar(pkg, accessToken) {
  const timeZone = pkg?.time_zone || "UTC";
  const created = [];
  for (const event of pkg?.events || []) {
    const response = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toGoogleEvent(event, timeZone)),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error?.message || `Google Calendar rejected an event (${response.status}).`);
    }
    created.push(data);
  }
  return created;
}

// Full flow: package the trip, get Google's consent, create the events.
export async function connectTripToGoogleCalendar(trip) {
  const pkg = calendarPackage(trip);
  const accessToken = await requestCalendarAccess();
  return addTripToGoogleCalendar(pkg, accessToken);
}