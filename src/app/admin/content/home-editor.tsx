"use client";
import { Reorder, useDragControls } from "motion/react";
import { useState, useTransition } from "react";
import { saveHomeLayout } from "@/server/actions/admin";
import { Card } from "@/components/admin/ui";
import { cn } from "@/lib/cn";

type S = { id: string; label: string; enabled: boolean };

export function HomeEditor({ initial, canEdit }: { initial: S[]; canEdit: boolean }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; setItems(n); };
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card title="Sections" className="xl:col-span-2">
        <Reorder.Group axis="y" values={items} onReorder={canEdit ? setItems : () => {}} className="space-y-2">
          {items.map((s, i) => <Row key={s.id} s={s} i={i} canEdit={canEdit} onToggle={() => setItems(items.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)))} onMove={move} />)}
        </Reorder.Group>
      </Card>
      <Card title="Publish">
        <p className="text-[13px] text-muted">{items.filter((s) => s.enabled).length} of {items.length} sections visible.</p>
        <button disabled={!dirty || pending || !canEdit} onClick={() => start(async () => { const r = await saveHomeLayout(items.map((s) => ({ id: s.id, enabled: s.enabled }))); setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Published" : r.error }); })} className="btn btn-primary btn-sm mt-4 w-full">{pending ? "Publishing…" : "Publish homepage"}</button>
        {dirty && <button onClick={() => setItems(initial)} className="link-line mt-3 text-[12px] text-muted">Discard changes</button>}
        {msg && <p className={`mt-3 text-[12.5px] ${msg.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>{msg.text}</p>}
        {!canEdit && <p className="mt-3 text-[12px] text-muted">Read-only: needs content.edit.</p>}
        <a href="/" target="_blank" className="link-line mt-6 inline-block text-[12px]">Open homepage</a>
      </Card>
    </div>
  );
}

function Row({ s, i, canEdit, onToggle, onMove }: { s: S; i: number; canEdit: boolean; onToggle: () => void; onMove: (i: number, d: -1 | 1) => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={s} dragListener={false} dragControls={controls} className={cn("flex items-center gap-3 border border-line bg-bg px-3 py-3", !s.enabled && "opacity-50")}>
      <button onPointerDown={(e) => canEdit && controls.start(e)} className="cursor-grab touch-none px-1 text-muted active:cursor-grabbing" aria-label={`Drag ${s.label}`} data-cursor="drag">⋮⋮</button>
      <span className="w-6 text-[12px] text-muted">{String(i + 1).padStart(2, "0")}</span>
      <span className="flex-1 text-[13.5px]">{s.label}</span>
      <button onClick={() => onMove(i, -1)} disabled={!canEdit} className="h-8 w-8 border border-line text-[12px] disabled:opacity-30" aria-label="Move up">↑</button>
      <button onClick={() => onMove(i, 1)} disabled={!canEdit} className="h-8 w-8 border border-line text-[12px] disabled:opacity-30" aria-label="Move down">↓</button>
      <label className="flex items-center gap-2 text-[12px] text-muted"><input type="checkbox" checked={s.enabled} disabled={!canEdit} onChange={onToggle} className="accent-[var(--accent)]" /> Visible</label>
    </Reorder.Item>
  );
}
