import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { message } from "./message";

export const messageKeyEnvelope = pgTable(
  "message_key_envelope",
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
    encryptedKey: text("encrypted_key").notNull(),
    algorithm: text("algorithm").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("message_key_envelope_unique").on(table.messageId, table.userId),
    index("message_key_envelope_messageId_idx").on(table.messageId),
    index("message_key_envelope_userId_idx").on(table.userId),
  ],
);
