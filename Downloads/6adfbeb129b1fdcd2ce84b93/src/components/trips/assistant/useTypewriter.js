import { useEffect, useState } from "react";

// Reveals an answer a few characters at a time so it reads as if the assistant
// is still writing. A long answer finishes in roughly two seconds.
export default function useTypewriter(text, animate) {
  const [shown, setShown] = useState(text.length);

  useEffect(() => {
    if (!animate) {
      setShown(text.length);
      return;
    }
    let index = 0;
    const step = Math.max(2, Math.round(text.length / 120));
    setShown(0);
    const timer = setInterval(() => {
      index = Math.min(text.length, index + step);
      setShown(index);
      if (index >= text.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [text, animate]);

  return { visible: text.slice(0, shown), typing: shown < text.length };
}