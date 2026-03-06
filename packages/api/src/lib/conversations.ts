import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@opencord/db";
import {
  conversation,
  conversationMember,
  friendship,
  message,
  messageKeyEnvelope,
} from "@opencord/db/schema/index";

import { getPresenceMap } from "./presence";
import { assertUsersNotBlocked, getProfilesByUserIds } from "./profile";
import { canonicalPairKey, formatPresenceStatus, requireValue } from "./utils";

export async function getOrCreateDmConversation(args: { otherUserId: string; viewerId: string }) {
  const existingFriendship = await db.query.friendship.findFirst({
    where: eq(friendship.pairKey, canonicalPairKey(args.viewerId, args.otherUserId)),
  });

  if (!existingFriendship || existingFriendship.status !== "accepted") {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only chat with friends." });
  }

  const allowed = await assertUsersNotBlocked(args.viewerId, args.otherUserId);

  if (!allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This conversation is unavailable." });
  }

  const dmKey = canonicalPairKey(args.viewerId, args.otherUserId);
  const existingConversation = await db.query.conversation.findFirst({
    where: eq(conversation.dmKey, dmKey),
  });

  if (existingConversation) {
    return existingConversation;
  }

  const [createdConversation] = await db
    .insert(conversation)
    .values({
      type: "dm",
      dmKey,
      ownerId: args.viewerId,
    })
    .returning();

  const safeConversation = requireValue(
    createdConversation,
    "Failed to create direct message conversation.",
  );

  await db.insert(conversationMember).values([
    {
      conversationId: safeConversation.id,
      userId: args.viewerId,
    },
    {
      conversationId: safeConversation.id,
      userId: args.otherUserId,
    },
  ]);

  return safeConversation;
}

export async function assertConversationAccess(args: { conversationId: string; userId: string }) {
  const membership = await db.query.conversationMember.findFirst({
    where: and(
      eq(conversationMember.conversationId, args.conversationId),
      eq(conversationMember.userId, args.userId),
    ),
  });

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Conversation not found." });
  }

  return membership;
}

export async function listDirectMessages(viewerId: string) {
  const memberships = await db
    .select({
      conversationId: conversation.id,
      type: conversation.type,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
      lastReadMessageId: conversationMember.lastReadMessageId,
    })
    .from(conversationMember)
    .innerJoin(conversation, eq(conversation.id, conversationMember.conversationId))
    .where(eq(conversationMember.userId, viewerId))
    .orderBy(desc(conversation.lastMessageAt), desc(conversation.updatedAt));

  if (memberships.length === 0) {
    return [];
  }

  const conversationIds = memberships.map((row) => row.conversationId);
  const members = await db
    .select()
    .from(conversationMember)
    .where(inArray(conversationMember.conversationId, conversationIds));

  const participantIds = members
    .filter((member) => member.userId !== viewerId)
    .map((member) => member.userId);
  const profiles = await getProfilesByUserIds(participantIds);
  const presenceMap = await getPresenceMap(participantIds);
  const latestMessages = await db
    .select({
      conversationId: message.conversationId,
      ciphertext: message.ciphertext,
      createdAt: message.createdAt,
      senderId: message.senderId,
    })
    .from(message)
    .where(inArray(message.conversationId, conversationIds))
    .orderBy(desc(message.createdAt));

  const latestMessageMap = new Map<string, (typeof latestMessages)[number]>();

  for (const latestMessage of latestMessages) {
    if (latestMessage.conversationId && !latestMessageMap.has(latestMessage.conversationId)) {
      latestMessageMap.set(latestMessage.conversationId, latestMessage);
    }
  }

  const memberMap = new Map<string, string>();

  for (const member of members) {
    if (member.userId !== viewerId) {
      memberMap.set(member.conversationId, member.userId);
    }
  }

  return memberships
    .map((row) => {
      const otherUserId = memberMap.get(row.conversationId);

      if (!otherUserId) {
        return null;
      }

      const profile = profiles.get(otherUserId);

      if (!profile) {
        return null;
      }

      const presence = presenceMap.get(otherUserId);
      const latestMessage = latestMessageMap.get(row.conversationId);

      return {
        conversationId: row.conversationId,
        userId: otherUserId,
        username: profile.username,
        displayName: profile.displayName || profile.name,
        image: profile.image,
        presence: formatPresenceStatus(Boolean(presence?.isOnline)),
        lastSeenAt: presence?.lastSeenAt ?? profile.lastSeenAt,
        lastMessageAt: latestMessage?.createdAt ?? row.lastMessageAt,
        lastMessagePreview: latestMessage ? "Encrypted message" : "Start a conversation",
      };
    })
    .filter(Boolean);
}

export async function getConversationDetails(args: { conversationId: string; viewerId: string }) {
  await assertConversationAccess({
    conversationId: args.conversationId,
    userId: args.viewerId,
  });

  const existingConversation = await db.query.conversation.findFirst({
    where: eq(conversation.id, args.conversationId),
  });

  if (!existingConversation) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found." });
  }

  const members = await db.query.conversationMember.findMany({
    where: eq(conversationMember.conversationId, args.conversationId),
  });

  const participantIds = members.map((member) => member.userId);
  const profiles = await getProfilesByUserIds(participantIds);
  const presenceMap = await getPresenceMap(
    participantIds.filter((userId) => userId !== args.viewerId),
  );

  return {
    id: existingConversation.id,
    type: existingConversation.type,
    participants: members.map((member) => {
      const profile = profiles.get(member.userId);

      return {
        userId: member.userId,
        username: profile?.username ?? "unknown",
        displayName: profile?.displayName || profile?.name || "Unknown",
        image: profile?.image ?? null,
        publicKey: profile?.publicKey ?? null,
        publicKeyAlgorithm: profile?.publicKeyAlgorithm ?? null,
        presence:
          member.userId === args.viewerId
            ? "online"
            : formatPresenceStatus(Boolean(presenceMap.get(member.userId)?.isOnline)),
      };
    }),
  };
}

export async function listConversationMessages(args: {
  conversationId: string;
  limit: number;
  viewerId: string;
}) {
  await assertConversationAccess({
    conversationId: args.conversationId,
    userId: args.viewerId,
  });

  const rows = await db.query.message.findMany({
    where: and(eq(message.conversationId, args.conversationId), isNull(message.deletedAt)),
    orderBy: [desc(message.createdAt)],
    limit: args.limit,
  });

  const orderedRows = [...rows].reverse();
  const senderProfiles = await getProfilesByUserIds(orderedRows.map((row) => row.senderId));
  const envelopes = orderedRows.length
    ? await db
        .select()
        .from(messageKeyEnvelope)
        .where(
          and(
            inArray(
              messageKeyEnvelope.messageId,
              orderedRows.map((row) => row.id),
            ),
            eq(messageKeyEnvelope.userId, args.viewerId),
          ),
        )
    : [];

  const envelopeMap = new Map(envelopes.map((envelope) => [envelope.messageId, envelope]));

  return orderedRows.map((row) => {
    const senderProfile = senderProfiles.get(row.senderId);
    const envelope = envelopeMap.get(row.id);

    return {
      id: row.id,
      conversationId: row.conversationId,
      ciphertext: row.ciphertext,
      iv: row.iv,
      encryptionAlgorithm: row.encryptionAlgorithm,
      encryptedKey: envelope?.encryptedKey ?? null,
      keyAlgorithm: envelope?.algorithm ?? null,
      createdAt: row.createdAt,
      sender: {
        id: row.senderId,
        username: senderProfile?.username ?? "unknown",
        displayName: senderProfile?.displayName || senderProfile?.name || "Unknown",
        image: senderProfile?.image ?? null,
      },
    };
  });
}

export async function markConversationRead(args: {
  conversationId: string;
  messageId: string;
  viewerId: string;
}) {
  await assertConversationAccess({
    conversationId: args.conversationId,
    userId: args.viewerId,
  });

  await db
    .update(conversationMember)
    .set({
      lastReadAt: new Date(),
      lastReadMessageId: args.messageId,
    })
    .where(
      and(
        eq(conversationMember.conversationId, args.conversationId),
        eq(conversationMember.userId, args.viewerId),
      ),
    );

  return { success: true };
}

export async function createConversationMessage(args: {
  conversationId: string;
  ciphertext: string;
  encryptionAlgorithm: string;
  envelopes: Array<{ algorithm: string; encryptedKey: string; userId: string }>;
  iv: string;
  senderId: string;
}) {
  await assertConversationAccess({
    conversationId: args.conversationId,
    userId: args.senderId,
  });

  const members = await db.query.conversationMember.findMany({
    where: eq(conversationMember.conversationId, args.conversationId),
  });
  const memberIds = members.map((member) => member.userId).sort();
  const envelopeIds = args.envelopes.map((envelope) => envelope.userId).sort();

  if (memberIds.join(":") !== envelopeIds.join(":")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing encrypted message keys for one or more participants.",
    });
  }

  const [createdMessage] = await db
    .insert(message)
    .values({
      senderId: args.senderId,
      conversationId: args.conversationId,
      ciphertext: args.ciphertext,
      iv: args.iv,
      encryptionAlgorithm: args.encryptionAlgorithm,
    })
    .returning();

  const safeMessage = requireValue(createdMessage, "Failed to create conversation message.");

  await db.insert(messageKeyEnvelope).values(
    args.envelopes.map((envelope) => ({
      messageId: safeMessage.id,
      userId: envelope.userId,
      encryptedKey: envelope.encryptedKey,
      algorithm: envelope.algorithm,
    })),
  );

  await db
    .update(conversation)
    .set({
      lastMessageId: safeMessage.id,
      lastMessageAt: safeMessage.createdAt,
    })
    .where(eq(conversation.id, args.conversationId));

  await db
    .update(conversationMember)
    .set({
      lastReadAt: safeMessage.createdAt,
      lastReadMessageId: safeMessage.id,
    })
    .where(
      and(
        eq(conversationMember.conversationId, args.conversationId),
        eq(conversationMember.userId, args.senderId),
      ),
    );

  const senderProfiles = await getProfilesByUserIds([args.senderId]);
  const senderProfile = senderProfiles.get(args.senderId);

  return {
    id: safeMessage.id,
    conversationId: args.conversationId,
    ciphertext: safeMessage.ciphertext,
    iv: safeMessage.iv,
    encryptionAlgorithm: safeMessage.encryptionAlgorithm,
    createdAt: safeMessage.createdAt,
    sender: {
      id: args.senderId,
      username: senderProfile?.username ?? "unknown",
      displayName: senderProfile?.displayName || senderProfile?.name || "Unknown",
      image: senderProfile?.image ?? null,
    },
    envelopes: args.envelopes,
  };
}
