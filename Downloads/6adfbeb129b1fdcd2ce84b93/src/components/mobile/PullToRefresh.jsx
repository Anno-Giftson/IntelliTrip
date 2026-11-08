import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const THRESHOLD = 56;
const MAX_PULL = 88;

// Touch pull-to-refresh for the mobile list: drag down from the top of the page.
export default function PullToRefresh({ onRefresh, children }) {
  const startY = useRef(null);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);

  function onTouchStart(event) {
    if (busy || window.scrollY > 0) return;
    startY.current = event.touches[0].clientY;
  }

  function onTouchMove(event) {
    if (startY.current == null) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta > 0) setPull(Math.min(MAX_PULL, delta * 0.55));
  }

  async function onTouchEnd() {
    if (startY.current == null) return;
    startY.current = null;
    if (pull < THRESHOLD) {
      setPull(0);
      return;
    }
    setBusy(true);
    setPull(THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setBusy(false);
      setPull(0);
    }
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="overscroll-contain md:overscroll-auto"
    >
      <div className="flex items-center justify-center overflow-hidden" style={{ height: pull }} aria-hidden={pull === 0}>
        <Loader2
          className={`h-5 w-5 text-foreground/50 ${busy ? "animate-spin" : ""}`}
          style={{ transform: busy ? undefined : `rotate(${pull * 3}deg)` }}
        />
      </div>
      <div style={{ transform: pull ? `translateY(${pull * 0.15}px)` : undefined, transition: busy ? undefined : "transform 120ms" }}>
        {children}
      </div>
    </div>
  );
}