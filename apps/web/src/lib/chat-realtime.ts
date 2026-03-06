import { env } from "@opencord/env/web";

import type { RealtimeServerEvent } from "@/types/chat";

type RealtimeClient = {
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (event: unknown) => void;
};

export function createRealtimeClient(args: {
  getTicket: () => Promise<string>;
  onEvent: (event: RealtimeServerEvent) => void;
}) {
  let socket: WebSocket | null = null;
  let connectPromise: Promise<void> | null = null;

  const connect = async () => {
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    if (connectPromise) {
      return connectPromise;
    }

    connectPromise = (async () => {
      const ticket = await args.getTicket();
      const wsUrl = new URL(env.VITE_SERVER_URL);
      wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
      wsUrl.pathname = "/ws";
      wsUrl.searchParams.set("ticket", ticket);

      socket = new WebSocket(wsUrl.toString());

      await new Promise<void>((resolve, reject) => {
        if (!socket) {
          reject(new Error("Failed to create realtime socket."));
          return;
        }

        socket.onopen = () => resolve();
        socket.onerror = () => reject(new Error("Failed to connect realtime socket."));
        socket.onclose = () => {
          socket = null;
          connectPromise = null;
        };
        socket.onmessage = (messageEvent) => {
          const event = JSON.parse(String(messageEvent.data)) as RealtimeServerEvent;
          args.onEvent(event);
        };
      });
    })();

    try {
      await connectPromise;
    } finally {
      if (socket?.readyState !== WebSocket.OPEN) {
        connectPromise = null;
      }
    }
  };

  const disconnect = () => {
    socket?.close();
    socket = null;
    connectPromise = null;
  };

  const send = (event: unknown) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(event));
  };

  return {
    connect,
    disconnect,
    send,
  } satisfies RealtimeClient;
}
