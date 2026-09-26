/**
 * One Euro filter — low jitter when still, low lag when the hand moves.
 * Casiez, Roussel, Vogel (CHI 2012). Used here so jewellery rides the camera
 * instead of vibrating on the landmarks.
 */
export class OneEuro {
  private x = 0;
  private dx = 0;
  private t = 0;
  private primed = false;

  constructor(
    private minCutoff = 1.15,
    private beta = 0.018,
    private dCutoff = 1.15,
  ) {}

  reset() {
    this.primed = false;
  }

  filter(v: number, t: number) {
    if (!this.primed) {
      this.primed = true;
      this.x = v;
      this.dx = 0;
      this.t = t;
      return v;
    }
    const dt = Math.max((t - this.t) / 1000, 1 / 240);
    this.t = t;
    const edx = (v - this.x) / dt;
    this.dx = lowpass(this.dx, edx, alpha(dt, this.dCutoff));
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x = lowpass(this.x, v, alpha(dt, cutoff));
    return this.x;
  }
}

export class AngleEuro {
  private euro = new OneEuro(1.05, 0.016, 1.1);
  private last = 0;
  private primed = false;

  reset() {
    this.euro.reset();
    this.primed = false;
  }

  filter(v: number, t: number) {
    if (!this.primed) {
      this.primed = true;
      this.last = v;
      return this.euro.filter(v, t);
    }
    let x = v;
    while (x - this.last > Math.PI) x -= Math.PI * 2;
    while (x - this.last < -Math.PI) x += Math.PI * 2;
    const out = this.euro.filter(x, t);
    this.last = out;
    return out;
  }
}

import type { TryOnAnchor } from "./kind";

export type SmoothPose = TryOnAnchor;

function slot() {
  return {
    x: new OneEuro(1.2, 0.022),
    y: new OneEuro(1.2, 0.022),
    size: new OneEuro(0.42, 0.008),
    angle: new AngleEuro(),
    ax: new OneEuro(0.95, 0.014),
    ay: new OneEuro(0.95, 0.014),
    az: new OneEuro(0.95, 0.014),
    ux: new OneEuro(0.9, 0.012),
    uy: new OneEuro(0.9, 0.012),
    uz: new OneEuro(0.9, 0.012),
  };
}

type Slot = ReturnType<typeof slot>;

/** Per-piece temporal filter. Survives a few missed frames so the jewel never pops. */
export class PoseSmoother {
  private slots: Slot[] = [];
  private last: SmoothPose[] | null = null;
  private lastT = 0;
  private held = 0;

  reset() {
    this.slots = [];
    this.last = null;
    this.held = 0;
  }

  push(raw: SmoothPose[], t: number) {
    while (this.slots.length < raw.length) this.slots.push(slot());
    this.last = raw.map((p, i) => applySlot(this.slots[i], p, t));
    this.lastT = t;
    this.held = 0;
    return this.last;
  }

  /** Keep the last pose for a short hold, then give up. */
  sample(t: number): SmoothPose[] | null {
    if (!this.last) return null;
    if (this.held === 0) return this.last;
    if (t - this.lastT > 420) return null;
    return this.last;
  }

  miss() {
    this.held += 1;
    return this.held < 14;
  }
}

function applySlot(s: Slot, p: SmoothPose, t: number): SmoothPose {
  const ax = s.ax.filter(p.ax, t);
  const ay = s.ay.filter(p.ay, t);
  const az = s.az.filter(p.az, t);
  const ux = s.ux.filter(p.ux, t);
  const uy = s.uy.filter(p.uy, t);
  const uz = s.uz.filter(p.uz, t);
  const aLen = Math.hypot(ax, ay, az) || 1;
  const uLen = Math.hypot(ux, uy, uz) || 1;
  return {
    x: s.x.filter(p.x, t),
    y: s.y.filter(p.y, t),
    angle: s.angle.filter(p.angle, t),
    size: s.size.filter(p.size, t),
    ax: ax / aLen,
    ay: ay / aLen,
    az: az / aLen,
    ux: ux / uLen,
    uy: uy / uLen,
    uz: uz / uLen,
  };
}

function alpha(dt: number, cutoff: number) {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

function lowpass(prev: number, next: number, a: number) {
  return prev + a * (next - prev);
}
