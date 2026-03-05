import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { MessageSquare, Users2 } from "lucide-react";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { getCommunityById } from "@/components/sidebar/navigation-data";
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
  const currentCommunity = getCommunityById(match?.[1] ?? null);
  const header = location.pathname.startsWith("/dms")
    ? {
        icon: <MessageSquare className="size-4" />,
        eyebrow: "Messages",
        title: "Direct messages",
        description: "Talk one-on-one or keep lightweight group chats moving.",
      }
    : currentCommunity
      ? {
          icon: <Users2 className="size-4" />,
          eyebrow: "Community",
          title: currentCommunity.name,
          description: `${currentCommunity.members} members - ${currentCommunity.online} online`,
        }
      : {
          icon: <Users2 className="size-4" />,
          eyebrow: "Workspace",
          title: "Home",
          description: "A calmer starting point for messages and communities.",
        };

  return (
    <div className="flex h-svh bg-background text-foreground">
      <div className="sticky top-0 h-dvh shrink-0">
        <AppSidebar />
      </div>
      <div className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0,_transparent_45%)]">
        <div className="flex h-full min-w-0 flex-col">
          <header className="border-b border-border/60 bg-background/80 px-8 py-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 items-center justify-center rounded-2xl border border-border/60 bg-card">
                {header.icon}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {header.eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {header.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {header.description}
                </p>
              </div>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
