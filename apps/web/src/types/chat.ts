export type DirectMessageListItem = {
  conversationId: string;
  displayName: string;
  image: string | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string;
  lastSeenAt: string | null;
  presence: "online" | "offline";
  userId: string;
  username: string;
};

export type FriendRow = {
  customStatus?: string | null;
  displayName: string | null;
  friendshipId: string;
  image: string | null;
  lastSeenAt?: string | null;
  presence?: "online" | "offline";
  userId: string;
  username: string;
};

export type BlockedRow = {
  blockId: string;
  displayName: string | null;
  image: string | null;
  userId: string;
  username: string;
};

export type UserSearchRow = {
  displayName: string | null;
  friendship: "friends" | "incoming" | "none" | "outgoing";
  image: string | null;
  presence: "online" | "offline";
  userId: string;
  username: string;
};

export type ChatMessage = {
  conversationId: string | null;
  createdAt: Date;
  ciphertext: string | null;
  encryptedKey: string | null;
  encryptionAlgorithm: string | null;
  id: string;
  iv: string | null;
  keyAlgorithm: string | null;
  sender: {
    displayName: string;
    id: string;
    image: string | null;
    username: string;
  };
};

export type ConversationDetails = {
  id: string;
  participants: Array<{
    displayName: string;
    image: string | null;
    presence: "online" | "offline";
    publicKey: string | null;
    publicKeyAlgorithm: string | null;
    userId: string;
    username: string;
  }>;
  type: "dm" | "group";
};

export type PresenceUpdateEvent = {
  payload: {
    isOnline: boolean;
    lastSeenAt: string;
    userId: string;
  };
  type: "presence:update";
};

export type SessionReadyEvent = {
  payload: {
    userId: string;
  };
  type: "session:ready";
};

export type MessageNewEvent = {
  payload: ChatMessage;
  type: "message:new";
};

export type ErrorEvent = {
  payload: {
    message: string;
  };
  type: "error";
};

export type RealtimeServerEvent =
  | ErrorEvent
  | MessageNewEvent
  | PresenceUpdateEvent
  | SessionReadyEvent;
