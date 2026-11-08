const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function SendReminderButton({ tripId }) {
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const response = await db.functions.invoke("tripReminders", { trip_id: tripId });
      const count = response?.data?.sent?.length ?? 0;
      if (count) {
        toast("Reminder on the way", { description: "Check the inbox you signed up with." });
      } else {
        toast("Reminder not sent", { description: "This trip's reminder already went out, or its dates have passed." });
      }
    } catch (err) {
      toast.error(err?.message || "Could not send the reminder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={busy} onClick={send}>
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="mr-2 h-4 w-4" aria-hidden="true" />}
      Email me a reminder
    </Button>
  );
}