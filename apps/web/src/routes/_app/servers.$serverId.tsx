import { createFileRoute } from "@tanstack/react-router";
import { Hash } from "lucide-react";

export const Route = createFileRoute("/_app/servers/$serverId")({
  component: ServerPage,
});

function ServerPage() {
  return (
    <div className="flex h-full items-center justify-center rounded-[1.75rem] border border-border/60 bg-card/20">
      <div className="text-center">
        <Hash className="mx-auto mb-3 size-9 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Select a room</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a text or voice room from the left.
        </p>
      </div>
    </div>
  );
}
