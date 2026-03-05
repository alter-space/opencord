import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
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
  return (
    <div className="grid h-svh grid-cols-[min-content_minmax(0,1fr)] bg-background">
      <div className="sticky top-0 h-dvh">
        <AppSidebar />
      </div>
      <div className="h-screen py-1.5 pr-1.5">
        <div className="relative h-full overflow-y-auto rounded-lg bg-card">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
