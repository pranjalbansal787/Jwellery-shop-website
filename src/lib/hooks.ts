"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
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
