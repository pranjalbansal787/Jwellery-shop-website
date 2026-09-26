"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FACETS, MULTI, SORTS, type FacetKey } from "@/lib/filters";
import { IconChevron, IconClose, IconCheck } from "@/components/ui/icons";
import { useLockBody } from "@/lib/hooks";
import { cn } from "@/lib/cn";

type Counts = Record<FacetKey, Record<string, number>>;

const PendingCtx = createContext(false);
export const usePendingFilters = () => useContext(PendingCtx);


function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const get = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);
  const push = (next: URLSearchParams) => {
    next.delete("page");
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const toggle = (k: FacetKey, v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (MULTI.includes(k)) {
      const cur = get(k);
      const list = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      if (list.length) next.set(k, list.join(","));
      else next.delete(k);
    } else {
      if (get(k)[0] === v) next.delete(k);
      else next.set(k, v);
    }
    push(next);
  };
  const setSort = (v: string) => {
    const next = new URLSearchParams(sp.toString());
    if (v === "featured") next.delete("sort");
    else next.set("sort", v);
    push(next);
  };
  const clear = () => {
    const next = new URLSearchParams();
    const q = sp.get("q");
    if (q) next.set("q", q);
    push(next);
  };
  const active = (Object.keys(FACETS) as FacetKey[]).flatMap((k) => get(k).map((v) => ({ k, v, label: FACETS[k].options.find((o) => o[0] === v)?.[1] ?? v })));
  return { get, toggle, setSort, clear, active, pending, sort: sp.get("sort") ?? "featured" };
}

export function FilterBar({ counts, total, children }: { counts: Counts; total: number; children: React.ReactNode }) {
  const s = useFilterState();
  const [open, setOpen] = useState<FacetKey | "sort" | null>(null);
  const [sheet, setSheet] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => { if (!bar.current?.contains(e.target as Node)) setOpen(null); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", on);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", on); document.removeEventListener("keydown", k); };
  }, []);

  return (
    <PendingCtx.Provider value={s.pending}>
      <div ref={bar} className="sticky top-[var(--header-h)] z-30 border-y border-line bg-bg/95 backdrop-blur-md">
        <div className="container-x flex h-14 items-center justify-between gap-4">
          <div className="hidden items-center gap-1 lg:flex">
            {(Object.keys(FACETS) as FacetKey[]).map((k) => (
              <div key={k} className="relative">
                <button onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k} className={cn("flex h-10 items-center gap-2 px-3 text-[12px] uppercase tracking-[0.16em]", s.get(k).length && "text-accent")}>
                  {FACETS[k].label}{s.get(k).length > 0 && <span className="text-[11px]">({s.get(k).length})</span>}
                  <IconChevron size={14} className={cn("transition-transform", open === k && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {open === k && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute left-0 top-full mt-1 w-64 border border-line bg-elevated p-2 shadow-xl">
                      <FacetOptions k={k} counts={counts} s={s} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <button onClick={() => setSheet(true)} className="flex h-10 items-center gap-2 text-[12px] uppercase tracking-[0.16em] lg:hidden">
            Filter & sort {s.active.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-on-accent">{s.active.length}</span>}
          </button>
          <div className="flex items-center gap-4">
            <p className="text-[12px] text-muted" aria-live="polite">{s.pending ? "Updating…" : `${total} ${total === 1 ? "piece" : "pieces"}`}</p>
            <div className="relative hidden lg:block">
              <button onClick={() => setOpen(open === "sort" ? null : "sort")} aria-expanded={open === "sort"} className="flex h-10 items-center gap-2 px-3 text-[12px] uppercase tracking-[0.16em]">
                Sort: {SORTS.find((x) => x[0] === s.sort)?.[1]} <IconChevron size={14} />
              </button>
              <AnimatePresence>
                {open === "sort" && (
                  <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-full mt-1 w-56 border border-line bg-elevated p-2 shadow-xl" role="listbox">
                    {SORTS.map(([v, l]) => (
                      <li key={v}><button role="option" aria-selected={s.sort === v} onClick={() => { s.setSort(v); setOpen(null); }} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[13.5px] hover:bg-surface">{l}{s.sort === v && <IconCheck size={15} />}</button></li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        {s.active.length > 0 && (
          <div className="container-x flex flex-wrap items-center gap-2 pb-3">
            {s.active.map((a) => (
              <button key={a.k + a.v} onClick={() => s.toggle(a.k, a.v)} className="chip !min-h-8 !text-[12px]" aria-label={`Remove filter ${a.label}`}>{a.label} <IconClose size={12} /></button>
            ))}
            <button onClick={s.clear} className="link-line ml-2 text-[12px] text-muted">Clear all</button>
          </div>
        )}
      </div>
      <MobileSheet open={sheet} onClose={() => setSheet(false)} counts={counts} s={s} total={total} />
      <div className={cn("transition-opacity duration-300", s.pending && "opacity-40")} aria-busy={s.pending}>{children}</div>
    </PendingCtx.Provider>
  );
}

function FacetOptions({ k, counts, s }: { k: FacetKey; counts: Counts; s: ReturnType<typeof useFilterState> }) {
  const multi = MULTI.includes(k);
  return (
    <ul role={multi ? "group" : "radiogroup"} aria-label={FACETS[k].label}>
      {FACETS[k].options.map(([v, l]) => {
        const on = s.get(k).includes(v);
        const n = counts[k]?.[v] ?? 0;
        return (
          <li key={v}>
            <button
              role={multi ? "checkbox" : "radio"}
              aria-checked={on}
              disabled={!on && n === 0}
              onClick={() => s.toggle(k, v)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13.5px] hover:bg-surface disabled:opacity-35"
            >
              <span className={cn("flex h-4 w-4 items-center justify-center border", multi ? "" : "rounded-full", on ? "border-fg bg-fg text-bg" : "border-line-strong")}>{on && <IconCheck size={11} />}</span>
              <span className="flex-1">{l}</span>
              <span className="text-[12px] text-muted">{n}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MobileSheet({ open, onClose, counts, s, total }: { open: boolean; onClose: () => void; counts: Counts; s: ReturnType<typeof useFilterState>; total: number }) {
  useLockBody(open);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[65] bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filter and sort"
            className="fixed inset-x-0 bottom-0 z-[66] flex max-h-[88dvh] flex-col border-t border-line bg-bg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120) onClose(); }}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong" />
            <div className="flex items-center justify-between px-5 py-3">
              <p className="kicker">Filter & sort</p>
              <button onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center" aria-label="Close"><IconClose /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <p className="kicker mt-2 text-muted">Sort</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SORTS.map(([v, l]) => <button key={v} aria-pressed={s.sort === v} onClick={() => s.setSort(v)} className="chip">{l}</button>)}
              </div>
              {(Object.keys(FACETS) as FacetKey[]).map((k) => (
                <div key={k} className="mt-7">
                  <p className="kicker text-muted">{FACETS[k].label}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FACETS[k].options.map(([v, l]) => {
                      const on = s.get(k).includes(v);
                      const n = counts[k]?.[v] ?? 0;
                      return <button key={v} aria-pressed={on} disabled={!on && !n} onClick={() => s.toggle(k, v)} className="chip disabled:opacity-35">{l} <span className="opacity-60">{n}</span></button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button onClick={s.clear} className="btn btn-outline">Clear</button>
              <button onClick={onClose} className="btn btn-primary">Show {total}</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

