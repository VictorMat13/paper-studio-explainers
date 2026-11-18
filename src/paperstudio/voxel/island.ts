import type { BlockKind } from "./materials";
import type { FallingSpec, WorldSpec } from "./types";
import { rng, vnoise } from "./util";

// The island and the interior room, block for block the same as the ep09 storyboard page (`heightAt`,
// `surfaceKind`, `treeSpots`, `buildBlocks`), so a spec renders the same geometry here as in the storyboard frames.
// Island: 32 x 32 cells, centre (16, 16), flat spawn plateau at height 3, slopes to a sand shore and water.

export const N = 32;
export const C = 16;
export const RAD = 13.2;

/** column height (number of blocks; the top block's top face is at y = height). 0 = water / void */
export function heightAt(x: number, z: number): number {
  const dx = x - C,
    dz = z - C;
  const r = Math.sqrt(dx * dx + dz * dz) / RAD;
  if (r >= 1) return 0;
  if (r < 0.36) return 3;
  const n = vnoise(x * 0.35 + 7, z * 0.35 + 3);
  const base = (1 - r) * 3.4 + n * 1.6;
  return Math.max(1, Math.min(5, 1 + Math.floor(base)));
}

/** ground height under a (possibly fractional) point, the way the page places agents and props */
export const groundAt = (x: number, z: number) => heightAt(Math.floor(x), Math.floor(z));

export function surfaceKind(x: number, z: number, ht: number): BlockKind {
  const dx = x - C,
    dz = z - C;
  const r = Math.sqrt(dx * dx + dz * dz) / RAD;
  return ht === 1 && r > 0.78 ? "sand" : "grass";
}

/** seeded tree cells [x, z], 4 apart, outside the spawn circle */
export function treeSpots(count: number, seed: number): [number, number][] {
  const R = rng(seed + 101);
  const out: [number, number][] = [];
  let tries = 0;
  while (out.length < count && tries < 4000) {
    tries++;
    const x = 2 + ((R() * (N - 4)) | 0),
      z = 2 + ((R() * (N - 4)) | 0);
    const dx = x - C,
      dz = z - C;
    const r = Math.sqrt(dx * dx + dz * dz) / RAD;
    if (r > 0.86 || r < 0.42) continue;
    if (out.some((p) => Math.abs(p[0] - x) < 4 && Math.abs(p[1] - z) < 4)) continue;
    out.push([x, z]);
  }
  return out;
}

/** one block. `sy` = height scale (water is 0.875 tall). `tree` = index of the tree it belongs to (trunk above the
 *  stump and canopy), so a falling tree can be lifted out of the static blocks */
export type Block = { k: BlockKind; x: number; y: number; z: number; sy?: number; tree?: number };

/** index of the STANDING tree nearest a cell (skips the first `stumps` and any in `fell`; the page's seeded order) */
export function treeNear(spec: Pick<WorldSpec, "trees" | "treeSeed" | "stumps" | "fell">, x: number, z: number): number {
  const cells = treeSpots(spec.trees || 0, spec.treeSeed || 3);
  const fell = spec.fell ?? [];
  let best = -1,
    bd = Infinity;
  cells.forEach(([tx, tz], i) => {
    if (i < (spec.stumps || 0) || fell.indexOf(i) >= 0) return;
    const d = (tx - x) * (tx - x) + (tz - z) * (tz - z);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

/** every falling tree of a spec (`falling` and `fallingTree` together) as { i, t, dir, puff } */
export function fallingOf(spec: WorldSpec): FallingSpec[] {
  const out: FallingSpec[] = [...(spec.falling ?? [])];
  for (const ft of spec.fallingTree ?? []) {
    const i = ft.i ?? (ft.near ? treeNear(spec, ft.near[0], ft.near[1]) : -1);
    if (i >= 0) out.push({ i, t: ft.progress, dir: ft.dir, puff: ft.puff });
  }
  return out;
}

/** extra blocks that are static (no `appear`) */
export const staticBlocks = (spec: WorldSpec) => (spec.blocks ?? []).filter((b) => b.appear === undefined);

/** the spec fields that change the static block list (everything else is animated per frame) */
export const blockKeyOf = (spec: WorldSpec) =>
  JSON.stringify([
    spec.terrain ?? "island",
    spec.trees || 0,
    spec.treeSeed || 3,
    spec.stumps || 0,
    spec.fell ?? [],
    fallingOf(spec)
      .map((f) => f.i)
      .sort((a, b) => a - b),
    (spec.shelters ?? []).map((s) => [s.x, s.z]),
    spec.frames ?? [],
    spec.farm ? [spec.farm.x, spec.farm.z, spec.farm.w, spec.farm.d] : 0,
    staticBlocks(spec).map((b) => [b.k, b.x, b.y, b.z]),
  ]);

/**
 * The page's block list for a spec (island + trees/stumps + huts + half-built frames + farmland + extra blocks;
 * or the interior room). Extensions (all default off, so a page spec gives the page's list):
 * - `fell: [i, ...]`: tree i is cut down to its stump WITHOUT re-seeding the other trees (the page's `stumps` count
 *   re-rolls every later tree's height, so animate felling with `fell`, never by counting `stumps` up).
 * - `falling: [{ i, t }]` / `fallingTree: [{ i | near, progress }]`: tree i's trunk and canopy are tagged `tree: i`
 *   (VoxelWorld lifts them into the falling-tree animation).
 * - `blocks` entries with `appear` are left out (they animate in AnimatedBlocks).
 */
export function buildBlocks(spec: WorldSpec): Block[] {
  const list: Block[] = [];
  const add = (k: BlockKind, x: number, y: number, z: number, sy?: number, tree?: number) => list.push({ k, x, y, z, sy, tree });
  const terrain = spec.terrain ?? "island";
  if (terrain === "island") {
    for (let x = 0; x < N; x++)
      for (let z = 0; z < N; z++) {
        const ht = heightAt(x, z);
        if (ht === 0) {
          const dx = x - C,
            dz = z - C;
          const r = Math.sqrt(dx * dx + dz * dz) / RAD;
          if (r < 2.4) add("water", x, 0, z, 0.875);
          continue;
        }
        const top = surfaceKind(x, z, ht);
        for (let y = Math.max(0, ht - 3); y < ht; y++) add(y === ht - 1 ? top : "dirt", x, y, z);
      }
    const trees = treeSpots(spec.trees || 0, spec.treeSeed || 3);
    const stumps = spec.stumps || 0;
    const fell = new Set(spec.fell ?? []);
    const falling = new Set(fallingOf(spec).map((f) => f.i));
    const R = rng(77);
    trees.forEach(([x, z], i) => {
      const g = heightAt(x, z);
      if (i < stumps) {
        add("log", x, g, z);
        return;
      }
      // a felled tree still rolls its random numbers, so every other tree keeps its shape
      const cut = fell.has(i);
      const tag = falling.has(i) && !cut ? i : undefined;
      const put = (k: BlockKind, bx: number, by: number, bz: number) => {
        if (!cut) add(k, bx, by, bz, undefined, tag);
      };
      const th = 4 + ((R() * 2) | 0);
      for (let y = 0; y < th; y++) {
        if (y === 0) add("log", x, g, z);
        else put("log", x, g + y, z);
      }
      const top = g + th - 1;
      for (let dy = -2; dy <= 0; dy++) {
        const rad = dy < 0 ? 2 : 1;
        for (let dx = -rad; dx <= rad; dx++)
          for (let dz = -rad; dz <= rad; dz++) {
            if (dy < 0 && Math.abs(dx) === 2 && Math.abs(dz) === 2 && R() < 0.5) continue;
            if (dx === 0 && dz === 0 && dy < 0) continue;
            put("leaves", x + dx, top + dy, z + dz);
          }
      }
      put("leaves", x, top + 1, z);
      put("leaves", x + 1, top + 1, z);
      put("leaves", x - 1, top + 1, z);
      put("leaves", x, top + 1, z + 1);
      put("leaves", x, top + 1, z - 1);
    });
    (spec.shelters ?? []).forEach((s) => {
      const g = heightAt(s.x, s.z);
      const w = 4,
        d = 4;
      for (let y = 0; y < 3; y++)
        for (let x = 0; x < w; x++)
          for (let z = 0; z < d; z++) {
            const edge = x === 0 || z === 0 || x === w - 1 || z === d - 1;
            if (!edge) continue;
            if (z === d - 1 && x === 1 && y < 2) continue;
            add("cobble", s.x + x, g + y, s.z + z);
          }
      for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) add("planks", s.x + x, g + 3, s.z + z);
    });
    (spec.frames ?? []).forEach((f) => {
      const g = heightAt(f.x, f.z);
      for (const [dx, dz] of [
        [0, 0],
        [2, 0],
        [0, 2],
        [2, 2],
      ])
        for (let y = 0; y < 3; y++) add("log", f.x + dx, g + y, f.z + dz);
      for (let i = 0; i <= 2; i++) {
        add("planks", f.x + i, g + 3, f.z);
        add("planks", f.x + i, g + 3, f.z + 2);
      }
    });
    if (spec.farm) {
      const f = spec.farm;
      for (let x = 0; x < f.w; x++)
        for (let z = 0; z < f.d; z++) {
          const g = heightAt(f.x + x, f.z + z);
          list.forEach((b) => {
            if (b.x === f.x + x && b.z === f.z + z && b.y === g - 1) b.k = "farmland";
          });
        }
    }
    staticBlocks(spec).forEach((b) => add(b.k, b.x, b.y, b.z));
  } else if (terrain === "interior") {
    for (let x = -1; x < 9; x++) for (let z = -1; z < 9; z++) add((x + z) % 5 === 0 ? "stone" : "cobble", x, 0, z);
    for (let x = -1; x < 9; x++) for (let y = 1; y < 4; y++) add(y === 3 && x % 3 === 0 ? "dirt" : "cobble", x, y, -1);
    for (let z = -1; z < 9; z++) for (let y = 1; y < 4; y++) add(y === 3 && z % 4 === 0 ? "dirt" : "cobble", -1, y, z);
    for (let z = -1; z < 9; z++) for (let y = 1; y < 3; y++) if (z < 2 || z > 5) add("cobble", 8, y, z);
    staticBlocks(spec).forEach((b) => add(b.k, b.x, b.y, b.z));
  }
  return list;
}

/** the tree cells of a spec, in the page's order: tree i stands at treeCells(spec)[i] */
export const treeCells = (spec: WorldSpec) => treeSpots(spec.trees || 0, spec.treeSeed || 3);
