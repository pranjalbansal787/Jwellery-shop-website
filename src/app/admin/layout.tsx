import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { getAdminSession, ROLES } from "@/server/rbac";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getAdminSession();
  return (
    <AdminShell session={{ role: s.role, label: s.label, name: s.name }} roles={Object.entries(ROLES).map(([id, r]) => ({ id, label: r.label, person: r.person }))}>
      {children}
    </AdminShell>
  );
}
