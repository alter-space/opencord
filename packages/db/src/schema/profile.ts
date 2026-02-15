import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const userStatusEnum = pgEnum("user_status", [
  "online",
  "idle",
  "dnd",
  "offline",
]);

export const userProfile = pgTable("user_profile", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  status: userStatusEnum("status").default("offline").notNull(),
  customStatus: text("custom_status"),
  bannerUrl: text("banner_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
