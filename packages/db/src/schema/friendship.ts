import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const friendshipStatusEnum = pgEnum("friendship_status", ["pending", "accepted", "blocked"]);

export const friendship = pgTable(
  "friendship",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pairKey: text("pair_key").notNull().unique(),
    status: friendshipStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("friendship_requesterId_idx").on(table.requesterId),
    index("friendship_addresseeId_idx").on(table.addresseeId),
    index("friendship_pairKey_idx").on(table.pairKey),
    index("friendship_status_idx").on(table.status),
  ],
);
