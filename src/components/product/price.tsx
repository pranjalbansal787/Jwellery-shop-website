"use client";
import { AnimatePresence, motion } from "motion/react";
import { useMoney } from "@/components/providers/brand-provider";
import { cn } from "@/lib/cn";

/** Price with a soft digit transition when a variant changes the amount. */
export function Price({ amount, compareAt, className, from = false }: { amount: number; compareAt?: number; className?: string; from?: boolean }) {
  const money = useMoney();
  const text = money(amount);
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      {from && <span className="text-[0.75em] text-muted">From</span>}
      <span className="relative inline-flex overflow-hidden" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={text} initial={{ y: "60%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-60%", opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
      {compareAt && compareAt > amount && <s className="text-[0.8em] text-muted">{money(compareAt)}</s>}
    </span>
  );
}
