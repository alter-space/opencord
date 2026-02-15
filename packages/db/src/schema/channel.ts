import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { server } from "./server";

export const channelTypeEnum = pgEnum("channel_type", ["text", "voice"]);

export const channel = pgTable(
  "channel",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serverId: text("server_id")
      .notNull()
      .references(() => server.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: channelTypeEnum("type").default("text").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("channel_serverId_idx").on(table.serverId),
    index("channel_serverId_position_idx").on(table.serverId, table.position),
  ],
);
