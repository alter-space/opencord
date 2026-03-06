import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { listConversationMessages, markConversationRead } from "../lib/conversations";

export const messagesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listConversationMessages({
        conversationId: input.conversationId,
        limit: input.limit,
        viewerId: ctx.session.user.id,
      });
    }),
  markRead: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().min(1),
        messageId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return markConversationRead({
        conversationId: input.conversationId,
        messageId: input.messageId,
        viewerId: ctx.session.user.id,
      });
    }),
});
