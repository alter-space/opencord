CREATE TABLE "message_key_envelope" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"encrypted_key" text NOT NULL,
	"algorithm" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_key_envelope_unique" UNIQUE("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user_block" (
	"id" text PRIMARY KEY NOT NULL,
	"blocker_id" text NOT NULL,
	"blocked_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_block_pair_unique" UNIQUE("blocker_id","blocked_id")
);
--> statement-breakpoint
ALTER TABLE "friendship" DROP CONSTRAINT "friendship_pair_unique";--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "dm_key" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "last_message_id" text;--> statement-breakpoint
ALTER TABLE "conversation" ADD COLUMN "last_message_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversation_member" ADD COLUMN "last_read_message_id" text;--> statement-breakpoint
ALTER TABLE "friendship" ADD COLUMN "pair_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "public_key" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "public_key_algorithm" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "last_seen_at" timestamp;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "ciphertext" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "iv" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "encryption_algorithm" text;--> statement-breakpoint
ALTER TABLE "message_key_envelope" ADD CONSTRAINT "message_key_envelope_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_key_envelope" ADD CONSTRAINT "message_key_envelope_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_block" ADD CONSTRAINT "user_block_blocker_id_user_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_block" ADD CONSTRAINT "user_block_blocked_id_user_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_key_envelope_messageId_idx" ON "message_key_envelope" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_key_envelope_userId_idx" ON "message_key_envelope" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_block_blockerId_idx" ON "user_block" USING btree ("blocker_id");--> statement-breakpoint
CREATE INDEX "user_block_blockedId_idx" ON "user_block" USING btree ("blocked_id");--> statement-breakpoint
CREATE INDEX "conversation_dmKey_idx" ON "conversation" USING btree ("dm_key");--> statement-breakpoint
CREATE INDEX "conversation_lastMessageAt_idx" ON "conversation" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "friendship_pairKey_idx" ON "friendship" USING btree ("pair_key");--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_dm_key_unique" UNIQUE("dm_key");--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_pair_key_unique" UNIQUE("pair_key");