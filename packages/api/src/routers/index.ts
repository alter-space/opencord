import { protectedProcedure, publicProcedure, router } from "../index";
import { conversationsRouter } from "./conversations";
import { friendsRouter } from "./friends";
import { messagesRouter } from "./messages";
import { profileRouter } from "./profile";
import { usersRouter } from "./users";
import { wsRouter } from "./ws";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  conversations: conversationsRouter,
  friends: friendsRouter,
  messages: messagesRouter,
  profile: profileRouter,
  users: usersRouter,
  ws: wsRouter,
});
export type AppRouter = typeof appRouter;
