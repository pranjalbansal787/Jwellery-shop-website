import type { Product } from "./types";

export type CardProduct = Pick<Product, "id" | "slug" | "name" | "subtitle" | "metals" | "defaultMetal" | "defaultGem" | "badges" | "status" | "mediaSlug"> & { fromPrice: number };

/** Minimal projection sent to the client for listing cards (keeps RSC payloads small at scale). */
export function toCard(p: Product): CardProduct {
  return { id: p.id, slug: p.slug, name: p.name, subtitle: p.subtitle, metals: p.metals, defaultMetal: p.defaultMetal, defaultGem: p.defaultGem, badges: p.badges, status: p.status, mediaSlug: p.mediaSlug, fromPrice: Math.min(...p.variants.map((v) => v.price)) };
}
