import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { getServerById } from "@/components/sidebar/navigation-data";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

function AppLayout() {
  const location = useLocation();
  const match = location.pathname.match(/^\/servers\/([^/]+)/);
  const activeServer = getServerById(match?.[1] ?? null);

  return (
    <div className="flex h-svh bg-background text-foreground">
      <div className="sticky top-0 h-dvh shrink-0">
        <AppSidebar />
      </div>
      <div className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0,_transparent_44%)]">
        <div className="flex h-full min-w-0 flex-col">
          {location.pathname.startsWith("/servers") && activeServer ? (
            <header className="flex h-14 items-center border-b border-border bg-background/80 px-6 backdrop-blur">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {activeServer.name}
              </h1>
            </header>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-6 md:py-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
