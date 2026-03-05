import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bell,
  Globe2,
  Hash,
  Home,
  LogOut,
  MessageSquare,
  Search,
  Users2,
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
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import {
  channelsByCommunity,
  communities,
  conversations,
  getCommunityById,
  statusColors,
} from "./navigation-data";
import { SidebarNav } from "./sidebar-nav";

function railCls(active: boolean) {
  return cn(
    "relative flex size-11 items-center justify-center rounded-2xl transition-colors duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-foreground text-background shadow-sm"
      : "text-muted-foreground hover:bg-card hover:text-foreground",
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const { currentArea, serverId } = useMemo(() => {
    if (location.pathname.startsWith("/dms")) {
      return { currentArea: "dms" as const, serverId: null };
    }

    const match = location.pathname.match(/^\/servers\/([^/]+)/);
    if (match) {
      return { currentArea: "server" as const, serverId: match[1] };
    }

    return { currentArea: null as null, serverId: null };
  }, [location.pathname]);

  const currentCommunity = getCommunityById(serverId);
  const currentChannels = currentCommunity
    ? channelsByCommunity[currentCommunity.id] ?? []
    : [];
  const textChannels = currentChannels.filter((channel) => channel.type === "text");
  const voiceChannels = currentChannels.filter((channel) => channel.type === "voice");
  const groupedConversations = {
    Pinned: conversations.filter((conversation) => conversation.group === "Pinned"),
    Recent: conversations.filter((conversation) => conversation.group === "Recent"),
    Friends: conversations.filter((conversation) => conversation.group === "Friends"),
  };
  const communityLinkParams = { serverId: currentCommunity?.id ?? communities[0].id };

  return (
    <SidebarNav
      rail={
        <div className="flex h-full flex-col items-center justify-between py-4">
          <div className="flex flex-col items-center gap-2">
            <Link
              to="/"
              className="mb-2 flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-card text-sm font-bold text-foreground"
            >
              <Globe2 />
            </Link>

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

            <Link
              to="/servers/$serverId"
              params={communityLinkParams}
              className={railCls(currentArea === "server")}
              title="Communities"
            >
              <Users2 className="size-5" />
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer outline-none">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
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
        <div className="flex h-full min-w-0 flex-col">
          <div className="border-b border-border/60 px-4 py-4">
            <div className="mb-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {currentArea === "server"
                  ? "Communities"
                  : currentArea === "dms"
                    ? "Messages"
                    : "Workspace"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {currentArea === "server"
                  ? currentCommunity?.name ?? "Communities"
                  : currentArea === "dms"
                    ? "Direct Messages"
                    : "Home"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentArea === "server"
                  ? currentCommunity?.description ?? "Jump between communities and channels"
                  : currentArea === "dms"
                    ? "Friends, groups, and recent conversations"
                    : "Your conversations and spaces in one place"}
              </p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search navigation"
                placeholder={currentArea === "server" ? "Search channels" : "Search conversations"}
                className="rounded-xl border-border/60 bg-background pl-8"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {currentArea === null && (
              <div className="space-y-5">
                <section>
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Jump back in
                  </div>
                  <div className="space-y-1">
                    <Link
                      to="/dms"
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-background text-foreground">
                        <MessageSquare className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">Messages</div>
                        <div className="truncate text-xs text-muted-foreground">
                          Pick up where your last chat left off
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/servers/$serverId"
                      params={{ serverId: communities[0].id }}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-background text-foreground">
                        <Users2 className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">Communities</div>
                        <div className="truncate text-xs text-muted-foreground">
                          Browse your channels and voice rooms
                        </div>
                      </div>
                    </Link>
                  </div>
                </section>

                <section>
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Active now
                  </div>
                  <div className="space-y-1">
                    {conversations.slice(0, 3).map((conversation) => (
                      <Link
                        key={conversation.id}
                        to="/dms"
                        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-accent"
                      >
                        <div className="relative">
                          <div className="flex size-9 items-center justify-center rounded-full bg-background text-sm font-medium text-foreground">
                            {conversation.name[0]}
                          </div>
                          <div
                            className={cn(
                              "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card",
                              statusColors[conversation.status],
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm text-foreground">{conversation.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {conversation.activity}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {currentArea === "dms" && (
              <div className="space-y-5">
                {Object.entries(groupedConversations).map(([group, items]) => (
                  <section key={group}>
                    <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {group}
                    </div>
                    <div className="space-y-1">
                      {items.map((conversation) => (
                        <Link
                          key={conversation.id}
                          to="/dms"
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-accent"
                        >
                          <div className="relative">
                            <div className="flex size-9 items-center justify-center rounded-full bg-background text-sm font-medium text-foreground">
                              {conversation.name[0]}
                            </div>
                            <div
                              className={cn(
                                "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card",
                                statusColors[conversation.status],
                              )}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {conversation.name}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {conversation.activity}
                            </div>
                          </div>
                          {group === "Pinned" && (
                            <Bell className="ml-auto size-3.5 text-muted-foreground" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {currentArea === "server" && currentCommunity && (
              <div className="space-y-5">
                <section>
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Your communities
                  </div>
                  <div className="space-y-1">
                    {communities.map((community) => (
                      <Link
                        key={community.id}
                        to="/servers/$serverId"
                        params={{ serverId: community.id }}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-accent",
                          community.id === currentCommunity.id && "bg-background",
                        )}
                      >
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-background text-xs font-semibold text-foreground">
                          {community.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {community.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {community.online} online
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Text rooms
                  </div>
                  <div className="space-y-1">
                    {textChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Hash className="size-4 shrink-0" />
                        <span className="truncate">{channel.name}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Voice rooms
                  </div>
                  <div className="space-y-1">
                    {voiceChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Volume2 className="size-4 shrink-0" />
                        <span className="truncate">{channel.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
