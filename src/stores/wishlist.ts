"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GemKey, MetalKey } from "@/lib/types";

export interface WishItem {
  productId: string;
  slug: string;
  metal: MetalKey;
  gem: GemKey;
  addedAt: string;
}

interface WishState {
  items: WishItem[];
  toggle: (i: Omit<WishItem, "addedAt">) => boolean;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
}

/** Guest wishlist in localStorage; merged into `wishlists` on login (ARCHITECTURE.md §8). */
export const useWishlist = create<WishState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (i) => {
        const exists = get().items.some((x) => x.productId === i.productId);
        set((s) => ({ items: exists ? s.items.filter((x) => x.productId !== i.productId) : [{ ...i, addedAt: new Date().toISOString() }, ...s.items] }));
        return !exists;
      },
      remove: (productId) => set((s) => ({ items: s.items.filter((x) => x.productId !== productId) })),
      has: (productId) => get().items.some((x) => x.productId === productId),
    }),
    { name: "wishlist-v1", storage: createJSONStorage(() => localStorage) },
  ),
);
