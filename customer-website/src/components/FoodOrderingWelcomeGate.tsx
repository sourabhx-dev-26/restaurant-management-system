"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

type FoodOrderingWelcomeGateProps = {
  featuredImageUrl?: string;
};

export default function FoodOrderingWelcomeGate({
  featuredImageUrl,
}: FoodOrderingWelcomeGateProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(
      () => setShowWelcome(false),
      shouldReduceMotion ? 250 : 3900
    );

    return () => window.clearTimeout(timer);
  }, [shouldReduceMotion]);

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          aria-label="Welcome to the ordering experience"
          className="fixed inset-0 z-[9999] overflow-hidden bg-[#05070B]"
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.65, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute left-0 top-0 z-10 flex h-full w-[calc(50%+8px)] items-center justify-center border-r border-[#D6B25E]/20 bg-[#05070B]"
            animate={shouldReduceMotion ? undefined : { x: "-100%" }}
            transition={{ delay: 2.55, duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="text-center">
              <motion.p
                className="mb-4 text-[10px] font-black uppercase tracking-[0.42em] text-[#D6B25E]/70 sm:text-xs"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Taste
              </motion.p>
              <motion.h1
                className="text-[19vw] font-black leading-none text-[#F5D98B] sm:text-[16vw]"
                initial={{ opacity: 0, x: -52 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42, duration: 0.75 }}
              >
                DE
              </motion.h1>
            </div>
          </motion.div>

          <motion.div
            className="absolute right-0 top-0 z-10 flex h-full w-[calc(50%+8px)] items-center justify-center bg-[#07120E]"
            animate={shouldReduceMotion ? undefined : { x: "100%" }}
            transition={{ delay: 2.55, duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="text-center">
              <motion.p
                className="mb-4 text-[10px] font-black uppercase tracking-[0.42em] text-[#6EF2A9]/75 sm:text-xs"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Order
              </motion.p>
              <motion.h1
                className="text-[19vw] font-black leading-none text-[#6EF2A9] sm:text-[16vw]"
                initial={{ opacity: 0, x: 52 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.52, duration: 0.75 }}
              >
                MO
              </motion.h1>
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.72 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : {
                    opacity: [0, 1, 1, 0],
                    scale: [0.72, 1.06, 1, 0.86],
                    rotate: [-5, 0, 0, 5],
                  }
            }
            transition={{ duration: 2.45, times: [0, 0.3, 0.78, 1], ease: "easeInOut" }}
          >
            <div className="food-welcome-plate">
              <div className="food-welcome-glow" />
              {featuredImageUrl ? (
                <motion.img
                  src={featuredImageUrl}
                  alt="Featured dish"
                  className="food-welcome-dish"
                  animate={shouldReduceMotion ? undefined : { y: [0, -8, 0], scale: [1, 1.035, 1] }}
                  transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : (
                <div className="food-welcome-mark" aria-hidden="true">
                  <span>+</span>
                  <span>+</span>
                  <span>+</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.p
            className="absolute bottom-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.4em] text-white/45 sm:text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
          >
            Your table. Your taste.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
