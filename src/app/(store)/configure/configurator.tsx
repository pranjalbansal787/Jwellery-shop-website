"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ViewerPanel } from "@/components/pdp/viewer-panel";
import { Price } from "@/components/product/price";
import { Dialog } from "@/components/ui/dialog";
import { RingSizer } from "@/components/pdp/ring-sizer";
import { useCart } from "@/stores/cart";
import { useProfile } from "@/stores/profile";
import { useHydrated } from "@/lib/hooks";
import { CFG_CARATS, CFG_METALS, CFG_SHAPES, CFG_STONES, SETTINGS, encodeConfig, gemSizeFor, leadDaysConfig, priceConfig, type RingConfig } from "@/lib/configurator";
import { GEM_LABEL, GEM_SWATCH, METAL_LABEL, METAL_SWATCH, deliveryEstimate } from "@/lib/labels";
import { RING_SIZES } from "@/lib/ring-size";
import { flyToBag } from "@/lib/fly-to-bag";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

const STEPS = ["Setting", "Metal", "Stone", "Shape", "Carat", "Size", "Engraving", "Review"] as const;

export function Configurator({ images }: { images: Record<string, string> }) {
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<RingConfig>({ setting: "solitaire", metal: "yellow", stone: "diamond", shape: "round", carat: 1, size: "" });
  const [engraving, setEngraving] = useState("");
  const [sizeOpen, setSizeOpen] = useState(false);
  const hydrated = useHydrated();
  const { ringSize } = useProfile();
  const add = useCart((s) => s.add);
  useEffect(() => { if (hydrated && ringSize && !cfg.size) setCfg((c) => ({ ...c, size: ringSize })); }, [hydrated, ringSize, cfg.size]);

  const full = { ...cfg, engraving: engraving || undefined };
  const price = priceConfig(full);
  const lead = leadDaysConfig(full);
  const spec = useMemo(() => ({ design: cfg.setting, metal: cfg.metal, gem: cfg.stone, shape: cfg.shape, size: gemSizeFor(cfg.carat) }), [cfg]);
  const up = (patch: Partial<RingConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const canNext = step !== 5 || !!cfg.size;
  const image = images[`${cfg.setting}|${cfg.metal}|${cfg.stone}`];

  const addToBag = async () => {
    await flyToBag(document.getElementById("cfg-stage"), image);
    add({ productId: `bespoke-${cfg.setting}`, slug: "", name: `Bespoke ${SETTINGS.find((s) => s.id === cfg.setting)!.label} Ring`, variantId: encodeConfig(cfg), sku: `SLN-BSP-${cfg.setting.slice(0, 3).toUpperCase()}-${cfg.carat}`, metal: cfg.metal, purity: cfg.metal === "platinum" ? "PT950" : "18K", gem: cfg.stone, size: cfg.size, engraving: engraving || undefined, unitPrice: price, image, leadDays: lead });
    track("cart_added", { productId: "bespoke", price });
  };

  return (
    <div className="container-x grid gap-10 py-10 lg:grid-cols-12 lg:gap-14 lg:py-14">
      <div className="lg:col-span-7">
        <div id="cfg-stage" className="relative aspect-square lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <ViewerPanel spec={spec} />
          <div className="pointer-events-none absolute left-5 top-5">
            <p className="kicker text-accent">Your design</p>
            <p className="mt-1 text-[13px] text-muted">{cfg.carat.toFixed(2)} ct {CFG_SHAPES.find((s) => s.id === cfg.shape)!.label.toLowerCase()} {GEM_LABEL[cfg.stone].toLowerCase()} · {METAL_LABEL[cfg.metal]}</p>
          </div>
        </div>
      </div>
      <div className="lg:col-span-5">
        <p className="kicker text-accent">Bespoke</p>
        <h1 className="display-lg mt-3">Design your engagement ring</h1>
        <div className="mt-5 flex items-baseline justify-between border-b border-line pb-5">
          <Price amount={price} className="font-display text-3xl" />
          <p className="text-[12.5px] text-muted">Ready by {deliveryEstimate(lead)}</p>
        </div>
        <ol className="scrollbar-none mt-6 flex gap-1 overflow-x-auto" aria-label="Configuration steps">
          {STEPS.map((s, i) => (
            <li key={s}><button onClick={() => (i <= 5 || cfg.size ? setStep(i) : null)} aria-current={step === i ? "step" : undefined} className={cn("whitespace-nowrap border-b px-2.5 py-2 text-[11px] uppercase tracking-[0.14em]", step === i ? "border-fg" : i < step ? "border-accent text-muted" : "border-line text-muted")}>{i + 1}. {s}</button></li>
          ))}
        </ol>
        <div className="min-h-[300px] pt-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
              {step === 0 && <Options items={SETTINGS.map((s) => ({ id: s.id, label: s.label, sub: s.desc }))} value={cfg.setting} onChange={(v) => up({ setting: v as RingConfig["setting"] })} />}
              {step === 1 && <Options items={CFG_METALS.map((m) => ({ id: m.id, label: METAL_LABEL[m.id], swatch: METAL_SWATCH[m.id], sub: m.id === "platinum" ? "PT950, naturally white" : "18K" }))} value={cfg.metal} onChange={(v) => up({ metal: v as RingConfig["metal"] })} />}
              {step === 2 && <Options items={CFG_STONES.map((s) => ({ id: s.id, label: GEM_LABEL[s.id], swatch: GEM_SWATCH[s.id], sub: s.id === "diamond" ? "GIA or IGI certified" : "Natural, origin reported" }))} value={cfg.stone} onChange={(v) => up({ stone: v as RingConfig["stone"] })} />}
              {step === 3 && <Options items={CFG_SHAPES.map((s) => ({ id: s.id, label: s.label }))} value={cfg.shape} onChange={(v) => up({ shape: v as RingConfig["shape"] })} cols={3} />}
              {step === 4 && (
                <div>
                  <Options items={CFG_CARATS.map((c) => ({ id: String(c), label: `${c.toFixed(2)} ct` }))} value={String(cfg.carat)} onChange={(v) => up({ carat: Number(v) })} cols={3} />
                  <p className="mt-4 text-[12.5px] text-muted">Price per carat rises with size because larger stones are rarer. Your advisor can show certified stones either side of your choice.</p>
                </div>
              )}
              {step === 5 && (
                <div>
                  <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Ring size">
                    {RING_SIZES.map((s) => <button key={s} role="radio" aria-checked={cfg.size === s} onClick={() => up({ size: s })} className={cn("h-10 border text-[13px]", cfg.size === s ? "border-fg bg-fg text-bg" : "border-line hover:border-line-strong")}>{s}</button>)}
                  </div>
                  <button onClick={() => setSizeOpen(true)} className="link-line mt-4 text-[12.5px] text-muted">Not sure? Find your size</button>
                </div>
              )}
              {step === 6 && (
                <div>
                  <input value={engraving} onChange={(e) => setEngraving(e.target.value.slice(0, 18))} placeholder="Initials, a date, a word" className="field font-display text-2xl italic" aria-label="Engraving" />
                  <p className="mt-2 text-[12px] text-muted">Optional and complimentary · {18 - engraving.length} characters left</p>
                </div>
              )}
              {step === 7 && (
                <dl className="divide-y divide-line border-y border-line text-[14px]">
                  {[["Setting", SETTINGS.find((s) => s.id === cfg.setting)!.label], ["Metal", METAL_LABEL[cfg.metal]], ["Centre stone", `${cfg.carat.toFixed(2)} ct ${CFG_SHAPES.find((s) => s.id === cfg.shape)!.label} ${GEM_LABEL[cfg.stone]}`], ["Size", `India ${cfg.size}`], ["Engraving", engraving || "None"], ["Estimated ready", deliveryEstimate(lead)]].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-3"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-6 flex gap-3">
          {step > 0 && <button onClick={() => setStep(step - 1)} className="btn btn-outline">Back</button>}
          {step < 7 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext} className="btn btn-primary flex-1">Continue</button>
          ) : (
            <button onClick={addToBag} className="btn btn-primary flex-1">Add to bag</button>
          )}
        </div>
        <p className="mt-6 text-[12px] text-muted">Every bespoke ring is confirmed with you by an advisor before crafting begins. Prices shown are indicative until your stone is selected.</p>
      </div>
      <Dialog open={sizeOpen} onClose={() => setSizeOpen(false)} title="Find your ring size" size="lg">
        <RingSizer compact onSelect={(s) => { up({ size: s }); setSizeOpen(false); }} />
      </Dialog>
    </div>
  );
}

function Options({ items, value, onChange, cols = 1 }: { items: { id: string; label: string; sub?: string; swatch?: string }[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div className={cn("grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-1")} role="radiogroup">
      {items.map((it) => (
        <button key={it.id} role="radio" aria-checked={value === it.id} onClick={() => onChange(it.id)} className={cn("flex items-center gap-4 border p-4 text-left transition-colors", value === it.id ? "border-fg bg-surface" : "border-line hover:border-line-strong", cols === 3 && "justify-center")}>
          {it.swatch && <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: it.swatch }} />}
          <span><span className="block text-[14px]">{it.label}</span>{it.sub && <span className="text-[12.5px] text-muted">{it.sub}</span>}</span>
        </button>
      ))}
    </div>
  );
}
