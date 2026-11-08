export default function PlanFacts({ rows }) {
  const items = (rows || []).filter(([, value]) => value);
  if (!items.length) return null;

  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs uppercase tracking-[0.12em] text-foreground/55">{label}</dt>
          <dd className="mt-0.5 text-sm leading-relaxed">{value}</dd>
        </div>
      ))}
    </dl>
  );
}