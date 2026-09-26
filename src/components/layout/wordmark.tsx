"use client";
import Link from "next/link";
import { useBrand } from "@/components/providers/brand-provider";
import { cn } from "@/lib/cn";

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { brand } = useBrand();
  return (
    <Link href="/" className={cn("group inline-flex flex-col items-center leading-none", className)} aria-label={`${brand.name} home`} data-cursor="link">
      <span className="font-display text-[26px] tracking-[0.34em] uppercase md:text-[30px]" style={{ marginRight: "-0.34em" }}>
        {brand.name}
      </span>
      {!compact && <span className="kicker mt-1.5 !text-[8.5px] !tracking-[0.42em] text-muted">{brand.descriptor}</span>}
    </Link>
  );
}
