"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="container-x flex min-h-[80vh] flex-col items-center justify-center text-center">
      <p className="kicker text-accent">Something went wrong</p>
      <h1 className="display-xl mt-4">We couldn’t load this page</h1>
      <p className="lede mt-4 max-w-md">Please try again. If it keeps happening, our concierge can help on WhatsApp.</p>
      {error.digest && <p className="mt-2 text-[12px] text-muted">Reference {error.digest}</p>}
      <div className="mt-8 flex gap-3"><button onClick={reset} className="btn btn-primary">Try again</button><Link href="/" className="btn btn-outline">Return home</Link></div>
    </main>
  );
}
