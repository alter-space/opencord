import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Globe2, Hash, LogOut, Volume2 } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { Facehash } from "facehash";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { channelsByServer, getServerById, servers } from "./navigation-data";
import { SidebarArea, SidebarNav } from "./sidebar-nav";

function railCls(active: boolean) {
  return cn(
    "relative flex size-11 items-center justify-center rounded-[40%] transition-all duration-200",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-foreground text-background shadow-sm"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );
}

function serverCls(active: boolean) {
  return cn(
    "flex size-11 items-center justify-center rounded-[40%] border text-xs font-semibold transition-all duration-200",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "border-transparent bg-foreground text-background shadow-sm"
      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
  );
}

function HomePanel() {
  const location = useLocation();
  const conversationsQuery = useQuery(trpc.conversations.list.queryOptions());

  return (
    <div className="flex h-full min-w-0 flex-col border-l border-border bg-card/30">
      <div className="border-b border-border px-4 py-4">
        <div className="text-sm font-semibold text-foreground">Home</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            location.pathname === "/"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          <Globe2 className="size-4" />
          <span>Friends</span>
        </Link>

        <div className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Direct Messages
        </div>

        <div className="space-y-[2px]">
          {conversationsQuery.isLoading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
          ) : (
            (conversationsQuery.data ?? []).map((conversation) => (
              <Link
                key={conversation?.conversationId}
                to="/"
                search={{ conversationId: conversation?.conversationId } as never}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
                  location.search?.conversationId === conversation?.conversationId
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Facehash
                    name={conversation?.username ?? "user"}
                    size={28}
                    className="rounded-[40%]"
                  />
                  {conversation?.presence === "online" && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1 truncate text-sm">
                  {conversation?.displayName || conversation?.username}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ServerPanel({ serverId }: { serverId: string }) {
  const server = getServerById(serverId) ?? servers[0];
  const channels = channelsByServer[server.id] ?? [];
  const textChannels = channels.filter((channel) => channel.type === "text");
  const voiceChannels = channels.filter((channel) => channel.type === "voice");

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="truncate text-sm font-semibold text-foreground">{server.name}</div>
          <div className="shrink-0 text-[11px] text-muted-foreground">{server.online} online</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-5">
          <section>
            <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Text rooms
            </div>
            <div className="space-y-1">
              {textChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Hash className="size-4 shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Voice rooms
            </div>
            <div className="space-y-1">
              {voiceChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Volume2 className="size-4 shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const { currentArea, serverId } = useMemo(() => {
    const match = location.pathname.match(/^\/servers\/([^/]+)/);
    if (match) {
      return { currentArea: "server" as const, serverId: match[1] };
    }

    return { currentArea: "home" as const, serverId: null };
  }, [location.pathname]);

  const activeServer = getServerById(serverId) ?? servers[0];

  return (
    <SidebarNav
      currentArea={currentArea}
      rail={
        <div className="flex h-full flex-col items-center justify-between">
          <div className="flex flex-col items-center gap-2 p-2">
            <Link
              to="/"
              className={cn(
                "mb-1 flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-sm font-bold text-foreground",
                railCls(currentArea === "home"),
              )}
            >
              <Globe2 className="size-5" />
            </Link>

            <div className="my-1 h-px w-7 bg-border" />

            <div className="flex max-h-[calc(100dvh-15rem)] flex-col items-center gap-2 overflow-y-auto px-0.5 pb-1">
              {servers.map((server) => (
                <Link
                  key={server.id}
                  to="/servers/$serverId"
                  params={{ serverId: server.id }}
                  className={serverCls(server.id === activeServer.id && currentArea === "server")}
                  title={server.name}
                >
                  {server.initials}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                  {session?.user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end">
                <DropdownMenuLabel>{session?.user.name ?? "User"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => navigate({ to: "/login" }),
                      },
                    });
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      }
      panel={
        <>
          <SidebarArea visible={currentArea === "home"} direction="left">
            <HomePanel />
          </SidebarArea>

          {servers.map((server) => (
            <SidebarArea
              key={server.id}
              visible={currentArea === "server" && activeServer.id === server.id}
              direction="left"
              motion="inset"
              blur
            >
              <div className="flex h-full min-w-0 flex-col border-l border-border">
                <ServerPanel serverId={server.id} />
              </div>
            </SidebarArea>
          ))}
        </>
      }
    />
  );
}
