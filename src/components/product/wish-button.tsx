"use client";
import { motion } from "motion/react";
import { useWishlist } from "@/stores/wishlist";
import { useHydrated } from "@/lib/hooks";
import { IconHeart } from "@/components/ui/icons";
import { track } from "@/lib/analytics";
import type { GemKey, MetalKey } from "@/lib/types";
import { cn } from "@/lib/cn";

export function WishButton({ productId, slug, metal, gem, className, withLabel = false }: { productId: string; slug: string; metal: MetalKey; gem: GemKey; className?: string; withLabel?: boolean }) {
  const hydrated = useHydrated();
  const active = useWishlist((s) => s.items.some((i) => i.productId === productId));
  const toggle = useWishlist((s) => s.toggle);
  const on = hydrated && active;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle({ productId, slug, metal, gem });
        if (added) track("wishlist_added", { productId, metal });
      }}
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Save to wishlist"}
      className={cn("inline-flex items-center justify-center gap-2", className)}
    >
      <motion.span key={String(on)} initial={{ scale: on ? 0.7 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 18 }} className={on ? "text-accent" : ""}>
        <IconHeart size={withLabel ? 18 : 19} filled={on} />
      </motion.span>
      {withLabel && <span className="text-[11.5px] uppercase tracking-[0.2em]">{on ? "Saved" : "Save"}</span>}
    </button>
  );
}
