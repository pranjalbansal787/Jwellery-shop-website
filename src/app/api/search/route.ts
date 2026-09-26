import { NextResponse } from "next/server";
import { searchCatalog, fromPrice } from "@/server/repo/catalog";
import { productImage } from "@/lib/media";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 120) ?? "";
  if (q.trim().length < 2) return NextResponse.json({ products: [], categories: [], collections: [], parsed: null });
  const r = await searchCatalog(q, 6);
  return NextResponse.json({
    parsed: r.parsed,
    categories: r.categories.map((c) => ({ slug: c.slug, name: c.name })),
    collections: r.collections,
    products: r.products.map((p) => ({ slug: p.slug, name: p.name, subtitle: p.subtitle, price: fromPrice(p), image: productImage(p) })),
  });
}
