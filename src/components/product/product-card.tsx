"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { WishButton } from "./wish-button";
import { useMoney } from "@/components/providers/brand-provider";
import { METAL_LABEL, METAL_SWATCH } from "@/lib/labels";
import { productImage } from "@/lib/media";
import type { MetalKey } from "@/lib/types";
import type { CardProduct } from "@/lib/card";
import { cn } from "@/lib/cn";

export type { CardProduct };

export function ProductCard({ p, priority = false, sizes = "(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw", className }: { p: CardProduct; priority?: boolean; sizes?: string; className?: string }) {
  const [metal, setMetal] = useState<MetalKey>(p.defaultMetal);
  const money = useMoney();
  const href = `/products/${p.slug}${metal !== p.defaultMetal ? `?metal=${metal}` : ""}`;
  const unavailable = p.status === "out_of_stock";
  return (
    <article className={cn("group relative", className)}>
      <Link href={href} className="block" data-cursor="view" aria-label={`${p.name}, from ${money(p.fromPrice)}`}>
        <div className="relative aspect-[4/5] overflow-hidden stage">
          <Image
            src={productImage(p, metal)}
            alt={`${p.name} in ${METAL_LABEL[metal]}`}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes={sizes}
            className="object-contain transition-[opacity,transform] duration-[900ms] ease-[var(--ease-expo)] group-hover:scale-[1.04] group-hover:opacity-0"
          />
          <Image
            src={productImage(p, p.defaultMetal, p.defaultGem, "detail")}
            alt=""
            fill
            sizes={sizes}
            loading="lazy"
            className="scale-[1.06] object-contain opacity-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-expo)] group-hover:scale-100 group-hover:opacity-100"
          />
          {(p.badges.length > 0 || unavailable) && (
            <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {unavailable ? <Badge>Unavailable</Badge> : p.badges.slice(0, 2).map((b) => <Badge key={b} accent={b === "NEW" || b === "LIMITED"}>{b}</Badge>)}
            </div>
          )}
        </div>
      </Link>
      <WishButton productId={p.id} slug={p.slug} metal={metal} gem={p.defaultGem} className="absolute right-2 top-2 h-10 w-10 opacity-80 transition-opacity hover:opacity-100" />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[1.2rem] leading-snug">
            <Link href={href}>{p.name}</Link>
          </h3>
          <p className="mt-0.5 truncate text-[12.5px] text-muted">{p.subtitle}</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-[13.5px]">{money(p.fromPrice)}</p>
        {p.metals.length > 1 && (
          <div className="flex items-center gap-1.5 pr-0.5" role="radiogroup" aria-label={`Metal for ${p.name}`}>
            {p.metals.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={m === metal}
                aria-label={METAL_LABEL[m]}
                title={METAL_LABEL[m]}
                onClick={() => setMetal(m)}
                className={cn("h-4 w-4 rounded-full ring-offset-2 ring-offset-bg transition-shadow", m === metal ? "ring-1 ring-fg" : "ring-0 hover:ring-1 hover:ring-line-strong")}
                style={{ background: METAL_SWATCH[m] }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Badge({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <span className={cn("px-2 py-1 text-[9.5px] font-medium uppercase tracking-[0.2em]", accent ? "bg-accent text-on-accent" : "bg-bg/80 text-fg backdrop-blur-sm")}>{children}</span>;
}
