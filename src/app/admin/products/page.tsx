import Link from "next/link";
import Image from "next/image";
import { db } from "@/server/db";
import { FilterLinks, PageHeader, Pill, Table, Td, inr } from "@/components/admin/ui";
import { productImage } from "@/lib/media";
import { STOCK_LABEL } from "@/lib/labels";
import { can } from "@/server/rbac";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").toLowerCase();
  const roots = db.categories.filter((c) => !c.parentId);
  const inCat = (pid: string, catId: string) => pid === catId || db.categories.find((c) => c.id === pid)?.parentId === catId;
  const list = db.products.filter((p) => (!sp.cat || inCat(p.categoryId, sp.cat)) && (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q)));
  const canCreate = await can("product.create");
  return (
    <div className="space-y-6">
      <PageHeader kicker="Catalogue" title="Products" description={`${db.products.length} products · ${db.products.reduce((n, p) => n + p.variants.length, 0)} variants. All demo items are flagged as demo data.`} actions={canCreate ? <Link href="/admin/products/new" className="btn btn-primary btn-sm">New product</Link> : undefined} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterLinks base="/admin/products" param="cat" current={sp.cat} options={[["", "All", db.products.length], ...roots.map((r) => [r.id, r.name, db.products.filter((p) => inCat(p.categoryId, r.id)).length] as [string, string, number])]} />
        <form className="flex gap-2"><input name="q" defaultValue={sp.q} placeholder="Name or SKU" className="field-box w-56" /><button className="btn btn-outline btn-sm">Search</button></form>
      </div>
      <div className="border border-line bg-surface">
        <Table head={["", "Product", "Category", "Price range", "Stock", "Availability", "Visibility"]}>
          {list.map((p) => {
            const prices = p.variants.map((v) => v.price);
            const stock = p.variants.reduce((n, v) => n + v.stock, 0);
            return (
              <tr key={p.id} className="hover:bg-elevated">
                <Td className="w-14"><div className="relative h-11 w-11 stage"><Image src={productImage(p)} alt="" fill sizes="44px" className="object-contain" /></div></Td>
                <Td><Link href={`/admin/products/${p.id}`} className="link-line">{p.name}</Link><span className="block text-[12px] text-muted">{p.sku} · {p.variants.length} variants</span></Td>
                <Td className="text-muted">{db.categories.find((c) => c.id === p.categoryId)?.name}</Td>
                <Td>{inr(Math.min(...prices))}{prices.length > 1 && Math.max(...prices) !== Math.min(...prices) ? ` – ${inr(Math.max(...prices))}` : ""}</Td>
                <Td>{stock}</Td>
                <Td><Pill tone={p.status === "in_stock" ? "ok" : p.status === "low_stock" || p.status === "preorder" ? "warn" : p.status === "out_of_stock" ? "danger" : "muted"}>{STOCK_LABEL[p.status]}</Pill></Td>
                <Td><Pill tone={p.visibility === "published" ? "accent" : "muted"}>{p.visibility}</Pill></Td>
              </tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}
