import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import MobileTabBar from "@/components/layout/MobileTabBar";
import TopBar from "@/components/layout/TopBar";
import { lastPathFor, rememberPath, tabFor } from "@/lib/tabStacks";

export default function AppShell({ children }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const activeTab = tabFor(pathname);

  useEffect(() => {
    rememberPath(pathname);
  }, [pathname]);

  function selectTab(tab) {
    // Tapping another tab returns to where you left it; tapping the current one goes home.
    const target = tab === activeTab ? tab : lastPathFor(tab);
    if (target === pathname) window.scrollTo({ top: 0, behavior: "smooth" });
    else navigate({ href: target });
  }

  return (
    <div className="min-h-screen text-foreground">
      <TopBar pathname={pathname} />
      {/* Only the page body fades in — the top bar and tab bar stay put. */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 md:pb-10 md:pt-8">
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>
      <MobileTabBar activeTab={activeTab} onSelect={selectTab} />
    </div>
  );
}