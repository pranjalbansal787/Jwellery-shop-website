"use client";
import { create } from "zustand";

interface UiState {
  searchOpen: boolean;
  menuOpen: boolean;
  setSearch: (o: boolean) => void;
  setMenu: (o: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  searchOpen: false,
  menuOpen: false,
  setSearch: (searchOpen) => set({ searchOpen, menuOpen: false }),
  setMenu: (menuOpen) => set({ menuOpen }),
}));
