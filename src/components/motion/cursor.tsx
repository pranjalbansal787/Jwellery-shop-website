"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "motion/react";
import { useBrand } from "@/components/providers/brand-provider";

/**
 * Custom cursor: a precise dot + a spring-lagged ring.
 * States are declared in markup, never in JS: <a data-cursor="view">, <div data-cursor="drag">, etc.
 * Labels: view | drag | explore | 360 | try. Modifiers: link | button | zoom | hide.
 * Disabled automatically on touch/coarse pointers and when motion is reduced or turned off.
 *
 * Native <dialog>.showModal() and Fullscreen paint above any z-index. The cursor lives in the
 * top layer via the Popover API so it stays visible over try-on, zoom, and size dialogs.
 * If the browser cannot put it there, native cursors are restored for those surfaces.
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
  const layerRef = useRef<HTMLDivElement>(null);

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
    const layer = layerRef.current;
    if (!enabled) {
      root.classList.remove("has-cursor", "cursor-native-modals");
      return;
    }

    const canTopLayer = !!layer && typeof layer.showPopover === "function";
    const inFullscreen = () => !!document.fullscreenElement;

    const applyHostClass = () => {
      if (inFullscreen()) {
        root.classList.remove("has-cursor");
        return;
      }
      root.classList.add("has-cursor");
      root.classList.toggle("cursor-native-modals", !canTopLayer);
    };

    const promote = () => {
      if (!layer || !canTopLayer || inFullscreen()) return;
      try {
        if (layer.matches(":popover-open")) layer.hidePopover();
        layer.showPopover();
      } catch {
        /* already open, or the document is not ready */
      }
    };

    applyHostClass();
    promote();

    const move = (e: PointerEvent) => {
      setVisible(true);
      const m = magnetEl.current;
      if (m) {
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
      const t = e.target instanceof Element ? e.target : e.target instanceof Text ? e.target.parentElement : null;
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
    const onFullscreen = () => {
      applyHostClass();
      if (!inFullscreen()) promote();
    };
    const onToggle = (e: Event) => {
      if (e.target === layer) return;
      if (e.target instanceof HTMLDialogElement) promote();
    };

    const mo = new MutationObserver((records) => {
      for (const rec of records) {
        if (rec.type === "attributes" && rec.target instanceof HTMLDialogElement) {
          promote();
          return;
        }
        for (const node of rec.addedNodes) {
          if (node instanceof HTMLDialogElement && node.open) {
            promote();
            return;
          }
        }
      }
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("toggle", onToggle, true);
    return () => {
      root.classList.remove("has-cursor", "cursor-native-modals");
      try { layer?.hidePopover(); } catch { /* unmounting */ }
      mo.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("toggle", onToggle, true);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const labelled = !!state.label;
  const size = labelled ? 78 : state.kind === "zoom" ? 64 : state.kind === "button" ? 54 : state.kind === "link" ? 44 : state.kind === "text" ? 6 : 32;
  const hidden = state.kind === "hide";

  return (
    <div
      ref={layerRef}
      popover="manual"
      aria-hidden
      className="cursor-layer pointer-events-none"
    >
      <div
        ref={dotRef}
        className="absolute left-0 top-0 -ml-[2px] -mt-[2px] h-1 w-1 rounded-full bg-accent transition-opacity duration-200"
        style={{ opacity: visible && !labelled && !hidden ? 1 : 0 }}
      />
      <motion.div className="absolute left-0 top-0" style={{ x: rx, y: ry }}>
        <motion.div
          className={`cursor-ring flex items-center justify-center rounded-full ${labelled ? "cursor-label-fill" : ""}`}
          animate={{
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            opacity: visible && !hidden ? 1 : 0,
            scale: pressed ? 0.86 : 1,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
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
