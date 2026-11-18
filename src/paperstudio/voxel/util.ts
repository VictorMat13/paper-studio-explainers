// Small deterministic helpers shared by the voxel world. Ported 1:1 from the ep09 storyboard page
// (`Made By AI/ep09 minecraft/storyboard/index.html`, the three.js module at the bottom), so the same seeds give
// the same pixels, the same island and the same crowd as the storyboard frames.

/** the page's LCG: rng(seed)() -> [0, 1) */
export function rng(seed: number): () => number {
  let r = (seed * 2654435761) >>> 0 || 7;
  return () => {
    r = (r * 1664525 + 1013904223) >>> 0;
    return r / 4294967296;
  };
}

export const clampN = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
  lerpN(a[0], b[0], t),
  lerpN(a[1], b[1], t),
  lerpN(a[2], b[2], t),
];
export const smooth01 = (t: number) => {
  const x = clampN(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** the page's value noise (sin hash + smoothstep) */
export function vnoise(x: number, z: number): number {
  const h = (i: number, j: number) => {
    const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const xi = Math.floor(x),
    zi = Math.floor(z),
    fx = x - xi,
    fz = z - zi,
    sx = fx * fx * (3 - 2 * fx),
    sz = fz * fz * (3 - 2 * fz);
  const a = h(xi, zi),
    b = h(xi + 1, zi),
    c = h(xi, zi + 1),
    d = h(xi + 1, zi + 1);
  return (a * (1 - sx) + b * sx) * (1 - sz) + (c * (1 - sx) + d * sx) * sz;
}

/** stable small hash in [0,1) for per-index jitter (flicker, particles) */
export const hash01 = (a: number, b = 0, c = 0) => {
  const n = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return n - Math.floor(n);
};
