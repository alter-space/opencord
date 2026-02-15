import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { message } from "./message";

export const messageReaction = pgTable(
  "message_reaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    messageId: text("message_id")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("message_reaction_unique").on(
      table.messageId,
      table.userId,
      table.emoji,
    ),
    index("message_reaction_messageId_idx").on(table.messageId),
  ],
);
