import type { GemKey, MetalKey } from "./jewels/builders";

export type RenderView = "front" | "detail";

/** Path to a pre-rendered studio shot. In production this becomes a CDN URL from product_media. */
export function renderPath(slug: string, metal: MetalKey, gem: GemKey, view: RenderView = "front") {
  return `/renders/${slug}--${metal}--${gem}--${view}.webp`;
}

/**
 * Demo renders exist for every metal with the default gem, every gem with the default metal,
 * and a detail angle for the default combination. Anything else falls back sensibly.
 */
export function productImage(
  p: { slug: string; mediaSlug?: string; defaultMetal: MetalKey; defaultGem: GemKey },
  metal: MetalKey = p.defaultMetal,
  gem: GemKey = p.defaultGem,
  view: RenderView = "front",
) {
  const slug = p.mediaSlug ?? p.slug;
  if (view === "detail") return renderPath(slug, p.defaultMetal, p.defaultGem, "detail");
  if (gem === p.defaultGem) return renderPath(slug, metal, gem, "front");
  return renderPath(slug, p.defaultMetal, gem, "front");
}
