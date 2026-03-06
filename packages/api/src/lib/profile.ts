import { and, eq, inArray } from "drizzle-orm";

import { db } from "@opencord/db";
import { user, userBlock, userProfile } from "@opencord/db/schema/index";

import { sanitizeUsername } from "./utils";

type SessionUser = {
  id: string;
  email?: string | null;
  image?: string | null;
  name?: string | null;
};

export async function ensureUserProfile(sessionUser: SessionUser) {
  const existingProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, sessionUser.id),
  });

  if (existingProfile) {
    return existingProfile;
  }

  const baseSource = sessionUser.email?.split("@")[0] || sessionUser.name || sessionUser.id;
  const baseUsername = sanitizeUsername(baseSource);

  let username = baseUsername;
  let suffix = 1;

  for (;;) {
    const taken = await db.query.userProfile.findFirst({
      where: eq(userProfile.username, username),
      columns: { id: true },
    });

    if (!taken) {
      break;
    }

    suffix += 1;
    username = sanitizeUsername(`${baseUsername}${suffix}`);
  }

  const [createdProfile] = await db
    .insert(userProfile)
    .values({
      userId: sessionUser.id,
      username,
      displayName: sessionUser.name?.trim() || null,
    })
    .returning();

  return createdProfile;
}

export async function getProfilesByUserIds(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  const profiles = await db
    .select({
      userId: user.id,
      name: user.name,
      image: user.image,
      username: userProfile.username,
      displayName: userProfile.displayName,
      status: userProfile.status,
      customStatus: userProfile.customStatus,
      publicKey: userProfile.publicKey,
      publicKeyAlgorithm: userProfile.publicKeyAlgorithm,
      lastSeenAt: userProfile.lastSeenAt,
    })
    .from(user)
    .innerJoin(userProfile, eq(userProfile.userId, user.id))
    .where(inArray(user.id, uniqueUserIds));

  return new Map(profiles.map((profile) => [profile.userId, profile]));
}

export async function getBlockedUserIds(userId: string) {
  const blockedRows = await db
    .select({ blockedId: userBlock.blockedId })
    .from(userBlock)
    .where(eq(userBlock.blockerId, userId));

  const blockedByRows = await db
    .select({ blockerId: userBlock.blockerId })
    .from(userBlock)
    .where(eq(userBlock.blockedId, userId));

  return {
    blocked: new Set(blockedRows.map((row) => row.blockedId)),
    blockedBy: new Set(blockedByRows.map((row) => row.blockerId)),
  };
}

export async function assertUsersNotBlocked(userId: string, otherUserId: string) {
  const block = await db.query.userBlock.findFirst({
    where: and(eq(userBlock.blockerId, userId), eq(userBlock.blockedId, otherUserId)),
  });

  if (block) {
    return false;
  }

  const blockedBy = await db.query.userBlock.findFirst({
    where: and(eq(userBlock.blockerId, otherUserId), eq(userBlock.blockedId, userId)),
  });

  return !blockedBy;
}

export async function updateProfileEncryptionKey(args: {
  userId: string;
  publicKey: string;
  publicKeyAlgorithm: string;
}) {
  const [updatedProfile] = await db
    .update(userProfile)
    .set({
      publicKey: args.publicKey,
      publicKeyAlgorithm: args.publicKeyAlgorithm,
    })
    .where(eq(userProfile.userId, args.userId))
    .returning();

  return updatedProfile;
}

export async function updateUserLastSeen(userId: string) {
  await db
    .update(userProfile)
    .set({
      lastSeenAt: new Date(),
    })
    .where(eq(userProfile.userId, userId));
}
