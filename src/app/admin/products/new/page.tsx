import Link from "next/link";
import { db } from "@/server/db";
import { PageHeader } from "@/components/admin/ui";
import { NewProductForm } from "./new-product-form";

export const metadata = { title: "New product" };

export default function NewProduct() {
  return (
    <div className="space-y-6">
      <PageHeader kicker={<Link href="/admin/products" className="link-line">Products</Link>} title="New product" description="Creates a draft with variants generated from a design template. Publish when media and copy are ready." />
      <NewProductForm categories={db.categories.map((c) => ({ id: c.id, name: c.parentId ? `— ${c.name}` : c.name }))} />
    </div>
  );
}
