"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GemKey, MetalKey, Purity } from "@/lib/types";

export interface CartLine {
  key: string;
  productId: string;
  slug: string;
  name: string;
  variantId: string;
  sku: string;
  metal: MetalKey;
  purity: Purity;
  gem: GemKey;
  size?: string;
  engraving?: string;
  qty: number;
  unitPrice: number;
  image: string;
  leadDays: number;
}

interface CartState {
  lines: CartLine[];
  giftWrap: boolean;
  giftMessage: string;
  open: boolean;
  lastAddedKey: string | null;
  add: (l: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (o: boolean) => void;
  setGift: (wrap: boolean, message?: string) => void;
}

const keyOf = (l: Pick<CartLine, "variantId" | "size" | "engraving">) => `${l.variantId}|${l.size ?? ""}|${l.engraving ?? ""}`;

/**
 * Guest cart lives in localStorage; on login it merges into the server cart (carts/cart_items).
 * Prices shown here are re-validated server-side at checkout — the client is never trusted for pricing.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      giftWrap: true,
      giftMessage: "",
      open: false,
      lastAddedKey: null,
      add: (l, qty = 1) =>
        set((s) => {
          const key = keyOf(l);
          const existing = s.lines.find((x) => x.key === key);
          const lines = existing ? s.lines.map((x) => (x.key === key ? { ...x, qty: Math.min(5, x.qty + qty) } : x)) : [...s.lines, { ...l, key, qty }];
          return { lines, open: true, lastAddedKey: key };
        }),
      setQty: (key, qty) => set((s) => ({ lines: s.lines.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(5, qty)) } : x)) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((x) => x.key !== key) })),
      clear: () => set({ lines: [], giftMessage: "" }),
      setOpen: (open) => set({ open }),
      setGift: (giftWrap, giftMessage) => set((s) => ({ giftWrap, giftMessage: giftMessage ?? s.giftMessage })),
    }),
    {
      name: "cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, giftWrap: s.giftWrap, giftMessage: s.giftMessage }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
