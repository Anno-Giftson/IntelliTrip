import { useRef } from "react";

// A thin grab bar on the panel's left edge: drag it to widen or narrow the
// assistant, or nudge it with the arrow keys.
export default function ResizeHandle({ width, onResize, onResizeEnd, min, max }) {
  const drag = useRef(null);

  const clamp = (value) => Math.min(max, Math.max(min, value));

  function start(event) {
    event.preventDefault();
    drag.current = { x: event.clientX, width };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function move(event) {
    if (!drag.current) return;
    onResize(clamp(drag.current.width + (drag.current.x - event.clientX)));
  }

  function end(event) {
    if (!drag.current) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    onResizeEnd();
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the assistant panel"
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        onResize(clamp(width + (event.key === "ArrowLeft" ? 24 : -24)));
        onResizeEnd();
      }}
      className="group absolute inset-y-0 left-0 z-20 hidden w-2.5 cursor-col-resize touch-none select-none outline-none md:block"
    >
      <span className="absolute inset-y-0 left-0 w-full transition-colors group-hover:bg-foreground/10 group-focus-visible:bg-foreground/10" />
      <span className="absolute left-0 top-1/2 h-12 w-1 -translate-y-1/2 rounded-r-full bg-border transition-colors group-hover:bg-foreground/50 group-focus-visible:bg-foreground/50" />
    </div>
  );
}