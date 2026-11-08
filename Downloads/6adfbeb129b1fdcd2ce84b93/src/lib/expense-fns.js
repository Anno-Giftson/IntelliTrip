import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const asArray = (res) => (Array.isArray(res) ? res : (res?.items ?? []));

export const listExpenses = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ trip_id: z.string() }))
  .handler(async ({ data, context }) =>
    asArray(
      await context.getBase44().entities.Expense.filter(
        { trip_id: data.trip_id },
        { sort: "-spent_on", limit: 200 },
      ),
    ),
  );

export const addExpense = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      trip_id: z.string(),
      label: z.string().min(1).max(120),
      amount_cents: z.number().min(1).max(100000000),
      category: z.enum(["Food", "Transit", "Stay", "Activity", "Shopping", "Other"]).optional(),
      spent_on: z.string().max(10).optional(),
      receipt_file_uri: z.string().max(600).optional(),
      notes: z.string().max(600).optional(),
    }),
  )
  .handler(async ({ data, context }) => context.getBase44().entities.Expense.create(data));

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await context.getBase44().entities.Expense.delete(data.id);
    return { ok: true };
  });