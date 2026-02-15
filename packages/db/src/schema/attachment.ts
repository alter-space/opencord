import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { message } from "./message";

export const messageAttachment = pgTable(
  "message_attachment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    messageId: text("message_id")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    filename: text("filename").notNull(),
    contentType: text("content_type"),
    size: integer("size"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_attachment_messageId_idx").on(table.messageId),
  ],
);
