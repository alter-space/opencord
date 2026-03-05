import { createFileRoute } from "@tanstack/react-router";
import { Hash } from "lucide-react";

export const Route = createFileRoute("/_app/servers/$serverId")({
  component: ServerPage,
});

function ServerPage() {
  const { serverId } = Route.useParams();

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Hash className="mx-auto mb-3 size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Server {serverId}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a channel from the sidebar
        </p>
      </div>
    </div>
  );
}
