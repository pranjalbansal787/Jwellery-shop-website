"use client";
import { createContext, useContext } from "react";
import type { Brand, ThemeId } from "@/lib/brand";
import { formatMoney } from "@/lib/money";

interface Ctx {
  brand: Brand;
  themeId: ThemeId;
  preview: ThemeId | null;
}

const BrandContext = createContext<Ctx | null>(null);

export function BrandProvider({ brand, themeId, preview, children }: Ctx & { children: React.ReactNode }) {
  return <BrandContext.Provider value={{ brand, themeId, preview }}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside BrandProvider");
  return ctx;
}

export function useMoney() {
  const { brand } = useBrand();
  return (inr: number) => formatMoney(inr, brand.currency);
}
