import type { GemKey, MetalKey, Occasion } from "./types";

export const FACETS = {
  metal: { label: "Metal", options: [["yellow", "Yellow Gold"], ["white", "White Gold"], ["rose", "Rose Gold"], ["platinum", "Platinum"]] as [MetalKey, string][] },
  gem: { label: "Gemstone", options: [["diamond", "Diamond"], ["emerald", "Emerald"], ["ruby", "Ruby"], ["sapphire", "Sapphire"], ["none", "Plain metal"]] as [GemKey, string][] },
  price: { label: "Price", options: [["0-100000", "Under ₹1 lakh"], ["100000-250000", "₹1 – 2.5 lakh"], ["250000-500000", "₹2.5 – 5 lakh"], ["500000-", "Above ₹5 lakh"]] as [string, string][] },
  occasion: { label: "Occasion", options: [["engagement", "Engagement"], ["wedding", "Wedding"], ["anniversary", "Anniversary"], ["festive", "Festive"], ["gifting", "Gifting"], ["birthday", "Birthday"], ["everyday", "Everyday"]] as [Occasion, string][] },
  availability: { label: "Availability", options: [["ready", "Ready to ship"], ["made_to_order", "Made to order"]] as [string, string][] },
} as const;

export type FacetKey = keyof typeof FACETS;
export const MULTI: FacetKey[] = ["metal", "gem", "occasion"];

export const SORTS = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
] as const;

export type SearchParams = Record<string, string | string[] | undefined>;

export function readList(sp: SearchParams, key: string) {
  const v = sp[key];
  if (!v) return [];
  return (Array.isArray(v) ? v.join(",") : v).split(",").filter(Boolean);
}
