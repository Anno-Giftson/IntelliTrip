import { Check, Loader2 } from "lucide-react";

export default function ChecklistRow({ title, hint, done, busy, actionLabel, onAction }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
          done ? "border-transparent bg-primary text-primary-foreground" : "border-border text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? "text-foreground/55 line-through" : ""}`}>{title}</p>
        {!done && hint && <p className="mt-0.5 text-xs leading-snug text-foreground/60">{hint}</p>}
      </div>

      {!done && (
        <button
          type="button"
          onClick={onAction}
          disabled={busy}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold underline decoration-foreground/30 underline-offset-4 transition-colors hover:bg-foreground/5 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {actionLabel}
        </button>
      )}
    </li>
  );
}