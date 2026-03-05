import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_app/dms")({
  component: DmsPage,
});

function DmsPage() {
  return (
    <div className="flex h-full items-center justify-center rounded-[2rem] border border-dashed border-border/60 bg-card/20">
      <div className="text-center">
        <MessageSquare className="mx-auto mb-3 size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Choose a conversation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pinned chats, recent messages, and friends live in the left panel.
        </p>
      </div>
    </div>
  );
}
