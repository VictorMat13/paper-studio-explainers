import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { CrtPass } from "./CrtPass";
import { EASE } from "./theme";
import { C, SHELTERS, SPAWN, VoxelWorld, driftCam, interior, nightWorld, type WorldSpec } from "./voxel";

// VoxelDemo (180 frames, 1080x1920, 30 fps): the voxel world kit on its own.
//   0-59    SPAWN (Day 1, the crowd of 50), slow orbit + push; tree 0 falls 14-44; day to night blend 50-60
//   60-119  night, the three huts with lit torches; an agent walks to hut 0 and goes in, the door shuts
//   120-179 inside a hut at night: three agents, the cooked chicken in flight, agent 2 steps toward it
// Every frame is a spec computed from the frame (nothing animates on its own).

export const VOXEL_DEMO_LEN = 180;

const ease = (f: number, a: number, b: number, e: (t: number) => number = EASE.travel) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

/** frame 0 of this section is exactly the storyboard's H1.1 world (SPAWN) */
export const spawnSpec = (f: number): WorldSpec => ({
  ...SPAWN,
  // a 10-frame blend day -> (dusk) -> night at 50-60
  time: f < 50 ? "day" : interpolate(f, [50, 60], [0, 2 / 3], { extrapolateRight: "clamp" }),
  falling: [{ i: 0, t: interpolate(f, [14, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }],
  cloudDrift: f * 0.03,
  cam: driftCam(SPAWN.cam, f, 0, 59, { orbit: 6, push: 0.04 }),
});

const NIGHT = nightWorld({ trees: 12, stumps: 10, shelters: SHELTERS, crowd: { n: 5, cx: C - 1, cz: C + 1, r: 2.4, seed: 14 } });

export const nightSpec = (f: number): WorldSpec => {
  // the walker: along the hut row at z 21.6 (all height 3), then into hut 0's doorway, fading as it goes in
  const walk = ease(f, 4, 40, EASE.linear);
  const inT = ease(f, 40, 50, EASE.linear);
  const x = interpolate(walk, [0, 1], [15.4, 11.5]);
  const z = interpolate(inT, [0, 1], [21.6, 20.4]);
  const door = 1 - ease(f, 46, 56, EASE.travel);
  return {
    ...NIGHT,
    shelters: SHELTERS.map((s, i) => (i === 0 ? { ...s, door } : s)),
    agents: [
      {
        x,
        z,
        y: 3,
        skin: 6,
        // facing -x along the row, then turning to face -z into the doorway
        yaw: -90 - 90 * ease(f, 37, 45, EASE.travel),
        walkPhase: f < 50 ? f * 0.07 : undefined,
        opacity: 1 - ease(f, 44, 50, EASE.linear),
      },
    ],
    flicker: f,
    cloudDrift: (60 + f) * 0.03,
    cam: driftCam({ target: [C, 3, C], dist: 22, yaw: 30, pitch: 42, shift: -270, fov: 84 }, f, 0, 59, { orbit: 8, push: 0.03 }),
  };
};

const ROOM = interior({
  agents: [
    { x: 2.2, z: 5.2, yaw: 60, skin: 0 },
    { x: 5.8, z: 3.4, yaw: -110, skin: 1 },
    { x: 4.2, z: 4.6, yaw: -30, skin: 2 },
  ],
  items: [{ kind: "chicken", x: 3.4, y: 2.2, z: 4.6 }],
});

export const roomSpec = (f: number): WorldSpec => {
  // the chicken carries on along its toss arc from the storyboard pose toward the hungry agent, tumbling
  const s = ease(f, 0, 30, EASE.linear);
  const cx = interpolate(s, [0, 1], [3.4, 5.3]);
  const cz = interpolate(s, [0, 1], [4.6, 3.7]);
  const cy = 2.2 + 0.5 * Math.sin(s * Math.PI) - 0.9 * s;
  const step = ease(f, 6, 30, EASE.travel);
  return {
    ...ROOM,
    agents: [
      ROOM.agents![0],
      { ...ROOM.agents![1], headYaw: -20 * ease(f, 10, 26) },
      // turns toward the arc, then steps after it (facing its direction of travel: +x, -z)
      { ...ROOM.agents![2], x: 4.2 + 0.5 * step, z: 4.6 - 0.4 * step, yaw: -30 + 158 * ease(f, 0, 10), walkPhase: f > 6 && f < 30 ? (f - 6) * 0.06 : undefined },
    ],
    items: [{ kind: "chicken", x: cx, y: cy, z: cz, rotY: 0.6, rotZ: s * Math.PI * 2.5, glow: true }],
    flicker: f,
    cam: driftCam(ROOM.cam, f, 0, 59, { orbit: 8, push: 0.03 }),
  };
};

const Section: React.FC<{ make: (f: number) => WorldSpec; resolution?: number }> = ({ make, resolution }) => {
  const f = useCurrentFrame();
  return <VoxelWorld spec={make(f)} resolution={resolution} />;
};

export const VoxelDemo: React.FC<{ crt?: boolean; resolution?: number }> = ({ crt = false, resolution = 1 }) => (
  <AbsoluteFill style={{ background: "#9DB9D8" }}>
    <CrtPass enabled={crt}>
      <Sequence from={0} durationInFrames={60} name="spawn">
        <Section make={spawnSpec} resolution={resolution} />
      </Sequence>
      <Sequence from={60} durationInFrames={60} name="night huts">
        <Section make={nightSpec} resolution={resolution} />
      </Sequence>
      <Sequence from={120} durationInFrames={60} name="interior">
        <Section make={roomSpec} resolution={resolution} />
      </Sequence>
    </CrtPass>
  </AbsoluteFill>
);

/**
 * VoxelSpecTest (60 frames): renders any world spec from props (e.g. a storyboard `specs/<ID>.json`), for checking a
 * shot's world. With `anim` the new scene kinds run over the 60 frames: `fallingTree` progress 0 to 1, `blocks` with
 * `appear` rising in order, shelters with a `door` swinging from open to shut, and a 2-degree orbit.
 */
export const VoxelSpecTest: React.FC<{ spec: WorldSpec; anim?: boolean; resolution?: number }> = ({ spec, anim = true, resolution = 1 }) => {
  const f = useCurrentFrame();
  const p = f / 59;
  const s: WorldSpec = !anim
    ? spec
    : {
        ...spec,
        fallingTree: spec.fallingTree?.map((ft) => ({ ...ft, progress: p })),
        blocks: spec.blocks?.map((b, i) => (b.appear !== undefined ? { ...b, appear: Math.max(0, Math.min(1, p * 2 - i * 0.18)) } : b)),
        shelters: spec.shelters?.map((sh) => (sh.door !== undefined ? { ...sh, door: 1 - ease(f, 10, 40) } : sh)),
        flicker: f,
        cam: driftCam(spec.cam, f, 0, 59, { orbit: 2 }),
      };
  return (
    <AbsoluteFill style={{ background: "#9DB9D8" }}>
      <VoxelWorld spec={s} resolution={resolution} />
    </AbsoluteFill>
  );
};
