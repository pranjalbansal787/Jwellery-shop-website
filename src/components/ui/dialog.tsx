"use client";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { IconClose } from "./icons";
import { cn } from "@/lib/cn";

/**
 * Accessible modal built on the native <dialog> element: top-layer rendering, focus trapping,
 * Escape to close and inert background come from the platform rather than a dependency.
 */
export function Dialog({ open, onClose, title, children, size = "md", className, bare = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "md" | "lg" | "full"; className?: string; bare?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose(); }} aria-label={title} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <div className="flex h-full w-full items-end justify-center md:items-center md:p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col border border-line bg-bg",
              size === "md" && "md:max-w-2xl",
              size === "lg" && "md:max-w-5xl",
              size === "full" && "h-[100dvh] max-h-none md:h-[92dvh] md:max-w-6xl",
              className,
            )}
          >
            {!bare && (
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <h2 className="kicker">{title}</h2>
                <button onClick={onClose} className="-mr-2 flex h-10 w-10 items-center justify-center" aria-label="Close"><IconClose /></button>
              </div>
            )}
            <div className={cn("flex-1 overflow-y-auto", !bare && "p-6")}>{children}</div>
          </motion.div>
        </div>
      )}
    </dialog>
  );
}
