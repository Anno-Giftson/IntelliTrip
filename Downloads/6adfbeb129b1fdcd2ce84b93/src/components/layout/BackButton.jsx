import { useEffect, useRef } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export default function BackButton({ fallback = "/", label = "Back" }) {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useRef(false);

  // Read the history once, in the browser: a deep link opened cold has nowhere to go back to.
  useEffect(() => {
    canGoBack.current = window.history.length > 1;
  }, []);

  function goBack() {
    if (canGoBack.current) router.history.back();
    else navigate({ to: fallback });
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-[44px] items-center gap-1 rounded-full pl-1 pr-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10"
    >
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      {label}
    </button>
  );
}