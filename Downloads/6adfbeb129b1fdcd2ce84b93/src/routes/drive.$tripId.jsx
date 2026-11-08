import { useEffect, useMemo, useRef, useState } from "react";
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import DriveHud from "@/components/drive/DriveHud";
import DriveMap from "@/components/drive/DriveMap";
import { getDriveRoute } from "@/lib/drive-fns";
import { getTrip } from "@/lib/server-fns";

const EARTH = 6371000;

function distanceMeters(a, b) {
  if (!a || !b) return Infinity;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat = ((a.lat + b.lat) * Math.PI) / 360;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat) ** 2 * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.sqrt(h));
}

export const Route = createFileRoute("/drive/$tripId")({
  ssr: false,
  beforeLoad: requireSignedIn,
  errorComponent: AuthGateError,
  loader: async ({ params }) => {
    const trip = await getTrip({ data: { id: params.tripId } });
    if (!trip) throw notFound();
    return { trip };
  },
  head: () => ({ meta: [{ title: "Drive mode" }] }),
  component: DrivePage,
});

function DrivePage() {
  const { trip } = Route.useLoaderData();
  const planRoute = useServerFn(getDriveRoute);
  const navigate = useNavigate();
  const stops = useMemo(
    () => (trip.map_points?.days || []).filter((day) => Number.isFinite(day.lat) && Number.isFinite(day.lng)),
    [trip],
  );
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastFrom = useRef(null);
  const stop = stops[index] || null;

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("This device can't share its location.");
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (fix) => {
        setPosition({ lat: fix.coords.latitude, lng: fix.coords.longitude });
        setGeoError("");
      },
      () => setGeoError("Turn on location so we can guide you."),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  // A new stop always means a new leg.
  useEffect(() => {
    lastFrom.current = null;
    setPath(null);
  }, [index]);

  // Re-plan only after the driver has actually moved on, so a live position
  // stream doesn't hammer the routing service.
  useEffect(() => {
    if (!position || !stop) return;
    if (lastFrom.current && distanceMeters(lastFrom.current, position) < 200) return;
    lastFrom.current = position;
    let alive = true;
    setLoading(true);
    setError("");
    planRoute({ data: { from: position, to: { lat: stop.lat, lng: stop.lng } } })
      .then((result) => alive && setPath(result))
      .catch((err) => alive && setError(err?.message || "Could not plan this leg."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [position, stop?.lat, stop?.lng, index]);

  const step = useMemo(() => {
    if (!path?.steps?.length) return null;
    const ahead = path.steps.find(
      (entry) => distanceMeters(position, { lat: entry.location[0], lng: entry.location[1] }) > 45,
    );
    return ahead || path.steps[path.steps.length - 1];
  }, [path, position]);

  function reroute() {
    lastFrom.current = null;
    setPath(null);
    setPosition((current) => (current ? { ...current } : current));
  }

  if (stops.length === 0) {
    return (
      <div className="app-gradient flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">The map for this trip isn't ready</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Build the trip map first — drive mode needs the coordinates of each day.
          </p>
          <Link
            to="/trips/$tripId"
            params={{ tripId: trip.id }}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Back to the trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-muted">
      <DriveMap position={position} path={path} stop={stop} />
      <DriveHud
        stop={stop}
        index={index}
        total={stops.length}
        step={step}
        path={path}
        loading={loading}
        error={error}
        geoError={geoError}
        onReroute={reroute}
        onNext={() => setIndex((current) => Math.min(current + 1, stops.length - 1))}
        onExit={() => navigate({ to: "/trips/$tripId", params: { tripId: trip.id } })}
      />
    </div>
  );
}