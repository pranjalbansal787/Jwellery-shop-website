"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCart, cartSubtotal } from "@/stores/cart";
import { useLockBody, useHydrated, useFocusTrap, useInert } from "@/lib/hooks";
import { IconClose, IconGift, IconMinus, IconPlus } from "@/components/ui/icons";
import { useMoney } from "@/components/providers/brand-provider";
import { METAL_LABEL, GEM_LABEL, deliveryEstimate } from "@/lib/labels";
import { usePathname } from "next/navigation";

export function CartDrawer({ suggestions }: { suggestions: { slug: string; name: string; price: number; image: string }[] }) {
  const { lines, open, setOpen, setQty, remove, giftWrap, setGift, giftMessage } = useCart();
  const hydrated = useHydrated();
  const money = useMoney();
  const pathname = usePathname();
  const [msgOpen, setMsgOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  useLockBody(open);
  useFocusTrap(open, panel);
  useInert(open);
  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setOpen]);

  const items = hydrated ? lines : [];
  const subtotal = cartSubtotal(items);
  const maxLead = Math.max(0, ...items.map((l) => l.leadDays));
  const inCart = new Set(items.map((l) => l.slug));
  const recs = suggestions.filter((s) => !inCart.has(s.slug)).slice(0, 2);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/55" style={{ zIndex: "var(--z-drawer)" as unknown as number }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="fixed inset-y-0 right-0 flex w-full max-w-[480px] flex-col border-l border-line bg-bg"
            style={{ zIndex: "var(--z-drawer)" as unknown as number }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-6">
              <p className="kicker">Your bag {items.length > 0 && <span className="text-muted">· {items.reduce((n, l) => n + l.qty, 0)}</span>}</p>
              <button onClick={() => setOpen(false)} className="-mr-2 flex h-11 w-11 items-center justify-center" aria-label="Close bag"><IconClose /></button>
            </div>
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
                <p className="display-md">Your bag is empty</p>
                <p className="mt-3 text-muted">Pieces you add will wait here, even if you leave and come back later.</p>
                <Link href="/shop" className="btn btn-primary mt-8">Explore jewellery</Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map((l) => (
                      <motion.li key={l.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex gap-4 py-6">
                        <Link href={l.slug ? `/products/${l.slug}` : "/configure"} className="relative h-28 w-24 shrink-0 stage">
                          <Image src={l.image} alt={l.name} fill sizes="96px" className="jewel-shot-sm" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex justify-between gap-3">
                            <Link href={l.slug ? `/products/${l.slug}` : "/configure"} className="font-display text-[1.2rem] leading-snug">{l.name}</Link>
                            <p className="shrink-0 text-[13.5px]">{money(l.unitPrice * l.qty)}</p>
                          </div>
                          <p className="mt-1 text-[12.5px] text-muted">
                            {l.purity} {METAL_LABEL[l.metal]}{l.gem !== "none" ? ` · ${GEM_LABEL[l.gem]}` : ""}{l.size ? ` · Size ${l.size}` : ""}
                          </p>
                          {l.engraving && <p className="text-[12.5px] text-muted">Engraving: “{l.engraving}”</p>}
                          <p className="text-[12px] text-muted">Delivery by {deliveryEstimate(l.leadDays)}</p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-line">
                              <button className="flex h-9 w-9 items-center justify-center disabled:opacity-30" onClick={() => setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} aria-label="Decrease quantity"><IconMinus size={14} /></button>
                              <span className="w-6 text-center text-[13px]" aria-live="polite">{l.qty}</span>
                              <button className="flex h-9 w-9 items-center justify-center disabled:opacity-30" onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= 5} aria-label="Increase quantity"><IconPlus size={14} /></button>
                            </div>
                            <button onClick={() => remove(l.key)} className="link-line text-[12px] text-muted">Remove</button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {recs.length > 0 && (
                    <li className="py-6">
                      <p className="kicker text-muted">Complete the set</p>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {recs.map((r) => (
                          <Link key={r.slug} href={`/products/${r.slug}`} className="group" data-cursor="view">
                            <div className="relative aspect-square stage overflow-hidden"><Image src={r.image} alt="" fill sizes="180px" className="jewel-shot" /></div>
                            <p className="mt-2 text-[12.5px]">{r.name}</p>
                            <p className="text-[12px] text-muted">{money(r.price)}</p>
                          </Link>
                        ))}
                      </div>
                    </li>
                  )}
                </ul>
                <div className="border-t border-line px-6 py-5">
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-2.5"><IconGift size={18} /> Signature gift packaging</span>
                    <input type="checkbox" checked={giftWrap} onChange={(e) => setGift(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                  </label>
                  {giftWrap && (
                    <div className="mt-2">
                      {!msgOpen && !giftMessage ? (
                        <button onClick={() => setMsgOpen(true)} className="link-line text-[12.5px] text-muted">Add a handwritten card</button>
                      ) : (
                        <textarea value={giftMessage} onChange={(e) => setGift(true, e.target.value.slice(0, 180))} rows={2} placeholder="Your message (180 characters)" className="field-box mt-1 resize-none" aria-label="Gift message" />
                      )}
                    </div>
                  )}
                  <div className="mt-5 flex items-baseline justify-between">
                    <span className="kicker">Subtotal</span>
                    <span className="font-display text-2xl">{money(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">Inclusive of 3% GST · Complimentary insured delivery · Estimated by {deliveryEstimate(maxLead)}</p>
                  <Link href="/checkout" className="btn btn-primary mt-5 w-full" onClick={() => setOpen(false)}>Proceed to checkout</Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
