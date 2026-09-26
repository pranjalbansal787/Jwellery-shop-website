import type { Metadata } from "next";
import { listStores } from "@/server/repo/crm";
import { getProduct } from "@/server/repo/catalog";
import { productImage } from "@/lib/media";
import { Booking } from "./booking";

export const metadata: Metadata = { title: "Book an appointment", description: "Private boutique appointments, video consultations, bridal and custom design sessions." };

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ service?: string; product?: string; store?: string }> }) {
  const sp = await searchParams;
  const stores = await listStores();
  const product = sp.product ? await getProduct(sp.product) : null;
  return (
    <div className="container-x py-12 md:py-20">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="kicker text-accent">Appointments</p>
          <h1 className="display-xl mt-4">A private moment, reserved for you</h1>
        </div>
        <p className="lede md:col-span-4 md:col-start-9 md:self-end">One-to-one time with a jewellery advisor, in a private room or on a video call. There’s never an obligation to buy.</p>
      </div>
      <Booking
        stores={stores.map((s) => ({ id: s.id, name: s.name, city: s.city, address: s.address }))}
        initialService={sp.service}
        initialStore={sp.store}
        product={product ? { slug: product.slug, name: product.name, image: productImage(product) } : null}
      />
    </div>
  );
}
