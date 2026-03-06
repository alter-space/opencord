import { createFileRoute } from "@tanstack/react-router";

import { ChatShell } from "@/components/chat/chat-shell";

export const Route = createFileRoute("/_app/")({
  component: HomeComponent,
});

function HomeComponent() {
  return <ChatShell />;
}
