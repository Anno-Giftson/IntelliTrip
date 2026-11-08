import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { shareTrip, stopSharing } from "@/lib/share-fns";

export default function ShareTripButton({ tripId }) {
  const create = useServerFn(shareTrip);
  const revoke = useServerFn(stopSharing);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function open() {
    if (link) return;
    setBusy(true);
    setError("");
    try {
      const { token } = await create({ data: { id: tripId } });
      setLink(`${window.location.origin}/share/${token}`);
    } catch (err) {
      setError(err?.message || "Could not create the link just now.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copy the link from the box above.");
    }
  }

  async function stop() {
    setBusy(true);
    try {
      await revoke({ data: { id: tripId } });
      setLink("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full" onClick={open}>
          <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Share this trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share the plan</DialogTitle>
          <DialogDescription>
            Anyone with this link can read the itinerary — no account needed. They can't change anything.
          </DialogDescription>
        </DialogHeader>

        {busy && !link && (
          <p className="flex items-center gap-2 text-sm text-foreground/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Creating your link…
          </p>
        )}

        {link && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Shareable link" className="bg-card" />
              <Button type="button" onClick={copy} className="shrink-0">
                {copied ? <Check className="mr-2 h-4 w-4" aria-hidden="true" /> : <Copy className="mr-2 h-4 w-4" aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={stop} disabled={busy}>
              Stop sharing this link
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}