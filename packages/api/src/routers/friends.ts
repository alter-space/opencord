import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
  acceptFriendRequest,
  blockUser,
  declineFriendRequest,
  getFriendsDashboard,
  removeFriend,
  sendFriendRequest,
  unblockUser,
} from "../lib/friends";
import { ensureUserProfile } from "../lib/profile";

export const friendsRouter = router({
  dashboard: protectedProcedure
    .input(
      z.object({
        presenceFilter: z.enum(["all", "online", "offline"]).default("all"),
        query: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ensureUserProfile(ctx.session.user);

      return getFriendsDashboard({
        viewerId: ctx.session.user.id,
        query: input.query,
        presenceFilter: input.presenceFilter,
      });
    }),
  sendRequest: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return sendFriendRequest({
        targetUserId: input.targetUserId,
        viewer: ctx.session.user,
      });
    }),
  acceptRequest: protectedProcedure
    .input(
      z.object({
        friendshipId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return acceptFriendRequest({
        friendshipId: input.friendshipId,
        viewerId: ctx.session.user.id,
      });
    }),
  declineRequest: protectedProcedure
    .input(
      z.object({
        friendshipId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return declineFriendRequest({
        friendshipId: input.friendshipId,
        viewerId: ctx.session.user.id,
      });
    }),
  remove: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return removeFriend({
        targetUserId: input.targetUserId,
        viewerId: ctx.session.user.id,
      });
    }),
  block: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return blockUser({
        targetUserId: input.targetUserId,
        viewerId: ctx.session.user.id,
      });
    }),
  unblock: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return unblockUser({
        targetUserId: input.targetUserId,
        viewerId: ctx.session.user.id,
      });
    }),
});
