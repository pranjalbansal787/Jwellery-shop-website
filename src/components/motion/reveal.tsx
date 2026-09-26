"use client";
import { motion } from "motion/react";
import { useMotionLevel } from "@/lib/hooks";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fade-and-rise on first view. Content is fully visible without JS/motion (initial state is only applied when motion is allowed). */
export function Reveal({ children, delay = 0, y = 28, className, as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" | "article" }) {
  const level = useMotionLevel();
  const M = motion[as];
  if (!level) return <M className={className}>{children}</M>;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: y * level }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.0, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

/** Line-by-line text-mask reveal for editorial headlines. Pass lines as separate strings. */
export function MaskText({ lines, className, delay = 0, as = "h2" }: { lines: ReactNode[]; className?: string; delay?: number; as?: "h1" | "h2" | "h3" | "p" }) {
  const level = useMotionLevel();
  const Tag = as;
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          {level ? (
            <motion.span
              className="block"
              initial={{ y: "105%" }}
              whileInView={{ y: "0%" }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 1.1, ease: EASE, delay: delay + i * 0.09 }}
            >
              {line}
            </motion.span>
          ) : (
            <span className="block">{line}</span>
          )}
        </span>
      ))}
    </Tag>
  );
}
