/** Micro-interaction: a ghost of the product image glides into the bag icon. Resolves when done. */
export function flyToBag(from: HTMLElement | null, src: string): Promise<void> {
  return new Promise((resolve) => {
    const target = document.querySelector<HTMLElement>("[data-bag-target]");
    if (!from || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return resolve();
    const a = from.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    const size = Math.min(a.width, a.height, 320);
    Object.assign(img.style, { position: "fixed", left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px`, objectFit: "contain", zIndex: "95", pointerEvents: "none" });
    document.body.appendChild(img);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = img.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.6}px, ${dy * 0.35}px) scale(0.45)`, opacity: 0.9, offset: 0.6 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.06)`, opacity: 0.2 },
      ],
      { duration: 750, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
    );
    anim.onfinish = () => {
      img.remove();
      target.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 320, easing: "ease-out" });
      resolve();
    };
  });
}
