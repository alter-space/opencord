export const servers = [
  {
    id: "1",
    name: "General",
    initials: "GN",
    members: 128,
    online: 42,
  },
  {
    id: "2",
    name: "Design Team",
    initials: "DT",
    members: 24,
    online: 8,
  },
  {
    id: "3",
    name: "Engineering",
    initials: "EN",
    members: 56,
    online: 19,
  },
  {
    id: "4",
    name: "Music Lounge",
    initials: "ML",
    members: 312,
    online: 87,
  },
] as const;

export const channelsByServer = {
  "1": [
    { id: "general", name: "general", type: "text" },
    { id: "intros", name: "introductions", type: "text" },
    { id: "voice-1", name: "voice chat", type: "voice" },
  ],
  "2": [
    { id: "reviews", name: "design-reviews", type: "text" },
    { id: "inspo", name: "inspiration", type: "text" },
    { id: "voice-2", name: "design room", type: "voice" },
  ],
  "3": [
    { id: "dev", name: "development", type: "text" },
    { id: "ci", name: "ci-cd", type: "text" },
    { id: "voice-3", name: "standup room", type: "voice" },
  ],
  "4": [
    { id: "recs", name: "recommendations", type: "text" },
    { id: "share", name: "share-music", type: "text" },
    { id: "voice-4", name: "listening party", type: "voice" },
  ],
} as const;

export function getServerById(serverId: string | null) {
  if (!serverId) {
    return null;
  }

  return servers.find((server) => server.id === serverId) ?? null;
}
