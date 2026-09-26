import { PERMISSIONS, ROLES, getAdminSession } from "@/server/rbac";
import { Card, PageHeader } from "@/components/admin/ui";
import { IconCheck } from "@/components/ui/icons";

export const metadata = { title: "Users & roles" };

const PLANNED_ROLES = ["Administrator", "Inventory Manager", "Store Manager", "Marketing", "Finance"];

export default async function RolesPage() {
  const s = await getAdminSession();
  const roles = Object.entries(ROLES);
  return (
    <div className="space-y-6">
      <PageHeader kicker="System" title="Users & roles" description="Granular permissions enforced on the server for every action (and mirrored in the UI). Switch roles from the top bar to see the admin change." />
      <Card title="Permission matrix" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[12.5px]">
            <thead><tr className="border-b border-line text-left"><th className="px-4 py-3 font-normal text-muted">Permission</th>{roles.map(([id, r]) => <th key={id} className={`px-3 py-3 text-center font-normal ${s.role === id ? "text-accent" : "text-muted"}`}>{r.label}<span className="block text-[11px]">{r.person}</span></th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {PERMISSIONS.map((p) => (
                <tr key={p}><td className="px-4 py-2 font-mono text-[12px]">{p}</td>{roles.map(([id, r]) => <td key={id} className="px-3 text-center">{(r.can as readonly string[]).includes(p) ? <IconCheck size={14} className="mx-auto text-accent" /> : <span className="text-muted/40">·</span>}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[12.5px] text-muted">Also defined in the architecture (not in this demo’s switcher): {PLANNED_ROLES.join(", ")}. Production adds MFA, session timeout and IP allow-listing for admin.</p>
    </div>
  );
}
