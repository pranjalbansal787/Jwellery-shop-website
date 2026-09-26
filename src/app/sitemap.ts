import type { MetadataRoute } from "next";
import { getCategories, getCollections, listProducts } from "@/server/repo/catalog";
import { listStores } from "@/server/repo/crm";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cats, cols, stores] = await Promise.all([listProducts(), getCategories(), getCollections(), listStores()]);
  const now = new Date();
  return [
    ...["", "/shop", "/collections", "/stores", "/appointments", "/ring-size", "/gift-finder", "/configure", "/education"].map((p) => ({ url: `${SITE}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...cats.map((c) => ({ url: `${SITE}/shop/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...cols.map((c) => ({ url: `${SITE}/collections/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${SITE}/products/${p.slug}`, lastModified: new Date(p.createdAt), changeFrequency: "weekly" as const, priority: 0.9, images: [`${SITE}/renders/${p.slug}--${p.defaultMetal}--${p.defaultGem}--front.webp`] })),
    ...stores.map((s) => ({ url: `${SITE}/stores/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
