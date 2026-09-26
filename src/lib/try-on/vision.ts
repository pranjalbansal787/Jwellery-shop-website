import type { FaceLandmarker, HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { fallbackAnchors, needsFace, type TryOnAnchor, type TryOnKind } from "./kind";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const RING_MCP = 13;
const RING_PIP = 14;
const MIDDLE_MCP = 9;
const INDEX_MCP = 5;
const PINKY_MCP = 17;
const WRIST = 0;

const FACE_CHIN = 152;
const FACE_FOREHEAD = 10;
const FACE_LEFT_EAR = 234;
const FACE_RIGHT_EAR = 454;

export type TrackSource = HTMLVideoElement | HTMLImageElement;

type Mode = "VIDEO" | "IMAGE";

export class JewelTracker {
  private hands: HandLandmarker | null = null;
  private face: FaceLandmarker | null = null;
  private mode: Mode = "VIDEO";
  private lastTs = 0;
  private wantFace = false;

  async init(kind: TryOnKind) {
    this.wantFace = needsFace(kind);
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
    const make = async (delegate: "GPU" | "CPU") => {
      const base = { delegate };
      if (this.wantFace) {
        this.face = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: FACE_MODEL, ...base },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.4,
          minFacePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      } else {
        this.hands = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: HAND_MODEL, ...base },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
      }
    };
    try {
      await make("GPU");
    } catch {
      this.face = null;
      this.hands = null;
      await make("CPU");
    }
    this.mode = "VIDEO";
    this.lastTs = 0;
  }

  async setMode(mode: Mode) {
    if (this.mode === mode) return;
    if (this.hands) await this.hands.setOptions({ runningMode: mode });
    if (this.face) await this.face.setOptions({ runningMode: mode });
    this.mode = mode;
    this.lastTs = 0;
  }

  detect(
    source: TrackSource,
    kind: TryOnKind,
    stageW: number,
    stageH: number,
    mirror: boolean,
  ): TryOnAnchor[] | null {
    const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
    if (!srcW || !srcH || !stageW || !stageH) return null;

    const map = mapper(srcW, srcH, stageW, stageH, mirror);
    if (this.wantFace) {
      const faces = this.runFace(source);
      const lm = faces?.faceLandmarks?.[0];
      if (!lm || lm.length < 400) return null;
      return fromFace(lm, kind, map);
    }
    const hands = this.runHands(source);
    const lm = pickHand(hands?.landmarks);
    if (!lm || lm.length < 18) return null;
    return fromHand(lm, kind, map);
  }

  close() {
    this.hands?.close();
    this.face?.close();
    this.hands = null;
    this.face = null;
  }

  private runHands(source: TrackSource) {
    if (!this.hands) return null;
    if (this.mode === "IMAGE") {
      try {
        return this.hands.detect(source);
      } catch {
        /* still in video mode — timestamped detect works on a still frame */
      }
    }
    const ts = nextTs(this.lastTs);
    this.lastTs = ts;
    return this.hands.detectForVideo(source, ts);
  }

  private runFace(source: TrackSource) {
    if (!this.face) return null;
    if (this.mode === "IMAGE") {
      try {
        return this.face.detect(source);
      } catch {
        /* still in video mode */
      }
    }
    const ts = nextTs(this.lastTs);
    this.lastTs = ts;
    return this.face.detectForVideo(source, ts);
  }
}

export function smoothAnchors(prev: TryOnAnchor[] | null, next: TryOnAnchor[], alpha = 0.42): TryOnAnchor[] {
  if (!prev || prev.length !== next.length) return next;
  return next.map((n, i) => {
    const p = prev[i];
    return {
      x: p.x + (n.x - p.x) * alpha,
      y: p.y + (n.y - p.y) * alpha,
      angle: lerpAngle(p.angle, n.angle, alpha),
      size: p.size + (n.size - p.size) * alpha,
    };
  });
}

export { fallbackAnchors };

function fromHand(lm: NormalizedLandmark[], kind: TryOnKind, map: Mapper): TryOnAnchor[] | null {
  if (kind === "bangle" || kind === "bracelet") {
    const wrist = lm[WRIST];
    const mid = lm[MIDDLE_MCP];
    const index = lm[INDEX_MCP];
    const pinky = lm[PINKY_MCP];
    if (!wrist || !mid || !index || !pinky) return null;
    const palmX = mid.x - wrist.x;
    const palmY = mid.y - wrist.y;
    const len = Math.hypot(palmX, palmY) || 1;
    // Sit just behind the wrist, on the forearm — not on the palm.
    const raw = { x: wrist.x - (palmX / len) * 0.08, y: wrist.y - (palmY / len) * 0.08 };
    const a = map.pt(raw.x, raw.y);
    const w = map.seg(index, pinky);
    return [{ x: a.x, y: a.y, angle: Math.atan2(palmY, palmX), size: Math.max(w * 1.35, 0.12) }];
  }

  const mcp = lm[RING_MCP];
  const pip = lm[RING_PIP];
  const mid = lm[MIDDLE_MCP];
  if (!mcp || !pip || !mid) return null;
  // Rings sit between knuckle and PIP, closer to the PIP.
  const raw = lerp(mcp, pip, 0.62);
  const a = map.pt(raw.x, raw.y);
  const axisX = pip.x - mcp.x;
  const axisY = pip.y - mcp.y;
    const width = map.seg(mcp, mid) * 1.25;
    return [{ x: a.x, y: a.y, angle: Math.atan2(axisY, axisX), size: Math.max(width, 0.028) }];
}

function fromFace(lm: NormalizedLandmark[], kind: TryOnKind, map: Mapper): TryOnAnchor[] | null {
  const chin = lm[FACE_CHIN];
  const brow = lm[FACE_FOREHEAD];
  const left = lm[FACE_LEFT_EAR];
  const right = lm[FACE_RIGHT_EAR];
  if (!chin || !brow || !left || !right) return null;
  const faceW = map.seg(left, right);
  const faceH = map.seg(brow, chin);

  if (kind === "earring") {
    const drop = (chin.y - ((left.y + right.y) / 2)) * 0.22;
    const l = map.pt(left.x + (left.x - chin.x) * 0.16, left.y + drop);
    const r = map.pt(right.x + (right.x - chin.x) * 0.16, right.y + drop);
    const lobe = Math.max(faceW * 0.055, 0.016);
    return [
      { x: l.x, y: l.y, angle: 0, size: lobe },
      { x: r.x, y: r.y, angle: 0, size: lobe },
    ];
  }

  if (kind === "pendant") {
    const p = map.pt(chin.x, chin.y + faceH * 0.42);
    return [{ x: p.x, y: p.y, angle: 0, size: Math.max(faceW, 0.12) }];
  }

  const n = map.pt(chin.x, chin.y + faceH * 0.18);
  return [{ x: n.x, y: n.y, angle: 0, size: Math.max(faceW * 1.15, 0.16) }];
}

type Mapper = {
  pt: (nx: number, ny: number) => { x: number; y: number };
  seg: (a: { x: number; y: number }, b: { x: number; y: number }) => number;
};

/** Map MediaPipe image-space landmarks onto an object-cover stage, including a selfie flip. */
function mapper(srcW: number, srcH: number, stageW: number, stageH: number, mirror: boolean): Mapper {
  const s = Math.max(stageW / srcW, stageH / srcH);
  const w = srcW * s;
  const h = srcH * s;
  const ox = (stageW - w) / 2;
  const oy = (stageH - h) / 2;
  const pt = (nx: number, ny: number) => {
    const x = ox + (mirror ? 1 - nx : nx) * w;
    const y = oy + ny * h;
    return { x: x / stageW, y: y / stageH };
  };
  return {
    pt,
    seg: (a, b) => {
      const p = pt(a.x, a.y);
      const q = pt(b.x, b.y);
      return Math.hypot(p.x - q.x, p.y - q.y);
    },
  };
}

function pickHand(landmarks: NormalizedLandmark[][] | undefined) {
  if (!landmarks?.length) return null;
  if (landmarks.length === 1) return landmarks[0];
  let best = landmarks[0];
  let bestArea = 0;
  for (const lm of landmarks) {
    if (!lm.length) continue;
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const p of lm) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const area = (maxX - minX) * (maxY - minY);
    if (area > bestArea) {
      bestArea = area;
      best = lm;
    }
  }
  return best;
}

function lerp(a: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function nextTs(last: number) {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  return now <= last ? last + 1 : now;
}
