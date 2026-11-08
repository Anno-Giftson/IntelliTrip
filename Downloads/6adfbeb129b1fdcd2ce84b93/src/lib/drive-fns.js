import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const OSRM = "https://router.project-osrm.org/route/v1/driving";

const side = (modifier) => {
  if (!modifier) return "";
  return ` ${String(modifier).replace("slight ", "slightly ").replace("sharp", "sharply")}`;
};

function instruction(step) {
  const maneuver = step.maneuver || {};
  const road = step.name ? ` onto ${step.name}` : "";
  switch (maneuver.type) {
    case "depart":
      return `Head out${road}`;
    case "arrive":
      return "You have arrived";
    case "turn":
      return `Turn${side(maneuver.modifier)}${road}`;
    case "continue":
    case "new name":
      return `Continue${side(maneuver.modifier)}${road}`;
    case "merge":
      return `Merge${side(maneuver.modifier)}${road}`;
    case "fork":
      return `Keep${side(maneuver.modifier)}${road}`;
    case "end of road":
      return `At the end of the road, turn${side(maneuver.modifier)}${road}`;
    case "on ramp":
      return `Take the ramp${road}`;
    case "off ramp":
      return `Take the exit${road}`;
    case "roundabout":
    case "rotary":
      return `Enter the roundabout${maneuver.exit ? ` and take exit ${maneuver.exit}` : ""}${road}`;
    default:
      return `Continue${road}`;
  }
}

// Turn-by-turn driving route between the traveller's position and the next stop.
export const getDriveRoute = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      from: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
      to: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
      mode: z.enum(["driving", "walking"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const profile = data.mode === "walking" ? "foot" : "driving";
    const url = `${OSRM.replace("driving", profile)}/${data.from.lng},${data.from.lat};${data.to.lng},${data.to.lat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("The routing service is busy — try again in a moment.");
    const route = (await response.json())?.routes?.[0];
    if (!route) throw new Error("No drivable route was found to this stop.");

    return {
      distance: Math.round(route.distance || 0),
      duration: Math.round(route.duration || 0),
      geometry: (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]),
      steps: (route.legs?.[0]?.steps || []).map((step) => ({
        instruction: instruction(step),
        distance: Math.round(step.distance || 0),
        type: step.maneuver?.type || "continue",
        location: [step.maneuver?.location?.[1], step.maneuver?.location?.[0]],
      })),
    };
  });