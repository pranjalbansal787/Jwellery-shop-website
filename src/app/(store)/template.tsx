"use client";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useMotionLevel } from "@/lib/hooks";

let firstPaint = true;

/**
 * Page transition: on client navigations a dark veil lifts off the viewport while the
 * new page rises into place. Skipped on the first paint (protects LCP) and when motion is off.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const level = useMotionLevel();
  const animate = !firstPaint && level > 0;
  useEffect(() => {
    firstPaint = false;
  }, []);
  if (!animate) return <>{children}</>;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-bg"
        style={{ zIndex: 80, transformOrigin: "top" }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}>
        {children}
      </motion.div>
    </>
  );
}
