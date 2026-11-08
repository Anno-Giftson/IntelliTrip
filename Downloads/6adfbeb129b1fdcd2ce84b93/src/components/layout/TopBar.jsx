import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/layout/BackButton";
import { useAuth } from "@/lib/AuthContext";
import { TAB_ROOTS } from "@/lib/tabStacks";

export function Brand() {
  return (
    <Link to="/" className="flex min-h-[44px] items-center text-base font-semibold tracking-tight">
      IntelliTrip
    </Link>
  );
}

export default function TopBar({ pathname }) {
  const { user, logout } = useAuth();
  const isRoot = TAB_ROOTS.includes(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/75 backdrop-blur-md">
      <div className="safe-top" />

      {/* Phones: back on child screens, brand on the three root screens. */}
      <div className="mx-auto flex min-h-[52px] w-full max-w-5xl items-center gap-2 px-3 md:hidden">
        {isRoot ? <Brand /> : <BackButton />}
        {user && (
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Sign out"
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Tablet and desktop keep the full nav bar. */}
      <div className="mx-auto hidden w-full max-w-5xl items-center gap-2 px-4 py-3 md:flex">
        <Brand />
        <nav className="ml-auto flex items-center gap-1">
          <Link
            to="/"
            className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-medium transition-colors hover:bg-foreground/5 ${
              pathname === "/" ? "bg-foreground/5" : ""
            }`}
          >
            My trips
          </Link>
          <Link
            to="/profile"
            className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-medium transition-colors hover:bg-foreground/5 ${
              pathname.startsWith("/profile") ? "bg-foreground/5" : ""
            }`}
          >
            Preferences
          </Link>
          <Button asChild size="sm" className="ml-1 rounded-full">
            <Link to="/trips/new">New trip</Link>
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => logout()}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}