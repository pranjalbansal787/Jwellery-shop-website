import { getHomeSections } from "@/server/repo/content";
import { PageHeader } from "@/components/admin/ui";
import { HomeEditor } from "./home-editor";
import { can } from "@/server/rbac";

export const metadata = { title: "Homepage content" };

export default async function ContentPage() {
  const sections = await getHomeSections();
  return (
    <div className="space-y-6">
      <PageHeader kicker="Experience" title="Homepage" description="The homepage is assembled from modular sections. Drag to reorder, toggle visibility, then publish. Section-level copy and media editing arrives with the CMS module (P1)." />
      <HomeEditor initial={sections.map((s) => ({ ...s }))} canEdit={await can("content.edit")} />
    </div>
  );
}
