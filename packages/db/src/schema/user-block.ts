import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const userBlock = pgTable(
  "user_block",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("user_block_pair_unique").on(table.blockerId, table.blockedId),
    index("user_block_blockerId_idx").on(table.blockerId),
    index("user_block_blockedId_idx").on(table.blockedId),
  ],
);
