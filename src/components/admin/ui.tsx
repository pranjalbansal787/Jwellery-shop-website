import Link from "next/link";
import { cn } from "@/lib/cn";

export function PageHeader({ title, kicker, actions, description }: { title: string; kicker?: React.ReactNode; actions?: React.ReactNode; description?: string }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && <p className="kicker text-muted">{kicker}</p>}
        <h1 className="mt-1 font-display text-[2.1rem] leading-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className, pad = true }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("min-w-0 border border-line bg-surface", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[11.5px] uppercase tracking-[0.16em] text-muted">{title}</h2>
          {action}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: number }) {
  return (
    <div className="border border-line bg-surface p-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-display text-[2rem] leading-none">{value}</p>
      <p className="mt-2 flex items-center gap-2 text-[12px] text-muted">
        {trend !== undefined && <span className={trend >= 0 ? "text-[var(--ok)]" : "text-[var(--danger)]"}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%</span>}
        {sub}
      </p>
    </div>
  );
}

const TONES: Record<string, string> = {
  ok: "border-[color-mix(in_oklab,var(--ok)_50%,transparent)] text-[var(--ok)]",
  warn: "border-[color-mix(in_oklab,var(--warn)_50%,transparent)] text-[var(--warn)]",
  danger: "border-[color-mix(in_oklab,var(--danger)_50%,transparent)] text-[var(--danger)]",
  accent: "border-accent/50 text-accent",
  muted: "border-line-strong text-muted",
};

export function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em]", TONES[tone])}>{children}</span>;
}

export const ORDER_TONE: Record<string, keyof typeof TONES> = {
  placed: "muted", payment_confirmed: "accent", quality_check: "accent", packaged: "accent", dispatched: "warn", out_for_delivery: "warn", delivered: "ok", cancelled: "danger", refunded: "danger",
};

export function Table({ head, children, className }: { head: React.ReactNode[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[720px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.14em] text-muted">
            {head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-3 font-normal">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

export function FilterLinks({ base, param, options, current }: { base: string; param: string; options: [string, string, number?][]; current?: string }) {
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto" aria-label="Filter">
      {options.map(([v, l, n]) => {
        const active = (current ?? "") === v;
        return (
          <Link key={v} href={v ? `${base}?${param}=${v}` : base} aria-current={active ? "page" : undefined} className={cn("whitespace-nowrap border px-3 py-1.5 text-[12px]", active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg")}>
            {l}{n !== undefined && <span className="ml-1.5 opacity-60">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const inrShort = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : inr(n));
export const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
