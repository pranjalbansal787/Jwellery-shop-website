import { getCollections, getCategories, listProducts, getProduct, fromPrice } from "@/server/repo/catalog";
import { getHomeSections } from "@/server/repo/content";
import { listStores } from "@/server/repo/crm";
import { HeroStory, type HeroData } from "@/components/home/hero-story";
import { Boutiques, CategoryGrid, ConciergeBand, Craftsmanship, FeaturedCollections, Occasions, ProductRail, Spotlight, TrustRow } from "@/components/home/sections";
import { toCard } from "@/lib/card";
import { productImage, renderPath } from "@/lib/media";
import { JsonLd, organizationLd } from "@/lib/seo";
import { cookies } from "next/headers";
import { BRAND_COOKIE, parseBrand } from "@/lib/brand";

export default async function Home() {
  const [sections, collections, categories, all, stores, hero, spot] = await Promise.all([
    getHomeSections(), getCollections(), getCategories(), listProducts(), listStores(), getProduct("elan-solitaire-ring"), getProduct("seraphine-halo-ring"),
  ]);
  const brand = parseBrand((await cookies()).get(BRAND_COOKIE)?.value);
  const heroData: HeroData = {
    slug: hero!.slug,
    name: hero!.name,
    price: fromPrice(hero!),
    specs: ["1.00 ct round brilliant", `${hero!.diamond?.colour} colour · ${hero!.diamond?.clarity}`, `${hero!.diamond?.certificate} certified`, "18K or platinum"],
    posters: { yellow: renderPath(hero!.slug, "yellow", "diamond"), white: renderPath(hero!.slug, "white", "diamond"), rose: renderPath(hero!.slug, "rose", "diamond"), platinum: renderPath(hero!.slug, "platinum", "diamond") },
  };
  const newest = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10).map(toCard);
  const best = all.filter((p) => p.badges.includes("BESTSELLER")).map(toCard);
  const roots = categories.filter((c) => !c.parentId);
  const catItems = [...roots, ...categories.filter((c) => c.slug === "engagement-rings")].slice(0, 6).map((c) => {
    const sample = all.find((p) => p.design === c.heroDesign) ?? all[0];
    return { slug: c.slug, name: c.name, image: productImage(sample), count: all.filter((p) => p.categoryId === c.id || categories.find((x) => x.id === p.categoryId)?.parentId === c.id).length };
  });

  const render = (id: string) => {
    switch (id) {
      case "hero": return <HeroStory key={id} data={heroData} />;
      case "collections": return <FeaturedCollections key={id} items={collections.slice(0, 3)} />;
      case "new-arrivals": return <ProductRail key={id} kicker="New arrivals" title={["Just arrived", "from the atelier"]} href="/shop?sort=newest" cta="Shop new" products={newest} />;
      case "craftsmanship": return <Craftsmanship key={id} image={renderPath("aria-three-stone-oval", "white", "diamond")} secondary={renderPath("elan-solitaire-ring", "white", "diamond")} />;
      case "spotlight": return <Spotlight key={id} product={{ slug: spot!.slug, name: spot!.name, subtitle: spot!.subtitle, price: fromPrice(spot!), sku: spot!.sku }} spec={{ design: spot!.design, metal: spot!.defaultMetal, gem: spot!.defaultGem, shape: spot!.shape, size: spot!.gemSize }} />;
      case "categories": return <CategoryGrid key={id} items={catItems} />;
      case "occasions": return <Occasions key={id} />;
      case "bestsellers": return <ProductRail key={id} kicker="Bestsellers" title={["Most admired"]} href="/shop" cta="Shop all" products={best} />;
      case "concierge": return <ConciergeBand key={id} image={renderPath("regalia-riviere-necklace", "white", "diamond")} />;
      case "boutiques": return <Boutiques key={id} stores={stores} />;
      case "trust": return <TrustRow key={id} />;
      default: return null;
    }
  };

  return (
    <>
      <JsonLd data={organizationLd(brand, stores)} />
      {sections.filter((s) => s.enabled).map((s) => render(s.id))}
    </>
  );
}
