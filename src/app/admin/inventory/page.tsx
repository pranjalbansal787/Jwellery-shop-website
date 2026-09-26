import Link from "next/link";
import { db } from "@/server/db";
import { FilterLinks, PageHeader, Pill, Table, Td } from "@/components/admin/ui";
import { StockInput } from "@/components/admin/action-button";
import { adjustStock } from "@/server/actions/admin";
import { can } from "@/server/rbac";
import { METAL_LABEL, GEM_LABEL } from "@/lib/labels";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "" } = await searchParams;
  const rows = db.products.flatMap((p) => p.variants.map((v) => ({ p, v })));
  const status = (r: (typeof rows)[number]) => (r.p.status === "made_to_order" || r.p.status === "preorder" ? "mto" : r.v.stock === 0 ? "out" : r.v.stock <= 2 ? "low" : "ok");
  const list = rows.filter((r) => !filter || status(r) === filter);
  const editable = await can("inventory.modify");
  const n = (k: string) => rows.filter((r) => status(r) === k).length;
  return (
    <div className="space-y-6">
      <PageHeader kicker="Commerce" title="Inventory" description="Variant-level stock. Store and warehouse locations, reservations and transfers are modelled in the schema (inventory, inventory_locations) and arrive in P1." />
      <FilterLinks base="/admin/inventory" param="filter" current={filter} options={[["", "All variants", rows.length], ["low", "Low stock (≤2)", n("low")], ["out", "Out of stock", n("out")], ["mto", "Made to order / pre-order", n("mto")], ["ok", "Healthy", n("ok")]]} />
      <div className="border border-line bg-surface">
        <Table head={["SKU", "Product", "Configuration", "Status", "Lead time", "On hand"]}>
          {list.slice(0, 200).map(({ p, v }) => {
            const s = status({ p, v });
            return (
              <tr key={v.id}>
                <Td className="text-muted">{v.sku}</Td>
                <Td><Link href={`/admin/products/${p.id}`} className="link-line">{p.name}</Link></Td>
                <Td className="text-muted">{v.purity} {METAL_LABEL[v.metal]} · {GEM_LABEL[v.gem]}</Td>
                <Td><Pill tone={s === "ok" ? "ok" : s === "low" ? "warn" : s === "out" ? "danger" : "muted"}>{s === "ok" ? "In stock" : s === "low" ? "Low" : s === "out" ? "Out" : "MTO"}</Pill></Td>
                <Td className="text-muted">{v.leadDays} days</Td>
                <Td><StockInput value={v.stock} disabled={!editable} onSave={async (x) => { "use server"; return adjustStock(v.id, x); }} /></Td>
              </tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}
