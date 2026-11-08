// Turns the planner's cost strings ("$420 (USD 420)", "1,250 USD", "€90") into
// integer cents so a package total can be shown and charged consistently.
const FIRST_NUMBER = /(\d[\d,]*(?:\.\d{1,2})?)/;

export function moneyToCents(value) {
  if (typeof value === "number") return Math.round(value * 100);
  const text = String(value || "");
  if (!text) return 0;
  // The planner writes a USD figure in brackets; prefer it over the local currency.
  const match =
    text.match(/usd\s*([\d,]+(?:\.\d{1,2})?)/i) ||
    text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/) ||
    text.match(FIRST_NUMBER);
  const amount = Number(String(match?.[1] ?? "").replace(/,/g, ""));
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function packageBreakdown(plan) {
  const flights = (plan?.flights || []).map((leg) => ({
    label: [leg.direction ? `${leg.direction} flight` : "Flight", leg.airline, leg.flight_number].filter(Boolean).join(" · "),
    detail: [leg.departs, leg.arrives, leg.date].filter(Boolean).join(" → "),
    cents: moneyToCents(leg.cost),
  }));

  const stay = plan?.lodging
    ? [
        {
          label: `Stay · ${plan.lodging.name || plan.lodging.area || "lodging"}`,
          detail: plan.lodging.nights ? `${plan.lodging.nights} nights` : "",
          cents: moneyToCents(plan.lodging.cost),
        },
      ]
    : [];

  const items = [...flights, ...stay].filter((item) => item.cents > 0);
  return { items, totalCents: items.reduce((sum, item) => sum + item.cents, 0) };
}

export const formatCents = (cents) =>
  (Number(cents || 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });