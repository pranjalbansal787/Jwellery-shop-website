"use client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { saveProduct } from "@/server/actions/admin";
import { Card, inr } from "@/components/admin/ui";
import { METAL_LABEL, GEM_LABEL } from "@/lib/labels";
import type { Badge, Product, StockStatus, Visibility } from "@/lib/types";

const BADGES: Badge[] = ["NEW", "EXCLUSIVE", "LIMITED", "BESTSELLER", "MADE TO ORDER"];
const STATUSES: StockStatus[] = ["in_stock", "low_stock", "made_to_order", "preorder", "out_of_stock", "discontinued"];
const VIS: Visibility[] = ["draft", "scheduled", "published", "archived"];

export function ProductForm({ product, image, detail, categories, collections, perms }: { product: Product; image: string; detail: string; categories: { id: string; name: string }[]; collections: { id: string; name: string }[]; perms: string[] }) {
  const [f, setF] = useState({ name: product.name, subtitle: product.subtitle, description: product.description, categoryId: product.categoryId, collectionIds: product.collectionIds, visibility: product.visibility, status: product.status, badges: product.badges });
  const [variants, setVariants] = useState(product.variants.map((v) => ({ id: v.id, price: v.price, stock: v.stock })));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const canEdit = perms.includes("product.update");
  const canPrice = perms.includes("pricing.modify");
  const canStock = perms.includes("inventory.modify");
  const dirty = JSON.stringify({ ...f, v: variants }) !== JSON.stringify({ name: product.name, subtitle: product.subtitle, description: product.description, categoryId: product.categoryId, collectionIds: product.collectionIds, visibility: product.visibility, status: product.status, badges: product.badges, v: product.variants.map((v) => ({ id: v.id, price: v.price, stock: v.stock })) });

  const save = () => start(async () => {
    const r = await saveProduct(product.id, { ...f, variants });
    setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Saved" : r.error });
  });

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card title="Details">
          <fieldset disabled={!canEdit} className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Title</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="field-box mt-1" /></label>
            <label className="md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Short description</span><input value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className="field-box mt-1" /></label>
            <label className="md:col-span-2"><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Description</span><textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="field-box mt-1" /></label>
            <label><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Category</span><select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })} className="field-box mt-1">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Slug</span><input value={product.slug} readOnly className="field-box mt-1 text-muted" /></label>
          </fieldset>
        </Card>
        <Card title={`Variants · ${variants.length}`} pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead><tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[0.14em] text-muted"><th className="px-4 py-3 font-normal">SKU</th><th className="px-4 font-normal">Metal</th><th className="px-4 font-normal">Stone</th><th className="px-4 font-normal">Weight</th><th className="px-4 font-normal">Price (₹)</th><th className="px-4 font-normal">Stock</th></tr></thead>
              <tbody className="divide-y divide-line">
                {product.variants.map((v, i) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 text-muted">{v.sku}</td>
                    <td className="px-4">{v.purity} {METAL_LABEL[v.metal]}</td>
                    <td className="px-4">{GEM_LABEL[v.gem]}</td>
                    <td className="px-4 text-muted">{v.weightGrams} g</td>
                    <td className="px-4"><input type="number" min={1000} step={500} value={variants[i].price} disabled={!canPrice} onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} className="field-box !min-h-9 w-32" aria-label={`Price for ${v.sku}`} /></td>
                    <td className="px-4"><input type="number" min={0} value={variants[i].stock} disabled={!canStock} onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)))} className="field-box !min-h-9 w-20" aria-label={`Stock for ${v.sku}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!canPrice || !canStock) && <p className="border-t border-line px-4 py-3 text-[12px] text-muted">{!canPrice && "Prices are read-only for your role (needs pricing.modify). "}{!canStock && "Stock is read-only (needs inventory.modify)."}</p>}
        </Card>
        {product.diamond && (
          <Card title="Diamond">
            <dl className="grid grid-cols-2 gap-3 text-[13px] md:grid-cols-4">
              {[["Carat", product.diamond.totalCarat.toFixed(2)], ["Shape", product.diamond.shape], ["Colour", product.diamond.colour], ["Clarity", product.diamond.clarity], ["Cut", product.diamond.cut], ["Lab", product.diamond.certificate], ["Certificate", product.diamond.certificateNo]].map(([k, v]) => <div key={k}><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{k}</dt><dd className="mt-1 capitalize">{v}</dd></div>)}
            </dl>
          </Card>
        )}
      </div>
      <div className="space-y-6">
        <Card title="Publishing">
          <fieldset disabled={!canEdit} className="space-y-4">
            <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Visibility</span><select value={f.visibility} onChange={(e) => setF({ ...f, visibility: e.target.value as Visibility })} className="field-box mt-1 capitalize">{VIS.map((v) => <option key={v} value={v} disabled={v === "published" && !perms.includes("product.publish") && product.visibility !== "published"}>{v}</option>)}</select></label>
            <label className="block"><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Availability</span><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as StockStatus })} className="field-box mt-1">{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select></label>
            <div><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Badges</span><div className="mt-2 flex flex-wrap gap-1.5">{BADGES.map((b) => <button type="button" key={b} aria-pressed={f.badges.includes(b)} onClick={() => setF({ ...f, badges: f.badges.includes(b) ? f.badges.filter((x) => x !== b) : [...f.badges, b].slice(0, 3) })} className="chip !min-h-8 !text-[11px]">{b}</button>)}</div></div>
            <div><span className="text-[11px] uppercase tracking-[0.14em] text-muted">Collections</span><div className="mt-2 space-y-1.5">{collections.map((c) => <label key={c.id} className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.collectionIds.includes(c.id)} onChange={(e) => setF({ ...f, collectionIds: e.target.checked ? [...f.collectionIds, c.id] : f.collectionIds.filter((x) => x !== c.id) })} className="accent-[var(--accent)]" />{c.name}</label>)}</div></div>
          </fieldset>
          <button onClick={save} disabled={!dirty || pending} className="btn btn-primary btn-sm mt-6 w-full">{pending ? "Saving…" : dirty ? "Save changes" : "No changes"}</button>
          {msg && <p className={`mt-3 text-[12.5px] ${msg.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`} role="status">{msg.text}</p>}
          <p className="mt-3 text-[11.5px] text-muted">Price and stock edits are written to the audit log with before/after values.</p>
        </Card>
        <Card title="Media">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative aspect-[4/5] stage"><Image src={image} alt="" fill sizes="160px" className="object-contain" /></div>
            <div className="relative aspect-[4/5] stage"><Image src={detail} alt="" fill sizes="160px" className="object-contain" /></div>
          </div>
          <p className="mt-3 text-[12px] text-muted">Demo media are studio renders of the procedural 3D model ({product.design}). Uploads, 360° sets and GLB models arrive with the Media module (signed S3 uploads, AVIF/WebP variants, Draco/KTX2 optimisation queue).</p>
          <p className="mt-2 text-[12px] text-muted">From {inr(Math.min(...variants.map((v) => v.price)))}</p>
        </Card>
      </div>
    </div>
  );
}
