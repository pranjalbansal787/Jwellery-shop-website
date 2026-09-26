"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "motion/react";
import { useBrand } from "@/components/providers/brand-provider";

/**
 * Custom cursor: a precise dot + a spring-lagged ring.
 * States are declared in markup, never in JS: <a data-cursor="view">, <div data-cursor="drag">, etc.
 * Labels: view | drag | explore | 360 | try. Modifiers: link | button | zoom | hide.
 * Disabled automatically on touch/coarse pointers and when motion is reduced or turned off.
 */
type CursorState = { kind: string; label: string | null };

const LABELS: Record<string, string> = { view: "View", drag: "Drag", explore: "Explore", "360": "360°", try: "Try" };

export function Cursor() {
  const { brand } = useBrand();
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<CursorState>({ kind: "default", label: null });
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
  const magnetEl = useRef<HTMLElement | null>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(brand.cursor && brand.motion !== "off" && fine.matches && !reduce.matches);
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, [brand.cursor, brand.motion]);

  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.classList.remove("has-cursor");
      return;
    }
    root.classList.add("has-cursor");
    const move = (e: PointerEvent) => {
      setVisible(true);
      const m = magnetEl.current;
      if (m) {
        // magnetic: ring gravitates towards the centre of the CTA
        const r = m.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        x.set(cx + (e.clientX - cx) * 0.25);
        y.set(cy + (e.clientY - cy) * 0.25);
      } else {
        x.set(e.clientX);
        y.set(e.clientY);
      }
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const el = t?.closest<HTMLElement>("[data-cursor], a, button, [role=button], input, textarea, select, label");
      if (!el) {
        magnetEl.current = null;
        setState({ kind: "default", label: null });
        return;
      }
      const kind = el.dataset.cursor ?? (el.matches("input, textarea, select") ? "text" : el.matches("button, [role=button]") ? "button" : "link");
      magnetEl.current = kind === "button" || el.dataset.magnetic !== undefined ? el : null;
      setState({ kind, label: el.dataset.cursorLabel ?? LABELS[kind] ?? null });
    };
    const leave = () => setVisible(false);
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const labelled = !!state.label;
  const size = labelled ? 78 : state.kind === "zoom" ? 64 : state.kind === "button" ? 54 : state.kind === "link" ? 44 : state.kind === "text" ? 6 : 32;
  const hidden = state.kind === "hide";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: "var(--z-cursor)" as unknown as number }}>
      <div
        ref={dotRef}
        className="absolute left-0 top-0 -ml-[2px] -mt-[2px] h-1 w-1 rounded-full bg-accent transition-opacity duration-200"
        style={{ opacity: visible && !labelled && !hidden ? 1 : 0 }}
      />
      <motion.div className="absolute left-0 top-0" style={{ x: rx, y: ry }}>
        <motion.div
          className="flex items-center justify-center rounded-full"
          animate={{
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            opacity: visible && !hidden ? 1 : 0,
            scale: pressed ? 0.86 : 1,
            backgroundColor: labelled ? "color-mix(in oklab, var(--background) 55%, transparent)" : "rgba(0,0,0,0)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          style={{
            border: "1px solid color-mix(in oklab, var(--accent) 80%, transparent)",
            boxShadow: "0 0 18px -6px color-mix(in oklab, var(--accent) 45%, transparent)",
            backdropFilter: labelled ? "blur(6px)" : undefined,
          }}
        >
          <AnimatePresence mode="wait">
            {state.label && (
              <motion.span
                key={state.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="kicker !text-[10px] !tracking-[0.2em] text-fg"
              >
                {state.label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
