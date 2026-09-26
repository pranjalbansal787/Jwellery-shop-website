import { coupons } from "@/server/promotions";
import { PageHeader, Pill, Table, Td } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { toggleCoupon } from "@/server/actions/admin";

export const metadata = { title: "Promotions" };

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader kicker="Growth" title="Promotions" description="Coupons with thresholds, validity windows and usage limits are validated server-side at checkout. Collection/product discounts, gift-with-purchase and scheduled campaigns share the same rules engine (P1)." />
      <div className="border border-line bg-surface">
        <Table head={["Code", "Offer", "Minimum order", "Valid", "Usage", "Status", ""]}>
          {coupons.map((c) => (
            <tr key={c.code}>
              <Td><span className="font-medium tracking-[0.08em]">{c.code}</span></Td>
              <Td>{c.description}</Td>
              <Td className="text-muted">₹{c.minOrder.toLocaleString("en-IN")}</Td>
              <Td className="text-muted">{c.startsAt} → {c.endsAt}</Td>
              <Td>{c.used} / {c.usageLimit}<div className="mt-1 h-1 w-28 bg-line"><div className="h-1 bg-accent" style={{ width: `${(c.used / c.usageLimit) * 100}%` }} /></div></Td>
              <Td><Pill tone={c.active ? "ok" : "muted"}>{c.active ? "Active" : "Paused"}</Pill></Td>
              <Td><ActionButton action={async () => { "use server"; return toggleCoupon(c.code); }} className="btn btn-outline btn-sm">{c.active ? "Pause" : "Activate"}</ActionButton></Td>
            </tr>
          ))}
        </Table>
      </div>
      <p className="text-[12.5px] text-muted">Try it: add a piece over ₹1,00,000 to the bag and apply DIWALI26 at checkout.</p>
    </div>
  );
}
