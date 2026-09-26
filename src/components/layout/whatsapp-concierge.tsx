"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useBrand } from "@/components/providers/brand-provider";
import { useConcierge } from "@/stores/concierge";
import { useWishlist } from "@/stores/wishlist";
import { waLink, waMessage } from "@/lib/whatsapp";
import { IconClose, IconWhatsApp, IconArrow } from "@/components/ui/icons";
import { track } from "@/lib/analytics";

/** Floating WhatsApp concierge with context-aware intents (product page context is prefilled). */
export function WhatsAppConcierge() {
  const { brand } = useBrand();
  const ctx = useConcierge((s) => s.ctx);
  const wish = useWishlist((s) => s.items);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  if (pathname.startsWith("/checkout")) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const intents = ctx?.productName
    ? ["Ask about this jewellery", "Check availability", "Request customisation", "Ask about delivery", "Book appointment"]
    : ["Help me choose a piece", "Book appointment", "Ask about delivery", ...(wish.length ? ["Share my wishlist"] : []), "Request customisation"];

  const message = (intent: string) => {
    if (intent === "Share my wishlist") {
      return waMessage("I'd like advice on my wishlist", brand.name) + "\n\n" + wish.map((w) => `${origin}/products/${w.slug}`).join("\n");
    }
    return waMessage(intent === "Help me choose a piece" ? "I'd like help choosing a piece" : `I'd like to ${intent.toLowerCase()}`, brand.name, ctx ?? undefined);
  };

  return (
    <div className={`fixed right-5 md:bottom-8 md:right-8 ${pathname.startsWith("/products/") ? "bottom-24 lg:bottom-8" : "bottom-5"}`} style={{ zIndex: 50 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            role="dialog"
            aria-label="WhatsApp concierge"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-16 right-0 w-[min(88vw,340px)] border border-line bg-elevated p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="kicker text-accent">Concierge</p>
                <p className="mt-1.5 display-sm">How may we help?</p>
                <p className="mt-1 text-[12.5px] text-muted">An advisor will reply on WhatsApp during boutique hours.</p>
              </div>
              <button onClick={() => setOpen(false)} className="-mr-2 -mt-2 flex h-9 w-9 items-center justify-center" aria-label="Close"><IconClose size={16} /></button>
            </div>
            {ctx?.productName && <p className="mt-4 border-l border-accent pl-3 text-[12.5px] text-muted">About: <span className="text-fg">{ctx.productName}</span>{ctx.metal ? ` · ${ctx.metal}` : ""}{ctx.size ? ` · size ${ctx.size}` : ""}</p>}
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {intents.map((i) => (
                <li key={i}>
                  <a href={waLink(brand.whatsapp, message(i))} target="_blank" rel="noopener" onClick={() => track("whatsapp_clicked", { intent: i, product: ctx?.sku })} className="group flex items-center justify-between py-3 text-[13.5px]">
                    {i}
                    <IconArrow size={16} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-fg" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-13 w-13 items-center justify-center rounded-full border border-line-strong bg-elevated text-fg shadow-lg transition-colors hover:border-accent hover:text-accent"
        style={{ width: 52, height: 52 }}
        aria-expanded={open}
        aria-label="WhatsApp concierge"
        data-magnetic
      >
        <IconWhatsApp size={22} />
      </button>
    </div>
  );
}
