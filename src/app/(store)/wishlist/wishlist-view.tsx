"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlist } from "@/stores/wishlist";
import { useHydrated } from "@/lib/hooks";
import { ProductCard } from "@/components/product/product-card";
import type { CardProduct } from "@/lib/card";
import { useBrand } from "@/components/providers/brand-provider";
import { waLink, waMessage } from "@/lib/whatsapp";
import { IconWhatsApp, IconCheck } from "@/components/ui/icons";

export function WishlistView() {
  const hydrated = useHydrated();
  const items = useWishlist((s) => s.items);
  const { brand } = useBrand();
  const [cards, setCards] = useState<CardProduct[] | null>(null);
  const [copied, setCopied] = useState(false);
  const ids = items.map((i) => i.productId).join(",");

  useEffect(() => {
    if (!hydrated) return;
    if (!ids) { setCards([]); return; }
    fetch(`/api/products?ids=${ids}`).then((r) => r.json()).then((list: CardProduct[]) => setCards(ids.split(",").map((id) => list.find((c) => c.id === id)).filter(Boolean) as CardProduct[]));
  }, [ids, hydrated]);

  const shareUrl = typeof window !== "undefined" && items.length ? `${window.location.origin}/wishlist/shared?items=${items.map((i) => `${i.slug}:${i.metal}`).join(",")}` : "";

  return (
    <div className="container-x py-12 md:py-20">
      <p className="kicker text-accent">Saved pieces</p>
      <h1 className="display-xl mt-4">Wishlist</h1>
      {hydrated && items.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn btn-outline btn-sm" target="_blank" rel="noopener" href={waLink(brand.whatsapp, waMessage("I'd like advice on my wishlist", brand.name) + "\n\n" + items.map((i) => `${location.origin}/products/${i.slug}?metal=${i.metal}`).join("\n"))}><IconWhatsApp size={15} /> Ask an advisor</a>
          <button className="btn btn-outline btn-sm" onClick={async () => { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? <><IconCheck size={14} /> Link copied</> : "Share wishlist"}</button>
        </div>
      )}
      <p className="mt-4 max-w-lg text-[13px] text-muted">Saved on this device. Sign in (coming with customer accounts) to keep your wishlist everywhere and get notified when a saved piece changes price or comes back in stock.</p>
      {!hydrated || cards === null ? (
        <ul className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <li key={i}><div className="skeleton aspect-[4/5]" /><div className="skeleton mt-4 h-4 w-2/3" /></li>)}</ul>
      ) : cards.length === 0 ? (
        <div className="mt-16 max-w-md">
          <p className="display-md">Nothing saved yet</p>
          <p className="mt-3 text-muted">Tap the heart on any piece to keep it here while you decide.</p>
          <Link href="/shop" className="btn btn-primary mt-8">Explore jewellery</Link>
        </div>
      ) : (
        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
          {cards.map((c) => <li key={c.id}><ProductCard p={c} /><Link href={`/products/${c.slug}`} className="btn btn-outline btn-sm mt-4 w-full">Choose size & add to bag</Link></li>)}
        </ul>
      )}
    </div>
  );
}
