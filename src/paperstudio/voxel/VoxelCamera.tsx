import React, { useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { EASE } from "../theme";
import type { VoxelCam } from "./types";
import { clampN, lerpN } from "./util";

// The replay-mod camera from the ep09 storyboard page (`makeCamera`): a perspective camera orbiting a target,
// pitched down, with a vertical lens shift (setViewOffset) so the horizon sits in the top third and the captions
// sit on the sky. Plus the helpers builders use for hold, move, hold (lerpCam / camKeys) and drifting holds.

export const CAM_DEFAULTS = { dist: 24, yaw: 0, pitch: 42, shift: -270, fov: 84 } as const;

/** the page's defaults filled in (fov || 84, dist || 24, yaw || 0, pitch ?? 42, shift ?? -270) */
export const fullCam = (c: VoxelCam): Required<VoxelCam> => ({
  target: [c.target[0], c.target[1], c.target[2]],
  dist: c.dist || CAM_DEFAULTS.dist,
  yaw: c.yaw || 0,
  pitch: c.pitch ?? CAM_DEFAULTS.pitch,
  shift: c.shift ?? CAM_DEFAULTS.shift,
  fov: c.fov || CAM_DEFAULTS.fov,
});

/** world position of the camera for a spec (target + spherical offset) */
export function camPosition(c: VoxelCam): [number, number, number] {
  const f = fullCam(c);
  const pitch = (f.pitch * Math.PI) / 180,
    yaw = (f.yaw * Math.PI) / 180,
    d = f.dist;
  const t = f.target;
  return [t[0] + Math.cos(pitch) * Math.sin(yaw) * d, t[1] + Math.sin(pitch) * d, t[2] + Math.cos(pitch) * Math.cos(yaw) * d];
}

/** set a PerspectiveCamera from a spec for a canvas of w x h px (the page's makeCamera, in place) */
export function applyCam(cam: THREE.PerspectiveCamera, c: VoxelCam, w: number, h: number) {
  const f = fullCam(c);
  cam.fov = f.fov;
  cam.aspect = w / h;
  cam.near = 0.1;
  cam.far = 400;
  cam.up.set(0, 1, 0);
  const p = camPosition(f);
  cam.position.set(p[0], p[1], p[2]);
  cam.lookAt(f.target[0], f.target[1], f.target[2]);
  cam.setViewOffset(w, h, 0, (f.shift * h) / 1920, w, h);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
}

/** a standalone camera object for a spec (outside React, e.g. for projecting points) */
export function makeCamera(c: VoxelCam, w = 1080, h = 1920) {
  const cam = new THREE.PerspectiveCamera(fullCam(c).fov, w / h, 0.1, 400);
  applyCam(cam, c, w, h);
  return cam;
}

/** where a world point lands on the 1080x1920 frame for a camera spec (for pinning paper tags over agents) */
export function projectToReel(c: VoxelCam, p: [number, number, number], w = 1080, h = 1920): { x: number; y: number; behind: boolean } {
  const cam = makeCamera(c, w, h);
  const v = new THREE.Vector3(p[0], p[1], p[2]).project(cam);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, behind: v.z > 1 };
}

/** the storyboard's name: projectToScreen([x, y, z], cam) -> reel px { x, y, behind } (same as projectToReel) */
export const projectToScreen = (worldPos: [number, number, number], cam: VoxelCam, w = 1080, h = 1920) => projectToReel(cam, worldPos, w, h);

/** the world point `dist` blocks from the camera that lands on reel px (x, y): put the moon (moonAt) or anything
 *  else exactly where the storyboard draws it, e.g. skyPointAt(cam, 860, 380) */
export function skyPointAt(c: VoxelCam, x: number, y: number, dist = 100, w = 1080, h = 1920): [number, number, number] {
  const cam = makeCamera(c, w, h);
  const v = new THREE.Vector3((x / w) * 2 - 1, 1 - (y / h) * 2, 0.5).unproject(cam).sub(cam.position).normalize();
  const p = cam.position.clone().add(v.multiplyScalar(dist));
  return [p.x, p.y, p.z];
}

const shortYaw = (a: number, b: number) => {
  let d = (((b - a) % 360) + 540) % 360 - 180;
  if (d === -180) d = 180;
  return d;
};

/**
 * Blend two camera specs, t 0..1 (clamped, NOT eased: pass an eased t, or use camKeys).
 * orbit = yaw (the short way round), push = dist (geometric, so a push reads even), tilt = pitch, follow = target,
 * plus shift and fov.
 */
export function lerpCam(a: VoxelCam, b: VoxelCam, t: number): VoxelCam {
  const A = fullCam(a),
    B = fullCam(b);
  const k = clampN(t, 0, 1);
  return {
    target: [lerpN(A.target[0], B.target[0], k), lerpN(A.target[1], B.target[1], k), lerpN(A.target[2], B.target[2], k)],
    dist: A.dist * Math.pow(B.dist / A.dist, k),
    yaw: A.yaw + shortYaw(A.yaw, B.yaw) * k,
    pitch: lerpN(A.pitch, B.pitch, k),
    shift: lerpN(A.shift, B.shift, k),
    fov: lerpN(A.fov, B.fov, k),
  };
}

export type CamKey = { f: number; cam: VoxelCam; ease?: (t: number) => number };

/**
 * Hold, move, hold: the camera at frame f along keys sorted by f. Between two keys it eases with the later key's
 * `ease` (default EASE.cam, the in-out camera curve); two keys with the same cam = a hold. Before the first key it
 * holds the first, after the last it holds the last.
 *   camKeys(f, [{ f: 0, cam: A }, { f: 20, cam: A }, { f: 38, cam: B }])   // hold 0-20, move 20-38 (18 frames), hold
 */
export function camKeys(f: number, keys: CamKey[]): VoxelCam {
  if (keys.length === 0) throw new Error("camKeys needs at least one key");
  if (f <= keys[0].f) return keys[0].cam;
  for (let i = 1; i < keys.length; i++) {
    const k0 = keys[i - 1],
      k1 = keys[i];
    if (f <= k1.f) {
      const span = Math.max(1e-6, k1.f - k0.f);
      const e = k1.ease ?? EASE.cam;
      return lerpCam(k0.cam, k1.cam, e(clampN((f - k0.f) / span, 0, 1)));
    }
  }
  return keys[keys.length - 1].cam;
}

/** orbit by dYaw degrees */
export const orbitCam = (c: VoxelCam, dYaw: number): VoxelCam => ({ ...c, yaw: (c.yaw || 0) + dYaw });
/** push in by a factor (1.06 = 6% closer; below 1 pulls back) */
export const pushCam = (c: VoxelCam, factor: number): VoxelCam => ({ ...c, dist: (c.dist || CAM_DEFAULTS.dist) / factor });
/** tilt by dPitch degrees (positive looks more down) */
export const tiltCam = (c: VoxelCam, dPitch: number): VoxelCam => ({ ...c, pitch: (c.pitch ?? CAM_DEFAULTS.pitch) + dPitch });
/** move the target (follow) */
export const followCam = (c: VoxelCam, target: [number, number, number]): VoxelCam => ({ ...c, target });

/**
 * A drifting hold: from `from` to `to` frames the camera slowly pushes (`push`, e.g. 0.04 = 4%) and orbits
 * (`orbit` degrees), on the sine in-out drift curve, so every hold moves without a kink at either end.
 */
export function driftCam(c: VoxelCam, f: number, from: number, to: number, o: { push?: number; orbit?: number; tilt?: number } = {}): VoxelCam {
  const t = EASE.drift(clampN((f - from) / Math.max(1, to - from), 0, 1));
  let out = c;
  if (o.push) out = pushCam(out, 1 + o.push * t);
  if (o.orbit) out = orbitCam(out, o.orbit * t);
  if (o.tilt) out = tiltCam(out, o.tilt * t);
  return out;
}

/** puts the scene's default camera at the spec every frame (layout effect: before ThreeCanvas renders the frame) */
export const VoxelCameraRig: React.FC<{ cam: VoxelCam; w: number; h: number }> = ({ cam, w, h }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    applyCam(camera, cam, w, h);
  });
  return null;
};
