"use client";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";

/** Button bound to a server action; surfaces permission errors inline instead of failing silently. */
export function ActionButton({ action, children, className, disabled, title }: { action: () => Promise<{ ok: boolean; error?: string }>; children: React.ReactNode; className?: string; disabled?: boolean; title?: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button type="button" title={title} disabled={pending || disabled} onClick={() => start(async () => { const r = await action(); setErr(r.ok ? null : r.error ?? "Failed"); })} className={cn("disabled:opacity-40", className)}>
        {pending ? "…" : children}
      </button>
      {err && <span className="mt-1 max-w-[220px] text-[11px] text-[var(--danger)]" role="alert">{err}</span>}
    </span>
  );
}

export function StockInput({ value, onSave, disabled }: { value: number; onSave: (n: number) => Promise<{ ok: boolean; error?: string }>; disabled?: boolean }) {
  const [v, setV] = useState(String(value));
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "saved" | string>("idle");
  const changed = Number(v) !== value;
  return (
    <span className="inline-flex items-center gap-2">
      <input type="number" min={0} value={v} disabled={disabled} onChange={(e) => { setV(e.target.value); setState("idle"); }} className="field-box !min-h-8 w-20" aria-label="Stock" />
      {changed && <button disabled={pending} onClick={() => start(async () => { const r = await onSave(Number(v)); setState(r.ok ? "saved" : r.error ?? "Failed"); })} className="text-[11.5px] uppercase tracking-[0.12em] text-accent">Save</button>}
      {state === "saved" && !changed && <span className="text-[11px] text-[var(--ok)]">Saved</span>}
      {state !== "idle" && state !== "saved" && <span className="text-[11px] text-[var(--danger)]">{state}</span>}
    </span>
  );
}
