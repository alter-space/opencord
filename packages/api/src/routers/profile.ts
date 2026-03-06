import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { ensureUserProfile, updateProfileEncryptionKey } from "../lib/profile";

export const profileRouter = router({
  bootstrap: protectedProcedure
    .input(
      z.object({
        publicKey: z.string().min(1).optional(),
        publicKeyAlgorithm: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ensureUserProfile(ctx.session.user);

      if (input.publicKey && input.publicKeyAlgorithm) {
        return updateProfileEncryptionKey({
          userId: ctx.session.user.id,
          publicKey: input.publicKey,
          publicKeyAlgorithm: input.publicKeyAlgorithm,
        });
      }

      return profile;
    }),
  me: protectedProcedure.query(async ({ ctx }) => {
    return ensureUserProfile(ctx.session.user);
  }),
});
