import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
  getConversationDetails,
  getOrCreateDmConversation,
  listDirectMessages,
} from "../lib/conversations";
import { ensureUserProfile } from "../lib/profile";
import { requireValue } from "../lib/utils";

export const conversationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await ensureUserProfile(ctx.session.user);
    return listDirectMessages(ctx.session.user.id);
  }),
  openDm: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dmConversation = await getOrCreateDmConversation({
        viewerId: ctx.session.user.id,
        otherUserId: input.userId,
      });
      const safeConversation = requireValue(
        dmConversation,
        "Failed to open direct message conversation.",
      );

      return getConversationDetails({
        conversationId: safeConversation.id,
        viewerId: ctx.session.user.id,
      });
    }),
  byId: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getConversationDetails({
        conversationId: input.conversationId,
        viewerId: ctx.session.user.id,
      });
    }),
});
