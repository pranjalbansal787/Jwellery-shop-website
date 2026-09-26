"use client";
import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { useReducedMotion } from "motion/react";
import { useBrand } from "@/components/providers/brand-provider";

/** True after hydration — gate any render that depends on localStorage-backed state. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Motion allowed = brand setting not "off" AND user has not requested reduced motion. */
export function useMotionLevel(): 0 | 0.5 | 1 {
  const reduced = useReducedMotion();
  const { brand } = useBrand();
  if (reduced || brand.motion === "off") return 0;
  return brand.motion === "subtle" ? 0.5 : 1;
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(q);
    setM(mq.matches);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [locked]);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep Tab inside an open overlay. Autofocus is optional when the overlay focuses a field itself. */
export function useFocusTrap(active: boolean, ref: RefObject<HTMLElement | null>, opts?: { autofocus?: boolean }) {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const items = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (opts?.autofocus !== false) {
      requestAnimationFrame(() => {
        if (!root.contains(document.activeElement)) items()[0]?.focus();
      });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) { e.preventDefault(); return; }
      const i = list.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (i <= 0) { e.preventDefault(); list[list.length - 1].focus(); }
      } else if (i === list.length - 1 || i === -1) {
        e.preventDefault();
        list[0].focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, [active, ref, opts?.autofocus]);
}

/** Mark page chrome inert so screen readers and Tab skip the background behind sibling overlays. */
export function useInert(active: boolean, selector = "#main, header, footer") {
  useEffect(() => {
    if (!active) return;
    const nodes = [...document.querySelectorAll<HTMLElement>(selector)];
    nodes.forEach((n) => { n.inert = true; });
    return () => { nodes.forEach((n) => { n.inert = false; }); };
  }, [active, selector]);
}
