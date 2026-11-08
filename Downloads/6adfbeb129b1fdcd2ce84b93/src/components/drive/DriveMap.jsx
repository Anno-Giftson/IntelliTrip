import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

// Keeps the driver's own position in the middle of the screen.
function Follow({ center }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  useEffect(() => {
    if (center) map.setView(center, Math.max(map.getZoom(), 15), { animate: true });
  }, [center?.[0], center?.[1], map]);
  return null;
}

export default function DriveMap({ position, path, stop }) {
  const center = position ? [position.lat, position.lng] : stop ? [stop.lat, stop.lng] : null;
  if (!center) return null;

  return (
    <MapContainer
      center={center}
      zoom={15}
      zoomControl={false}
      attributionControl={false}
      className="absolute inset-0 h-full w-full"
    >
      {/* Esri's public basemap: no API key, and it doesn't block this app. */}
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" maxZoom={19} />

      {path?.geometry?.length > 1 && (
        <Polyline positions={path.geometry} pathOptions={{ color: "#4338ca", weight: 7, opacity: 0.9 }} />
      )}

      {stop && (
        <CircleMarker
          center={[stop.lat, stop.lng]}
          radius={10}
          pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 1, weight: 3 }}
        />
      )}

      {position && (
        <CircleMarker
          center={[position.lat, position.lng]}
          radius={9}
          pathOptions={{ color: "#ffffff", fillColor: "#2563eb", fillOpacity: 1, weight: 3 }}
        />
      )}

      <Follow center={center} />
    </MapContainer>
  );
}