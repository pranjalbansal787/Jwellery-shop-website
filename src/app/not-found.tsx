import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-[80vh] flex-col items-center justify-center text-center">
      <p className="kicker text-accent">404</p>
      <h1 className="display-xl mt-4">This page has been moved to the vault</h1>
      <p className="lede mt-4 max-w-md">The page you’re looking for doesn’t exist, or is no longer on display.</p>
      <div className="mt-8 flex gap-3"><Link href="/" className="btn btn-primary">Return home</Link><Link href="/shop" className="btn btn-outline">Browse jewellery</Link></div>
    </main>
  );
}
