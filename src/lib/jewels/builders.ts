/**
 * Procedural jewellery models.
 *
 * One source of truth for geometry + materials, shared by:
 *  - scripts/render (offline studio renders used as product photography in demo mode)
 *  - the live 3D viewer / WebGL hero (React Three Fiber renders these groups as <primitive/>)
 *
 * In production, real GLB/GLTF assets from the Media/3D Assets module replace these.
 * The viewer only depends on "something that returns a THREE.Object3D", so swapping is trivial.
 */
import * as THREE from "three";

export type MetalKey = "yellow" | "white" | "rose" | "platinum";
export type GemKey = "diamond" | "emerald" | "ruby" | "sapphire" | "none";
export type GemShape = "round" | "oval" | "pear" | "emerald" | "cushion";
export type DesignKey =
  | "solitaire" | "halo" | "band" | "eternity" | "three-stone" | "cocktail" | "signet"
  | "tennis" | "bangle" | "pendant" | "studs" | "drops" | "hoops" | "riviere";

export interface JewelSpec {
  design: DesignKey;
  metal: MetalKey;
  gem: GemKey;
  shape?: GemShape;
  /** relative gem size multiplier (1 = design default) */
  size?: number;
}

export const METAL_COLORS: Record<MetalKey, string> = {
  yellow: "#E3BD74",
  white: "#E6E6E3",
  rose: "#E7AE95",
  platinum: "#D8D9DB",
};

const GEM_COLORS: Record<Exclude<GemKey, "none">, string> = {
  diamond: "#FFFFFF",
  emerald: "#1E9A5E",
  ruby: "#C01235",
  sapphire: "#2446B8",
};

/* ---------------------------------------------------------------- materials */

const matCache = new Map<string, THREE.Material>();
let gemEnv: THREE.Texture | null = null;

/** Gems use their own high-contrast "sparkle" environment (black room, many small lights). */
export function setGemEnvironment(tex: THREE.Texture) {
  gemEnv = tex;
  for (const [k, m] of matCache) if (k.startsWith("gem:")) (m as THREE.MeshPhysicalMaterial).envMap = tex;
}

export function metalMaterial(metal: MetalKey): THREE.MeshPhysicalMaterial {
  const key = `metal:${metal}`;
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshPhysicalMaterial({
        color: METAL_COLORS[metal],
        metalness: 1,
        roughness: metal === "platinum" ? 0.22 : 0.16,
        clearcoat: 0.35,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.25,
      }),
    );
  }
  return matCache.get(key) as THREE.MeshPhysicalMaterial;
}

/**
 * Gem material. A faceted mirror-dielectric hybrid: flat-shaded facets reflect a
 * high-contrast studio environment, which reads as brilliance without an expensive
 * refraction pass. The live viewer can upgrade to a refraction shader on capable GPUs.
 */
export function gemMaterial(gem: Exclude<GemKey, "none">, solid = false): THREE.MeshPhysicalMaterial {
  const key = `gem:${gem}:${solid ? "solid" : "crown"}`;
  if (!matCache.has(key)) {
    const isDiamond = gem === "diamond";
    matCache.set(
      key,
      new THREE.MeshPhysicalMaterial({
        color: GEM_COLORS[gem],
        metalness: isDiamond ? 1 : 0.75,
        roughness: 0.015,
        transparent: !solid,
        opacity: solid ? 1 : isDiamond ? 0.62 : 0.72,
        depthWrite: true,
        flatShading: true,
        clearcoat: 1,
        clearcoatRoughness: 0,
        iridescence: isDiamond ? 0.55 : 0.15,
        iridescenceIOR: 1.8,
        emissive: new THREE.Color(GEM_COLORS[gem]).multiplyScalar(isDiamond ? 0.02 : 0.1),
        envMapIntensity: isDiamond ? 2.3 : 1.7,
        envMap: gemEnv,
      }),
    );
  }
  return matCache.get(key) as THREE.MeshPhysicalMaterial;
}

/* ---------------------------------------------------------------- gem geometry */

const gemGeoCache = new Map<string, THREE.BufferGeometry>();

/** Unit gem (girdle radius 1), table facing +Y. */
export function gemGeometry(shape: GemShape = "round", detail = 16): THREE.BufferGeometry {
  const key = `${shape}:${detail}`;
  const cached = gemGeoCache.get(key);
  if (cached) return cached;

  let geo: THREE.BufferGeometry;
  if (shape === "emerald") {
    // Step cut: few radial segments + stepped profile.
    const pts = [
      [0.001, -0.5], [0.45, -0.3], [0.8, -0.1], [1, 0.04], [1, 0.1],
      [0.88, 0.2], [0.74, 0.29], [0.62, 0.34], [0.001, 0.34],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    geo = new THREE.LatheGeometry(pts, 4, Math.PI / 4);
    geo.scale(1.12, 1, 0.82);
  } else {
    const pts = [
      [0.001, -0.62], [0.3, -0.45], [0.7, -0.17], [1, 0.05], [1, 0.1],
      [0.9, 0.17], [0.72, 0.26], [0.55, 0.33], [0.001, 0.33],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    geo = new THREE.LatheGeometry(pts, shape === "cushion" ? 8 : detail, Math.PI / detail);
    if (shape === "oval") geo.scale(1, 1, 1.35);
    if (shape === "pear") {
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const z = p.getZ(i);
        if (z < 0) {
          const t = -z; // 0..1
          p.setX(i, p.getX(i) * (1 - 0.55 * t));
          p.setZ(i, z * 1.55);
        } else {
          p.setZ(i, z * 1.05);
        }
      }
      geo.translate(0, 0, 0.25);
    }
  }
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  gemGeoCache.set(key, geo);
  return geo;
}

/** Inner back-faces: seen through the semi-transparent crown they fake internal pavilion reflections. */
function gemInnerMaterial(gem: Exclude<GemKey, "none">): THREE.MeshPhysicalMaterial {
  const key = `gem:inner:${gem}`;
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(GEM_COLORS[gem]).lerp(new THREE.Color("#ffffff"), gem === "diamond" ? 0 : 0.1),
        metalness: 1,
        roughness: 0,
        side: THREE.BackSide,
        flatShading: true,
        envMapIntensity: gem === "diamond" ? 2.6 : 2,
        envMap: gemEnv,
      }),
    );
  }
  return matCache.get(key) as THREE.MeshPhysicalMaterial;
}

function gem(g: GemKey, shape: GemShape, radius: number, detail = 16): THREE.Object3D {
  const k = g === "none" ? "diamond" : g;
  const geo = gemGeometry(shape, radius > 0.15 ? Math.max(detail, 20) : detail);
  const group = new THREE.Group();
  if (radius > 0.12) {
    const inner = new THREE.Mesh(geo, gemInnerMaterial(k));
    inner.scale.setScalar(0.985);
    inner.rotation.y = Math.PI / (detail * 1.5);
    group.add(inner);
  }
  group.add(new THREE.Mesh(geo, gemMaterial(k, radius <= 0.12)));
  group.scale.setScalar(radius);
  return group;
}

/* ---------------------------------------------------------------- helpers */

const UP = new THREE.Vector3(0, 1, 0);

function orientTo(obj: THREE.Object3D, dir: THREE.Vector3) {
  obj.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
}

function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material): THREE.Mesh {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, len, 8), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  orientTo(m, b.clone().sub(a));
  return m;
}

function bead(p: THREE.Vector3, r: number, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat);
  m.position.copy(p);
  return m;
}

/** Band built by revolving a superellipse cross-section. Axis = Z (ring stands facing camera). */
function band(R: number, thickness: number, width: number, mat: THREE.Material, squareness = 0.55): THREE.Mesh {
  const pts: THREE.Vector2[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const x = R + thickness / 2 + (thickness / 2) * Math.sign(c) * Math.pow(Math.abs(c), squareness);
    const y = (width / 2) * Math.sign(s) * Math.pow(Math.abs(s), squareness);
    pts.push(new THREE.Vector2(x, y));
  }
  const geo = new THREE.LatheGeometry(pts, 128);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, mat);
}

/** Prong setting around a gem whose girdle centre sits at `c` with table normal `up`. */
function prongs(c: THREE.Vector3, up: THREE.Vector3, gemR: number, base: THREE.Vector3[], mat: THREE.Material, count = 6) {
  const g = new THREE.Group();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, up.clone().normalize());
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.PI / count;
    const tip = new THREE.Vector3(Math.cos(a) * gemR * 0.98, gemR * 0.16, Math.sin(a) * gemR * 0.98).applyQuaternion(q).add(c);
    const from = base[i % base.length];
    g.add(rod(from, tip, gemR * 0.075, mat));
    g.add(bead(tip, gemR * 0.085, mat));
  }
  // basket rail
  const rail = new THREE.Mesh(new THREE.TorusGeometry(gemR * 0.62, gemR * 0.05, 8, 40), mat);
  rail.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
  rail.position.copy(c).add(up.clone().normalize().multiplyScalar(-gemR * 0.38));
  g.add(rail);
  return g;
}

/** Row of pavé stones along the outer surface of a band (axis Z). */
function pave(R: number, from: number, to: number, count: number, stoneR: number, gk: GemKey, z = 0) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const a = from + (to - from) * t;
    const dir = new THREE.Vector3(Math.sin(a), Math.cos(a), 0);
    const s = gem(gk, "round", stoneR, 10);
    s.position.copy(dir.clone().multiplyScalar(R + stoneR * 0.12)).setZ(z);
    orientTo(s, dir);
    g.add(s);
  }
  return g;
}

/* ---------------------------------------------------------------- designs */

function ringHead(spec: JewelSpec, R: number, t: number, gemR: number, shape: GemShape) {
  const metal = metalMaterial(spec.metal);
  const group = new THREE.Group();
  const top = R + t;
  const cy = top + gemR * 0.62 + 0.1;
  const c = new THREE.Vector3(0, cy, 0);
  const g = gem(spec.gem, shape, gemR);
  g.position.copy(c);
  group.add(g);
  const base = [
    new THREE.Vector3(0.12, top - 0.02, 0.1), new THREE.Vector3(-0.12, top - 0.02, 0.1),
    new THREE.Vector3(0.12, top - 0.02, -0.1), new THREE.Vector3(-0.12, top - 0.02, -0.1),
  ];
  group.add(prongs(c, UP, gemR * (shape === "oval" ? 1.1 : 1), base, metal, shape === "emerald" ? 4 : 6));
  return { group, c };
}

export function buildJewel(spec: JewelSpec): THREE.Group {
  const root = new THREE.Group();
  const metal = metalMaterial(spec.metal);
  const shape = spec.shape ?? "round";
  const k = spec.size ?? 1;
  const gk: GemKey = spec.gem === "none" ? "diamond" : spec.gem;

  switch (spec.design) {
    case "solitaire": {
      root.add(band(1, 0.16, 0.2, metal));
      root.add(ringHead({ ...spec, gem: gk }, 1, 0.16, 0.42 * k, shape).group);
      break;
    }
    case "halo": {
      root.add(band(1, 0.15, 0.2, metal));
      const gemR = 0.34 * k;
      const { group, c } = ringHead({ ...spec, gem: gk }, 1, 0.15, gemR, shape);
      root.add(group);
      const d = gemR * 1.3;
      const n = Math.round((Math.PI * 2 * d) / (gemR * 0.3));
      const halo = new THREE.Group();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const s = gem("diamond", "round", gemR * 0.15, 10);
        s.position.set(Math.cos(a) * d * (shape === "oval" ? 1 : 1), c.y + 0.02, Math.sin(a) * d * (shape === "oval" ? 1.3 : 1));
        halo.add(s);
      }
      const seat = new THREE.Mesh(new THREE.TorusGeometry(d, gemR * 0.1, 8, 64), metal);
      seat.rotation.x = Math.PI / 2;
      seat.position.y = c.y - 0.04;
      if (shape === "oval") seat.scale.set(1, 1.3, 1);
      halo.add(seat);
      root.add(halo);
      root.add(pave(1.15, -1.25, -0.35, 7, 0.045, "diamond"));
      root.add(pave(1.15, 0.35, 1.25, 7, 0.045, "diamond"));
      break;
    }
    case "band": {
      root.add(band(1, 0.2, 0.42, metal, 0.7));
      break;
    }
    case "eternity": {
      root.add(band(1, 0.14, 0.2, metal, 0.5));
      root.add(pave(1.12, 0, Math.PI * 2 * (1 - 1 / 30), 30, 0.1, gk));
      break;
    }
    case "three-stone": {
      root.add(band(1, 0.16, 0.2, metal));
      const main = ringHead({ ...spec, gem: gk }, 1, 0.16, 0.3 * k, shape);
      root.add(main.group);
      for (const sgn of [-1, 1]) {
        const a = sgn * 0.5;
        const dir = new THREE.Vector3(Math.sin(a), Math.cos(a), 0);
        const r = 0.2 * k;
        const c = dir.clone().multiplyScalar(1.16 + r * 0.62 + 0.05);
        const s = gem("diamond", "round", r);
        s.position.copy(c);
        orientTo(s, dir);
        root.add(s);
        const b = dir.clone().multiplyScalar(1.12);
        root.add(prongs(c, dir, r, [b.clone().setZ(0.08), b.clone().setZ(-0.08)], metal, 4));
      }
      break;
    }
    case "cocktail": {
      root.add(band(1, 0.2, 0.26, metal, 0.6));
      const gemR = 0.42 * k;
      const { group, c } = ringHead({ ...spec, gem: gk }, 1, 0.2, gemR, shape === "round" ? "oval" : shape);
      root.add(group);
      const plate = new THREE.Mesh(new THREE.TorusGeometry(gemR * 1.25, 0.05, 8, 64), metal);
      plate.rotation.x = Math.PI / 2;
      plate.scale.set(1, 1.3, 1);
      plate.position.y = c.y - 0.09;
      root.add(plate);
      const n = 26;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const s = gem("diamond", "round", 0.06, 10);
        s.position.set(Math.cos(a) * gemR * 1.25, c.y - 0.04, Math.sin(a) * gemR * 1.25 * 1.3);
        root.add(s);
      }
      break;
    }
    case "signet": {
      root.add(band(1, 0.22, 0.34, metal, 0.6));
      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.22, 64), metal);
      face.scale.set(1, 1, 0.82);
      face.position.y = 1.2;
      root.add(face);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.022, 8, 64), metal);
      rim.rotation.x = Math.PI / 2;
      rim.scale.set(1, 0.82, 1);
      rim.position.y = 1.315;
      root.add(rim);
      if (spec.gem !== "none") {
        const s = gem(gk, "round", 0.16);
        s.position.y = 1.33;
        root.add(s);
      }
      break;
    }
    case "tennis": {
      const Rb = 3, n = 46;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const p = new THREE.Vector3(Math.cos(a) * Rb, 0, Math.sin(a) * Rb);
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.14, 12), metal);
        cup.position.copy(p).setY(-0.02);
        root.add(cup);
        const s = gem(i % 2 && spec.gem !== "diamond" ? "diamond" : gk, "round", 0.18, 12);
        s.position.copy(p).setY(0.1);
        root.add(s);
      }
      root.rotation.x = 0.18;
      break;
    }
    case "bangle": {
      const b = band(2.6, 0.28, 0.5, metal, 0.45);
      root.add(b);
      if (spec.gem !== "none") root.add(pave(2.88, -1.1, 1.1, 21, 0.085, gk));
      break;
    }
    case "pendant": {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.2, 4.6, -0.2), new THREE.Vector3(-1.3, 2.4, 0),
        new THREE.Vector3(-0.35, 0.55, 0.05), new THREE.Vector3(0, 0.2, 0.05),
        new THREE.Vector3(0.35, 0.55, 0.05), new THREE.Vector3(1.3, 2.4, 0),
        new THREE.Vector3(2.2, 4.6, -0.2),
      ]);
      const n = 150;
      const linkGeo = new THREE.TorusGeometry(0.05, 0.014, 6, 16);
      linkGeo.scale(1, 1.5, 1);
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const link = new THREE.Mesh(linkGeo, metal);
        link.position.copy(curve.getPointAt(t));
        orientTo(link, curve.getTangentAt(t));
        link.rotateY(i % 2 ? Math.PI / 2 : 0);
        root.add(link);
      }
      const bail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 10, 32), metal);
      bail.position.set(0, 0.06, 0.05);
      root.add(bail);
      const pShape: GemShape = spec.shape ?? "pear";
      const gemR = 0.38 * k;
      const s = gem(gk, pShape, gemR);
      s.rotation.x = Math.PI / 2;
      s.rotation.z = Math.PI;
      s.position.set(0, -0.45 * k, 0.12);
      root.add(s);
      const collet = new THREE.Mesh(new THREE.TorusGeometry(gemR * 1.02, 0.03, 8, 48), metal);
      collet.position.copy(s.position).setZ(0.1);
      if (pShape === "pear") collet.scale.set(0.8, 1.3, 1);
      root.add(collet);
      root.add(rod(new THREE.Vector3(0, 0, 0.08), new THREE.Vector3(0, s.position.y + gemR * 1.25, 0.1), 0.025, metal));
      break;
    }
    case "studs": {
      for (const x of [-0.75, 0.75]) {
        const g = new THREE.Group();
        const r = 0.42 * k;
        const s = gem(gk, shape, r);
        g.add(s);
        g.add(prongs(new THREE.Vector3(), UP, r, [new THREE.Vector3(0, -0.4, 0)], metal, shape === "emerald" ? 4 : 6));
        g.rotation.x = 0.55;
        g.rotation.z = x < 0 ? 0.25 : -0.2;
        g.position.x = x;
        root.add(g);
      }
      break;
    }
    case "drops": {
      for (const x of [-0.7, 0.7]) {
        const g = new THREE.Group();
        const top = gem("diamond", "round", 0.16);
        top.rotation.x = Math.PI / 2;
        top.position.y = 1.1;
        g.add(top);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 32), metal);
        ring.position.copy(top.position).setZ(-0.03);
        g.add(ring);
        g.add(rod(new THREE.Vector3(0, 0.92, 0), new THREE.Vector3(0, 0.42, 0), 0.02, metal));
        const d = gem(gk, "pear", 0.32 * k);
        d.rotation.x = Math.PI / 2;
        d.rotation.z = Math.PI;
        d.position.y = 0.05;
        g.add(d);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34 * k, 0.03, 8, 48), metal);
        halo.scale.set(0.82, 1.3, 1);
        halo.position.set(0, 0.07, -0.04);
        g.add(halo);
        g.rotation.y = x < 0 ? 0.35 : -0.35;
        g.position.x = x;
        root.add(g);
      }
      break;
    }
    case "hoops": {
      for (const x of [-0.6, 0.6]) {
        const g = new THREE.Group();
        g.add(band(0.72, 0.1, 0.13, metal, 0.6));
        if (spec.gem !== "none") g.add(pave(0.83, Math.PI * 0.55, Math.PI * 1.45, 17, 0.05, gk, 0));
        g.rotation.y = x < 0 ? 0.9 : -0.9;
        g.position.x = x;
        root.add(g);
      }
      break;
    }
    case "riviere": {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3, 0, -2.6), new THREE.Vector3(-2.6, 0, 0.2), new THREE.Vector3(-1.4, 0, 1.9),
        new THREE.Vector3(0, 0, 2.4), new THREE.Vector3(1.4, 0, 1.9), new THREE.Vector3(2.6, 0, 0.2),
        new THREE.Vector3(3, 0, -2.6),
      ]);
      const n = 38;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const mid = 1 - Math.abs(t - 0.5) * 2; // 0..1..0
        const r = 0.11 + 0.14 * Math.pow(mid, 2.2);
        const p = curve.getPointAt(t);
        const collet = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 0.8, r * 0.7, 16), metal);
        collet.position.copy(p).setY(-r * 0.2);
        root.add(collet);
        const s = gem(i === Math.floor(n / 2) ? gk : spec.gem === "diamond" ? "diamond" : mid > 0.6 ? gk : "diamond", "round", r, 12);
        s.position.copy(p).setY(r * 0.25);
        root.add(s);
      }
      root.rotation.x = 0.1;
      break;
    }
  }
  return root;
}

/* ---------------------------------------------------------------- studio */

/** Dark studio with soft boxes — gives metal crisp highlights against deep shadows. */
export function buildStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#2b2a28");
  const panel = (w: number, h: number, intensity: number, pos: [number, number, number], warm = false) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(warm ? "#ffe4c4" : "#ffffff").multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(10, 10, 4.5, [0, 9, 1]);          // overhead softbox
  panel(2.2, 11, 9, [-7, 1, 2]);         // key strip
  panel(2.2, 11, 6, [7, 1.5, -1], true); // warm rim strip
  panel(14, 3, 2.6, [0, -1.5, 8]);       // front fill bounce
  panel(4, 4, 5, [4, 4, 7]);             // front key
  panel(3, 6, 3, [-3, 2, -8], true);     // back glow
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: "#6d6961" }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6;
  scene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  return tex;
}

export function buildGemEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#34343a");
  // deterministic pseudo-random scatter of small bright cards
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 240; i++) {
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
    const r = 8;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5 + rnd() * 1.4, 0.5 + rnd() * 1.4),
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.1 + rnd() * 0.5, 0.15, 0.5).multiplyScalar(rnd() < 0.25 ? 0.05 : 5 + rnd() * 12), side: THREE.DoubleSide }),
    );
    m.position.set(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
    m.lookAt(0, 0, 0);
    scene.add(m);
  }
  const top = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff").multiplyScalar(6), side: THREE.DoubleSide }));
  top.position.set(0, 9, 0); top.lookAt(0, 0, 0); scene.add(top);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(scene, 0).texture;
  pmrem.dispose();
  return tex;
}

/** Camera placement that frames an object for a given view. */
export type ViewKey = "hero" | "front" | "detail" | "top";

export function frameObject(obj: THREE.Object3D, camera: THREE.PerspectiveCamera, view: ViewKey, design: DesignKey, margin = 1.08, fitAspect = false) {
  const box = new THREE.Box3().setFromObject(obj);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const flat = design === "tennis" || design === "riviere";
  const dirs: Record<ViewKey, THREE.Vector3> = {
    hero: new THREE.Vector3(0.5, 0.42, 1),
    front: flat ? new THREE.Vector3(0.1, 1.5, 1) : new THREE.Vector3(0.55, 0.55, 1),
    detail: flat ? new THREE.Vector3(-0.5, 0.7, 1) : design === "pendant" ? new THREE.Vector3(-0.3, 0.1, 1) : new THREE.Vector3(-0.9, 0.55, 0.55),
    top: new THREE.Vector3(0.05, 1.4, 0.35),
  };
  let target = sphere.center.clone();
  let radius = sphere.radius;
  if (view === "detail" && !flat && design !== "pendant") {
    // tighten on the upper (gem) region
    target = new THREE.Vector3(sphere.center.x, box.max.y - (box.max.y - box.min.y) * 0.3, 0);
    radius *= 0.62;
  }
  if (design === "pendant") {
    target = new THREE.Vector3(0, view === "detail" ? -0.35 : 0.4, 0);
    radius = view === "detail" ? 1.1 : 2.2;
  }
  // fit whichever of the vertical / horizontal field of view is tighter (portrait phones)
  const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  const dist = (radius * margin) / Math.sin(fitAspect ? Math.min(vHalf, hHalf) : vHalf);
  camera.position.copy(target).add(dirs[view].normalize().multiplyScalar(dist));
  camera.near = dist / 50;
  camera.far = dist * 10;
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  return { target, box };
}
