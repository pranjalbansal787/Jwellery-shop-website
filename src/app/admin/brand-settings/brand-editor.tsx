"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveBrand, resetBrand } from "@/server/actions/admin";
import { Card } from "@/components/admin/ui";
import { CURRENCIES, FONT_PAIRS, THEMES, THEME_IDS, brandCssVars, type Brand, type ThemeId } from "@/lib/brand";
import { formatMoney } from "@/lib/money";
import { IconCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function BrandEditor({ initial, canEdit }: { initial: Brand; canEdit: boolean }) {
  const [b, setB] = useState<Brand>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();
  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setB((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(b) !== JSON.stringify(initial);
  const save = () => start(async () => { const r = await saveBrand(b); setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Saved" : r.error }); if (r.ok) router.refresh(); });
  const vars = brandCssVars(b) as React.CSSProperties;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
      <fieldset disabled={!canEdit} className="space-y-6">
        <Card title="Theme preset">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {THEME_IDS.map((id) => {
              const t = THEMES[id];
              return (
                <button key={id} type="button" onClick={() => { set("theme", id); set("accentOverride", null); }} aria-pressed={b.theme === id} className={cn("group border p-2 text-left transition-colors", b.theme === id ? "border-fg" : "border-line hover:border-line-strong")}>
                  <div className="flex h-16 items-end gap-1.5 p-2" style={{ background: t.background }}>
                    <span className="h-7 w-7 rounded-full" style={{ background: t.accent }} />
                    <span className="h-4 w-4 rounded-full" style={{ background: t.accentMetal }} />
                    <span className="ml-auto font-display text-lg" style={{ color: t.foreground }}>Aa</span>
                  </div>
                  <p className="mt-2 flex items-center justify-between text-[12.5px]">{t.label}{b.theme === id && <IconCheck size={14} className="text-accent" />}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-[13px]">
            <label className="flex items-center gap-2">Accent override <input type="color" value={b.accentOverride ?? THEMES[b.theme].accent} onChange={(e) => set("accentOverride", e.target.value)} className="h-8 w-10 cursor-pointer border border-line bg-transparent" /></label>
            {b.accentOverride && <button type="button" onClick={() => set("accentOverride", null)} className="link-line text-[12px] text-muted">Use preset accent</button>}
          </div>
        </Card>
        <Card title="Identity">
          <div className="grid gap-4 md:grid-cols-2">
            <Text label="Brand name" value={b.name} onChange={(v) => set("name", v)} max={40} />
            <Text label="Monogram (favicon)" value={b.monogram} onChange={(v) => set("monogram", v.slice(0, 3))} max={3} />
            <Text label="Descriptor" value={b.descriptor} onChange={(v) => set("descriptor", v)} max={40} />
            <Text label="Home city" value={b.city} onChange={(v) => set("city", v)} max={40} />
            <Text label="Tagline" value={b.tagline} onChange={(v) => set("tagline", v)} max={80} wide />
            <Text label="Announcement bar" value={b.announcement} onChange={(v) => set("announcement", v)} max={120} wide />
          </div>
        </Card>
        <Card title="Typography & shape">
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Font pairing" value={b.fontPair} onChange={(v) => set("fontPair", v as Brand["fontPair"])} options={Object.entries(FONT_PAIRS).map(([k, v]) => [k, v.label])} />
            <Select label="Button shape" value={b.buttonRadius} onChange={(v) => set("buttonRadius", v as Brand["buttonRadius"])} options={[["square", "Square (couture)"], ["soft", "Softened"], ["pill", "Pill"]]} />
          </div>
        </Card>
        <Card title="Commerce & contact">
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Display currency" value={b.currency} onChange={(v) => set("currency", v as Brand["currency"])} options={Object.keys(CURRENCIES).map((k) => [k, k])} />
            <Text label="WhatsApp number (digits, with country code)" value={b.whatsapp} onChange={(v) => set("whatsapp", v.replace(/\D/g, "").slice(0, 15))} max={15} />
            <Text label="Phone" value={b.phone} onChange={(v) => set("phone", v)} max={20} />
            <Text label="Email" value={b.email} onChange={(v) => set("email", v)} max={80} />
          </div>
          <p className="mt-3 text-[12px] text-muted">Non-INR currencies use demo exchange rates for presentation. Production stores per-market price lists.</p>
        </Card>
        <Card title="Experience">
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Homepage hero" value={b.heroMode} onChange={(v) => set("heroMode", v as Brand["heroMode"])} options={[["webgl", "Interactive WebGL"], ["editorial", "Editorial still"]]} />
            <Select label="Animation intensity" value={b.motion} onChange={(v) => set("motion", v as Brand["motion"])} options={[["full", "Full"], ["subtle", "Subtle"], ["off", "Off"]]} />
            <label className="flex items-center gap-3 pt-6 text-[13px]"><input type="checkbox" checked={b.cursor} onChange={(e) => set("cursor", e.target.checked)} className="accent-[var(--accent)]" /> Custom cursor</label>
          </div>
        </Card>
      </fieldset>

      <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card title="Live preview" pad={false}>
          <div style={{ ...vars, background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-body)" }} className="overflow-hidden">
            <div className="border-b px-5 py-3 text-center" style={{ borderColor: "var(--border)" }}>
              <p style={{ fontFamily: "var(--font-display)", letterSpacing: "0.3em" }} className="text-xl uppercase">{b.name || "Brand"}</p>
              <p className="text-[8px] uppercase tracking-[0.4em]" style={{ color: "var(--muted)" }}>{b.descriptor}</p>
            </div>
            <div className="grid grid-cols-2 items-center gap-4 p-5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.24em]" style={{ color: "var(--accent)" }}>New season</p>
                <p style={{ fontFamily: "var(--font-display)" }} className="mt-2 text-[1.7rem] leading-none">Light, held <em style={{ color: "var(--accent-metal)" }}>in gold</em></p>
                <span className="mt-4 inline-block px-4 py-2 text-[9px] uppercase tracking-[0.2em]" style={{ background: "var(--foreground)", color: "var(--background)", borderRadius: "var(--radius-button)" }}>Discover</span>
              </div>
              <div className="relative aspect-[4/5]" style={{ background: "var(--stage)" }}>
                <Image src={`/renders/elan-solitaire-ring--${b.theme === "platinum" || b.theme === "sapphire" ? "white" : b.theme === "rose" ? "rose" : "yellow"}--diamond--front.webp`} alt="" fill sizes="200px" className="object-contain" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t px-5 py-3 text-[11px]" style={{ borderColor: "var(--border)" }}>
              <span>Élan Solitaire Ring</span><span style={{ color: "var(--muted)" }}>{formatMoney(645000, b.currency)}</span>
            </div>
          </div>
        </Card>
        <Card title="Apply">
          <button onClick={save} disabled={!dirty || pending || !canEdit} className="btn btn-primary btn-sm w-full">{pending ? "Applying…" : dirty ? "Apply to storefront" : "No changes"}</button>
          {msg && <p className={`mt-3 text-[12.5px] ${msg.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`} role="status">{msg.text}</p>}
          {!canEdit && <p className="mt-3 text-[12px] text-muted">Needs brand.manage (Super Admin or Content Editor).</p>}
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Quick preview links</p>
            <p className="mt-1 text-[12px] text-muted">Preview a preset without saving (this browser only).</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {THEME_IDS.map((id: ThemeId) => (
                <button key={id} type="button" onClick={async () => { const url = `${location.origin}/?previewTheme=${id}`; await navigator.clipboard.writeText(url).catch(() => {}); setCopied(id); window.open(url, "_blank"); }} className="chip !min-h-8 !text-[11px]">{copied === id ? "Opened" : THEMES[id].label}</button>
              ))}
            </div>
          </div>
          <button onClick={() => start(async () => { const r = await resetBrand(); if (r.ok) { router.refresh(); location.reload(); } else setMsg({ ok: false, text: r.error }); })} disabled={!canEdit} className="link-line mt-5 text-[12px] text-muted">Reset to the default demo brand</button>
        </Card>
      </div>
    </div>
  );
}

function Text({ label, value, onChange, max, wide }: { label: string; value: string; onChange: (v: string) => void; max: number; wide?: boolean }) {
  return <label className={wide ? "md:col-span-2" : ""}><span className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span><input value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className="field-box mt-1" /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return <label><span className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="field-box mt-1">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
}
