import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { authClient } from "@/lib/auth-client";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.data) {
      redirect({ to: "/dashboard", throw: true });
    }
  },
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="min-h-svh w-full flex bg-white dark:bg-black overflow-hidden">
      <div className="w-full flex flex-col md:flex-row h-full">
        {/* Left: Form Side */}
        <div className="w-full md:w-1/2 bg-white dark:bg-zinc-900 flex items-center justify-center p-8 md:p-12 relative min-h-svh order-2 md:order-1">
          <div className="w-full max-w-sm relative min-h-[420px]">
            <AnimatePresence mode="wait" initial={false}>
              {showSignIn ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Visual Side */}
        <div className="relative w-full md:w-1/2 bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex items-center justify-center p-12 min-h-[300px] md:min-h-0 order-1 md:order-2">
          {/* Animated Gradient Blob */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-white/30 dark:bg-black/20 z-10 backdrop-blur-[80px]" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-60"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [90, 0, 90],
                opacity: [0.6, 0.4, 0.6],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-bl from-blue-400 via-cyan-400 to-teal-400 rounded-full blur-3xl opacity-50 mix-blend-multiply"
            />
          </div>

          <div className="relative z-20 text-center space-y-6 max-w-md px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto w-20 h-20 bg-white dark:bg-white/10 rounded-2xl shadow-xl flex items-center justify-center backdrop-blur-md border border-white/20"
            >
              <svg
                className="w-10 h-10 text-indigo-600 dark:text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                It's time to Wonder
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xl font-light leading-relaxed">
                Welcome to opencord's private alpha.
                <br />
                Early access for our first explorers.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
