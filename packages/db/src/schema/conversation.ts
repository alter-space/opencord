import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const conversationTypeEnum = pgEnum("conversation_type", [
  "dm",
  "group",
]);

export const conversation = pgTable(
  "conversation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: conversationTypeEnum("type").notNull(),
    name: text("name"),
    imageUrl: text("image_url"),
    ownerId: text("owner_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("conversation_ownerId_idx").on(table.ownerId)],
);

export const conversationMember = pgTable(
  "conversation_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    unique("conversation_member_unique").on(
      table.conversationId,
      table.userId,
    ),
    index("conversation_member_conversationId_idx").on(table.conversationId),
    index("conversation_member_userId_idx").on(table.userId),
  ],
);
