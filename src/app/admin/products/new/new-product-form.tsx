"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProduct } from "@/server/actions/admin";
import { Card } from "@/components/admin/ui";
import type { DesignKey } from "@/lib/types";

const DESIGNS: [DesignKey, string][] = [["solitaire", "Solitaire ring"], ["halo", "Halo ring"], ["three-stone", "Three-stone ring"], ["band", "Band"], ["eternity", "Eternity band"], ["cocktail", "Cocktail ring"], ["signet", "Signet"], ["studs", "Stud earrings"], ["drops", "Drop earrings"], ["hoops", "Hoops"], ["pendant", "Pendant"], ["riviere", "Rivière necklace"], ["tennis", "Tennis bracelet"], ["bangle", "Bangle"]];

export function NewProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", categoryId: categories[0].id, design: "solitaire" as DesignKey, basePrice: 150000 });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="max-w-2xl">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await createProduct(f); if (r.ok) router.push(`/admin/products/${r.id}`); else setErr(r.error); }); }}>
        <label className="md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Title</span><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="field-box mt-1" placeholder="e.g. Amara Oval Halo Ring" /></label>
        <label><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Category</span><select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })} className="field-box mt-1">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Design template</span><select value={f.design} onChange={(e) => setF({ ...f, design: e.target.value as DesignKey })} className="field-box mt-1">{DESIGNS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Base price (₹)</span><input type="number" min={1000} step={500} value={f.basePrice} onChange={(e) => setF({ ...f, basePrice: Number(e.target.value) })} className="field-box mt-1" /></label>
        {err && <p className="text-[12.5px] text-[var(--danger)] md:col-span-2">{err}</p>}
        <div className="md:col-span-2"><button className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Creating…" : "Create draft"}</button></div>
      </form>
    </Card>
  );
}
