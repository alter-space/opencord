import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { trpcServer } from "@hono/trpc-server";
import { createConversationMessage, getConversationDetails } from "@opencord/api/lib/conversations";
import { listAcceptedFriendIds } from "@opencord/api/lib/friends";
import { setUserPresenceOffline, touchUserPresence } from "@opencord/api/lib/presence";
import { ensureUserProfile, updateUserLastSeen } from "@opencord/api/lib/profile";
import { createContext } from "@opencord/api/context";
import { appRouter } from "@opencord/api/routers/index";
import { consumeWebSocketTicket } from "@opencord/api/routers/ws";
import { auth } from "@opencord/auth";
import { env } from "@opencord/env/server";
import { streamText, convertToModelMessages, wrapLanguageModel } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { WSContext } from "hono/ws";

type ClientEvent =
  | {
      type: "presence:heartbeat";
    }
  | {
      type: "message:send";
      payload: {
        conversationId: string;
        ciphertext: string;
        encryptionAlgorithm: string;
        envelopes: Array<{
          algorithm: string;
          encryptedKey: string;
          userId: string;
        }>;
        iv: string;
      };
    };

type ServerEvent =
  | {
      type: "session:ready";
      payload: {
        userId: string;
      };
    }
  | {
      type: "presence:update";
      payload: {
        isOnline: boolean;
        lastSeenAt: string;
        userId: string;
      };
    }
  | {
      type: "message:new";
      payload: Omit<Awaited<ReturnType<typeof createConversationMessage>>, "envelopes"> & {
        encryptedKey: string | null;
        keyAlgorithm: string | null;
      };
    }
  | {
      type: "error";
      payload: {
        message: string;
      };
    };

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
const socketsByUserId = new Map<string, Set<WSContext>>();

function sendServerEvent(socket: WSContext, event: ServerEvent) {
  socket.send(JSON.stringify(event));
}

function broadcastToUser(userId: string, event: ServerEvent) {
  const sockets = socketsByUserId.get(userId);

  if (!sockets) {
    return;
  }

  for (const socket of sockets) {
    sendServerEvent(socket, event);
  }
}

function addSocketForUser(userId: string, socket: WSContext) {
  const sockets = socketsByUserId.get(userId) ?? new Set<WSContext>();
  sockets.add(socket);
  socketsByUserId.set(userId, sockets);
}

async function removeSocketForUser(userId: string, socket: WSContext) {
  const sockets = socketsByUserId.get(userId);

  if (!sockets) {
    return;
  }

  sockets.delete(socket);

  if (sockets.size > 0) {
    return;
  }

  socketsByUserId.delete(userId);

  const offlineRecord = await setUserPresenceOffline(userId);
  await updateUserLastSeen(userId);
  const friendIds = await listAcceptedFriendIds(userId);

  for (const recipientId of [userId, ...friendIds]) {
    broadcastToUser(recipientId, {
      type: "presence:update",
      payload: {
        userId,
        isOnline: false,
        lastSeenAt: offlineRecord.lastSeenAt,
      },
    });
  }
}

async function handleIncomingEvent(userId: string, socket: WSContext, event: ClientEvent) {
  if (event.type === "presence:heartbeat") {
    await touchUserPresence(userId);

    sendServerEvent(socket, {
      type: "presence:update",
      payload: {
        userId,
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
      },
    });

    return;
  }

  if (event.type === "message:send") {
    const createdMessage = await createConversationMessage({
      senderId: userId,
      conversationId: event.payload.conversationId,
      ciphertext: event.payload.ciphertext,
      encryptionAlgorithm: event.payload.encryptionAlgorithm,
      envelopes: event.payload.envelopes,
      iv: event.payload.iv,
    });
    const conversationDetails = await getConversationDetails({
      conversationId: event.payload.conversationId,
      viewerId: userId,
    });

    for (const participant of conversationDetails.participants) {
      const matchingEnvelope = createdMessage.envelopes.find(
        (envelope) => envelope.userId === participant.userId,
      );

      broadcastToUser(participant.userId, {
        type: "message:new",
        payload: {
          id: createdMessage.id,
          conversationId: createdMessage.conversationId,
          ciphertext: createdMessage.ciphertext,
          iv: createdMessage.iv,
          encryptionAlgorithm: createdMessage.encryptionAlgorithm,
          createdAt: createdMessage.createdAt,
          sender: createdMessage.sender,
          encryptedKey: matchingEnvelope?.encryptedKey ?? null,
          keyAlgorithm: matchingEnvelope?.algorithm ?? null,
        },
      });
    }
  }
}

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get(
  "/ws",
  upgradeWebSocket(async (c) => {
    const ticket = c.req.query("ticket");

    if (!ticket) {
      throw new Error("Missing websocket ticket.");
    }

    const userId = await consumeWebSocketTicket(ticket);

    if (!userId) {
      throw new Error("Invalid websocket ticket.");
    }

    await ensureUserProfile({ id: userId });

    return {
      onOpen: async (_event, socket) => {
        addSocketForUser(userId, socket);
        await touchUserPresence(userId);
        const friendIds = await listAcceptedFriendIds(userId);

        sendServerEvent(socket, {
          type: "session:ready",
          payload: { userId },
        });

        for (const recipientId of [userId, ...friendIds]) {
          broadcastToUser(recipientId, {
            type: "presence:update",
            payload: {
              userId,
              isOnline: true,
              lastSeenAt: new Date().toISOString(),
            },
          });
        }
      },
      onClose: async (_event, socket) => {
        await removeSocketForUser(userId, socket);
      },
      onMessage: async (messageEvent, socket) => {
        try {
          const event = JSON.parse(String(messageEvent.data)) as ClientEvent;
          await handleIncomingEvent(userId, socket, event);
        } catch (error) {
          sendServerEvent(socket, {
            type: "error",
            payload: {
              message: error instanceof Error ? error.message : "Invalid realtime event.",
            },
          });
        }
      },
    };
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.post("/ai", async (c) => {
  const body = await c.req.json();
  const uiMessages = body.messages || [];
  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
    middleware: devToolsMiddleware(),
  });
  const result = streamText({
    model,
    messages: await convertToModelMessages(uiMessages),
  });

  return result.toUIMessageStreamResponse();
});

app.get("/", (c) => {
  return c.text("OK");
});

const server = serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

injectWebSocket(server);
