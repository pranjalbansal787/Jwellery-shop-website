import "server-only";
import { db } from "../db";
import type { Category, GemKey, MetalKey, Occasion, Product } from "@/lib/types";
import { parseQuery, type ParsedQuery } from "@/lib/search";

export interface ProductFilters {
  category?: string;
  collection?: string;
  metal?: MetalKey[];
  gem?: GemKey[];
  occasion?: Occasion[];
  price?: string; // "min-max"
  availability?: "ready" | "made_to_order";
  gender?: "men" | "women";
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
  ids?: string[];
}

export const fromPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));

export const PRICE_BUCKETS = [
  { value: "0-100000", label: "Under ₹1,00,000" },
  { value: "100000-250000", label: "₹1,00,000 – ₹2,50,000" },
  { value: "250000-500000", label: "₹2,50,000 – ₹5,00,000" },
  { value: "500000-", label: "Above ₹5,00,000" },
];

export async function getCategories(): Promise<Category[]> {
  return db.categories.filter((c) => c.published).sort((a, b) => a.position - b.position);
}

export async function getCategory(slug: string) {
  return db.categories.find((c) => c.slug === slug && c.published) ?? null;
}

function descendantIds(catId: string): string[] {
  const kids = db.categories.filter((c) => c.parentId === catId).map((c) => c.id);
  return [catId, ...kids.flatMap(descendantIds)];
}

export async function getCollections() {
  return db.collections.filter((c) => c.published).sort((a, b) => a.position - b.position);
}

export async function getCollection(slug: string) {
  return db.collections.find((c) => c.slug === slug && c.published) ?? null;
}

const published = () => db.products.filter((p) => p.visibility === "published");

export async function listProducts(f: ProductFilters = {}) {
  let list = published();
  if (f.ids) list = list.filter((p) => f.ids!.includes(p.id));
  if (f.category) {
    const cat = db.categories.find((c) => c.slug === f.category);
    if (cat) {
      const ids = descendantIds(cat.id);
      list = list.filter((p) => ids.includes(p.categoryId));
    }
  }
  if (f.collection) {
    const col = db.collections.find((c) => c.slug === f.collection || c.id === f.collection);
    if (col) list = list.filter((p) => p.collectionIds.includes(col.id));
  }
  if (f.metal?.length) list = list.filter((p) => p.metals.some((m) => f.metal!.includes(m)));
  if (f.gem?.length) list = list.filter((p) => p.gems.some((g) => f.gem!.includes(g)) || (f.gem!.includes("diamond") && p.diamond));
  if (f.occasion?.length) list = list.filter((p) => p.occasions.some((o) => f.occasion!.includes(o)));
  if (f.gender) list = list.filter((p) => p.gender === f.gender || p.gender === "unisex");
  if (f.availability === "ready") list = list.filter((p) => p.status === "in_stock" || p.status === "low_stock");
  if (f.availability === "made_to_order") list = list.filter((p) => p.status === "made_to_order" || p.status === "preorder");
  if (f.price) {
    const [min, max] = f.price.split("-").map((x) => (x ? Number(x) : undefined));
    list = list.filter((p) => {
      const price = fromPrice(p);
      return (min === undefined || price >= min) && (max === undefined || price <= max);
    });
  }
  const sorted = [...list];
  switch (f.sort) {
    case "price-asc": sorted.sort((a, b) => fromPrice(a) - fromPrice(b)); break;
    case "price-desc": sorted.sort((a, b) => fromPrice(b) - fromPrice(a)); break;
    case "newest": sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    default:
      sorted.sort((a, b) => score(b) - score(a));
  }
  return sorted;
}

/** "Featured" ranking: merchandising badges, stock, then recency. Production: admin-pinned + sales velocity. */
function score(p: Product) {
  return (p.badges.includes("BESTSELLER") ? 30 : 0) + (p.badges.includes("NEW") ? 20 : 0) + (p.badges.includes("EXCLUSIVE") ? 12 : 0) +
    (p.status === "out_of_stock" ? -40 : 0) + (p.rating?.count ?? 0) / 10;
}

export async function getProduct(slug: string) {
  return published().find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string) {
  return db.products.find((p) => p.id === id) ?? null;
}

export async function relatedProducts(p: Product, limit = 4) {
  return published()
    .filter((x) => x.id !== p.id)
    .map((x) => ({ x, s: (x.categoryId === p.categoryId ? 3 : 0) + x.collectionIds.filter((c) => p.collectionIds.includes(c)).length * 2 + (x.defaultGem === p.defaultGem ? 1 : 0) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.x);
}

/** "Complete the set": same collection, different category. */
export async function completeTheSet(p: Product, limit = 3) {
  return published()
    .filter((x) => x.id !== p.id && x.categoryId !== p.categoryId && x.collectionIds.some((c) => p.collectionIds.includes(c)))
    .slice(0, limit);
}

export interface SearchResult {
  parsed: ParsedQuery;
  products: Product[];
  categories: Category[];
  collections: { slug: string; name: string }[];
}

export async function searchCatalog(q: string, limit = 24): Promise<SearchResult> {
  const parsed = parseQuery(q);
  const cats = db.categories.filter((c) => parsed.terms.some((t) => c.name.toLowerCase().includes(t)) || c.slug === parsed.categorySlug);
  const cols = db.collections.filter((c) => parsed.terms.some((t) => c.name.toLowerCase().includes(t)) || (parsed.occasion === "festive" && c.id === "festive-edit") || (parsed.occasion === "wedding" && c.id === "bridal-2027") || (parsed.occasion === "gifting" && c.id === "gifts"));
  let list = published();
  if (parsed.categorySlug) {
    const cat = db.categories.find((c) => c.slug === parsed.categorySlug)!;
    const ids = descendantIds(cat.id);
    list = list.filter((p) => ids.includes(p.categoryId));
  }
  if (parsed.metal) list = list.filter((p) => p.metals.includes(parsed.metal!));
  if (parsed.gem) list = list.filter((p) => p.gems.includes(parsed.gem!) || (parsed.gem === "diamond" && p.diamond));
  if (parsed.occasion) list = list.filter((p) => p.occasions.includes(parsed.occasion!));
  if (parsed.gender) list = list.filter((p) => p.gender === parsed.gender || p.gender === "unisex");
  if (parsed.maxPrice) list = list.filter((p) => fromPrice(p) <= parsed.maxPrice!);
  if (parsed.minPrice) list = list.filter((p) => fromPrice(p) >= parsed.minPrice!);
  if (parsed.terms.length) {
    const scored = list
      .map((p) => {
        const hay = `${p.name} ${p.subtitle} ${p.collectionIds.join(" ")} ${p.design}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        const s = parsed.terms.reduce((acc, t) => acc + (hay.includes(t) ? 2 : fuzzy(hay, t) ? 1 : 0), 0);
        return { p, s };
      })
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);
    // If structured filters matched but free text didn't, keep structured results.
    list = scored.length ? scored.map((r) => r.p) : parsed.categorySlug || parsed.gem || parsed.metal || parsed.occasion ? list : [];
  }
  const results = list.slice(0, limit);
  db.searches.unshift({ q, results: results.length, at: new Date().toISOString() });
  db.searches.length = Math.min(db.searches.length, 500);
  return { parsed, products: results, categories: cats.slice(0, 3), collections: cols.slice(0, 3).map((c) => ({ slug: c.slug, name: c.name })) };
}

/** Tolerates one typo for terms of 5+ chars ("emrald", "saphire"). */
function fuzzy(hay: string, term: string) {
  if (term.length < 5) return false;
  return hay.split(/\s+/).some((w) => {
    if (Math.abs(w.length - term.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < w.length && j < term.length) {
      if (w[i] === term[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (w.length > term.length) i++;
      else if (w.length < term.length) j++;
      else { i++; j++; }
    }
    return edits + (w.length - i) + (term.length - j) <= 1;
  });
}
