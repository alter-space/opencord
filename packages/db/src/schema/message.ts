import {
  type AnyPgColumn,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { channel } from "./channel";
import { conversation } from "./conversation";

export const message = pgTable(
  "message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    content: text("content"),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").references(() => conversation.id, {
      onDelete: "cascade",
    }),
    channelId: text("channel_id").references(() => channel.id, {
      onDelete: "cascade",
    }),
    replyToId: text("reply_to_id").references(
      (): AnyPgColumn => message.id,
      { onDelete: "set null" },
    ),
    pinnedAt: timestamp("pinned_at"),
    pinnedById: text("pinned_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("message_senderId_idx").on(table.senderId),
    index("message_conversationId_idx").on(table.conversationId),
    index("message_channelId_idx").on(table.channelId),
    index("message_createdAt_idx").on(table.createdAt),
    index("message_conversationId_createdAt_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    index("message_channelId_createdAt_idx").on(
      table.channelId,
      table.createdAt,
    ),
    index("message_replyToId_idx").on(table.replyToId),
  ],
);
