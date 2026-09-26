"use server";
import { listProducts, fromPrice } from "../repo/catalog";
import { toCard } from "@/lib/card";
import type { MetalKey, Occasion } from "@/lib/types";

export interface GiftAnswers { recipient: "her" | "him" | "couple" | "self"; occasion: Occasion | "just-because"; budget: string; style: "classic" | "statement" | "minimal" | "colour"; metal: MetalKey | "any" }

/** Deterministic curation over real catalogue data — never invents products or prices. */
export async function findGifts(a: GiftAnswers) {
  const [min, max] = a.budget.split("-").map((x) => (x ? Number(x) : undefined));
  const all = await listProducts();
  const scored = all
    .filter((p) => p.status !== "out_of_stock")
    .filter((p) => (a.recipient === "him" ? p.gender !== "women" : a.recipient === "her" ? p.gender !== "men" : true))
    .filter((p) => { const price = fromPrice(p); return (min === undefined || price >= min) && (max === undefined || price <= max); })
    .map((p) => {
      let s = 0;
      if (a.occasion !== "just-because" && p.occasions.includes(a.occasion)) s += 4;
      if (p.occasions.includes("gifting")) s += 2;
      if (a.metal !== "any" && p.metals.includes(a.metal)) s += 3;
      if (a.style === "colour" && ["emerald", "ruby", "sapphire"].includes(p.defaultGem)) s += 4;
      if (a.style === "minimal" && (p.defaultGem === "none" || ["studs", "pendant", "band"].includes(p.design))) s += 3;
      if (a.style === "statement" && ["cocktail", "riviere", "tennis", "drops"].includes(p.design)) s += 4;
      if (a.style === "classic" && ["solitaire", "studs", "tennis", "eternity", "pendant"].includes(p.design) && p.defaultGem === "diamond") s += 3;
      if (p.badges.includes("BESTSELLER")) s += 1;
      return { p, s };
    })
    .sort((x, y) => y.s - x.s)
    .slice(0, 6);
  return scored.map(({ p }) => ({ ...toCard(p), metal: a.metal !== "any" && p.metals.includes(a.metal) ? a.metal : p.defaultMetal }));
}
