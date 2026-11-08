import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { updateTrip } from "@/lib/server-fns";

export default function useTripDraft(loaded) {
  const save = useServerFn(updateTrip);
  const [trip, setValue] = useState(loaded);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const draft = useRef(loaded);
  const pending = useRef({});
  const timer = useRef(null);
  const saving = useRef(null);
  const setTrip = (value) => { draft.current = value; setValue(value); };

  async function flush() {
    clearTimeout(timer.current);
    if (saving.current) { await saving.current; return flush(); }
    if (!Object.keys(pending.current).length) return;
    const batch = pending.current;
    pending.current = {};
    saving.current = (async () => {
      try {
        const updated = await save({ data: { id: loaded.id, ...batch } });
        setTrip({ ...updated, ...pending.current });
        setStatus(Object.keys(pending.current).length ? "Saving…" : "Saved");
        setError("");
      } catch (err) {
        pending.current = { ...batch, ...pending.current };
        setStatus("Not saved");
        setError(err.message || "Could not save your changes.");
        throw err;
      } finally { saving.current = null; }
    })();
    await saving.current;
    if (Object.keys(pending.current).length) await flush();
  }

  function patch(partial) {
    pending.current = { ...pending.current, ...partial };
    setTrip({ ...draft.current, ...partial });
    setStatus("Saving…");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { flush().catch(() => {}); }, 700);
  }

  async function saveNow(partial) {
    await flush();
    const updated = await save({ data: { id: loaded.id, ...partial } });
    setTrip(updated);
    return updated;
  }

  useEffect(() => () => { clearTimeout(timer.current); flush().catch(() => {}); }, []);
  return { trip, setTrip: (value) => setTrip({ ...value, ...pending.current }), status, setStatus, error, setError, patch, flush, saveNow,
    patchPlan: (partial) => patch({ plan: { ...draft.current.plan, ...partial } }) };
}