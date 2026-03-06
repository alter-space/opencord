import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { searchUsers } from "../lib/friends";
import { ensureUserProfile } from "../lib/profile";

export const usersRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(2),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ensureUserProfile(ctx.session.user);
      return searchUsers({ query: input.query, viewerId: ctx.session.user.id });
    }),
});
