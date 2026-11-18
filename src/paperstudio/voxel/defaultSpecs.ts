import type { VoxelCam, WorldSpec } from "./types";

// The storyboard page's named worlds, exactly as `index.html` defines them (world specs section of its DATA script).

export const C = 16;

/** the wide replay camera on the spawn plateau */
export const camWide = (yaw = 18, dist = 26, o: { pitch?: number; shift?: number; fov?: number } = {}): VoxelCam => ({
  target: [C, 3, C],
  dist,
  yaw,
  pitch: o.pitch ?? 42,
  shift: o.shift ?? -270,
  fov: o.fov ?? 84,
});

/** Day 1 spawn: 9 trees, the crowd of 50 on the plateau (H1.1, H2.3, H3.2) */
export const SPAWN: WorldSpec = { terrain: "island", time: "day", trees: 9, crowd: { n: 50, cx: C, cz: C, r: 4.2, seed: 5 }, cam: camWide(18, 24) };

export const spec = (o: WorldSpec): WorldSpec => Object.assign({}, o);

export function dayWorld(o: Partial<WorldSpec> = {}): WorldSpec {
  return spec(Object.assign({ terrain: "island", time: "day", trees: 12, cam: camWide() } as WorldSpec, o));
}
export function nightWorld(o: Partial<WorldSpec> = {}): WorldSpec {
  return spec(Object.assign({ terrain: "island", time: "night", trees: 12, cam: camWide() } as WorldSpec, o));
}

/** the three cobble huts */
export const SHELTERS = [
  { x: C - 6, z: C + 1 },
  { x: C + 1, z: C - 6 },
  { x: C + 5, z: C + 4 },
];

/** inside a hut at night: cobble room, two chests, crafting table, furnace, three wall torches */
export const interior = (o: Partial<WorldSpec> = {}): WorldSpec =>
  spec(
    Object.assign(
      {
        terrain: "interior",
        time: "night",
        cam: { target: [4, 1.2, 4.2], dist: 9.5, yaw: 22, pitch: 50, shift: -160, fov: 70 },
        torches: [
          [0.6, 1.6, 0.3],
          [7.4, 1.6, 0.3],
          [0.3, 1.6, 6.5],
        ],
        chests: [
          [1.2, 1, 0.9],
          [2.2, 1, 0.9],
        ],
        crafting: [[3.2, 1, 0.9]],
        furnace: [[6.6, 1, 0.9]],
      } as WorldSpec,
      o,
    ),
  );
