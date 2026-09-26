"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useUi } from "@/stores/ui";
import { useLockBody } from "@/lib/hooks";
import { IconChevron, IconClose, IconWhatsApp } from "@/components/ui/icons";
import { useBrand } from "@/components/providers/brand-provider";
import { waLink, waMessage } from "@/lib/whatsapp";
import type { NavData } from "./nav-types";

export function MobileMenu({ nav }: { nav: NavData }) {
  const { menuOpen, setMenu } = useUi();
  const { brand } = useBrand();
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  useLockBody(menuOpen);
  useEffect(() => setMenu(false), [pathname, setMenu]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setMenu]);
  const roots = nav.categories.filter((c) => !c.parentId);
  const items = [
    ...roots.map((r) => ({ label: r.name, href: `/shop/${r.slug}`, children: nav.categories.filter((c) => c.parentId === r.id) })),
    { label: "Collections", href: "/collections", children: [] },
    { label: "Gifts", href: "/gift-finder", children: [] },
  ];
  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 flex flex-col bg-bg lg:hidden"
          style={{ zIndex: "var(--z-overlay)" as unknown as number }}
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="container-x flex h-[var(--header-h)] items-center justify-between border-b border-line">
            <span className="kicker text-muted">Menu</span>
            <button onClick={() => setMenu(false)} className="-mr-2 flex h-11 w-11 items-center justify-center" aria-label="Close menu"><IconClose size={22} /></button>
          </div>
          <nav className="container-x flex-1 overflow-y-auto py-6">
            <ul>
              {items.map((it, i) => (
                <motion.li key={it.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="border-b border-line">
                  <div className="flex items-center justify-between">
                    <Link href={it.href} className="block py-4 font-display text-[2rem] leading-tight">{it.label}</Link>
                    {it.children.length > 0 && (
                      <button className="flex h-12 w-12 items-center justify-center" aria-expanded={open === it.label} aria-label={`Show ${it.label} categories`} onClick={() => setOpen(open === it.label ? null : it.label)}>
                        <IconChevron className={open === it.label ? "rotate-180 transition-transform" : "transition-transform"} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {open === it.label && (
                      <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        {it.children.map((c) => (
                          <li key={c.id}><Link href={`/shop/${c.slug}`} className="block py-2.5 pl-1 text-muted">{c.name}</Link></li>
                        ))}
                        <li className="pb-4" />
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 grid gap-3 text-[14px]">
              <Link href="/appointments" className="link-line w-fit">Book an appointment</Link>
              <Link href="/stores" className="link-line w-fit">Boutiques</Link>
              <Link href="/ring-size" className="link-line w-fit">Ring size guide</Link>
              <Link href="/wishlist" className="link-line w-fit">Wishlist</Link>
              <Link href="/track" className="link-line w-fit">Track an order</Link>
            </div>
          </nav>
          <div className="container-x border-t border-line py-4">
            <a href={waLink(brand.whatsapp, waMessage("I'd like some help choosing a piece", brand.name))} target="_blank" rel="noopener" className="btn btn-outline w-full">
              <IconWhatsApp size={16} /> Chat with a jewellery advisor
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
