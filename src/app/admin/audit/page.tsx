import { listAudit } from "@/server/repo/audit";
import { can } from "@/server/rbac";
import { PageHeader, Table, Td, when } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  if (!(await can("audit.view"))) return <div className="space-y-6"><PageHeader kicker="System" title="Audit log" /><p className="text-muted">Your role doesn’t have access to the audit log (needs audit.view).</p></div>;
  const events = await listAudit();
  return (
    <div className="space-y-6">
      <PageHeader kicker="System" title="Audit log" description="Append-only record of sensitive actions: actor, action, resource, before/after state, IP and user agent. Try changing a price or an order status, then return here." />
      <div className="border border-line bg-surface">
        <Table head={["When", "Actor", "Action", "Resource", "Change", "Origin"]}>
          {events.map((e) => (
            <tr key={e.id} className="align-top">
              <Td className="whitespace-nowrap text-muted">{when(e.at)}</Td>
              <Td>{e.actor}</Td>
              <Td className="font-mono text-[12px]">{e.action}</Td>
              <Td className="text-muted">{e.resource}</Td>
              <Td className="max-w-[320px]">
                {e.before !== undefined && <p className="truncate text-[12px] text-muted"><span className="text-[var(--danger)]">−</span> {JSON.stringify(e.before)}</p>}
                {e.after !== undefined && <p className="truncate text-[12px]"><span className="text-[var(--ok)]">+</span> {JSON.stringify(e.after)}</p>}
              </Td>
              <Td className="text-[12px] text-muted">{e.ip}<span className="block">{e.userAgent.slice(0, 40)}</span></Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
