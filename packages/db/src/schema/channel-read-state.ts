import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { channel } from "./channel";

export const channelReadState = pgTable(
  "channel_read_state",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    channelId: text("channel_id")
      .notNull()
      .references(() => channel.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
  },
  (table) => [
    unique("channel_read_state_unique").on(table.channelId, table.userId),
    index("channel_read_state_userId_idx").on(table.userId),
    index("channel_read_state_channelId_idx").on(table.channelId),
  ],
);
