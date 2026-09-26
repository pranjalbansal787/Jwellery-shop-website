import type { Metadata } from "next";
import { Listing } from "@/components/plp/listing";
import { PlpHeader } from "@/components/plp/plp-header";
import { getCategories } from "@/server/repo/catalog";
import type { SearchParams } from "@/lib/filters";

export const metadata: Metadata = { title: "All Jewellery", alternates: { canonical: "/shop" } };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cats = (await getCategories()).filter((c) => !c.parentId);
  return (
    <>
      <PlpHeader title="All jewellery" kicker="The maison" description="Every piece we make, from everyday essentials to one-of-a-kind high jewellery." crumbs={[{ name: "Home", href: "/" }, { name: "Jewellery", href: "/shop" }]} links={cats.map((c) => ({ name: c.name, href: `/shop/${c.slug}` }))} />
      <Listing base={{}} searchParams={sp} basePath="/shop" />
    </>
  );
}

