CREATE TYPE "public"."channel_type" AS ENUM('text', 'voice');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('dm', 'group');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('online', 'idle', 'dnd', 'offline');--> statement-breakpoint
CREATE TYPE "public"."server_role" AS ENUM('owner', 'moderator', 'member');--> statement-breakpoint
CREATE TABLE "message_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"url" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text,
	"size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_read_state" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channel_read_state_unique" UNIQUE("channel_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" text PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "channel_type" DEFAULT 'text' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "conversation_type" NOT NULL,
	"name" text,
	"image_url" text,
	"owner_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_member" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_member_unique" UNIQUE("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "friendship" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"addressee_id" text NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "friendship_pair_unique" UNIQUE("requester_id","addressee_id")
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"bio" text,
	"status" "user_status" DEFAULT 'offline' NOT NULL,
	"custom_status" text,
	"banner_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "server" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"invite_code" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "server_ban" (
	"id" text PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"user_id" text NOT NULL,
	"banned_by_id" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_ban_unique" UNIQUE("server_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "server_member" (
	"id" text PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "server_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_member_unique" UNIQUE("server_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "server_mute" (
	"id" text PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"user_id" text NOT NULL,
	"muted_by_id" text NOT NULL,
	"reason" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_mute_unique" UNIQUE("server_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text,
	"sender_id" text NOT NULL,
	"conversation_id" text,
	"channel_id" text,
	"reply_to_id" text,
	"pinned_at" timestamp,
	"pinned_by_id" text,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reaction" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_reaction_unique" UNIQUE("message_id","user_id","emoji")
);
--> statement-breakpoint
CREATE TABLE "voice_state" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"channel_id" text,
	"conversation_id" text,
	"is_muted" boolean DEFAULT false NOT NULL,
	"is_deafened" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "voice_state_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_read_state" ADD CONSTRAINT "channel_read_state_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_read_state" ADD CONSTRAINT "channel_read_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_server_id_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_addressee_id_user_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server" ADD CONSTRAINT "server_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_ban" ADD CONSTRAINT "server_ban_server_id_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_ban" ADD CONSTRAINT "server_ban_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_ban" ADD CONSTRAINT "server_ban_banned_by_id_user_id_fk" FOREIGN KEY ("banned_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_member" ADD CONSTRAINT "server_member_server_id_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_member" ADD CONSTRAINT "server_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_mute" ADD CONSTRAINT "server_mute_server_id_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_mute" ADD CONSTRAINT "server_mute_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_mute" ADD CONSTRAINT "server_mute_muted_by_id_user_id_fk" FOREIGN KEY ("muted_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_reply_to_id_message_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_pinned_by_id_user_id_fk" FOREIGN KEY ("pinned_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_state" ADD CONSTRAINT "voice_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_state" ADD CONSTRAINT "voice_state_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_state" ADD CONSTRAINT "voice_state_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_attachment_messageId_idx" ON "message_attachment" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "channel_read_state_userId_idx" ON "channel_read_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "channel_read_state_channelId_idx" ON "channel_read_state" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "channel_serverId_idx" ON "channel" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "channel_serverId_position_idx" ON "channel" USING btree ("server_id","position");--> statement-breakpoint
CREATE INDEX "conversation_ownerId_idx" ON "conversation" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "conversation_member_conversationId_idx" ON "conversation_member" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conversation_member_userId_idx" ON "conversation_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "friendship_requesterId_idx" ON "friendship" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friendship_addresseeId_idx" ON "friendship" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "friendship_status_idx" ON "friendship" USING btree ("status");--> statement-breakpoint
CREATE INDEX "server_ban_serverId_idx" ON "server_ban" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "server_member_serverId_idx" ON "server_member" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "server_member_userId_idx" ON "server_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "server_mute_serverId_idx" ON "server_mute" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "message_senderId_idx" ON "message" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "message_conversationId_idx" ON "message" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "message_channelId_idx" ON "message" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "message_createdAt_idx" ON "message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "message_conversationId_createdAt_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "message_channelId_createdAt_idx" ON "message" USING btree ("channel_id","created_at");--> statement-breakpoint
CREATE INDEX "message_replyToId_idx" ON "message" USING btree ("reply_to_id");--> statement-breakpoint
CREATE INDEX "message_reaction_messageId_idx" ON "message_reaction" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "voice_state_channelId_idx" ON "voice_state" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "voice_state_conversationId_idx" ON "voice_state" USING btree ("conversation_id");