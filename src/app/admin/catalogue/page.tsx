import Link from "next/link";
import { db } from "@/server/db";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { moveCategory, toggleCategory, toggleCollection } from "@/server/actions/admin";

export const metadata = { title: "Categories & collections" };

export default function CataloguePage() {
  const sorted = [...db.categories].sort((a, b) => a.position - b.position);
  const roots = sorted.filter((c) => !c.parentId);
  const count = (id: string) => db.products.filter((p) => p.categoryId === id || db.categories.find((c) => c.id === p.categoryId)?.parentId === id).length;
  const Row = ({ c, depth }: { c: (typeof sorted)[number]; depth: number }) => (
    <li className="flex items-center justify-between gap-3 border-b border-line py-2.5" style={{ paddingLeft: depth * 24 }}>
      <span className="flex items-center gap-3">
        {depth > 0 && <span className="text-muted">↳</span>}
        <span>{c.name}</span>
        <span className="text-[12px] text-muted">/{c.slug} · {count(c.id)}</span>
      </span>
      <span className="flex items-center gap-2">
        <Pill tone={c.published ? "ok" : "muted"}>{c.published ? "Published" : "Hidden"}</Pill>
        <ActionButton action={async () => { "use server"; return moveCategory(c.id, -1); }} className="h-8 w-8 border border-line" title="Move up">↑</ActionButton>
        <ActionButton action={async () => { "use server"; return moveCategory(c.id, 1); }} className="h-8 w-8 border border-line" title="Move down">↓</ActionButton>
        <ActionButton action={async () => { "use server"; return toggleCategory(c.id); }} className="h-8 border border-line px-3 text-[11px] uppercase tracking-[0.12em]">{c.published ? "Unpublish" : "Publish"}</ActionButton>
      </span>
    </li>
  );
  return (
    <div className="space-y-6">
      <PageHeader kicker="Catalogue" title="Categories & collections" description="Taxonomy (nested categories) drives navigation and filters. Editorial collections are independent: a product can sit in many." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Category tree">
          <ul>
            {roots.map((r) => (
              <div key={r.id}>
                <Row c={r} depth={0} />
                {sorted.filter((c) => c.parentId === r.id).map((c) => <Row key={c.id} c={c} depth={1} />)}
              </div>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-muted">Changes reflect immediately in the storefront mega menu and category pages.</p>
        </Card>
        <Card title="Editorial collections">
          <ul className="divide-y divide-line">
            {[...db.collections].sort((a, b) => a.position - b.position).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <span><span className="block">{c.name}</span><span className="text-[12px] text-muted">{c.kicker} · {c.productIds.length} products · <Link href={`/collections/${c.slug}`} target="_blank" className="link-line">view</Link></span></span>
                <span className="flex items-center gap-2">
                  <Pill tone={c.published ? "ok" : "muted"}>{c.published ? "Live" : "Hidden"}</Pill>
                  <ActionButton action={async () => { "use server"; return toggleCollection(c.id); }} className="h-8 border border-line px-3 text-[11px] uppercase tracking-[0.12em]">{c.published ? "Hide" : "Publish"}</ActionButton>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
