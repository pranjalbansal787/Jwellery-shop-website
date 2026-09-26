"use client";
import { useState } from "react";

export type Fmt = "inr" | "number";
const fmt = (kind: Fmt) => (n: number) => {
  if (kind === "number") return Math.round(n).toLocaleString("en-IN");
  return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`;
};

/** Single-series daily bars with per-bar hover tooltip. One hue (accent); recessive grid; no legend (title names the series). */
export function DailyBars({ data, format: kind, height = 220, label }: { data: { date: string; value: number }[]; format: Fmt; height?: number; label: string }) {
  const format = fmt(kind);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = niceMax(max);
  const W = 720, H = height, padL = 56, padB = 24, padT = 8;
  const bw = (W - padL) / data.length;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / nice);
  const ticks = [0, 0.5, 1].map((t) => t * nice);
  return (
    <figure className="relative" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label}: ${data.length} days`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)">{format(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * bw + 1;
          const h = Math.max(0, H - padB - y(d.value));
          const w = Math.max(2, bw - 2);
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * bw} y={padT} width={bw} height={H - padT - padB} fill="transparent" />
              <path d={roundedTop(x, H - padB - h, w, h, Math.min(4, w / 2))} fill="var(--accent)" opacity={hover === null || hover === i ? 0.9 : 0.35} />
            </g>
          );
        })}
        {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
          <text key={i} x={padL + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--muted)">{new Date(data[i].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</text>
        ))}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 -translate-x-1/2 border border-line bg-elevated px-3 py-2 text-[12px] shadow-lg" style={{ left: `${((padL + hover * bw + bw / 2) / W) * 100}%` }}>
          <p className="text-muted">{new Date(data[hover].date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
          <p className="text-fg">{format(data[hover].value)}</p>
        </div>
      )}
    </figure>
  );
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= r) return `M${x},${y + h}V${y}H${x + w}V${y + h}Z`;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Ranked horizontal bars (single hue) with values in text ink. */
export function RankBars({ rows, format: kind }: { rows: { label: string; value: number; sub?: string }[]; format: Fmt }) {
  const format = fmt(kind);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${format(r.value)}`}>
          <div className="flex justify-between gap-4 text-[12.5px]"><span className="truncate">{r.label}</span><span className="shrink-0 text-muted">{format(r.value)}{r.sub ? ` · ${r.sub}` : ""}</span></div>
          <div className="mt-1.5 h-1.5 bg-line/60"><div className="h-full rounded-r-[4px] bg-accent" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

/** Funnel as proportional rows — each step shows count and step conversion. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = steps[0]?.value || 1;
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="flex justify-between text-[12.5px]"><span>{s.label}</span><span className="text-muted">{s.value.toLocaleString("en-IN")}{i > 0 && steps[i - 1].value ? ` · ${((s.value / steps[i - 1].value) * 100).toFixed(1)}%` : ""}</span></div>
          <div className="mt-1.5 h-6 bg-line/40"><div className="h-full bg-accent/85" style={{ width: `${Math.max(1.5, (s.value / max) * 100)}%` }} /></div>
        </li>
      ))}
    </ol>
  );
}
