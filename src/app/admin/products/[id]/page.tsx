import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "./product-form";
import { getAdminSession } from "@/server/rbac";
import { productImage } from "@/lib/media";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = db.products.find((x) => x.id === id);
  if (!p) notFound();
  const s = await getAdminSession();
  return (
    <div className="space-y-6">
      <PageHeader kicker={<Link href="/admin/products" className="link-line">Products</Link>} title={p.name} description={`${p.sku} · created ${new Date(p.createdAt).toLocaleDateString("en-IN")}${p.isDemo ? " · demo data" : ""}`} actions={<Link href={`/products/${p.slug}`} target="_blank" className="btn btn-outline btn-sm">View on storefront</Link>} />
      <ProductForm
        product={p}
        image={productImage(p)}
        detail={productImage(p, p.defaultMetal, p.defaultGem, "detail")}
        categories={db.categories.map((c) => ({ id: c.id, name: c.parentId ? `— ${c.name}` : c.name }))}
        collections={db.collections.map((c) => ({ id: c.id, name: c.name }))}
        perms={s.permissions as string[]}
      />
    </div>
  );
}
