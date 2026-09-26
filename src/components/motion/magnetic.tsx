"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useMotionLevel } from "@/lib/hooks";

/** Subtle magnetic pull toward the pointer for primary CTAs. No-op for touch and reduced motion. */
export function Magnetic({ children, strength = 0.22 }: { children: React.ReactNode; strength?: number }) {
  const level = useMotionLevel();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  if (!level) return <>{children}</>;
  return (
    <motion.div
      ref={ref}
      className="inline-block"
      style={{ x, y }}
      data-magnetic
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength * level);
        y.set((e.clientY - (r.top + r.height / 2)) * strength * level);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
