import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_app/dms")({
  component: DmsPage,
});

function DmsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <MessageSquare className="mx-auto mb-3 size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Direct Messages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a conversation from the sidebar
        </p>
      </div>
    </div>
  );
}
