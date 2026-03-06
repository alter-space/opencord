export function canonicalPairKey(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort((left, right) => left.localeCompare(right)).join(":");
}

export function sanitizeUsername(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 24);

  return normalized || "user";
}

export function formatPresenceStatus(isOnline: boolean) {
  return isOnline ? "online" : "offline";
}

export function requireValue<T>(value: T | undefined, message: string) {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}
