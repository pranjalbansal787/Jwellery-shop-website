import Link from "next/link";
import { listCustomers } from "@/server/repo/crm";
import { FilterLinks, PageHeader, Pill, Table, Td, inr } from "@/components/admin/ui";
import { db } from "@/server/db";

export const metadata = { title: "Customers" };
const SEGMENTS = ["VIP", "Repeat Buyer", "High Intent", "Bridal", "Dormant", "Appointment Lead"];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ segment?: string }> }) {
  const { segment = "" } = await searchParams;
  const all = await listCustomers();
  const list = all.filter((c) => !segment || c.segment.includes(segment as never)).sort((a, b) => b.ltv - a.ltv);
  return (
    <div className="space-y-6">
      <PageHeader kicker="Clients" title="Customers" description="Client book with lifetime value, segments and consent. Important dates are stored only when a client volunteers them." />
      <FilterLinks base="/admin/customers" param="segment" current={segment} options={[["", "All", all.length], ...SEGMENTS.map((s) => [s, s, all.filter((c) => c.segment.includes(s as never)).length] as [string, string, number])]} />
      <div className="border border-line bg-surface">
        <Table head={["Client", "City", "Segments", "Orders", "Lifetime value", "AOV", "Preferred boutique", "Consent"]}>
          {list.map((c) => (
            <tr key={c.id} className="hover:bg-elevated">
              <Td><Link href={`/admin/customers/${c.id}`} className="link-line">{c.name}</Link><span className="block text-[12px] text-muted">{c.email}</span></Td>
              <Td className="text-muted">{c.city}</Td>
              <Td><span className="flex flex-wrap gap-1">{c.segment.map((s) => <Pill key={s} tone={s === "VIP" ? "accent" : "muted"}>{s}</Pill>)}</span></Td>
              <Td>{c.orders}</Td>
              <Td>{inr(c.ltv)}</Td>
              <Td className="text-muted">{c.aov ? inr(c.aov) : "—"}</Td>
              <Td className="text-muted">{db.stores.find((s) => s.id === c.preferredStoreId)?.name ?? "—"}</Td>
              <Td>{c.marketingConsent ? <Pill tone="ok">Opted in</Pill> : <Pill>No</Pill>}</Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
