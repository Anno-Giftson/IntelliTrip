import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccount } from "@/lib/server-fns";
import { useAuth } from "@/lib/AuthContext";

export default function DeleteAccount() {
  const remove = useServerFn(deleteAccount);
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      await remove({});
      logout();
    } catch (err) {
      setError(err?.message || "Could not delete your account just now.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-destructive/40 bg-card/70 p-5 backdrop-blur">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-destructive">Delete account</h2>
      <p className="mt-2 text-sm text-foreground/70">
        This removes every trip, your preferences and your setup checklist, and signs you out. It can't be undone.
      </p>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="mt-3 rounded-full" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />}
            Delete my account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Every trip you planned, your saved preferences and your checklist are deleted, and you're signed out.
              Trips you've already booked with airlines or hotels are not affected — those are with them, not us. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep my account</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={run}
            >
              Yes, delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}