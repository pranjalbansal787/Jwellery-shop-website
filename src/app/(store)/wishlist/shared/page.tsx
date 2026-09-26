import type { Metadata } from "next";
import { listProducts } from "@/server/repo/catalog";
import { ProductCard } from "@/components/product/product-card";
import { toCard } from "@/lib/card";

export const metadata: Metadata = { title: "A shared wishlist", robots: { index: false } };

export default async function SharedWishlist({ searchParams }: { searchParams: Promise<{ items?: string }> }) {
  const raw = ((await searchParams).items ?? "").split(",").slice(0, 30);
  const slugs = raw.map((r) => r.split(":")[0]);
  const all = await listProducts();
  const products = slugs.map((s) => all.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => !!p);
  return (
    <div className="container-x py-12 md:py-20">
      <p className="kicker text-accent">Shared with you</p>
      <h1 className="display-xl mt-4">A wishlist, for inspiration</h1>
      <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => <li key={p.id}><ProductCard p={toCard(p)} /></li>)}
      </ul>
      {products.length === 0 && <p className="mt-10 text-muted">This wishlist link is empty or has expired.</p>}
    </div>
  );
}
