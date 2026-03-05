import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Globe2,
  Hash,
  Home,
  LogOut,
  MessageSquare,
  Volume2,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
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

import { SidebarArea, SidebarNav } from "./sidebar-nav";

const mockServers = [
  { id: "1", name: "General", initials: "G" },
  { id: "2", name: "Design Team", initials: "D" },
  { id: "3", name: "Engineering", initials: "E" },
  { id: "4", name: "Music Lounge", initials: "M" },
];

const mockChannels: Record<
  string,
  { id: string; name: string; type: "text" | "voice" }[]
> = {
  "1": [
    { id: "general", name: "general", type: "text" },
    { id: "intros", name: "introductions", type: "text" },
    { id: "vc-1", name: "Voice Chat", type: "voice" },
  ],
  "2": [
    { id: "reviews", name: "design-reviews", type: "text" },
    { id: "inspo", name: "inspiration", type: "text" },
    { id: "vc-2", name: "Design Room", type: "voice" },
  ],
  "3": [
    { id: "dev", name: "development", type: "text" },
    { id: "ci", name: "ci-cd", type: "text" },
    { id: "vc-3", name: "Standup Room", type: "voice" },
  ],
  "4": [
    { id: "recs", name: "recommendations", type: "text" },
    { id: "share", name: "share-music", type: "text" },
    { id: "vc-4", name: "Listening Party", type: "voice" },
  ],
};

const mockConversations = [
  { id: "1", name: "Alice Johnson", status: "online" as const },
  { id: "2", name: "Bob Smith", status: "idle" as const },
  { id: "3", name: "Charlie Davis", status: "dnd" as const },
  { id: "4", name: "Diana Chen", status: "offline" as const },
];

const statusColors: Record<string, string> = {
  online: "bg-green-500",
  idle: "bg-yellow-500",
  dnd: "bg-red-500",
  offline: "bg-zinc-500",
};

function railCls(active: boolean) {
  return cn(
    "relative flex size-10 items-center justify-center rounded-lg transition-colors duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-card text-foreground"
      : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const { currentArea, serverId } = useMemo(() => {
    if (location.pathname.startsWith("/dms"))
      return { currentArea: "dms" as const, serverId: null };
    const match = location.pathname.match(/^\/servers\/([^/]+)/);
    if (match) return { currentArea: "server" as const, serverId: match[1] };
    return { currentArea: null as null, serverId: null };
  }, [location.pathname]);

  return (
    <SidebarNav
      currentArea={currentArea}
      rail={
        <div className="flex flex-col items-center justify-between">
          <div className="flex flex-col items-center gap-1 p-1.5">
            <Link
              to="/"
              className="mb-1 flex size-10 items-center justify-center text-sm font-bold text-foreground"
            >
              <Globe2 />
            </Link>

            <div className="mb-0.5 h-px w-6 bg-border" />

            <Link to="/" className={railCls(currentArea === null)} title="Home">
              <Home className="size-5" />
            </Link>

            <Link
              to="/dms"
              className={railCls(currentArea === "dms")}
              title="Direct Messages"
            >
              <MessageSquare className="size-5" />
            </Link>

            <div className="my-0.5 h-px w-6 bg-border" />

            {mockServers.map((server) => (
              <Link
                key={server.id}
                to="/servers/$serverId"
                params={{ serverId: server.id }}
                className={railCls(serverId === server.id)}
                title={server.name}
              >
                <span className="text-xs font-semibold">{server.initials}</span>
              </Link>
            ))}
          </div>

          <div className="flex flex-col items-center gap-1 p-1.5 pb-3">
            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer outline-none">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  {session?.user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end">
                <DropdownMenuLabel>
                  {session?.user.name ?? "User"}
                </DropdownMenuLabel>
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
          <SidebarArea visible={currentArea === "dms"} direction="left">
            <div className="mb-2 px-2 py-1">
              <span className="text-sm font-semibold text-foreground">
                Direct Messages
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {mockConversations.map((convo) => (
                <div
                  key={convo.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-75 hover:bg-secondary hover:text-foreground"
                >
                  <div className="relative">
                    <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                      {convo.name[0]}
                    </div>
                    <div
                      className={cn(
                        "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card",
                        statusColors[convo.status],
                      )}
                    />
                  </div>
                  <span className="truncate">{convo.name}</span>
                </div>
              ))}
            </div>
          </SidebarArea>

          {mockServers.map((server) => {
            const channels = mockChannels[server.id] ?? [];
            const textChannels = channels.filter((c) => c.type === "text");
            const voiceChannels = channels.filter((c) => c.type === "voice");

            return (
              <SidebarArea
                key={server.id}
                visible={serverId === server.id}
                direction="left"
              >
                <div className="mb-2 px-2 py-1">
                  <span className="text-sm font-semibold text-foreground">
                    {server.name}
                  </span>
                </div>

                {textChannels.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Text Channels
                    </div>
                    {textChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm text-muted-foreground transition-colors duration-75 hover:bg-secondary hover:text-foreground"
                      >
                        <Hash className="size-4 shrink-0" />
                        <span className="truncate">{channel.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {voiceChannels.length > 0 && (
                  <div className="mt-3 flex flex-col gap-0.5">
                    <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Voice Channels
                    </div>
                    {voiceChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm text-muted-foreground transition-colors duration-75 hover:bg-secondary hover:text-foreground"
                      >
                        <Volume2 className="size-4 shrink-0" />
                        <span className="truncate">{channel.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </SidebarArea>
            );
          })}
        </>
      }
    />
  );
}
