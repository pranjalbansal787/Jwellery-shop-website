import { cookies } from "next/headers";
import { BRAND_COOKIE, parseBrand } from "@/lib/brand";
import { PageHeader } from "@/components/admin/ui";
import { BrandEditor } from "./brand-editor";
import { can } from "@/server/rbac";

export const metadata = { title: "Brand & theme" };

export default async function BrandSettingsPage() {
  const brand = parseBrand((await cookies()).get(BRAND_COOKIE)?.value);
  return (
    <div className="space-y-6">
      <PageHeader kicker="Client presentation mode" title="Brand & theme" description="Dress the entire platform for a client in a minute: name, palette, typography, currency, WhatsApp number and hero. No code changes, no rebuild." />
      <BrandEditor initial={brand} canEdit={await can("brand.manage")} />
    </div>
  );
}
