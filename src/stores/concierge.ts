"use client";
import { create } from "zustand";
import type { WaContext } from "@/lib/whatsapp";

/** Pages publish context (e.g. the PDP's current configuration) so the concierge can prefill it. */
export const useConcierge = create<{ ctx: WaContext | null; setCtx: (c: WaContext | null) => void }>()((set) => ({
  ctx: null,
  setCtx: (ctx) => set({ ctx }),
}));
