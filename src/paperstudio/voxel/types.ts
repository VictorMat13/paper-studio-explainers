import type { BlockKind } from "./materials";
import type { ItemKind } from "./textures";

// The world spec: the same shape as `mc(spec)` on the ep09 storyboard page, plus animation inputs (all optional,
// all default to the page's still frame). A shot derives its spec from useCurrentFrame() and passes it to
// <VoxelWorld spec={...} />. Units: 1 block = 1 m; x/z on the island grid (centre C = 16), y up.

export type TimeName = "day" | "dawn" | "dusk" | "night";
/**
 * - a name: the page's sky for that time
 * - a number 0..1 along the cycle day (0) -> dusk (1/3) -> night (2/3) -> dawn (1): darken to night over 10 frames
 *   with `time: interpolate(f, [a, a + 10], [0, 2 / 3])`
 * - `{ from, to, t }`: a straight blend between two times (t 0..1), e.g. `{ from: "day", to: "night", t }`
 */
export type TimeSpec = TimeName | number | { from: TimeName; to: TimeName; t: number };

/** replay-mod camera (the page's makeCamera): orbits `target` at `dist`, `yaw` deg (0 = camera on the +z side looking
 *  north), `pitch` deg down (default 42), lens shift `shift` in reel px (default -270: horizon in the top third;
 *  interiors -160), `fov` deg vertical (default 84) */
export type VoxelCam = {
  target: [number, number, number];
  dist?: number;
  yaw?: number;
  pitch?: number;
  shift?: number;
  fov?: number;
};
/** alias: the voxel camera spec (not the Paper Studio DOM camera's CamSpec) */
export type CamSpec = VoxelCam;

/** an agent's look and pose. Page props: skin (0..7), grey, zombie, yaw (deg), swing, raise, sit, lie, ghost, tool, hold.
 *  Animation inputs: walkPhase, walkAmp, yOffset, scale, opacity, headYaw, headTilt; raise and lie also take 0..1 */
export type AgentLook = {
  skin?: number;
  grey?: boolean;
  zombie?: boolean;
  /** facing in degrees (0 = facing +z, toward a yaw-0 camera) */
  yaw?: number;
  /** static limb swing (default from seedv: odd 0.5, even -0.3, as on the page) */
  swing?: number;
  /** right arm up (true or 0..1) */
  raise?: boolean | number;
  sit?: boolean;
  /** lying flat (true or 0..1 for falling over) */
  lie?: boolean | number;
  /** translucent (respawning) */
  ghost?: boolean;
  /** stone axe in the right hand */
  tool?: boolean;
  /** item sprite held in the right hand */
  hold?: ItemKind;
  seedv?: number;
  /** 0..1 walk cycle (one full stride per unit; advance about 0.06 per frame for a walk) swings arms and legs */
  walkPhase?: number;
  /** swing amplitude for walkPhase (default 1.4) */
  walkAmp?: number;
  /** extra height in blocks (drop-in from the sky: start at 12-20 and ease to 0) */
  yOffset?: number;
  /** 0..1 pop, about the feet */
  scale?: number;
  /** 0..1 fade (ghosts multiply 0.45 on top) */
  opacity?: number;
  /** head turn in degrees (left/right), head tilt in degrees (roll) */
  headYaw?: number;
  headTilt?: number;
};
export type AgentSpec = AgentLook & { x: number; z: number; y?: number };

/** a hut. `door` (alias `open`) 0 closed (the page) .. 1 open: hinged on the frame side, swings outward */
export type ShelterSpec = { x: number; z: number; door?: number; open?: number };
export type FrameSpec = { x: number; z: number };
export type FarmSpec = { x: number; z: number; w: number; d: number; wheat?: [number, number][]; /** wheat sway 0..1 phase */ sway?: number };
/** an extra block. `appear` 0..1 animates it in (grows from its bottom face, eased); leave it out for a static block */
export type BlockSpec = { k: BlockKind; x: number; y: number; z: number; appear?: number };
export type CrowdSpec = {
  n: number;
  cx: number;
  cz: number;
  r: number;
  seed?: number;
  /** everyone faces this [x, z] */
  faceTo?: [number, number];
  /** every other agent holds an axe */
  tool?: boolean;
};
export type LyingSpec = {
  n: number;
  cx: number;
  cz: number;
  cols: number;
  dx: number;
  dz: number;
  /** 0..1 how far the newest (last) one has fallen over (default 1) */
  fall?: number;
  /** 0..1 opacity of all of them (fade to pale) */
  opacity?: number;
};
export type ItemSpec = {
  kind: ItemKind;
  x: number;
  y: number;
  z: number;
  big?: boolean;
  /** yaw in radians (page: 0.6) */
  rotY?: number;
  /** spin about the view axis in radians (a tossed item tumbling) */
  rotZ?: number;
  scale?: number;
  opacity?: number;
  /** unlit (full sprite colour whatever the light; the page's items are lit and read dark indoors at night) */
  glow?: boolean;
};
/** a burst of block particles at a point; t 0..1 = birth to gone */
export type PuffSpec = {
  x: number;
  y: number;
  z: number;
  t: number;
  /** dust: soft pale puff on landing; break: block bits arcing out and falling; spawn: white column rising */
  kind?: "dust" | "break" | "spawn";
  n?: number;
  seed?: number;
  /** 0..255 rgb (break defaults to oak log brown, dust to pale dirt, spawn to white) */
  color?: [number, number, number];
  /** particle size in blocks (default 0.14, spawn 0.1) */
  size?: number;
  /** spread radius multiplier (default 1) */
  spread?: number;
};
/** a tree falling over: t 0..0.7 it tips (accelerating) to flat, 0.7..1 it breaks into particles and is gone; the
 *  stump stays. `dir` = fall direction in degrees (0 = toward +z; default: away from the island centre) */
export type FallingSpec = { i: number; t: number; dir?: number; puff?: boolean };
/**
 * A tree being felled (the storyboard's name; same engine as `falling`): `progress` 0..1. The trunk logs tip over
 * as a group around the stump (0 to 0.7, accelerating), the canopy blocks drop off and fall (from about 0.12),
 * landing with block-break particles, the trunk breaks up on the ground (0.72 to 0.86); the stump stays.
 * Pick the tree by index `i` (the page's seeded order) or `near: [x, z]` (the tree nearest that cell).
 * After progress 1, list the tree in `fell` so it stays a stump.
 */
export type FallingTreeSpec = { i?: number; near?: [number, number]; progress: number; dir?: number; puff?: boolean };

export type WorldSpec = {
  terrain?: "island" | "interior" | "none";
  time?: TimeSpec;
  trees?: number;
  treeSeed?: number;
  /** the first `stumps` trees are cut to stumps (page) */
  stumps?: number;
  /** tree indices cut to stumps without re-rolling the others (use this to animate felling) */
  fell?: number[];
  falling?: FallingSpec[];
  fallingTree?: FallingTreeSpec[];
  shelters?: ShelterSpec[];
  frames?: FrameSpec[];
  farm?: FarmSpec;
  blocks?: BlockSpec[];
  /** [x, yOffset, z]; island: on the ground at that cell + yOffset; interior: y = 1 + yOffset */
  torches?: [number, number, number][];
  chests?: [number, number, number][];
  crafting?: [number, number, number][];
  furnace?: [number, number, number][];
  grassTufts?: [number, number][];
  /** zombies at [x, z] facing the centre */
  mobs?: [number, number][];
  lying?: LyingSpec;
  crowd?: CrowdSpec;
  /** the crowd faces the island centre */
  faceCenter?: boolean;
  agents?: AgentSpec[];
  items?: ItemSpec[];
  puffs?: PuffSpec[];
  cam: VoxelCam;
  /** cloud drift in blocks along +x (about 0.02 per frame is a slow drift) */
  cloudDrift?: number;
  /** sun disc position along its arc: 0 rising in the east, 0.4 high (the page's day sun), 1 setting in the west,
   *  outside 0..1 below the horizon. Default: from `time` */
  sunArc?: number;
  /** moon disc position along the same arc as the sun (0 east horizon .. 1 west horizon; the page's moon is near
   *  0.4). Default: the page's moon at night, rising into place while a blend darkens */
  moonArc?: number;
  /** the moon disc at an exact world point (overrides moonArc). The page's moon sits above the frame of every
   *  default-pitch camera; to show it (and aim hud wires at it) use `moonAt: skyPointAt(holdCam, 860, 380)` */
  moonAt?: [number, number, number];
  /** torch flicker phase (pass the frame): +-3% light, deterministic */
  flicker?: number;
  /** wheat and tall grass sway phase (pass frame / 30): about 2 px of sway */
  sway?: number;
};
