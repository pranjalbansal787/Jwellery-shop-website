"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { switchRole } from "@/server/actions/admin";
import { useBrand } from "@/components/providers/brand-provider";
import { IconMenu, IconClose, IconArrow } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const NAV: { group: string; items: [string, string, string?][] }[] = [
  { group: "Commerce", items: [["Dashboard", "/admin"], ["Orders", "/admin/orders"], ["Products", "/admin/products"], ["Categories & collections", "/admin/catalogue"], ["Inventory", "/admin/inventory"]] },
  { group: "Clients", items: [["Customers", "/admin/customers"], ["Appointments", "/admin/appointments"], ["Enquiries & WhatsApp", "/admin/enquiries"]] },
  { group: "Growth", items: [["Promotions", "/admin/promotions"], ["Analytics", "/admin/analytics"]] },
  { group: "Experience", items: [["Homepage content", "/admin/content"], ["Brand & theme", "/admin/brand-settings"]] },
  { group: "System", items: [["Users & roles", "/admin/roles"], ["Audit log", "/admin/audit"]] },
];
const PLANNED = ["Returns", "Shipping", "Gift cards", "Media & 3D assets", "Reviews", "SEO", "Pages"];

export function AdminShell({ session, roles, children }: { session: { role: string; label: string; name: string }; roles: { id: string; label: string; person: string }[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const { brand } = useBrand();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-5 text-[13px]" aria-label="Admin">
      {NAV.map((g) => (
        <div key={g.group} className="mb-6">
          <p className="px-3 text-[10px] uppercase tracking-[0.18em] text-muted">{g.group}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map(([label, href]) => {
              const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("relative block px-3 py-2 transition-colors", active ? "bg-elevated text-fg" : "text-muted hover:text-fg")}>
                    {active && <span className="absolute inset-y-1.5 left-0 w-px bg-accent" />}
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="border-t border-line px-3 pt-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">On the roadmap</p>
        <ul className="mt-2 space-y-1.5 text-[12px] text-muted/70">{PLANNED.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
    </nav>
  );
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]" style={{ fontSize: 13.5 }}>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-bg lg:flex">
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <Link href="/admin" className="font-display text-xl uppercase tracking-[0.28em]">{brand.name}</Link>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted">Admin</span>
        </div>
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex w-72 flex-col border-r border-line bg-bg">
            <div className="flex h-14 items-center justify-between border-b border-line px-5"><span className="font-display text-lg uppercase tracking-[0.24em]">{brand.name}</span><button onClick={() => setOpen(false)} aria-label="Close menu"><IconClose /></button></div>
            {nav}
          </div>
          <button className="flex-1 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 backdrop-blur md:h-16 md:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><IconMenu /></button>
            <span className="hidden border border-accent/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-accent sm:inline">Demo data</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] text-muted">
              <span className="hidden md:inline">Signed in as</span>
              <select
                value={session.role}
                disabled={pending}
                onChange={(e) => start(() => switchRole(e.target.value as never))}
                className="border border-line bg-surface px-2 py-1.5 text-[12px] text-fg"
                aria-label="Switch demo role"
              >
                {roles.map((r) => <option key={r.id} value={r.id}>{r.person} · {r.label}</option>)}
              </select>
            </label>
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 text-[12px] text-muted hover:text-fg sm:flex">Storefront <IconArrow size={14} /></Link>
          </div>
        </header>
        <main id="main" className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
