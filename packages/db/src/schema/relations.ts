import { relations } from "drizzle-orm";

import { user } from "./auth";
import { messageAttachment } from "./attachment";
import { channel } from "./channel";
import { channelReadState } from "./channel-read-state";
import { conversation, conversationMember } from "./conversation";
import { friendship } from "./friendship";
import { message } from "./message";
import { userProfile } from "./profile";
import { messageReaction } from "./reaction";
import {
  server,
  serverBan,
  serverMember,
  serverMute,
} from "./server";
import { voiceState } from "./voice-state";

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
}));

export const friendshipRelations = relations(friendship, ({ one }) => ({
  requester: one(user, {
    fields: [friendship.requesterId],
    references: [user.id],
    relationName: "friendshipRequester",
  }),
  addressee: one(user, {
    fields: [friendship.addresseeId],
    references: [user.id],
    relationName: "friendshipAddressee",
  }),
}));

export const conversationRelations = relations(
  conversation,
  ({ one, many }) => ({
    owner: one(user, {
      fields: [conversation.ownerId],
      references: [user.id],
    }),
    members: many(conversationMember),
    messages: many(message),
  }),
);

export const conversationMemberRelations = relations(
  conversationMember,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [conversationMember.conversationId],
      references: [conversation.id],
    }),
    user: one(user, {
      fields: [conversationMember.userId],
      references: [user.id],
    }),
  }),
);

export const serverRelations = relations(server, ({ one, many }) => ({
  owner: one(user, {
    fields: [server.ownerId],
    references: [user.id],
  }),
  members: many(serverMember),
  channels: many(channel),
  bans: many(serverBan),
  mutes: many(serverMute),
}));

export const serverMemberRelations = relations(serverMember, ({ one }) => ({
  server: one(server, {
    fields: [serverMember.serverId],
    references: [server.id],
  }),
  user: one(user, {
    fields: [serverMember.userId],
    references: [user.id],
  }),
}));

export const serverBanRelations = relations(serverBan, ({ one }) => ({
  server: one(server, {
    fields: [serverBan.serverId],
    references: [server.id],
  }),
  user: one(user, {
    fields: [serverBan.userId],
    references: [user.id],
  }),
  bannedBy: one(user, {
    fields: [serverBan.bannedById],
    references: [user.id],
    relationName: "serverBanBannedBy",
  }),
}));

export const serverMuteRelations = relations(serverMute, ({ one }) => ({
  server: one(server, {
    fields: [serverMute.serverId],
    references: [server.id],
  }),
  user: one(user, {
    fields: [serverMute.userId],
    references: [user.id],
  }),
  mutedBy: one(user, {
    fields: [serverMute.mutedById],
    references: [user.id],
    relationName: "serverMuteMutedBy",
  }),
}));

export const channelRelations = relations(channel, ({ one, many }) => ({
  server: one(server, {
    fields: [channel.serverId],
    references: [server.id],
  }),
  messages: many(message),
  readStates: many(channelReadState),
}));

export const channelReadStateRelations = relations(
  channelReadState,
  ({ one }) => ({
    channel: one(channel, {
      fields: [channelReadState.channelId],
      references: [channel.id],
    }),
    user: one(user, {
      fields: [channelReadState.userId],
      references: [user.id],
    }),
  }),
);

export const messageRelations = relations(message, ({ one, many }) => ({
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
    relationName: "messageSender",
  }),
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  channel: one(channel, {
    fields: [message.channelId],
    references: [channel.id],
  }),
  replyTo: one(message, {
    fields: [message.replyToId],
    references: [message.id],
    relationName: "messageReply",
  }),
  pinnedBy: one(user, {
    fields: [message.pinnedById],
    references: [user.id],
    relationName: "messagePinnedBy",
  }),
  attachments: many(messageAttachment),
  reactions: many(messageReaction),
}));

export const messageAttachmentRelations = relations(
  messageAttachment,
  ({ one }) => ({
    message: one(message, {
      fields: [messageAttachment.messageId],
      references: [message.id],
    }),
  }),
);

export const messageReactionRelations = relations(
  messageReaction,
  ({ one }) => ({
    message: one(message, {
      fields: [messageReaction.messageId],
      references: [message.id],
    }),
    user: one(user, {
      fields: [messageReaction.userId],
      references: [user.id],
    }),
  }),
);

export const voiceStateRelations = relations(voiceState, ({ one }) => ({
  user: one(user, {
    fields: [voiceState.userId],
    references: [user.id],
  }),
  channel: one(channel, {
    fields: [voiceState.channelId],
    references: [channel.id],
  }),
  conversation: one(conversation, {
    fields: [voiceState.conversationId],
    references: [conversation.id],
  }),
}));
