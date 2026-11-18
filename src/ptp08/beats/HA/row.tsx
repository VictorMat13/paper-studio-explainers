// ===========================================================================
// HA's robot row (builder HA, ep08; STYLE UPLIFT 2026-11-07): three robots at laptops. Each robot (robot.png, 300 px
// tall) stands behind its laptop (laptop.png, in front at its waist), so its head, waving arm and chest read above the
// lid; a soft caret pulses on the laptop's black screen until a Claude chip pops onto it; the robot comes down at zero
// velocity with a soft settle (SMOOTHNESS), sways its head, blinks, and leans toward the slab. Both cut-outs float with
// the kit's shadow stack.
// Geometry is pure (rowGeom) so the beat and the hand-offs aim at the same points.
// ===========================================================================
import React from "react";
import { Img } from "remotion";
import { EASE, mix, theme } from "../../../paperstudio";
import { HA_ASPECT, HA_LOGO, HA_PHOTO, LAPTOP_SCREEN } from "./assets";
import { PopChip, bump, io } from "./smooth";

/** group centres (world px, x) and the laptops' bottom line */
export const ROW_X = [190, 540, 890] as const;
export const ROW_BOTTOM = 1120;
/** laptop width, robot height (world px) */
export const LAP_W = 236;
export const ROBOT_H = 300;
const LAP_H = LAP_W / HA_ASPECT.laptop;
const ROBOT_W = ROBOT_H * HA_ASPECT.robot;
/** how much of the robot shows above the lid (head, arm, chest) */
const ROBOT_SHOW = 0.64;
/** the Claude chip on the screen */
export const CHIP_R = 40;
/** the wire under the row */
export const WIRE_Y = 1140;
/** robot.png eyes (fractions of the image): centres and the patch size that closes them in a blink */
const EYES = [
  { x: 0.366, y: 0.265 },
  { x: 0.686, y: 0.292 },
];
const EYE = { w: 0.092, h: 0.112 };
const VISOR = "#29282A";

export const rowGeom = (cx: number) => {
  const lapLeft = cx - 0.45 * LAP_W;
  const lapTop = ROW_BOTTOM - LAP_H;
  const screen = { x: lapLeft + LAPTOP_SCREEN.cx * LAP_W, y: lapTop + LAPTOP_SCREEN.cy * LAP_H };
  const robotLeft = screen.x - ROBOT_W / 2;
  const robotTop = lapTop - ROBOT_SHOW * ROBOT_H;
  return {
    lap: { x: lapLeft, y: lapTop, w: LAP_W, h: LAP_H },
    robot: { x: robotLeft, y: robotTop, w: ROBOT_W, h: ROBOT_H },
    screen,
    /** the robot's head top centre (where its chat bubble comes from) */
    head: { x: screen.x, y: robotTop + 14 },
    /** the lean pivot: the robot's centre line at the lid's top edge */
    pivot: { x: screen.x, y: lapTop + 18 },
  };
};

/** the row's bounding box (world px), for the hand-off turn */
export const ROW_RECT = (() => {
  const a = rowGeom(ROW_X[0]);
  const c = rowGeom(ROW_X[2]);
  const x0 = Math.min(a.robot.x, a.lap.x);
  const x1 = c.lap.x + c.lap.w;
  const y0 = a.robot.y;
  return { x: x0, y: y0, w: x1 - x0, h: WIRE_Y + 16 - y0 };
})();

/** landing (SMOOTHNESS): the group comes down 60 px over 14 frames, eased in and out (it arrives at rest exactly at
 *  `at`), fading in over its first 6 frames, then settles with a soft 10-frame squash bump (zero velocity at both
 *  ends); returns translateY, scale x/y and opacity */
export const landing = (f: number, at: number) => {
  const p = io(f, at - 14, at);
  const b = bump(f, at, 10);
  return { dy: -60 * (1 - p), sx: 1 + 0.018 * b, sy: 1 - 0.026 * b, o: io(f, at - 14, at - 8) };
};

/** a smooth blink (0 open .. 1 closed .. 0, 8 frames) every ~90 frames, seeded per robot */
const blinkAt = (f: number, seed: number) => {
  const period = 86 + seed * 13;
  const t = (((f + 30 + seed * 37) % period) + period) % period;
  return bump(t, 0, 8);
};

/**
 * One robot at its laptop. `at` = the landing frame, `chipAt` = the Claude chip's pop frame, `lean` = degrees about
 * the lid line (toward the slab), `lift` px up, `bob` = ambient offset, f = group-local frame.
 */
export const RobotAtLaptop: React.FC<{
  f: number;
  i: number;
  cx: number;
  at: number;
  chipAt?: number;
  lean: number;
  lift: number;
  bob: { x: number; y: number };
  /** the laptop (and its chip) has left the row (BodyC hand-off) */
  hideLaptop?: boolean;
  /** the chip has left the screen (BodyB hand-off) */
  hideChip?: boolean;
}> = ({ f, i, cx, at, chipAt, lean, lift, bob, hideLaptop, hideChip }) => {
  const g = rowGeom(cx);
  const L = landing(f, at);
  if (L.o <= 0) return null;
  // the robot is clipped at the lid's lower edge (it stands behind the laptop)
  const clipY = g.lap.y + 0.62 * g.lap.h - g.robot.y;
  const sway = 0.7 * Math.sin(((f + i * 29) / 82) * Math.PI * 2);
  const blink = blinkAt(f, i);
  const caret = 0.5 + 0.5 * Math.cos(((f + i * 11) / 32) * Math.PI * 2); // a soft pulse, never a hard blink
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${bob.x.toFixed(2)}px,${(bob.y + L.dy).toFixed(2)}px)`, opacity: L.o }}>
      {/* the soft settle squash about the laptop's bottom centre */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${cx}px ${ROW_BOTTOM}px`, transform: L.sx !== 1 ? `scale(${L.sx.toFixed(4)},${L.sy.toFixed(4)})` : undefined }}>
        {/* robot behind the lid (generous margins so its shadow is never cut) */}
        <div style={{ position: "absolute", left: g.robot.x - 80, top: g.robot.y - 140, width: g.robot.w + 260, height: clipY + 140, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 80,
              top: 140,
              width: g.robot.w,
              height: g.robot.h,
              transformOrigin: `${g.pivot.x - g.robot.x}px ${g.pivot.y - g.robot.y}px`,
              transform: `translateY(${(-lift).toFixed(2)}px) rotate(${(lean + sway).toFixed(3)}deg)`,
            }}
          >
            {HA_PHOTO.robot ? (
              <Img src={HA_PHOTO.robot} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", filter: theme.shadow.cutout }} />
            ) : (
              <div style={{ width: "100%", height: "60%", borderRadius: "40%", background: "#F4F4F4", boxShadow: "8px 12px 18px rgba(0,0,0,.2)" }} />
            )}
            {/* the blink: a lid of visor colour closing over each eye from the top */}
            {HA_PHOTO.robot && blink > 0.02
              ? EYES.map((e, k) => {
                  const w = EYE.w * g.robot.w;
                  const h = EYE.h * g.robot.h;
                  return (
                    <div key={k} style={{ position: "absolute", left: e.x * g.robot.w - w / 2, top: e.y * g.robot.h - h / 2, width: w, height: h * blink, overflow: "hidden" }}>
                      <div style={{ width: w, height: h, borderRadius: "50%", background: VISOR }} />
                    </div>
                  );
                })
              : null}
          </div>
        </div>
        {/* laptop in front */}
        {hideLaptop ? null : (
          <div style={{ position: "absolute", left: g.lap.x, top: g.lap.y, width: g.lap.w, height: g.lap.h }}>
            {HA_PHOTO.laptop ? (
              <Img src={HA_PHOTO.laptop} style={{ width: "100%", height: "100%", objectFit: "contain", filter: theme.shadow.cutout }} />
            ) : (
              <div style={{ width: "100%", height: "70%", borderRadius: 10, background: "#111", boxShadow: "8px 12px 18px rgba(0,0,0,.2)" }} />
            )}
            {/* a faint blinking caret on the black screen until the Claude chip lands there */}
            {!(chipAt !== undefined && f >= chipAt + 6) ? (
              <div
                style={{
                  position: "absolute",
                  left: (LAPTOP_SCREEN.cx - 0.03) * g.lap.w,
                  top: (LAPTOP_SCREEN.cy + 0.04) * g.lap.h,
                  width: 0.05 * g.lap.w,
                  height: 4,
                  background: "rgba(255,255,255,.8)",
                  opacity: caret * (chipAt !== undefined ? 1 - io(f, chipAt, chipAt + 6) : 1),
                  transform: "rotate(-4deg)",
                }}
              />
            ) : null}
          </div>
        )}
        {/* the Claude chip on the black screen */}
        {!hideLaptop && !hideChip && chipAt !== undefined ? <PopChip cx={g.screen.x} cy={g.screen.y - 6} name="Claude" src={HA_LOGO.claude} r={CHIP_R} at={chipAt} /> : null}
      </div>
    </div>
  );
};

/** the chip's centre on a laptop (the hand-offs start from it) */
export const chipCentre = (cx: number) => {
  const g = rowGeom(cx);
  return { x: g.screen.x, y: g.screen.y - 6 };
};

/** the wire's travelling highlight: a small filled node riding left to right after the wire is drawn */
export const wirePulse = (f: number, from: number, x0: number, x1: number, period = 46) => {
  if (f < from) return null;
  const t = ((f - from) % period) / period;
  return { x: mix(x0, x1, EASE.travel(t)), o: Math.sin(Math.PI * t) };
};
