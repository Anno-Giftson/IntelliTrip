import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from "lucide-react";

const LABELS = [
  [0, "Clear"],
  [2, "Mostly sunny"],
  [3, "Cloudy"],
  [48, "Fog"],
  [57, "Drizzle"],
  [67, "Rain"],
  [77, "Snow"],
  [82, "Showers"],
  [86, "Snow showers"],
  [99, "Storms"],
];

function look(code) {
  if (code === 0) return { Icon: Sun, tone: "text-chart-4" };
  if (code <= 2) return { Icon: CloudSun, tone: "text-chart-4" };
  if (code === 3) return { Icon: Cloud, tone: "text-muted-foreground" };
  if (code === 45 || code === 48) return { Icon: CloudFog, tone: "text-muted-foreground" };
  if (code >= 51 && code <= 57) return { Icon: CloudDrizzle, tone: "text-chart-2" };
  if (code >= 71 && code <= 77) return { Icon: CloudSnow, tone: "text-chart-2" };
  if (code >= 85 && code <= 86) return { Icon: CloudSnow, tone: "text-chart-2" };
  if (code >= 95) return { Icon: CloudLightning, tone: "text-chart-3" };
  return { Icon: CloudRain, tone: "text-chart-2" };
}

const labelFor = (code) => LABELS.find(([max]) => code <= max)?.[1] || "Mixed";

export default function WeatherDay({ day, active }) {
  const { Icon, tone } = look(day.code);
  const date = new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <li
      className={`min-w-[104px] flex-1 rounded-xl border p-3 text-center ${
        active ? "border-primary/50 bg-primary/5" : "border-border bg-card/50"
      }`}
    >
      <p className="text-xs font-medium text-foreground/70">{date}</p>
      <Icon className={`mx-auto my-2 h-6 w-6 ${tone}`} aria-hidden="true" />
      <p className="text-sm font-semibold">
        {day.high}°<span className="ml-1 font-normal text-foreground/55">{day.low}°</span>
      </p>
      <p className="mt-1 text-xs text-foreground/55">{labelFor(day.code)}</p>
      {typeof day.rain === "number" && <p className="text-xs text-primary">{day.rain}% rain</p>}
    </li>
  );
}