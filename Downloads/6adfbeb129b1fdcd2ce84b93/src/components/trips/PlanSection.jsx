export default function PlanSection({ title, hint, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">{title}</h3>
        {hint && <span className="text-xs text-foreground/55">{hint}</span>}
      </header>
      {children}
    </section>
  );
}