import type { Metadata } from "next";
import { listStores } from "@/server/repo/crm";
import { CheckoutFlow } from "./checkout-flow";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const stores = await listStores();
  return <CheckoutFlow stores={stores.map((s) => ({ id: s.id, name: s.name, city: s.city, address: s.address }))} />;
}
