import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TermsDialog({ open, onClose, onAgree }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Terms &amp; conditions</DialogTitle>
          <DialogDescription>The whole agreement, in one line.</DialogDescription>
        </DialogHeader>

        <p className="rounded-xl border border-border bg-foreground/5 p-4 text-sm leading-relaxed">
          Don't misuse this app or do anything bad with it.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            Not now
          </Button>
          <Button className="rounded-full" onClick={onAgree}>
            I agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}