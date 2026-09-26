"use client";
import { useEffect, useMemo, useState } from "react";
import { SIZE_TABLE, fromCircumference } from "@/lib/ring-size";
import { useProfile } from "@/stores/profile";
import { useHydrated } from "@/lib/hooks";
import { IconCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Tab = "chart" | "ring" | "screen" | "finger" | "print";
const TABS: [Tab, string][] = [["chart", "Size chart"], ["ring", "Measure a ring"], ["screen", "On-screen sizer"], ["finger", "Measure your finger"], ["print", "Printable sizer"]];

const CARD_MM = 85.6; // ISO/IEC 7810 ID-1 (payment card) width

export function RingSizer({ onSelect, compact = false }: { onSelect?: (india: string) => void; compact?: boolean }) {
  const [tab, setTab] = useState<Tab>("chart");
  const [result, setResult] = useState<number | null>(null);
  const { ringSize, setRingSize } = useProfile();
  const hydrated = useHydrated();

  const save = (india: number) => {
    setRingSize(String(india));
    onSelect?.(String(india));
  };

  return (
    <div>
      <div role="tablist" aria-label="Ways to find your size" className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([t, l]) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("shrink-0 border-b px-3 py-3 text-[12px] uppercase tracking-[0.14em] transition-colors", tab === t ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg")}>{l}</button>
        ))}
      </div>
      <div className="pt-6" role="tabpanel">
        {tab === "chart" && <Chart highlight={result ?? (hydrated && ringSize ? Number(ringSize) : null)} onPick={(n) => { setResult(n); save(n); }} compact={compact} />}
        {tab === "ring" && <RingMeasure onResult={setResult} />}
        {tab === "screen" && <ScreenSizer onResult={setResult} />}
        {tab === "finger" && <FingerMeasure onResult={setResult} />}
        {tab === "print" && <Printable />}
      </div>
      {result !== null && tab !== "chart" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-accent/60 bg-surface p-5" role="status">
          <div>
            <p className="kicker text-accent">Your size</p>
            <p className="mt-1 font-display text-3xl">India {result}</p>
            <p className="text-[12.5px] text-muted">UK {fromCircumference(result + 40).uk} · US {fromCircumference(result + 40).us} · EU {fromCircumference(result + 40).eu}</p>
          </div>
          <button onClick={() => save(result)} className="btn btn-primary btn-sm">{onSelect ? "Use this size" : "Save to my profile"}</button>
        </div>
      )}
      {hydrated && ringSize && (
        <p className="mt-4 flex items-center gap-2 text-[12.5px] text-muted"><IconCheck size={14} className="text-accent" /> Saved size: India {ringSize}. We’ll pre-select it on every ring.</p>
      )}
    </div>
  );
}

function Chart({ highlight, onPick, compact }: { highlight: number | null; onPick: (n: number) => void; compact: boolean }) {
  return (
    <div className={cn("overflow-auto", compact && "max-h-[46vh]")}>
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <thead className="sticky top-0 bg-bg">
          <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
            {["India", "Circumference", "Diameter", "UK", "US", "EU", "Japan", ""].map((h) => <th key={h} className="py-2.5 pr-3 font-normal">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {SIZE_TABLE.map((r) => (
            <tr key={r.india} className={cn("border-b border-line", highlight === r.india && "bg-surface")}>
              <td className="py-2.5 pr-3 font-medium">{r.india}</td>
              <td className="pr-3">{r.circumference} mm</td>
              <td className="pr-3">{r.diameter} mm</td>
              <td className="pr-3">{r.uk}</td>
              <td className="pr-3">{r.us}</td>
              <td className="pr-3">{r.eu}</td>
              <td className="pr-3">{r.jp}</td>
              <td className="text-right"><button onClick={() => onPick(r.india)} className="link-line text-[12px] text-muted hover:text-fg">{highlight === r.india ? "Selected" : "Select"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[12px] text-muted">Indicative conversions. Your advisor confirms the size before any sized piece is finished.</p>
    </div>
  );
}

function RingMeasure({ onResult }: { onResult: (n: number) => void }) {
  const [d, setD] = useState("");
  const n = parseFloat(d);
  useEffect(() => { if (n >= 14 && n <= 24) onResult(fromCircumference(n * Math.PI).india); }, [n, onResult]);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex items-center justify-center stage p-8">
        <svg viewBox="0 0 200 200" className="h-40 w-40" aria-hidden>
          <circle cx="100" cy="100" r="70" fill="none" stroke="var(--accent)" strokeWidth="14" opacity=".5" />
          <line x1="37" y1="100" x2="163" y2="100" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="3 3" />
          <text x="100" y="92" textAnchor="middle" fill="var(--muted)" fontSize="11">inner diameter</text>
        </svg>
      </div>
      <div>
        <p className="text-[14px]">Take a ring that fits the intended finger. Measure the <em>inside</em> edge to edge with a ruler, through the centre.</p>
        <label className="mt-6 block">
          <span className="kicker text-muted">Inner diameter (mm)</span>
          <input inputMode="decimal" value={d} onChange={(e) => setD(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 16.5" className="field mt-1 font-display text-2xl" />
        </label>
        {d && !(n >= 14 && n <= 24) && <p className="mt-2 text-[12.5px] text-[var(--danger)]">Enter a diameter between 14 and 24 mm.</p>}
      </div>
    </div>
  );
}

function FingerMeasure({ onResult }: { onResult: (n: number) => void }) {
  const [c, setC] = useState("");
  const n = parseFloat(c);
  useEffect(() => { if (n >= 42 && n <= 76) onResult(fromCircumference(n).india); }, [n, onResult]);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ol className="space-y-3 text-[14px]">
        {["Wrap a strip of paper or thread around the base of your finger.", "Mark where it overlaps. Measure towards the evening, when fingers are largest.", "Lay it flat and measure the length in millimetres.", "If between sizes, choose the larger one."].map((s, i) => (
          <li key={i} className="flex gap-3"><span className="font-display text-xl text-accent">{i + 1}</span><span className="pt-1">{s}</span></li>
        ))}
      </ol>
      <label className="block">
        <span className="kicker text-muted">Circumference (mm)</span>
        <input inputMode="decimal" value={c} onChange={(e) => setC(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 52" className="field mt-1 font-display text-2xl" />
        {c && !(n >= 42 && n <= 76) && <span className="mt-2 block text-[12.5px] text-[var(--danger)]">Enter a length between 42 and 76 mm.</span>}
      </label>
    </div>
  );
}

/** Screen calibration with a payment card, then match an existing ring against a live circle. */
function ScreenSizer({ onResult }: { onResult: (n: number) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [cardPx, setCardPx] = useState(320);
  const [ringD, setRingD] = useState(17);
  const pxPerMm = cardPx / CARD_MM;
  useEffect(() => { if (step === 2) onResult(fromCircumference(ringD * Math.PI).india); }, [ringD, step, onResult]);
  return (
    <div>
      {step === 1 ? (
        <>
          <p className="text-[14px]"><strong className="font-medium">Step 1 · Calibrate.</strong> Hold any payment card against the screen and adjust until the outline matches its width exactly.</p>
          <div className="mt-6 flex justify-center overflow-hidden">
            <div className="flex items-end justify-start rounded-[10px] border border-dashed border-accent p-3" style={{ width: cardPx, height: cardPx * (53.98 / 85.6) }}>
              <span className="text-[11px] text-muted">Card edge ↔</span>
            </div>
          </div>
          <input type="range" min={200} max={560} value={cardPx} onChange={(e) => setCardPx(+e.target.value)} className="mt-6 w-full accent-[var(--accent)]" aria-label="Card width" />
          <button onClick={() => setStep(2)} className="btn btn-primary btn-sm mt-4">It matches, continue</button>
        </>
      ) : (
        <>
          <p className="text-[14px]"><strong className="font-medium">Step 2 · Match your ring.</strong> Place a ring on the screen and adjust until the circle sits exactly inside it.</p>
          <div className="mt-6 flex h-56 items-center justify-center">
            <div className="rounded-full border-2 border-accent" style={{ width: ringD * pxPerMm, height: ringD * pxPerMm }} />
          </div>
          <input type="range" min={14} max={23} step={0.1} value={ringD} onChange={(e) => setRingD(+e.target.value)} className="w-full accent-[var(--accent)]" aria-label="Ring inner diameter" />
          <p className="mt-2 text-center text-[12.5px] text-muted">{ringD.toFixed(1)} mm inner diameter</p>
          <button onClick={() => setStep(1)} className="link-line mt-3 text-[12px] text-muted">Recalibrate</button>
        </>
      )}
    </div>
  );
}

function Printable() {
  const sizes = useMemo(() => SIZE_TABLE.filter((_, i) => i % 2 === 0), []);
  return (
    <div>
      <p className="text-[14px]">Print at <strong className="font-medium">100% scale</strong> (not “fit to page”). Check the 50 mm calibration bar with a ruler, then place your ring over the circles.</p>
      <div id="printable-sizer" className="mt-6 bg-white p-6 text-black">
        <div style={{ width: "50mm", height: "3mm", background: "#000" }} />
        <p style={{ fontSize: 10, marginTop: 4 }}>50 mm calibration bar</p>
        <div className="mt-4 flex flex-wrap gap-4">
          {sizes.map((r) => (
            <div key={r.india} className="flex flex-col items-center">
              <div style={{ width: `${r.diameter}mm`, height: `${r.diameter}mm`, borderRadius: "50%", border: "0.3mm solid #000" }} />
              <span style={{ fontSize: 10, marginTop: 4 }}>IN {r.india}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => window.print()} className="btn btn-outline btn-sm mt-4">Print sizer</button>
    </div>
  );
}
