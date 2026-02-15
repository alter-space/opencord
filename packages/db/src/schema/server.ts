import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const serverRoleEnum = pgEnum("server_role", [
  "owner",
  "moderator",
  "member",
]);

export const server = pgTable("server", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  inviteCode: text("invite_code")
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID().slice(0, 8)),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const serverMember = pgTable(
  "server_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serverId: text("server_id")
      .notNull()
      .references(() => server.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: serverRoleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    unique("server_member_unique").on(table.serverId, table.userId),
    index("server_member_serverId_idx").on(table.serverId),
    index("server_member_userId_idx").on(table.userId),
  ],
);

export const serverBan = pgTable(
  "server_ban",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serverId: text("server_id")
      .notNull()
      .references(() => server.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bannedById: text("banned_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("server_ban_unique").on(table.serverId, table.userId),
    index("server_ban_serverId_idx").on(table.serverId),
  ],
);

export const serverMute = pgTable(
  "server_mute",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serverId: text("server_id")
      .notNull()
      .references(() => server.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mutedById: text("muted_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("server_mute_unique").on(table.serverId, table.userId),
    index("server_mute_serverId_idx").on(table.serverId),
  ],
);
