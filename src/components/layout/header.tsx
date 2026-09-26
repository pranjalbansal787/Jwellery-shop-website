"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Wordmark } from "./wordmark";
import { IconBag, IconHeart, IconMenu, IconSearch } from "@/components/ui/icons";
import { useCart, cartCount } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { useUi } from "@/stores/ui";
import { useBrand } from "@/components/providers/brand-provider";
import { useHydrated } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import type { NavData } from "./nav-types";

export function Header({ nav }: { nav: NavData }) {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mega, setMega] = useState<null | "jewellery" | "collections">(null);
  const lastY = useRef(0);
  const { brand } = useBrand();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const setCartOpen = useCart((s) => s.setOpen);
  const wishCount = useWishlist((s) => s.items.length);
  const { setSearch, setMenu } = useUi();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 480 && y > lastY.current + 4 && !mega);
      if (y < lastY.current - 4) setHidden(false);
      lastY.current = y;
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [mega]);

  useEffect(() => setMega(null), [pathname]);

  const openMega = (m: "jewellery" | "collections") => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMega(m);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMega(null), 160);
  };

  const solid = scrolled || !overlay || !!mega;
  const count = hydrated ? cartCount(lines) : 0;

  return (
    <>
      {brand.announcement && (
        <div className="relative z-[41] border-b border-line bg-bg">
          <p className="container-x flex h-9 items-center justify-center truncate text-center text-[10.5px] tracking-[0.12em] text-muted md:text-[11px]">
            <span className="md:hidden">{brand.announcement.split("·")[0].trim()}</span>
            <span className="hidden md:inline">{brand.announcement}</span>
          </p>
        </div>
      )}
      <header
        className={cn(
          "sticky top-0 transition-[transform,background-color,border-color] duration-500 ease-[var(--ease-luxury)]",
          solid ? "border-b border-line bg-bg/92 backdrop-blur-md" : "border-b border-transparent bg-transparent",
          hidden && "-translate-y-full",
        )}
        style={{ zIndex: "var(--z-header)" as unknown as number, marginBottom: overlay ? "calc(var(--header-h) * -1)" : undefined }}
        onMouseLeave={scheduleClose}
      >
        <div className="container-x grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center">
          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            <MegaTrigger label="Jewellery" active={mega === "jewellery"} onOpen={() => openMega("jewellery")} onClose={scheduleClose} />
            <MegaTrigger label="Collections" active={mega === "collections"} onOpen={() => openMega("collections")} onClose={scheduleClose} />
            <NavLink href="/collections/bridal-2027" current={pathname}>Bridal</NavLink>
            <NavLink href="/gift-finder" current={pathname}>Gifts</NavLink>
          </nav>
          <button className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
            <IconMenu size={22} />
          </button>
          <Wordmark />
          <div className="flex items-center justify-end gap-1 md:gap-3">
            <NavLink href="/appointments" current={pathname} className="mr-4 hidden xl:inline-flex">Book an appointment</NavLink>
            <NavLink href="/stores" current={pathname} className="mr-4 hidden xl:inline-flex">Boutiques</NavLink>
            <button onClick={() => setSearch(true)} className="flex h-11 w-11 items-center justify-center" aria-label="Search">
              <IconSearch />
            </button>
            <Link href="/wishlist" className="relative hidden h-11 w-11 items-center justify-center sm:flex" aria-label={`Wishlist, ${wishCount} items`}>
              <IconHeart />
              {hydrated && wishCount > 0 && <Dot n={wishCount} />}
            </Link>
            <button onClick={() => setCartOpen(true)} className="relative flex h-11 w-11 items-center justify-center" aria-label={`Shopping bag, ${count} items`} data-bag-target>
              <IconBag />
              {count > 0 && <Dot n={count} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mega && (
            <motion.div
              key="mega"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-full hidden border-b border-line bg-bg lg:block"
              onMouseEnter={() => openMega(mega)}
              onMouseLeave={scheduleClose}
            >
              {mega === "jewellery" ? <JewelleryMega nav={nav} /> : <CollectionsMega nav={nav} />}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

function Dot({ n }: { n: number }) {
  return (
    <motion.span
      key={n}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-medium text-on-accent"
    >
      {n}
    </motion.span>
  );
}

function NavLink({ href, children, current, className }: { href: string; children: React.ReactNode; current: string; className?: string }) {
  const active = current === href || (href !== "/" && current.startsWith(href));
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("link-line py-1 text-[12px] tracking-[0.14em] uppercase", className)}>
      {children}
    </Link>
  );
}

function MegaTrigger({ label, active, onOpen, onClose }: { label: string; active: boolean; onOpen: () => void; onClose: () => void }) {
  return (
    <button
      className={cn("link-line py-1 text-[12px] tracking-[0.14em] uppercase", active && "!bg-[length:100%_1px]")}
      aria-expanded={active}
      aria-haspopup="true"
      onMouseEnter={onOpen}
      onFocus={onOpen}
      onClick={active ? onClose : onOpen}
    >
      {label}
    </button>
  );
}

function JewelleryMega({ nav }: { nav: NavData }) {
  const roots = nav.categories.filter((c) => !c.parentId);
  return (
    <div className="container-x grid grid-cols-12 gap-8 py-12">
      <div className="col-span-8 grid grid-cols-4 gap-8">
        {roots.map((r) => (
          <div key={r.id}>
            <Link href={`/shop/${r.slug}`} className="font-display text-2xl link-line">{r.name}</Link>
            <ul className="mt-4 space-y-2.5">
              {nav.categories.filter((c) => c.parentId === r.id).map((c) => (
                <li key={c.id}><Link href={`/shop/${c.slug}`} className="link-line text-[13px] text-muted hover:text-fg">{c.name}</Link></li>
              ))}
              <li><Link href={`/shop/${r.slug}`} className="link-line text-[13px] text-muted hover:text-fg">View all</Link></li>
            </ul>
          </div>
        ))}
        <div>
          <p className="kicker text-muted">Services</p>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li><Link className="link-line text-muted hover:text-fg" href="/configure">Design your ring</Link></li>
            <li><Link className="link-line text-muted hover:text-fg" href="/ring-size">Find your ring size</Link></li>
            <li><Link className="link-line text-muted hover:text-fg" href="/gift-finder">Find the perfect gift</Link></li>
            <li><Link className="link-line text-muted hover:text-fg" href="/appointments">Book an appointment</Link></li>
          </ul>
        </div>
      </div>
      <Link href="/shop/engagement-rings" className="group col-span-4 grid grid-cols-2 items-center gap-6 bg-surface p-6" data-cursor="view">
        <div className="relative aspect-[4/5] stage">
          <Image src={nav.feature.image} alt="" fill sizes="220px" className="jewel-shot" />
        </div>
        <div>
          <p className="kicker text-accent">Engagement</p>
          <p className="mt-3 display-sm">Certified centre stones, set by hand</p>
          <p className="mt-4 text-[12px] tracking-[0.14em] uppercase link-line inline-block">Discover</p>
        </div>
      </Link>
    </div>
  );
}

function CollectionsMega({ nav }: { nav: NavData }) {
  return (
    <div className="container-x grid grid-cols-4 gap-6 py-12">
      {nav.collections.slice(0, 4).map((c) => (
        <Link key={c.slug} href={`/collections/${c.slug}`} className="group" data-cursor="explore">
          <div className="relative aspect-[5/4] overflow-hidden stage">
            <Image src={c.heroImage} alt="" fill sizes="25vw" className="jewel-shot" />
          </div>
          <p className="kicker mt-4 text-muted">{c.kicker}</p>
          <p className="mt-1 display-sm">{c.name}</p>
        </Link>
      ))}
      <div className="col-span-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-6 text-[13px]">
        {nav.collections.slice(4).map((c) => (
          <Link key={c.slug} href={`/collections/${c.slug}`} className="link-line text-muted hover:text-fg">{c.name}</Link>
        ))}
        <Link href="/collections" className="link-line ml-auto">All collections</Link>
      </div>
    </div>
  );
}
