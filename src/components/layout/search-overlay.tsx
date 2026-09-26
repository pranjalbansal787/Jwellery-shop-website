"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useUi } from "@/stores/ui";
import { useProfile } from "@/stores/profile";
import { useLockBody, useHydrated, useFocusTrap, useInert } from "@/lib/hooks";
import { IconArrow, IconClose, IconSearch } from "@/components/ui/icons";
import { useMoney } from "@/components/providers/brand-provider";
import { track } from "@/lib/analytics";

type Result = {
  products: { slug: string; name: string; subtitle: string; price: number; image: string }[];
  categories: { slug: string; name: string }[];
  collections: { slug: string; name: string }[];
  parsed: { maxPrice?: number; minPrice?: number; metal?: string; gem?: string; categorySlug?: string } | null;
};

const POPULAR = ["Diamond earrings", "Gold ring under 50000", "Anniversary gift", "Emerald necklace", "Tennis bracelet", "Engagement rings"];

export function SearchOverlay() {
  const { searchOpen, setSearch } = useUi();
  const { recentSearches, pushSearch } = useProfile();
  const hydrated = useHydrated();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const money = useMoney();
  useLockBody(searchOpen);
  useFocusTrap(searchOpen, panel, { autofocus: false });
  useInert(searchOpen);

  useEffect(() => setSearch(false), [pathname, setSearch]);
  useEffect(() => {
    if (searchOpen) setTimeout(() => input.current?.focus(), 80);
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearch(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [searchOpen, setSearch]);

  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        setRes(await r.json());
      } catch { /* aborted */ } finally { setLoading(false); }
    }, 160);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const submit = (term: string) => {
    const t = term.trim();
    if (!t) return;
    pushSearch(t);
    track("search_performed", { q: t });
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  const chips = res?.parsed ? [
    res.parsed.categorySlug && res.parsed.categorySlug.replace(/-/g, " "),
    res.parsed.metal && `${res.parsed.metal} ${res.parsed.metal === "platinum" ? "" : "gold"}`.trim(),
    res.parsed.gem,
    res.parsed.maxPrice && `under ${money(res.parsed.maxPrice)}`,
    res.parsed.minPrice && `over ${money(res.parsed.minPrice)}`,
  ].filter(Boolean) as string[] : [];

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          className="fixed inset-0 overflow-y-auto bg-bg/97 backdrop-blur-sm"
          style={{ zIndex: "var(--z-overlay)" as unknown as number }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="container-x flex h-[var(--header-h)] items-center justify-end">
            <button onClick={() => setSearch(false)} className="-mr-2 flex h-11 w-11 items-center justify-center" aria-label="Close search"><IconClose size={22} /></button>
          </div>
          <div className="container-x max-w-5xl pb-20">
            <form onSubmit={(e) => { e.preventDefault(); submit(q); }} className="flex items-center gap-4 border-b border-line-strong pb-3" role="search">
              <IconSearch size={26} className="shrink-0 text-muted" />
              <label htmlFor="site-search" className="sr-only">Search jewellery</label>
              <input
                id="site-search"
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Try “emerald necklace” or “gold ring under 50000”"
                className="w-full bg-transparent py-2 font-display focus-visible:outline-none text-[clamp(1.6rem,4vw,3rem)] outline-none placeholder:text-muted/50"
                autoComplete="off"
                enterKeyHint="search"
              />
              {q && <button type="submit" className="btn btn-sm btn-primary shrink-0">Search</button>}
            </form>
            {chips.length > 0 && (
              <p className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                Understood as:
                {chips.map((c) => <span key={c} className="border border-line px-2.5 py-1 capitalize text-fg">{c}</span>)}
              </p>
            )}
            {!res && (
              <div className="mt-12 grid gap-12 md:grid-cols-2">
                {hydrated && recentSearches.length > 0 && (
                  <div>
                    <p className="kicker text-muted">Recent</p>
                    <ul className="mt-4 space-y-3">{recentSearches.map((s) => <li key={s}><button onClick={() => submit(s)} className="link-line text-lg">{s}</button></li>)}</ul>
                  </div>
                )}
                <div>
                  <p className="kicker text-muted">Popular searches</p>
                  <ul className="mt-4 space-y-3">{POPULAR.map((s) => <li key={s}><button onClick={() => { setQ(s); }} className="link-line text-lg">{s}</button></li>)}</ul>
                </div>
              </div>
            )}
            {res && (
              <div className="mt-10 grid gap-10 md:grid-cols-[1fr_2fr]">
                <div className="space-y-8">
                  {res.categories.length > 0 && (
                    <div><p className="kicker text-muted">Categories</p><ul className="mt-3 space-y-2">{res.categories.map((c) => <li key={c.slug}><Link className="link-line" href={`/shop/${c.slug}`}>{c.name}</Link></li>)}</ul></div>
                  )}
                  {res.collections.length > 0 && (
                    <div><p className="kicker text-muted">Collections</p><ul className="mt-3 space-y-2">{res.collections.map((c) => <li key={c.slug}><Link className="link-line" href={`/collections/${c.slug}`}>{c.name}</Link></li>)}</ul></div>
                  )}
                  {res.products.length > 0 && <button onClick={() => submit(q)} className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] link-line">See all results <IconArrow size={16} /></button>}
                </div>
                <div aria-live="polite">
                  {res.products.length === 0 && !loading ? (
                    <div className="border border-line p-8">
                      <p className="display-sm">Nothing matches “{q}” yet.</p>
                      <p className="mt-2 text-muted">Our advisors can source or make it for you. Try a broader term, or browse <Link href="/shop" className="link-line text-fg">all jewellery</Link>.</p>
                    </div>
                  ) : (
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {res.products.map((p) => (
                        <li key={p.slug}>
                          <Link href={`/products/${p.slug}`} className="group block" data-cursor="view">
                            <div className="relative aspect-[4/5] stage overflow-hidden">
                              <Image src={p.image} alt={p.name} fill sizes="200px" className="jewel-shot" />
                            </div>
                            <p className="mt-2 text-[13.5px]">{p.name}</p>
                            <p className="text-[12.5px] text-muted">{money(p.price)}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
