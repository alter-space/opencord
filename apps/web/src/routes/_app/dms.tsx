import { createFileRoute } from "@tanstack/react-router";

import { ChatShell } from "@/components/chat/chat-shell";

export const Route = createFileRoute("/_app/dms")({
  validateSearch: (search) => {
    return {
      conversationId: typeof search.conversationId === "string" ? search.conversationId : undefined,
    };
  },
  component: DmsRouteComponent,
});

function DmsRouteComponent() {
  return <ChatShell />;
}
