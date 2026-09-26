"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ViewerPanel } from "./viewer-panel";
import { RingSizer } from "./ring-sizer";
import { TryOn } from "./try-on";
import { Price } from "@/components/product/price";
import { WishButton } from "@/components/product/wish-button";
import { Dialog } from "@/components/ui/dialog";
import { IconCalendar, IconChevron, IconRuler, IconShield, IconTruck, IconWhatsApp, IconCamera, IconSparkle } from "@/components/ui/icons";
import { useBrand, useMoney } from "@/components/providers/brand-provider";
import { useCart } from "@/stores/cart";
import { useConcierge } from "@/stores/concierge";
import { useProfile } from "@/stores/profile";
import { useHydrated } from "@/lib/hooks";
import { productImage } from "@/lib/media";
import { GEM_LABEL, GEM_SWATCH, METAL_LABEL, METAL_SWATCH, STOCK_LABEL, deliveryEstimate } from "@/lib/labels";
import { waLink, waMessage } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import { flyToBag } from "@/lib/fly-to-bag";
import type { GemKey, MetalKey, Product, Purity } from "@/lib/types";
import { cn } from "@/lib/cn";

type Media = { kind: "image"; src: string; alt: string } | { kind: "3d" };

export function ProductExperience({ p, collectionName, initialMetal }: { p: Product; collectionName: string | null; initialMetal: MetalKey }) {
  const { brand } = useBrand();
  const money = useMoney();
  const router = useRouter();
  const hydrated = useHydrated();
  const add = useCart((s) => s.add);
  const setCtx = useConcierge((s) => s.setCtx);
  const { ringSize, pushViewed } = useProfile();

  const [metal, setMetal] = useState<MetalKey>(initialMetal);
  const [purity, setPurity] = useState<Purity>(initialMetal === "platinum" ? "PT950" : p.purities[0]);
  const [gem, setGem] = useState<GemKey>(p.defaultGem);
  const [size, setSize] = useState<string | null>(null);
  const [engrave, setEngrave] = useState(false);
  const [engraving, setEngraving] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [media, setMedia] = useState(0);
  const [dialog, setDialog] = useState<null | "size" | "tryon" | "zoom">(null);
  const [adding, setAdding] = useState(false);
  const mainImg = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const purities: Purity[] = metal === "platinum" ? ["PT950"] : p.purities;
  const variant = useMemo(() => p.variants.find((v) => v.metal === metal && v.purity === purity && v.gem === gem) ?? p.variants.find((v) => v.metal === metal) ?? p.variants[0], [p.variants, metal, purity, gem]);
  const orderable = p.status !== "out_of_stock" && p.status !== "discontinued";
  const readyToShip = variant.stock > 0;
  const statusLabel = p.status === "in_stock" && !readyToShip ? "Made to order" : STOCK_LABEL[p.status];

  const gallery: Media[] = [
    { kind: "image", src: productImage(p, metal, gem), alt: `${p.name} in ${METAL_LABEL[metal]}` },
    { kind: "image", src: productImage(p, metal, gem, "detail"), alt: `${p.name}, detail view` },
    { kind: "3d" },
  ];

  // effects: analytics + concierge context + saved ring size + recently viewed
  useEffect(() => { track("product_viewed", { productId: p.id, sku: p.sku }); pushViewed(p.id); }, [p.id, p.sku, pushViewed]);
  useEffect(() => { if (hydrated && ringSize && p.sizes?.includes(ringSize) && !size) setSize(ringSize); }, [hydrated, ringSize, p.sizes, size]);
  useEffect(() => {
    setCtx({ productName: p.name, sku: variant.sku, url: origin ? `${origin}/products/${p.slug}?metal=${metal}` : undefined, metal: `${purity} ${METAL_LABEL[metal]}`, size: size ?? undefined });
    return () => setCtx(null);
  }, [p.name, p.slug, variant.sku, metal, purity, size, setCtx, origin]);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chooseMetal = (m: MetalKey) => {
    setMetal(m);
    if (m === "platinum") setPurity("PT950");
    else if (purity === "PT950") setPurity(p.purities[0]);
    track("variant_selected", { productId: p.id, metal: m });
    const url = new URL(window.location.href);
    url.searchParams.set("metal", m);
    window.history.replaceState(null, "", url);
  };

  const addToBag = async (buyNow = false) => {
    if (p.sizes && !size) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setAdding(true);
    const image = productImage(p, metal, gem);
    if (!buyNow) await flyToBag(mainImg.current, image);
    add({ productId: p.id, slug: p.slug, name: p.name, variantId: variant.id, sku: variant.sku, metal, purity, gem, size: size ?? undefined, engraving: engrave && engraving.trim() ? engraving.trim() : undefined, unitPrice: variant.price, image, leadDays: variant.leadDays + (engrave && engraving ? 3 : 0) });
    track("cart_added", { productId: p.id, sku: variant.sku, price: variant.price });
    setAdding(false);
    if (buyNow) {
      useCart.getState().setOpen(false);
      router.push("/checkout");
    }
  };

  const specs: [string, string][] = [
    ["Metal", `${purity} ${METAL_LABEL[metal]}`],
    ["Approx. metal weight", `${variant.weightGrams} g`],
    ...(p.diamond ? ([["Diamond weight", `${p.diamond.totalCarat.toFixed(2)} ct total`], ["Shape", p.diamond.shape[0].toUpperCase() + p.diamond.shape.slice(1)], ["Colour · Clarity", `${p.diamond.colour} · ${p.diamond.clarity}`], ["Cut", p.diamond.cut], ["Certificate", `${p.diamond.certificate} · No. ${p.diamond.certificateNo}`]] as [string, string][]) : []),
    ...(gem !== "diamond" && gem !== "none" ? ([["Gemstone", GEM_LABEL[gem]]] as [string, string][]) : []),
    ["Hallmark", p.hallmark],
    ["SKU", variant.sku],
  ];

  return (
    <>
      <div className="container-x grid gap-10 pb-16 lg:grid-cols-12 lg:gap-14">
        {/* ------------------------------------------------ gallery */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <div ref={mainImg} className="relative aspect-[4/5] overflow-hidden stage md:aspect-square">
              <AnimatePresence mode="wait" initial={false}>
                {gallery[media].kind === "image" ? (
                  <motion.button
                    key={(gallery[media] as { src: string }).src}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    className="absolute inset-0 block h-full w-full"
                    onClick={() => setDialog("zoom")}
                    data-cursor="zoom"
                    aria-label="Open zoomed image"
                  >
                    <ZoomImage src={(gallery[media] as { src: string }).src} alt={(gallery[media] as { alt: string }).alt} priority={media === 0} />
                  </motion.button>
                ) : (
                  <motion.div key="3d" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ViewerPanel spec={{ design: p.design, metal, gem, shape: p.shape, size: p.gemSize }} />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
                {p.badges.map((b) => <span key={b} className="bg-bg/80 px-2 py-1 text-[9.5px] uppercase tracking-[0.2em] backdrop-blur-sm">{b}</span>)}
              </div>
              <WishButton productId={p.id} slug={p.slug} metal={metal} gem={gem} className="absolute right-3 top-3 h-11 w-11 bg-bg/60 backdrop-blur-sm" />
            </div>
            <div className="mt-3 flex gap-3" role="tablist" aria-label="Product media">
              {gallery.map((m, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={media === i}
                  onClick={() => { setMedia(i); if (m.kind === "3d") track("viewer_3d_opened", { productId: p.id }); }}
                  className={cn("relative h-20 w-16 overflow-hidden stage transition-opacity md:h-24 md:w-20", media === i ? "ring-1 ring-fg" : "opacity-60 hover:opacity-100")}
                  aria-label={m.kind === "3d" ? "3D view" : `Image ${i + 1}`}
                >
                  {m.kind === "image" ? <Image src={m.src} alt="" fill sizes="80px" className="jewel-shot-sm" /> : <span className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.18em]">360°</span>}
                </button>
              ))}
              <button onClick={() => setDialog("tryon")} className="ml-auto flex items-center gap-2 self-center border border-line px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] hover:border-fg" data-cursor="try">
                <IconCamera size={15} /> Try on
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ purchase panel */}
        <div className="lg:col-span-5">
          {collectionName && <p className="kicker text-accent">{collectionName}</p>}
          <h1 className="display-lg mt-3">{p.name}</h1>
          <p className="mt-2 text-muted">{p.subtitle}</p>
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
            <Price amount={variant.price} compareAt={variant.compareAt} className="font-display text-[1.9rem]" />
            {p.rating && <p className="text-[12.5px] text-muted"><span className="text-accent">★</span> {p.rating.average.toFixed(1)} · {p.rating.count} reviews</p>}
          </div>
          <p className="mt-1 text-[12px] text-muted">Inclusive of 3% GST · EMI available from {money(Math.round(variant.price / 12))}/month</p>

          <div className="mt-8 space-y-7 border-t border-line pt-7">
            {/* Metal */}
            <fieldset>
              <legend className="flex w-full justify-between text-[12px] uppercase tracking-[0.16em]"><span>Metal</span><span className="normal-case tracking-normal text-muted">{METAL_LABEL[metal]}</span></legend>
              <div className="mt-3 flex flex-wrap gap-2.5" role="radiogroup">
                {p.metals.map((m) => (
                  <button key={m} role="radio" aria-checked={metal === m} onClick={() => chooseMetal(m)} aria-label={METAL_LABEL[m]} className={cn("flex h-11 items-center gap-2.5 border px-3.5 text-[13px] transition-colors", metal === m ? "border-fg" : "border-line hover:border-line-strong")}>
                    <span className="h-4 w-4 rounded-full" style={{ background: METAL_SWATCH[m] }} /> {METAL_LABEL[m].replace(" Gold", "")}
                  </button>
                ))}
              </div>
            </fieldset>
            {purities.length > 1 && (
              <fieldset>
                <legend className="text-[12px] uppercase tracking-[0.16em]">Purity</legend>
                <div className="mt-3 flex gap-2.5" role="radiogroup">
                  {purities.map((pu) => <button key={pu} role="radio" aria-checked={purity === pu} onClick={() => setPurity(pu)} className="chip">{pu}</button>)}
                </div>
              </fieldset>
            )}
            {p.gems.length > 1 && (
              <fieldset>
                <legend className="flex w-full justify-between text-[12px] uppercase tracking-[0.16em]"><span>Centre stone</span><span className="normal-case tracking-normal text-muted">{GEM_LABEL[gem]}</span></legend>
                <div className="mt-3 flex gap-3" role="radiogroup">
                  {p.gems.map((g) => (
                    <button key={g} role="radio" aria-checked={gem === g} aria-label={GEM_LABEL[g]} onClick={() => { setGem(g); track("variant_selected", { productId: p.id, gem: g }); }} className={cn("h-10 w-10 rounded-full ring-offset-[3px] ring-offset-bg", gem === g ? "ring-1 ring-fg" : "hover:ring-1 hover:ring-line-strong")} style={{ background: GEM_SWATCH[g] }} />
                  ))}
                </div>
              </fieldset>
            )}
            {p.sizes && (
              <fieldset id="size-picker">
                <legend className="flex w-full items-center justify-between text-[12px] uppercase tracking-[0.16em]">
                  <span>{p.design === "bangle" ? "Bangle size" : p.design === "tennis" ? "Length" : "Ring size (India)"}</span>
                  {!["bangle", "tennis"].includes(p.design) && (
                    <button type="button" onClick={() => { setDialog("size"); track("size_guide_opened", { productId: p.id }); }} className="link-line flex items-center gap-1.5 normal-case tracking-normal text-muted hover:text-fg"><IconRuler size={15} /> Find your size</button>
                  )}
                </legend>
                <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8" role="radiogroup" aria-invalid={sizeError}>
                  {p.sizes.map((s) => (
                    <button key={s} role="radio" aria-checked={size === s} onClick={() => { setSize(s); setSizeError(false); }} className={cn("h-10 border text-[13px] transition-colors", size === s ? "border-fg bg-fg text-bg" : "border-line hover:border-line-strong")}>{s}</button>
                  ))}
                </div>
                {sizeError && <p className="mt-2 text-[12.5px] text-[var(--danger)]" role="alert">Please choose a size. Not sure? Use the size guide, or add it later with an advisor.</p>}
                {hydrated && ringSize && size === ringSize && <p className="mt-2 text-[12px] text-muted">Pre-selected from your saved size.</p>}
              </fieldset>
            )}
            {p.engravable && (
              <div>
                <label className="flex cursor-pointer items-center justify-between text-[12px] uppercase tracking-[0.16em]">
                  <span>Complimentary engraving</span>
                  <input type="checkbox" checked={engrave} onChange={(e) => setEngrave(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                </label>
                <AnimatePresence initial={false}>
                  {engrave && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <input value={engraving} onChange={(e) => setEngraving(e.target.value.slice(0, 18))} placeholder="Up to 18 characters" className="field mt-2 font-display text-xl italic" aria-label="Engraving text" />
                      <p className="mt-1 text-[11.5px] text-muted">{18 - engraving.length} characters left · adds 3 working days</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div ref={ctaRef} className="mt-8 grid gap-3">
            <div className="flex items-center gap-2 text-[13px]">
              <span className={cn("h-1.5 w-1.5 rounded-full", readyToShip ? "bg-[var(--ok)]" : orderable ? "bg-[var(--warn)]" : "bg-[var(--danger)]")} />
              <span>{statusLabel}</span>
              {orderable && <span className="text-muted">· Delivery by {deliveryEstimate(variant.leadDays + (engrave && engraving ? 3 : 0))}</span>}
            </div>
            {orderable ? (
              <>
                <button onClick={() => addToBag()} disabled={adding} className="btn btn-primary w-full" data-cursor="button">{adding ? "Adding…" : p.status === "preorder" ? "Pre-order" : "Add to bag"}</button>
                <button onClick={() => addToBag(true)} className="btn btn-outline w-full">Buy now</button>
              </>
            ) : (
              <a href={waLink(brand.whatsapp, waMessage("Please let me know when this piece is available again", brand.name, { productName: p.name, sku: variant.sku }))} target="_blank" rel="noopener" className="btn btn-primary w-full">Notify me on WhatsApp</a>
            )}
            <div className="grid grid-cols-2 gap-3">
              <a href={waLink(brand.whatsapp, waMessage("I'd like to ask about this jewellery", brand.name, { productName: p.name, sku: variant.sku, metal: `${purity} ${METAL_LABEL[metal]}`, size: size ?? undefined, url: origin ? `${origin}/products/${p.slug}?metal=${metal}` : undefined }))} target="_blank" rel="noopener" onClick={() => track("whatsapp_clicked", { productId: p.id, intent: "pdp" })} className="btn btn-outline btn-sm"><IconWhatsApp size={15} /> Enquire</a>
              <Link href={`/appointments?product=${p.slug}`} className="btn btn-outline btn-sm"><IconCalendar size={15} /> Book a viewing</Link>
            </div>
          </div>

          <ul className="mt-8 grid grid-cols-3 gap-3 border-y border-line py-5 text-center text-[11.5px] text-muted">
            <li className="flex flex-col items-center gap-2"><IconShield size={18} className="text-accent" />{p.diamond ? `${p.diamond.certificate} certified` : "BIS hallmarked"}</li>
            <li className="flex flex-col items-center gap-2"><IconTruck size={18} className="text-accent" />Insured delivery</li>
            <li className="flex flex-col items-center gap-2"><IconSparkle size={18} className="text-accent" />Lifetime care</li>
          </ul>

          <div className="mt-2">
            <Accordion title="Details" defaultOpen>
              <p className="text-[14px] leading-relaxed text-muted">{p.description}</p>
              <dl className="mt-5 divide-y divide-line text-[13px]">
                {specs.map(([k, v]) => <div key={k} className="flex justify-between gap-6 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>)}
              </dl>
              {p.gemstoneNote && <p className="mt-4 text-[12.5px] text-muted">{p.gemstoneNote}</p>}
            </Accordion>
            <Accordion title="Certification & hallmarking">
              <p className="text-[14px] text-muted">{p.diamond ? `The centre diamond is accompanied by a ${p.diamond.certificate} grading report (No. ${p.diamond.certificateNo}), downloadable from your account after purchase.` : "Gold is BIS hallmarked with a unique HUID, verifiable on the BIS CARE app."} Every piece includes our certificate of authenticity. <Link href="/education" className="link-line text-fg">Learn about the 4Cs</Link>.</p>
            </Accordion>
            <Accordion title="Delivery & returns">
              <p className="text-[14px] text-muted">Complimentary, fully insured delivery across India with signature on receipt. Unworn pieces may be returned within 15 days; engraved and made-to-order pieces are final sale. Store pickup is available at any boutique.</p>
            </Accordion>
            <Accordion title="Care">
              <p className="text-[14px] text-muted">Store separately in the pouch provided. Remove before swimming, exercise or applying perfume. Bring it to any boutique for complimentary cleaning and a claw check once a year.</p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* mobile sticky purchase bar */}
      <AnimatePresence>
        {showSticky && orderable && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{p.name}</p>
                <Price amount={variant.price} className="text-[13px] text-muted" />
              </div>
              <button onClick={() => addToBag()} className="btn btn-primary btn-sm !min-h-11 px-6">{p.sizes && !size ? "Select size" : "Add to bag"}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={dialog === "size"} onClose={() => setDialog(null)} title="Find your ring size" size="lg">
        <RingSizer compact onSelect={(s) => { if (p.sizes?.includes(s)) { setSize(s); setSizeError(false); } setDialog(null); }} />
      </Dialog>
      <Dialog open={dialog === "tryon"} onClose={() => setDialog(null)} title={`Try on · ${p.name}`} size="lg">
        <TryOn
          image={productImage(p, metal, gem)}
          name={p.name}
          design={p.design}
          onAddToBag={() => { setDialog(null); addToBag(); }}
          optionsSlot={p.metals.length > 1 ? (
            <div>
              <span className="kicker text-muted">Metal</span>
              <div className="mt-2 flex gap-2">{p.metals.map((m) => <button key={m} aria-label={METAL_LABEL[m]} aria-pressed={metal === m} onClick={() => chooseMetal(m)} className={cn("h-8 w-8 rounded-full ring-offset-2 ring-offset-bg", metal === m && "ring-1 ring-fg")} style={{ background: METAL_SWATCH[m] }} />)}</div>
            </div>
          ) : undefined}
        />
      </Dialog>
      <Dialog open={dialog === "zoom"} onClose={() => setDialog(null)} title={p.name} size="full">
        <PanZoom src={gallery[media].kind === "image" ? (gallery[media] as { src: string }).src : productImage(p, metal, gem)} alt={p.name} />
      </Dialog>
    </>
  );
}

function ZoomImage({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  const [origin, setOrigin] = useState<string | null>(null);
  return (
    <div
      className="absolute inset-0"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onPointerLeave={() => setOrigin(null)}
    >
      <Image src={src} alt={alt} fill priority={!!priority} sizes="(min-width:1024px) 58vw, 100vw" className="jewel-shot transition-transform duration-500 ease-[var(--ease-expo)]" style={{ transform: origin ? "scale(1.8)" : "scale(1)", transformOrigin: origin ?? "50% 50%" }} />
    </div>
  );
}

function PanZoom({ src, alt }: { src: string; alt: string }) {
  const [z, setZ] = useState(1.6);
  return (
    <div className="relative h-full min-h-[60vh] overflow-hidden stage" data-cursor="drag">
      <motion.div drag dragElastic={0.1} dragConstraints={{ left: -400, right: 400, top: -400, bottom: 400 }} className="absolute inset-0" style={{ scale: z }}>
        <Image src={src} alt={alt} fill sizes="100vw" quality={90} className="pointer-events-none jewel-shot" draggable={false} />
      </motion.div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 border border-line bg-bg/80 px-3 py-2 backdrop-blur">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Zoom</span>
        <input type="range" min={1} max={3} step={0.05} value={z} onChange={(e) => setZ(+e.target.value)} className="w-32 accent-[var(--accent)]" aria-label="Zoom level" />
      </div>
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-5 text-left text-[12px] uppercase tracking-[0.16em]">
        {title}
        <IconChevron size={16} className={cn("transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
