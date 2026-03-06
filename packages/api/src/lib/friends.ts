import { TRPCError } from "@trpc/server";
import { and, eq, ilike, inArray, or } from "drizzle-orm";

import { db } from "@opencord/db";
import { friendship, user, userBlock, userProfile } from "@opencord/db/schema/index";

import { getPresenceMap } from "./presence";
import {
  assertUsersNotBlocked,
  ensureUserProfile,
  getBlockedUserIds,
  getProfilesByUserIds,
} from "./profile";
import { canonicalPairKey, formatPresenceStatus } from "./utils";

export async function getFriendshipByPair(userId: string, otherUserId: string) {
  return db.query.friendship.findFirst({
    where: eq(friendship.pairKey, canonicalPairKey(userId, otherUserId)),
  });
}

export async function listAcceptedFriendIds(viewerId: string) {
  const acceptedRows = await db
    .select({
      addresseeId: friendship.addresseeId,
      requesterId: friendship.requesterId,
    })
    .from(friendship)
    .where(
      and(
        eq(friendship.status, "accepted"),
        or(eq(friendship.requesterId, viewerId), eq(friendship.addresseeId, viewerId)),
      ),
    );

  return acceptedRows.map((row) =>
    row.requesterId === viewerId ? row.addresseeId : row.requesterId,
  );
}

export async function getFriendsDashboard(args: {
  query: string;
  viewerId: string;
  presenceFilter: "all" | "online" | "offline";
}) {
  const friendships = await db
    .select()
    .from(friendship)
    .where(
      or(eq(friendship.requesterId, args.viewerId), eq(friendship.addresseeId, args.viewerId)),
    );

  const blockedRows = await db
    .select()
    .from(userBlock)
    .where(eq(userBlock.blockerId, args.viewerId));

  const otherUserIds = new Set<string>();

  for (const row of friendships) {
    otherUserIds.add(row.requesterId === args.viewerId ? row.addresseeId : row.requesterId);
  }

  for (const row of blockedRows) {
    otherUserIds.add(row.blockedId);
  }

  const profiles = await getProfilesByUserIds([...otherUserIds]);
  const presenceMap = await getPresenceMap([...otherUserIds]);
  const normalizedQuery = args.query.trim().toLowerCase();

  const matchesQuery = (profile: {
    displayName: string | null;
    name: string | null;
    username: string | null;
  }) => {
    if (!normalizedQuery) {
      return true;
    }

    return [profile.displayName, profile.name, profile.username]
      .filter(Boolean)
      .some((value) => typeof value === "string" && value.toLowerCase().includes(normalizedQuery));
  };

  const accepted = friendships
    .filter((row) => row.status === "accepted")
    .map((row) => {
      const otherUserId = row.requesterId === args.viewerId ? row.addresseeId : row.requesterId;
      const profile = profiles.get(otherUserId);
      const presence = presenceMap.get(otherUserId);

      if (!profile || !matchesQuery(profile)) {
        return null;
      }

      const presenceStatus = formatPresenceStatus(Boolean(presence?.isOnline));

      if (args.presenceFilter !== "all" && args.presenceFilter !== presenceStatus) {
        return null;
      }

      return {
        friendshipId: row.id,
        userId: otherUserId,
        username: profile.username,
        displayName: profile.displayName || profile.name,
        image: profile.image,
        customStatus: profile.customStatus,
        presence: presenceStatus,
        lastSeenAt: presence?.lastSeenAt ?? profile.lastSeenAt,
      };
    })
    .filter(Boolean);

  const incoming = friendships
    .filter((row) => row.status === "pending" && row.addresseeId === args.viewerId)
    .map((row) => {
      const profile = profiles.get(row.requesterId);

      if (!profile || !matchesQuery(profile)) {
        return null;
      }

      return {
        friendshipId: row.id,
        userId: row.requesterId,
        username: profile.username,
        displayName: profile.displayName || profile.name,
        image: profile.image,
      };
    })
    .filter(Boolean);

  const outgoing = friendships
    .filter((row) => row.status === "pending" && row.requesterId === args.viewerId)
    .map((row) => {
      const profile = profiles.get(row.addresseeId);

      if (!profile || !matchesQuery(profile)) {
        return null;
      }

      return {
        friendshipId: row.id,
        userId: row.addresseeId,
        username: profile.username,
        displayName: profile.displayName || profile.name,
        image: profile.image,
      };
    })
    .filter(Boolean);

  const blocked = blockedRows
    .map((row) => {
      const profile = profiles.get(row.blockedId);

      if (!profile || !matchesQuery(profile)) {
        return null;
      }

      return {
        blockId: row.id,
        userId: row.blockedId,
        username: profile.username,
        displayName: profile.displayName || profile.name,
        image: profile.image,
      };
    })
    .filter(Boolean);

  return {
    accepted,
    incoming,
    outgoing,
    blocked,
  };
}

export async function searchUsers(args: { query: string; viewerId: string }) {
  const trimmedQuery = args.query.trim();
  if (trimmedQuery.length < 2) {
    return [];
  }

  const { blocked, blockedBy } = await getBlockedUserIds(args.viewerId);
  const excludedIds = new Set([args.viewerId, ...blocked, ...blockedBy]);
  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      image: user.image,
      username: userProfile.username,
      displayName: userProfile.displayName,
    })
    .from(user)
    .innerJoin(userProfile, eq(userProfile.userId, user.id))
    .where(
      or(
        ilike(user.name, `%${trimmedQuery}%`),
        ilike(userProfile.username, `%${trimmedQuery}%`),
        ilike(userProfile.displayName, `%${trimmedQuery}%`),
      ),
    )
    .limit(12);

  const userIds = rows.map((row) => row.userId).filter((userId) => !excludedIds.has(userId));

  const pairKeys = userIds.map((userId) => canonicalPairKey(args.viewerId, userId));
  const friendships = pairKeys.length
    ? await db.select().from(friendship).where(inArray(friendship.pairKey, pairKeys))
    : [];
  const friendshipMap = new Map(friendships.map((row) => [row.pairKey, row]));
  const presenceMap = await getPresenceMap(userIds);

  return rows
    .filter((row) => !excludedIds.has(row.userId))
    .map((row) => {
      const relation = friendshipMap.get(canonicalPairKey(args.viewerId, row.userId));
      const presence = presenceMap.get(row.userId);

      return {
        userId: row.userId,
        username: row.username,
        displayName: row.displayName || row.name,
        image: row.image,
        friendship:
          relation?.status === "accepted"
            ? "friends"
            : relation?.status === "pending"
              ? relation.requesterId === args.viewerId
                ? "outgoing"
                : "incoming"
              : "none",
        presence: formatPresenceStatus(Boolean(presence?.isOnline)),
      };
    });
}

export async function sendFriendRequest(args: {
  targetUserId: string;
  viewer: { email?: string | null; id: string; name?: string | null };
}) {
  if (args.targetUserId === args.viewer.id) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot add yourself." });
  }

  await ensureUserProfile(args.viewer);

  const target = await db.query.user.findFirst({
    where: eq(user.id, args.targetUserId),
  });

  if (!target) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
  }

  const allowed = await assertUsersNotBlocked(args.viewer.id, args.targetUserId);

  if (!allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You cannot add this user." });
  }

  const existing = await getFriendshipByPair(args.viewer.id, args.targetUserId);

  if (existing?.status === "accepted") {
    throw new TRPCError({ code: "CONFLICT", message: "You are already friends." });
  }

  if (existing?.status === "pending") {
    if (existing.addresseeId === args.viewer.id) {
      const [acceptedFriendship] = await db
        .update(friendship)
        .set({ status: "accepted" })
        .where(eq(friendship.id, existing.id))
        .returning();

      return acceptedFriendship;
    }

    return existing;
  }

  const [createdFriendship] = await db
    .insert(friendship)
    .values({
      requesterId: args.viewer.id,
      addresseeId: args.targetUserId,
      pairKey: canonicalPairKey(args.viewer.id, args.targetUserId),
      status: "pending",
    })
    .returning();

  return createdFriendship;
}

export async function acceptFriendRequest(args: { friendshipId: string; viewerId: string }) {
  const request = await db.query.friendship.findFirst({
    where: eq(friendship.id, args.friendshipId),
  });

  if (!request || request.addresseeId !== args.viewerId || request.status !== "pending") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Friend request not found." });
  }

  const [acceptedFriendship] = await db
    .update(friendship)
    .set({ status: "accepted" })
    .where(eq(friendship.id, args.friendshipId))
    .returning();

  return acceptedFriendship;
}

export async function declineFriendRequest(args: { friendshipId: string; viewerId: string }) {
  const request = await db.query.friendship.findFirst({
    where: eq(friendship.id, args.friendshipId),
  });

  if (!request) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Friend request not found." });
  }

  const canDelete =
    (request.status === "pending" && request.addresseeId === args.viewerId) ||
    (request.status === "pending" && request.requesterId === args.viewerId);

  if (!canDelete) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Action not allowed." });
  }

  await db.delete(friendship).where(eq(friendship.id, args.friendshipId));

  return { success: true };
}

export async function removeFriend(args: { targetUserId: string; viewerId: string }) {
  const existing = await getFriendshipByPair(args.viewerId, args.targetUserId);

  if (!existing || existing.status !== "accepted") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Friend not found." });
  }

  await db.delete(friendship).where(eq(friendship.id, existing.id));

  return { success: true };
}

export async function blockUser(args: { targetUserId: string; viewerId: string }) {
  if (args.targetUserId === args.viewerId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot block yourself." });
  }

  const target = await db.query.user.findFirst({
    where: eq(user.id, args.targetUserId),
  });

  if (!target) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
  }

  await db
    .insert(userBlock)
    .values({
      blockerId: args.viewerId,
      blockedId: args.targetUserId,
    })
    .onConflictDoNothing();

  const existing = await getFriendshipByPair(args.viewerId, args.targetUserId);

  if (existing) {
    await db.delete(friendship).where(eq(friendship.id, existing.id));
  }

  return { success: true };
}

export async function unblockUser(args: { targetUserId: string; viewerId: string }) {
  await db
    .delete(userBlock)
    .where(and(eq(userBlock.blockerId, args.viewerId), eq(userBlock.blockedId, args.targetUserId)));

  return { success: true };
}
