"use client";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, animate, useMotionValue } from "motion/react";
import { MaskText, Reveal } from "@/components/motion/reveal";
import { ProductCard, type CardProduct } from "@/components/product/product-card";
import { useMoney } from "@/components/providers/brand-provider";
import { IconArrow, IconArrowLeft, IconCalendar, IconShield, IconSparkle, IconTruck, IconWhatsApp, IconPin } from "@/components/ui/icons";
import { useBrand } from "@/components/providers/brand-provider";
import { waLink, waMessage } from "@/lib/whatsapp";
import { useMotionLevel } from "@/lib/hooks";
import { Magnetic } from "@/components/motion/magnetic";
import type { JewelSpec } from "@/lib/jewels/builders";
import { useEffect } from "react";

const ViewerScene = dynamic(() => import("@/components/three/jewel-scene").then((m) => m.ViewerScene), { ssr: false, loading: () => <div className="absolute inset-0 skeleton opacity-40" /> });

/* ------------------------------------------------------------------ section heading */
export function SectionHead({ kicker, title, href, cta, align = "split" }: { kicker: string; title: string[]; href?: string; cta?: string; align?: "split" | "center" }) {
  return (
    <div className={align === "center" ? "flex flex-col items-center text-center" : "flex flex-col gap-6 md:flex-row md:items-end md:justify-between"}>
      <div>
        <Reveal><p className="kicker text-accent">{kicker}</p></Reveal>
        <MaskText lines={title} className="display-lg mt-4" />
      </div>
      {href && (
        <Reveal delay={0.1}>
          <Link href={href} className="group inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.2em]">
            <span className="link-line">{cta}</span>
            <IconArrow size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ featured collections */
export function FeaturedCollections({ items }: { items: { slug: string; name: string; kicker: string; description: string; heroImage: string }[] }) {
  const [a, b, c] = items;
  return (
    <section className="container-x section-y">
      <SectionHead kicker="Collections" title={["Stories told", "in precious metal"]} href="/collections" cta="All collections" />
      <div className="mt-14 grid gap-5 md:grid-cols-12 md:grid-rows-2">
        {a && <CollectionTile c={a} className="md:col-span-7 md:row-span-2" tall />}
        {b && <CollectionTile c={b} className="md:col-span-5" />}
        {c && <CollectionTile c={c} className="md:col-span-5" />}
      </div>
    </section>
  );
}

function CollectionTile({ c, className, tall }: { c: { slug: string; name: string; kicker: string; description: string; heroImage: string }; className?: string; tall?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const level = useMotionLevel();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, (v) => (12 - 24 * v) * level);
  return (
    <Reveal className={className}>
      <Link ref={ref} href={`/collections/${c.slug}`} className="group relative block h-full overflow-hidden stage" data-cursor="explore">
        <div className={tall ? "aspect-[4/5] md:aspect-auto md:h-full md:min-h-[720px]" : "aspect-[16/11]"}>
          <motion.div style={{ y }} className="absolute inset-0">
            <Image
              src={c.heroImage}
              alt=""
              fill
              sizes={tall ? "(min-width:768px) 58vw, 100vw" : "(min-width:768px) 42vw, 100vw"}
              className={tall ? "jewel-shot !object-[center_12%] !pb-[38%] !pt-[6%]" : "jewel-shot"}
            />
          </motion.div>
        </div>
        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/90 to-transparent px-6 pb-6 md:px-9 md:pb-9 ${tall ? "pt-28" : "pt-16"}`}>
          <p className="kicker text-accent">{c.kicker}</p>
          <p className={tall ? "display-lg mt-3" : "display-md mt-2"}>{c.name}</p>
          {tall && <p className="lede mt-3 max-w-md">{c.description}</p>}
        </div>
      </Link>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ product rail */
export function ProductRail({ kicker, title, href, cta, products }: { kicker: string; title: string[]; href: string; cta: string; products: CardProduct[] }) {
  const track = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <section className="section-y overflow-hidden">
      <div className="container-x">
        <SectionHead kicker={kicker} title={title} href={href} cta={cta} />
      </div>
      <div className="relative mt-14">
        <div ref={track} className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] pb-2 [scroll-padding-inline:var(--gutter)]" data-cursor="drag" tabIndex={0} aria-label={`${title.join(" ")} carousel`}>
          {products.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 4) * 0.06} className="w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-[30vw] xl:w-[22vw]">
              <ProductCard p={p} sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 72vw" />
            </Reveal>
          ))}
        </div>
        <div className="container-x mt-8 flex justify-end gap-2">
          <button onClick={() => scrollBy(-1)} className="flex h-11 w-11 items-center justify-center border border-line hover:border-fg" aria-label="Previous"><IconArrowLeft size={18} /></button>
          <button onClick={() => scrollBy(1)} className="flex h-11 w-11 items-center justify-center border border-line hover:border-fg" aria-label="Next"><IconArrow size={18} /></button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ craftsmanship + counters */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const level = useMotionLevel();
  const mv = useMotionValue(level ? 0 : to);
  const [v, setV] = useState(level ? 0 : to);
  useEffect(() => {
    if (!inView || !level) return;
    const c = animate(mv, to, { duration: 2, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, level, mv, to]);
  return <span ref={ref}>{v.toLocaleString("en-IN")}{suffix}</span>;
}

export function Craftsmanship({ image, secondary }: { image: string; secondary: string }) {
  return (
    <section className="border-y border-line bg-surface">
      <div className="container-x grid-editorial section-y items-center gap-y-14">
        <div className="col-span-4 md:col-span-8 lg:col-span-6">
          <div className="relative grid grid-cols-5 items-end gap-4">
            <Reveal className="relative col-span-3 aspect-[4/5] stage"><Image src={image} alt="A three-stone ring on the setter's bench" fill sizes="(min-width:1024px) 30vw, 60vw" className="jewel-shot" /></Reveal>
            <Reveal delay={0.15} className="relative col-span-2 aspect-square stage"><Image src={secondary} alt="A solitaire ring, shown in full" fill sizes="(min-width:1024px) 20vw, 40vw" className="jewel-shot" /></Reveal>
          </div>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8">
          <Reveal><p className="kicker text-accent">The atelier</p></Reveal>
          <MaskText lines={["Nine to twenty-eight days,", "and eleven pairs of hands"]} className="display-lg mt-4" />
          <Reveal delay={0.1}><p className="lede mt-6">Every piece begins as a hand-carved wax model. It is cast, filed and pre-polished before a master setter raises each claw around its stone. Nothing is rushed; the last polish happens only after the final inspection.</p></Reveal>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {[{ n: 11, s: "", l: "Craftspeople per piece" }, { n: 28, s: "", l: "Days, at most" }, { n: 1987, s: "", l: "Atelier founded" }].map((c) => (
              <div key={c.l}><dt className="order-2 mt-2 text-[12px] text-muted">{c.l}</dt><dd className="font-display text-[clamp(2rem,3.5vw,3rem)] leading-none"><Counter to={c.n} suffix={c.s} /></dd></div>
            ))}
          </dl>
          <Reveal delay={0.2}><Link href="/education" className="btn btn-outline mt-10">Understand your diamond</Link></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 3D spotlight */
export function Spotlight({ product, spec }: { product: { slug: string; name: string; subtitle: string; price: number; sku: string }; spec: JewelSpec }) {
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, { once: true, margin: "400px 0px" });
  const money = useMoney();
  return (
    <section ref={ref} className="container-x section-y">
      <div className="grid-editorial items-center gap-y-10">
        <div className="col-span-4 md:col-span-8 lg:col-span-7">
          <div className="relative aspect-square stage md:aspect-[5/4]" data-cursor="360">
            {near && <ViewerScene spec={spec} autoRotate />}
            <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 kicker text-muted">Drag to rotate · Pinch to zoom</p>
          </div>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:col-start-9">
          <Reveal><p className="kicker text-accent">In three dimensions</p></Reveal>
          <MaskText lines={["Turn it in", "your hand"]} className="display-lg mt-4" />
          <Reveal delay={0.1}>
            <p className="lede mt-5">Every setting, every claw, in real time. Our 3D viewer uses the same model our workshop approves before casting.</p>
            <div className="mt-8 border-t border-line pt-6">
              <p className="display-sm">{product.name}</p>
              <p className="mt-1 text-[13px] text-muted">{product.subtitle}</p>
              <p className="mt-3">{money(product.price)}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic><Link href={`/products/${product.slug}`} className="btn btn-primary">View details</Link></Magnetic>
              <Link href="/configure" className="btn btn-outline">Design your own</Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ categories */
export function CategoryGrid({ items }: { items: { slug: string; name: string; image: string; count: number }[] }) {
  return (
    <section className="container-x section-y">
      <SectionHead kicker="Shop by category" title={["Find your piece"]} href="/shop" cta="All jewellery" />
      <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-6">
        {items.map((c, i) => (
          <Reveal as="li" key={c.slug} delay={i * 0.05}>
            <Link href={`/shop/${c.slug}`} className="group block" data-cursor="view">
              <div className="relative aspect-square overflow-hidden rounded-full stage">
                <div className="absolute inset-[18%] transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-105">
                  <Image src={c.image} alt="" fill sizes="(min-width:1280px) 15vw, (min-width:768px) 30vw, 45vw" className="object-contain" />
                </div>
              </div>
              <p className="mt-4 text-center font-display text-xl">{c.name}</p>
              <p className="text-center text-[12px] text-muted">{c.count} pieces</p>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ occasions & recipients */
export function Occasions() {
  const occasions = [
    { label: "Engagement", href: "/shop/engagement-rings" },
    { label: "Wedding", href: "/shop?occasion=wedding" },
    { label: "Anniversary", href: "/shop?occasion=anniversary" },
    { label: "Diwali", href: "/collections/festive-edit" },
    { label: "Birthday", href: "/shop?occasion=birthday" },
    { label: "Everyday", href: "/collections/everyday-fine" },
  ];
  const recipients = [
    { label: "For her", href: "/gift-finder?recipient=her" },
    { label: "For him", href: "/shop/mens-jewellery" },
    { label: "For a bride", href: "/collections/bridal-2027" },
    { label: "For yourself", href: "/shop?sort=newest" },
  ];
  return (
    <section className="border-y border-line">
      <div className="container-x grid gap-14 py-20 lg:grid-cols-2">
        <div>
          <p className="kicker text-muted">Shop by occasion</p>
          <ul className="mt-6">
            {occasions.map((o) => (
              <li key={o.label} className="border-b border-line">
                <Link href={o.href} className="group flex items-center justify-between py-4" data-cursor="link">
                  <span className="font-display text-[clamp(1.6rem,2.6vw,2.4rem)] transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-3">{o.label}</span>
                  <IconArrow size={18} className="text-muted opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-between gap-10">
          <div>
            <p className="kicker text-muted">Shop by recipient</p>
            <div className="mt-6 flex flex-wrap gap-2">{recipients.map((r) => <Link key={r.label} href={r.href} className="chip">{r.label}</Link>)}</div>
          </div>
          <div className="bg-surface p-8 md:p-10">
            <p className="kicker text-accent">Gift finder</p>
            <p className="display-md mt-3">Five questions to the perfect gift</p>
            <p className="mt-3 text-muted">Tell us who it’s for, the occasion and a budget. We’ll curate a short list, never a catalogue.</p>
            <Link href="/gift-finder" className="btn btn-primary mt-7">Begin</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ concierge + appointment */
export function ConciergeBand({ image }: { image: string }) {
  const { brand } = useBrand();
  return (
    <section className="container-x section-y">
      <div className="grid overflow-hidden bg-surface md:grid-cols-2">
        <div className="relative min-h-[360px] stage">
          <Image src={image} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="jewel-shot" />
        </div>
        <div className="flex flex-col justify-center p-8 md:p-14">
          <Reveal><p className="kicker text-accent">Private appointments</p></Reveal>
          <MaskText lines={["See it in person,", "or on a video call"]} className="display-lg mt-4" />
          <Reveal delay={0.1}>
            <p className="lede mt-5">Reserve a private room at one of our boutiques, or a video consultation with a jewellery advisor. Bridal and custom design sessions are always one-to-one.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic><Link href="/appointments" className="btn btn-primary"><IconCalendar size={16} /> Book an appointment</Link></Magnetic>
              <a href={waLink(brand.whatsapp, waMessage("I'd like to book a consultation", brand.name))} target="_blank" rel="noopener" className="btn btn-outline"><IconWhatsApp size={16} /> WhatsApp</a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ boutiques */
export function Boutiques({ stores }: { stores: { slug: string; name: string; city: string; address: string; hours: { days: string; time: string }[] }[] }) {
  return (
    <section className="container-x pb-[clamp(4.5rem,10vw,10rem)]">
      <SectionHead kicker="Boutiques" title={["Visit the maison"]} href="/stores" cta="All boutiques" />
      <ul className="mt-12 grid gap-px bg-line md:grid-cols-3">
        {stores.map((s, i) => (
          <Reveal as="li" key={s.slug} delay={i * 0.08} className="bg-bg">
            <Link href={`/stores/${s.slug}`} className="group block h-full p-8 md:p-10" data-cursor="view">
              <p className="kicker text-muted flex items-center gap-2"><IconPin size={14} /> {s.city}</p>
              <p className="display-sm mt-4">{s.name}</p>
              <p className="mt-3 text-[13.5px] text-muted">{s.address}</p>
              <p className="mt-4 text-[12.5px]">{s.hours[0].days} · {s.hours[0].time}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] link-line">Visit & directions</span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ trust */
export function TrustRow() {
  const items = [
    { icon: IconShield, t: "Certified & hallmarked", d: "GIA / IGI certified diamonds, BIS hallmarked gold with HUID." },
    { icon: IconTruck, t: "Insured delivery", d: "Fully insured, signature-on-delivery shipping across India." },
    { icon: IconSparkle, t: "Lifetime care", d: "Complimentary cleaning and claw checks at any boutique." },
    { icon: IconCalendar, t: "15-day returns", d: "Unworn pieces can be returned within 15 days of delivery." },
  ];
  return (
    <section className="border-t border-line">
      <ul className="container-x grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <li key={i.t} className="flex gap-4">
            <i.icon size={22} className="mt-1 shrink-0 text-accent" />
            <div><p className="text-[14px]">{i.t}</p><p className="mt-1 text-[13px] text-muted">{i.d}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
