"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Lightweight guest profile (saved ring size, recent searches, recently viewed). Synced to `customers` on login. */
interface ProfileState {
  ringSize: string | null;
  recentSearches: string[];
  recentlyViewed: string[];
  setRingSize: (s: string | null) => void;
  pushSearch: (q: string) => void;
  pushViewed: (id: string) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      ringSize: null,
      recentSearches: [],
      recentlyViewed: [],
      setRingSize: (ringSize) => set({ ringSize }),
      pushSearch: (q) => set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 6) })),
      pushViewed: (id) => set((s) => ({ recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 12) })),
    }),
    { name: "profile-v1", storage: createJSONStorage(() => localStorage) },
  ),
);
