import { redis } from "./redis";

const ONLINE_TTL_SECONDS = 75;
const OFFLINE_RETENTION_SECONDS = 60 * 60 * 24 * 30;

type PresenceRecord = {
  state: "online" | "offline";
  lastSeenAt: string;
};

function getPresenceKey(userId: string) {
  return `presence:user:${userId}`;
}

export async function setUserPresenceOnline(userId: string) {
  const record: PresenceRecord = {
    state: "online",
    lastSeenAt: new Date().toISOString(),
  };

  await redis.set(getPresenceKey(userId), record, { ex: ONLINE_TTL_SECONDS });
}

export async function setUserPresenceOffline(userId: string) {
  const record: PresenceRecord = {
    state: "offline",
    lastSeenAt: new Date().toISOString(),
  };

  await redis.set(getPresenceKey(userId), record, {
    ex: OFFLINE_RETENTION_SECONDS,
  });

  return record;
}

export async function touchUserPresence(userId: string) {
  return setUserPresenceOnline(userId);
}

export async function getPresenceMap(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  const entries = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const record = await redis.get<PresenceRecord>(getPresenceKey(userId));

      return [
        userId,
        {
          isOnline: record?.state === "online",
          lastSeenAt: record?.lastSeenAt ?? null,
        },
      ] as const;
    }),
  );

  return new Map(entries);
}
