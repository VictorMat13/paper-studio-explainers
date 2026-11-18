// ===========================================================================
// Paper Studio kit, ep06 additions: shared bits for the new components
// (asset paths with presence checks, seeded randomness, polyline and
// homography helpers). Nothing here changes an existing export.
// ===========================================================================
import { getStaticFiles, staticFile } from "remotion";

const ps = (p: string) => staticFile(`paperstudio/${p}`);

/** files the ep06 components can use (public/paperstudio/...); `asset06(key)` returns the URL only if the file is bundled */
const FILES06 = {
  token: "photos/token.png",
  tokenPile: "photos/token-pile.png",
  scissors: "photos/scissors.png",
  mapFolded: "photos/map-folded.png",
  laptop: "photos/laptop.png",
  robotDig: "photos/robot-dig.png",
  robotMap: "photos/robot-map.png",
  robot: "photos/robot.png",
  graph: "shots/graph-hero.png",
  logoGraphify: "logos/graphify-mark.svg",
  logoObsidian: "logos/obsidian.svg",
} as const;
export type Asset06 = keyof typeof FILES06;

let present: Set<string> | null = null;
/** true when public/<path> is in the bundle (Remotion injects the public file list into every bundle) */
export const hasStatic = (path: string) => {
  if (!present) {
    try {
      present = new Set((getStaticFiles() ?? []).map((f) => f.name.replace(/\\/g, "/")));
    } catch {
      present = new Set();
    }
  }
  return present.has(path.replace(/^\/+/, ""));
};

/** URL of an ep06 kit asset, or undefined when the file is not in public/paperstudio yet (components then draw a fallback) */
export const asset06 = (k: Asset06): string | undefined => (hasStatic(`paperstudio/${FILES06[k]}`) ? ps(FILES06[k]) : undefined);

/** all ep06 kit asset URLs (unchecked; prefer `asset06`) */
export const PHOTO06 = Object.fromEntries(Object.entries(FILES06).map(([k, v]) => [k, ps(v)])) as Record<Asset06, string>;

/**
 * Geometry of the ep06 cut-outs, measured on the delivered PNGs (fractions of the image).
 * Fallback drawings use their own built-in geometry.
 */
export const META06 = {
  /**
   * scissors.png (1888x1012): aspect w/h, pivot = the screw (fractions), direction the blades point (deg, 0 = right,
   * clockwise; these point left), opening angle between the blade centre lines
   */
  scissors: { aspect: 1888 / 1012, pivot: [0.49, 0.495] as P2, axis: 182.6, open: 23.4 },
  /**
   * laptop.png (1890x1506): aspect and the screen corners TL, TR, BR, BL (fractions). The whole lid face is black, so
   * the quad is the lid's black face inset by a thin bezel (2.2% sides, 4% top, 3.8% bottom).
   */
  laptop: {
    aspect: 1890 / 1506,
    quad: [
      [0.031, 0.1207],
      [0.6429, 0.0503],
      [0.7115, 0.5306],
      [0.0912, 0.6432],
    ] as Quad,
  },
  /** map-folded.png (1982x1454): a six-panel concertina held part open (about 60 degrees per fold) */
  mapFolded: { aspect: 1982 / 1454, panels: 6, angle: 62 },
  /** token.png (1850x1916): face-on with its milled rim showing on the right */
  token: { aspect: 1850 / 1916 },
};

// ------------------------------------------------------------- randomness
/** deterministic PRNG (mulberry32); same seed, same sequence */
export const rng = (seed: number) => {
  let a = Math.floor(seed * 9973 + 12345) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** a stable 0..1 value for (seed, i, k) */
export const hash01 = (seed: number, i: number, k = 0) => {
  let h = 2166136261 ^ Math.floor(seed * 7919);
  h = Math.imul(h ^ (i + 1) * 374761393, 16777619);
  h = Math.imul(h ^ (k + 7) * 668265263, 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};

// ------------------------------------------------------------- polylines
export type P2 = [number, number];
export type Quad = [P2, P2, P2, P2];

export const polyLen = (pts: P2[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};
/** point, heading (deg) and segment index at distance d along a polyline (clamped) */
export const polyAt = (pts: P2[], d: number) => {
  if (pts.length < 2) return { x: pts[0]?.[0] ?? 0, y: pts[0]?.[1] ?? 0, ang: 0, seg: 0 };
  let rest = Math.max(0, d);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const l = Math.hypot(bx - ax, by - ay);
    if (rest <= l || i === pts.length - 1) {
      const t = l ? Math.min(1, rest / l) : 0;
      return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, ang: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI, seg: i - 1 };
    }
    rest -= l;
  }
  const n = pts.length - 1;
  return { x: pts[n][0], y: pts[n][1], ang: 0, seg: n - 1 };
};
/** the polyline cut at distance d (for trails that grow along a path) */
export const polyUpTo = (pts: P2[], d: number): P2[] => {
  if (pts.length < 2) return pts.slice();
  const out: P2[] = [pts[0]];
  let rest = Math.max(0, d);
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (rest >= l) {
      out.push(pts[i]);
      rest -= l;
    } else {
      const t = l ? rest / l : 0;
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]);
      break;
    }
  }
  return out;
};
export const polyD = (pts: P2[]) => (pts.length ? "M" + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L") : "");

// ------------------------------------------------------------- homography
/**
 * CSS matrix3d that maps a W x H element (transform-origin 0 0) onto the quad TL, TR, BR, BL (px in the parent).
 * Heckbert's square-to-quad, pre-scaled by 1/W, 1/H.
 */
export const quadMatrix3d = (W: number, H: number, q: Quad) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
    a = x1 - x0;
    b = x2 - x1;
    c = x0;
    d = y1 - y0;
    e = y2 - y1;
    f = y0;
    g = 0;
    h = 0;
  } else {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + h * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + h * y3;
    f = y0;
  }
  const m = [a / W, d / W, 0, g / W, b / H, e / H, 0, h / H, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(9)).join(",")})`;
};

/** clip a convex polygon to the half-plane n . p >= k (Sutherland-Hodgman, one plane) */
export const clipHalf = (poly: P2[], n: P2, k: number): P2[] => {
  const out: P2[] = [];
  const side = (p: P2) => n[0] * p[0] + n[1] * p[1] - k;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa >= 0) out.push(a);
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
};
export const centroid = (poly: P2[]): P2 => {
  if (!poly.length) return [0, 0];
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const cr = x0 * y1 - x1 * y0;
    A += cr;
    cx += (x0 + x1) * cr;
    cy += (y0 + y1) * cr;
  }
  if (Math.abs(A) < 1e-6) return [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
  return [cx / (3 * A), cy / (3 * A)];
};
