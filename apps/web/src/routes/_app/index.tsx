import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: HomeComponent,
});

const mockServers = [
  { id: "1", name: "General", initials: "GN", members: 128, online: 42 },
  { id: "2", name: "Design Team", initials: "DT", members: 24, online: 8 },
  { id: "3", name: "Engineering", initials: "EN", members: 56, online: 19 },
  { id: "4", name: "Music Lounge", initials: "ML", members: 312, online: 87 },
];

const mockFriends = [
  { id: "1", name: "Alice Johnson", status: "online" as const, activity: "Playing Minecraft" },
  { id: "2", name: "Bob Smith", status: "idle" as const, activity: "Listening to Spotify" },
  { id: "3", name: "Charlie Davis", status: "dnd" as const, activity: "In a meeting" },
  { id: "4", name: "Diana Chen", status: "online" as const, activity: null },
];

const statusColors: Record<string, string> = {
  online: "bg-green-500",
  idle: "bg-yellow-500",
  dnd: "bg-red-500",
  offline: "bg-gray-500",
};

function HomeComponent() {
  const { data: session } = authClient.useSession();

  return (
    <div className="container mx-auto max-w-4xl space-y-8 overflow-y-auto px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {session?.user.name}
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your Servers
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mockServers.map((server) => (
            <Card key={server.id} className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                  {server.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{server.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {server.members} members &middot; {server.online} online
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Friends
        </h2>
        <Card>
          <CardContent className="divide-y divide-border py-1">
            {mockFriends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 py-3">
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {friend.name[0]}
                  </div>
                  <div
                    className={cn(
                      "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-card",
                      statusColors[friend.status],
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{friend.name}</p>
                  {friend.activity && (
                    <p className="truncate text-xs text-muted-foreground">{friend.activity}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
