import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { WhatsAppConcierge } from "@/components/layout/whatsapp-concierge";
import { Cursor } from "@/components/motion/cursor";
import { getCategories, getCollections, listProducts, fromPrice } from "@/server/repo/catalog";
import { productImage, renderPath } from "@/lib/media";
import type { NavData } from "@/components/layout/nav-types";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, collections, gifts] = await Promise.all([getCategories(), getCollections(), listProducts({ collection: "gifts" })]);
  const nav: NavData = {
    categories: categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, parentId: c.parentId })),
    collections: collections.map((c) => ({ slug: c.slug, name: c.name, kicker: c.kicker, heroImage: c.heroImage })),
    feature: { image: renderPath("isadora-oval-halo", "white", "diamond", "front") },
  };
  const suggestions = gifts.slice(0, 6).map((p) => ({ slug: p.slug, name: p.name, price: fromPrice(p), image: productImage(p) }));
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-fg focus:px-4 focus:py-2 focus:text-bg">Skip to content</a>
      <Header nav={nav} />
      <MobileMenu nav={nav} />
      <SearchOverlay />
      <CartDrawer suggestions={suggestions} />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppConcierge />
      <Cursor />
    </>
  );
}
