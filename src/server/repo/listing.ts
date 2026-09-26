import "server-only";
import { listProducts, type ProductFilters } from "./catalog";
import { FACETS, readList, type FacetKey, type SearchParams } from "@/lib/filters";
import type { GemKey, MetalKey, Occasion } from "@/lib/types";

export const PAGE_SIZE = 12;

export function filtersFromParams(sp: SearchParams, base: ProductFilters = {}): ProductFilters {
  const f: ProductFilters = { ...base };
  const metal = readList(sp, "metal") as MetalKey[];
  const gem = readList(sp, "gem") as GemKey[];
  const occasion = readList(sp, "occasion") as Occasion[];
  if (metal.length) f.metal = metal;
  if (gem.length) f.gem = gem;
  if (occasion.length) f.occasion = occasion;
  const price = readList(sp, "price")[0];
  if (price && /^\d*-\d*$/.test(price)) f.price = price;
  const av = readList(sp, "availability")[0];
  if (av === "ready" || av === "made_to_order") f.availability = av;
  const sort = readList(sp, "sort")[0];
  if (sort === "newest" || sort === "price-asc" || sort === "price-desc") f.sort = sort;
  return f;
}

/** Facet counts computed with every filter applied except the facet itself (standard disjunctive faceting). */
export async function facetCounts(f: ProductFilters) {
  const out: Record<FacetKey, Record<string, number>> = { metal: {}, gem: {}, price: {}, occasion: {}, availability: {} };
  for (const key of Object.keys(FACETS) as FacetKey[]) {
    const without = { ...f, [key]: undefined } as ProductFilters;
    for (const [value] of FACETS[key].options) {
      const probe: ProductFilters = { ...without };
      if (key === "metal") probe.metal = [value as MetalKey];
      if (key === "gem") probe.gem = [value as GemKey];
      if (key === "occasion") probe.occasion = [value as Occasion];
      if (key === "price") probe.price = value;
      if (key === "availability") probe.availability = value as "ready";
      out[key][value] = (await listProducts(probe)).length;
    }
  }
  return out;
}
