import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { chatKeyAlgorithm, ensureLocalEncryptionKeys } from "@/lib/chat-crypto";
import { createRealtimeClient } from "@/lib/chat-realtime";
import type { RealtimeServerEvent } from "@/types/chat";
import { trpc, trpcClient } from "@/utils/trpc";

export function useChatBootstrap() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const meQuery = useQuery({
    ...trpc.profile.me.queryOptions(),
    enabled: Boolean(session?.user.id),
    staleTime: 60_000,
  });
  const realtimeClientRef = useRef<ReturnType<typeof createRealtimeClient> | null>(null);
  const initializedUserIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const userId = session?.user.id;

    if (!userId) {
      realtimeClientRef.current?.disconnect();
      realtimeClientRef.current = null;
      initializedUserIdRef.current = null;
      setIsReady(false);
      return;
    }

    if (initializedUserIdRef.current === userId && realtimeClientRef.current) {
      return;
    }

    let cancelled = false;
    initializedUserIdRef.current = userId;
    setIsReady(false);

    const realtimeClient = createRealtimeClient({
      getTicket: async () => {
        const ticketResult = await trpcClient.ws.getTicket.mutate();
        return ticketResult.ticket;
      },
      onEvent: (event: RealtimeServerEvent) => {
        if (event.type === "error") {
          toast.error(event.payload.message);
          return;
        }

        if (event.type === "message:new") {
          void queryClient.invalidateQueries(trpc.messages.list.queryFilter());
          void queryClient.invalidateQueries(trpc.conversations.list.queryFilter());
          return;
        }

        if (event.type === "presence:update") {
          void queryClient.invalidateQueries(trpc.conversations.list.queryFilter());
          void queryClient.invalidateQueries(trpc.friends.dashboard.queryFilter());
        }
      },
    });

    realtimeClientRef.current = realtimeClient;

    const start = async () => {
      try {
        const keys = await ensureLocalEncryptionKeys(userId);
        await trpcClient.profile.bootstrap.mutate({
          publicKey: keys.serializedPublicKey,
          publicKeyAlgorithm: chatKeyAlgorithm,
        });
        await queryClient.ensureQueryData(trpc.profile.me.queryOptions());
        await realtimeClient.connect();

        if (cancelled) {
          return;
        }

        realtimeClient.send({ type: "presence:heartbeat" });
        setIsReady(true);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to connect realtime chat.");
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      realtimeClient.disconnect();
      if (realtimeClientRef.current === realtimeClient) {
        realtimeClientRef.current = null;
      }
    };
  }, [queryClient, session?.user.id]);

  useEffect(() => {
    if (!isReady || !realtimeClientRef.current) {
      return;
    }

    const heartbeatTimer = window.setInterval(() => {
      realtimeClientRef.current?.send({ type: "presence:heartbeat" });
    }, 25000);

    return () => {
      window.clearInterval(heartbeatTimer);
    };
  }, [isReady]);

  return {
    isReady,
    profile: meQuery.data,
    realtimeClient: realtimeClientRef.current,
  };
}
