import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/plp/listing";
import { PlpHeader } from "@/components/plp/plp-header";
import { getCategories, getCategory } from "@/server/repo/catalog";
import { JsonLd, breadcrumbLd } from "@/lib/seo";
import type { SearchParams } from "@/lib/filters";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = await getCategory((await params).category);
  if (!c) return {};
  return { title: c.name, description: c.description, alternates: { canonical: `/shop/${c.slug}` }, openGraph: { title: c.name, description: c.description } };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> }) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const cat = await getCategory(category);
  if (!cat) notFound();
  const all = await getCategories();
  const parent = cat.parentId ? all.find((c) => c.id === cat.parentId) : null;
  const rootId = parent?.id ?? cat.id;
  const siblings = all.filter((c) => c.id === rootId || c.parentId === rootId);
  const crumbs = [{ name: "Home", href: "/" }, { name: "Jewellery", href: "/shop" }, ...(parent ? [{ name: parent.name, href: `/shop/${parent.slug}` }] : []), { name: cat.name, href: `/shop/${cat.slug}` }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <PlpHeader
        title={cat.name}
        kicker={parent?.name ?? "Jewellery"}
        description={cat.description}
        crumbs={crumbs}
        links={siblings.length > 1 ? siblings.map((c) => ({ name: c.id === rootId ? `All ${c.name.toLowerCase()}` : c.name, href: `/shop/${c.slug}`, active: c.id === cat.id })) : undefined}
      />
      <Listing base={{ category: cat.slug }} searchParams={sp} basePath={`/shop/${cat.slug}`} />
    </>
  );
}
