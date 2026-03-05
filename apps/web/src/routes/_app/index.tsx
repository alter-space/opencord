import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";
import {
  communities as mockServers,
  conversations as mockFriends,
  statusColors,
} from "@/components/sidebar/navigation-data";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { data: session } = authClient.useSession();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {session?.user.name}
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s moving right now.</p>
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
