import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import CardDialog from "@/components/onboarding/CardDialog";
import ChecklistRow from "@/components/onboarding/ChecklistRow";
import { saveSetup } from "@/lib/server-fns";

// Three things that make the planner work properly: a saved taste profile, the
// traveller's own details, and a payment method ready for checkout.
const itemFor = (profile, setup) => [
  {
    key: "preferences",
    title: "Save your trip preferences",
    hint: "Likes, dislikes and pace shape every plan the AI writes.",
    action: "Add preferences",
    done: Boolean(profile?.likes || profile?.dislikes || profile?.pace || profile?.stay_style),
    to: "/profile",
  },
  {
    key: "traveller_details",
    title: "Complete your traveller profile",
    hint: "Your name and the city you usually fly from.",
    action: "Finish profile",
    done: Boolean(profile?.full_name && profile?.home_city),
    to: "/profile",
  },
  {
    key: "card_added",
    title: "Set up payment",
    hint: "For the in-app checkout — you approve every charge.",
    action: "Add card",
    done: Boolean(setup?.card_added),
    dialog: "card",
  },
];

export default function SetupChecklist({ setup, profile, onChange }) {
  const save = useServerFn(saveSetup);
  const navigate = useNavigate();
  const [state, setState] = useState(setup || {});
  const [open, setOpen] = useState("");
  const items = itemFor(profile, state);
  const doneCount = items.filter((item) => item.done).length;

  if (doneCount === items.length) return null;

  async function patch(partial) {
    const next = { ...state, ...partial };
    setState(next);
    onChange?.(next);
    try {
      await save({ data: partial });
    } catch {
      toast("Could not save that just now");
      setState(state);
      onChange?.(state);
    }
  }

  function act(item) {
    if (item.dialog) setOpen(item.dialog);
    else navigate({ to: item.to });
  }

  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Get set up</h2>
          <p className="text-sm text-foreground/65">Three quick things and the whole trip runs itself.</p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-foreground/60">
          {doneCount} of {items.length}
        </span>
      </header>

      <ul className="mt-2 divide-y divide-border">
        {items.map((item) => (
          <ChecklistRow
            key={item.key}
            title={item.title}
            hint={item.hint}
            done={item.done}
            busy={false}
            actionLabel={item.action}
            onAction={() => act(item)}
          />
        ))}
      </ul>

      <CardDialog
        open={open === "card"}
        onClose={() => setOpen("")}
        onSaved={async (card) => {
          setOpen("");
          await patch(card);
        }}
      />
    </section>
  );
}