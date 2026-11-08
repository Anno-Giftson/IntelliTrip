import { Compass, Plus, SlidersHorizontal } from "lucide-react";

const TABS = [
  { key: "/", label: "My Trips", Icon: Compass },
  { key: "/trips/new", label: "New Trip", Icon: Plus },
  { key: "/profile", label: "Preferences", Icon: SlidersHorizontal },
];

export default function MobileTabBar({ activeTab, onSelect }) {
  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-3">
        {TABS.map(({ key, label, Icon }) => {
          const active = key === activeTab;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors active:bg-foreground/5 ${
                active ? "text-foreground" : "text-foreground/55"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}