import type { Metadata } from "next";
import Link from "next/link";
import { searchCatalog } from "@/server/repo/catalog";
import { ProductCard } from "@/components/product/product-card";
import { toCard } from "@/lib/card";
import { Breadcrumbs } from "@/components/plp/listing";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 120);
  const r = q ? await searchCatalog(q, 48) : null;
  return (
    <div className="container-x pb-24 pt-10 md:pt-14">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Search", href: "/search" }]} />
      <p className="kicker mt-10 text-accent">Search</p>
      <h1 className="display-xl mt-4">{q ? <>“{q}”</> : "Search the maison"}</h1>
      {r && <p className="mt-4 text-muted">{r.products.length} {r.products.length === 1 ? "piece" : "pieces"}</p>}
      {r && (r.categories.length > 0 || r.collections.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {r.categories.map((c) => <Link key={c.slug} href={`/shop/${c.slug}`} className="chip">{c.name}</Link>)}
          {r.collections.map((c) => <Link key={c.slug} href={`/collections/${c.slug}`} className="chip">{c.name}</Link>)}
        </div>
      )}
      {r && r.products.length === 0 && (
        <div className="mt-16 max-w-xl border border-line p-10">
          <p className="display-md">Nothing matches yet</p>
          <p className="mt-3 text-muted">Try fewer words, a different stone, or let our advisors source it. Many designs can be made to order.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="btn btn-primary">Browse all</Link><Link href="/appointments?service=custom" className="btn btn-outline">Commission a piece</Link></div>
        </div>
      )}
      {r && r.products.length > 0 && (
        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {r.products.map((p, i) => <li key={p.id}><ProductCard p={toCard(p)} priority={i < 4} /></li>)}
        </ul>
      )}
    </div>
  );
}
