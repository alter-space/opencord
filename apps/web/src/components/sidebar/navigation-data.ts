export const communities = [
  {
    id: "1",
    name: "General",
    initials: "GN",
    description: "Open conversations for everyone",
    members: 128,
    online: 42,
  },
  {
    id: "2",
    name: "Design Team",
    initials: "DT",
    description: "Reviews, critiques, and ideas",
    members: 24,
    online: 8,
  },
  {
    id: "3",
    name: "Engineering",
    initials: "EN",
    description: "Build updates and ship notes",
    members: 56,
    online: 19,
  },
  {
    id: "4",
    name: "Music Lounge",
    initials: "ML",
    description: "Listening sessions and recs",
    members: 312,
    online: 87,
  },
] as const;

export const channelsByCommunity = {
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

export const conversations = [
  {
    id: "1",
    name: "Alice Johnson",
    status: "online",
    activity: "Sketching the onboarding flow",
    group: "Pinned",
  },
  {
    id: "2",
    name: "Bob Smith",
    status: "idle",
    activity: "Sharing build notes",
    group: "Recent",
  },
  {
    id: "3",
    name: "Charlie Davis",
    status: "dnd",
    activity: "In a voice room",
    group: "Recent",
  },
  {
    id: "4",
    name: "Diana Chen",
    status: "offline",
    activity: "Last active 2h ago",
    group: "Friends",
  },
] as const;

export const statusColors = {
  online: "bg-green-500",
  idle: "bg-amber-500",
  dnd: "bg-rose-500",
  offline: "bg-zinc-500",
} as const;

export function getCommunityById(communityId: string | null) {
  if (!communityId) {
    return null;
  }

  return communities.find((community) => community.id === communityId) ?? null;
}
