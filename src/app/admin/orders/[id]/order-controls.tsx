"use client";
import { useState, useTransition } from "react";
import { updateOrderStatus, addNote } from "@/server/actions/admin";
import { Card, when } from "@/components/admin/ui";
import type { OrderEvent, OrderStatus } from "@/lib/types";

const NEXT: Record<string, OrderStatus[]> = {
  placed: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["quality_check", "cancelled", "refunded"],
  quality_check: ["packaged", "cancelled", "refunded"],
  packaged: ["dispatched", "refunded"],
  dispatched: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function OrderControls({ id, status, canUpdate, canRefund, notes, timeline }: { id: string; status: OrderStatus; canUpdate: boolean; canRefund: boolean; notes: string[]; timeline: OrderEvent[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [note, setNote] = useState("");
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Saved." : r.error ?? "Failed" }); });
  return (
    <>
      <Card title="Fulfilment status">
        <div className="flex flex-wrap gap-2">
          {NEXT[status].map((s) => {
            const allowed = s === "refunded" ? canRefund : canUpdate;
            return (
              <button key={s} disabled={pending || !allowed} title={allowed ? undefined : "Your role can’t do this"} onClick={() => run(() => updateOrderStatus(id, s))} className={`btn btn-sm ${s === "cancelled" || s === "refunded" ? "btn-outline" : "btn-primary"}`}>
                Mark {s.replace(/_/g, " ")}
              </button>
            );
          })}
          {NEXT[status].length === 0 && <p className="text-[13px] text-muted">This order is closed.</p>}
        </div>
        {!canUpdate && <p className="mt-3 text-[12px] text-muted">Read-only for your role. Switch to Order Manager or Super Admin in the top bar.</p>}
        {msg && <p className={`mt-3 text-[12.5px] ${msg.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`} role="status">{msg.text}</p>}
        <ol className="mt-6 space-y-2 border-t border-line pt-4 text-[12.5px]">
          {[...timeline].reverse().map((e, i) => <li key={i} className="flex justify-between gap-4"><span className="capitalize">{String(e.status).replace(/_/g, " ")}{e.note ? <span className="text-muted"> · {e.note}</span> : null}</span><span className="shrink-0 text-muted">{when(e.at)}</span></li>)}
        </ol>
      </Card>
      <Card title="Internal notes">
        <form onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await addNote(id, note); if (r.ok) setNote(""); return r; }); }} className="flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible to staff only" className="field-box" disabled={!canUpdate} />
          <button className="btn btn-outline btn-sm" disabled={pending || !note.trim() || !canUpdate}>Add</button>
        </form>
        <ul className="mt-4 space-y-2 text-[13px]">{notes.map((n, i) => <li key={i} className="border-l border-accent pl-3">{n}</li>)}</ul>
      </Card>
    </>
  );
}
