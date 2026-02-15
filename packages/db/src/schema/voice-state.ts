import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { channel } from "./channel";
import { conversation } from "./conversation";

export const voiceState = pgTable(
  "voice_state",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    channelId: text("channel_id").references(() => channel.id, {
      onDelete: "cascade",
    }),
    conversationId: text("conversation_id").references(() => conversation.id, {
      onDelete: "cascade",
    }),
    isMuted: boolean("is_muted").default(false).notNull(),
    isDeafened: boolean("is_deafened").default(false).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("voice_state_channelId_idx").on(table.channelId),
    index("voice_state_conversationId_idx").on(table.conversationId),
  ],
);
