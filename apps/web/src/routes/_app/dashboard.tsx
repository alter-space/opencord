import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_app/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session } = authClient.useSession();
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Welcome {session?.user.name}</p>
      <p className="mt-1 text-muted-foreground">API: {privateData.data?.message}</p>
    </div>
  );
}
