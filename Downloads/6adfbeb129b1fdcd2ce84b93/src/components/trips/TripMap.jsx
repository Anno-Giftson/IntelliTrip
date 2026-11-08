import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { nearbyFood } from "@/lib/planMarkers";

// Recentres the map whenever the traveller picks another day.
function Follow({ center, zoom }) {
  const map = useMap();
  // The map is mounted lazily inside a panel, so Leaflet can measure it before
  // the layout settles and leave blank squares behind. Re-measure once mounted.
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 0.7 });
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
}

export default function TripMap({ markers, activeIndex }) {
  const destination = markers.destination;
  const active = markers.days[activeIndex] || null;
  const center = destination ? [destination.lat, destination.lng] : markers.route[0];
  if (!center) return null;

  const nearby = nearbyFood(markers, activeIndex, 6);
  const focus = active ? [active.lat, active.lng] : center;

  return (
    <MapContainer
      center={center}
      zoom={active ? 13 : 12}
      scrollWheelZoom={false}
      style={{ height: 380, width: "100%" }}
    >
      {/* Esri's public world basemap: served without an API key, unlike CARTO and
          openstreetmap.org's tile server, which block this app. Note the {y}/{x} order. */}
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />

      {markers.route.length > 1 && (
        <Polyline positions={markers.route} pathOptions={{ color: "#4338ca", weight: 3, opacity: 0.75 }} />
      )}

      {markers.lodging && (
        <CircleMarker
          center={[markers.lodging.lat, markers.lodging.lng]}
          radius={9}
          pathOptions={{ color: "#0f766e", fillColor: "#2dd4bf", fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <strong>Your stay</strong>
            <br />
            {markers.lodging.label}
            {markers.lodging.area ? ` · ${markers.lodging.area}` : ""}
          </Popup>
        </CircleMarker>
      )}

      {markers.days.map((day) => {
        const isActive = day.index === markers.days[activeIndex]?.index;
        return (
          <CircleMarker
            key={`day-${day.index}`}
            center={[day.lat, day.lng]}
            radius={isActive ? 11 : 8}
            pathOptions={{
              color: "#312e81",
              fillColor: isActive ? "#4338ca" : "#ffffff",
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>
              <strong>
                {day.day}
                {day.date ? ` · ${day.date}` : ""}
              </strong>
              <br />
              {day.title}
            </Popup>
          </CircleMarker>
        );
      })}

      {nearby.map((place) => (
        <CircleMarker
          key={`food-${place.index}`}
          center={[place.lat, place.lng]}
          radius={6}
          pathOptions={{ color: "#111111", fillColor: "#fbbf24", fillOpacity: 0.95, weight: 2 }}
        >
          <Popup>
            <strong>{place.name}</strong>
            {place.cuisine ? ` · ${place.cuisine}` : ""}
            <br />
            {`${place.km.toFixed(1)} km · ${place.walkMin} min walk · ${place.driveMin} min drive`}
          </Popup>
        </CircleMarker>
      ))}

      <Follow center={focus} zoom={active ? 13 : 12} />
    </MapContainer>
  );
}