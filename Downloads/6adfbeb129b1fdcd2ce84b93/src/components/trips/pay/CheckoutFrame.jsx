import { Lock } from "lucide-react";

// The framed booking window the plan pays inside. It stands in for the airline
// or hotel checkout until the live booking partner is connected.
export default function CheckoutFrame({ title, subtitle, footer, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-secondary/40">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/70 px-3 py-2">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-foreground/25" />
          <span className="h-2 w-2 rounded-full bg-foreground/25" />
          <span className="h-2 w-2 rounded-full bg-foreground/25" />
        </span>
        <p className="truncate text-xs font-medium text-foreground/70">{title}</p>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-foreground/55">
          <Lock className="h-3 w-3" aria-hidden="true" />
          secure
        </span>
      </div>
      <div className="space-y-3 bg-background/70 p-3">
        {subtitle && <p className="text-xs text-foreground/60">{subtitle}</p>}
        {children}
        {footer}
      </div>
    </div>
  );
}