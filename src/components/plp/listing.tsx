import Link from "next/link";
import { FilterBar } from "./filter-bar";
import { ProductCard } from "@/components/product/product-card";
import { toCard } from "@/lib/card";
import { listProducts, type ProductFilters } from "@/server/repo/catalog";
import { facetCounts, filtersFromParams, PAGE_SIZE } from "@/server/repo/listing";
import type { SearchParams } from "@/lib/filters";

/**
 * Shared PLP body: server-filtered results, disjunctive facet counts, URL-persisted state,
 * and "load more" pagination via ?page=N (crawlable, shareable, back-button safe).
 * At scale this delegates to the search engine (Meilisearch) with the same filter contract.
 */
export async function Listing({ base, searchParams, basePath }: { base: ProductFilters; searchParams: SearchParams; basePath: string }) {
  const filters = filtersFromParams(searchParams, base);
  const [all, counts] = await Promise.all([listProducts(filters), facetCounts(filters)]);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const shown = all.slice(0, page * PAGE_SIZE);
  const nextParams = new URLSearchParams(Object.entries(searchParams).flatMap(([k, v]) => (v === undefined ? [] : [[k, Array.isArray(v) ? v.join(",") : v]])));
  nextParams.set("page", String(page + 1));
  return (
    <FilterBar counts={counts} total={all.length}>
      <div className="container-x py-10 md:py-14">
        {all.length === 0 ? (
          <div className="mx-auto max-w-lg py-24 text-center">
            <p className="display-md">No pieces match these filters</p>
            <p className="mt-3 text-muted">Try removing a filter, or ask an advisor. Many designs can be made to order in another metal or stone.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href={basePath} className="btn btn-primary">Clear filters</Link>
              <Link href="/appointments?service=custom" className="btn btn-outline">Custom design</Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
              {shown.map((p, i) => (
                <li key={p.id}>
                  <ProductCard p={toCard(p)} priority={i < 4} />
                </li>
              ))}
            </ul>
            <div className="mt-16 flex flex-col items-center gap-4">
              <p className="text-[12px] text-muted">Showing {shown.length} of {all.length}</p>
              <div className="h-px w-40 bg-line"><div className="h-px bg-accent" style={{ width: `${(shown.length / all.length) * 100}%` }} /></div>
              {shown.length < all.length && (
                <Link href={`${basePath}?${nextParams.toString()}`} scroll={false} className="btn btn-outline mt-2" replace>
                  Load more
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </FilterBar>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12px] text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={it.href} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {i === items.length - 1 ? <span aria-current="page" className="text-fg">{it.name}</span> : <Link href={it.href} className="link-line">{it.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
