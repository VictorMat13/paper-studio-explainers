import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { EASE, PHOTO, prog, theme } from "./theme";
import { drift as driftAt } from "./motion";
import { WireNode, WirePath } from "./Wire";

export type CutoutProps = {
  /** "human" | "robot" picks the bundled hand photo; or pass `src` */
  kind?: "human" | "robot";
  src?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** edge it slides in from */
  from?: "left" | "right" | "top" | "bottom";
  /** frame the slide starts (undefined = already in place) */
  at?: number;
  dur?: number;
  /** slide distance (default 620 px, enough to start off frame) */
  dist?: number;
  /** ambient drift amplitude in px (default 0) */
  drift?: number;
  rotate?: number;
  opacity?: number;
};

/**
 * Photoreal cut-out floating a little above the paper: hairline white edge, a tight contact shadow and a wide soft
 * shadow falling down-right. No blob shadow underneath. Slides in from a frame edge without fading.
 */
export const Cutout: React.FC<CutoutProps> = ({ kind = "human", src, x, y, w, h, from = "left", at, dur = 16, dist = 620, drift = 0, rotate = 0, opacity = 1 }) => {
  const f = useCurrentFrame();
  const p = at === undefined ? 1 : prog(f, at, at + dur, EASE.enter);
  const r = (1 - p) * dist;
  const dx = from === "left" ? -r : from === "right" ? r : 0;
  const dy = from === "top" ? -r : from === "bottom" ? r : 0;
  const d = drift ? driftAt(f, drift, 110, kind === "robot" ? 3 : 0) : { x: 0, y: 0 };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        filter: theme.shadow.cutout,
        transform: `translate(${(dx + d.x).toFixed(2)}px,${(dy + d.y).toFixed(2)}px) rotate(${rotate}deg)`,
        opacity,
      }}
    >
      <Img src={src ?? PHOTO[kind]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

/**
 * The reference layout: the human hand enters from the left, the robot hand from the right, arms bleeding off
 * the frame edges, fingertips almost touching near the centre; the 7 px bracket line draws node to node between
 * them. `dy` shifts the whole scene; wrap it in your own transform to scale it down.
 */
export const HandsScene: React.FC<{
  dy?: number;
  /** frame the hands start sliding in (undefined = in place) */
  at?: number;
  /** frame the bracket starts drawing (undefined = drawn; null = no bracket) */
  bracketAt?: number | null;
  bracketDur?: number;
  /** ambient drift in px (hands move apart and back a little) */
  drift?: number;
}> = ({ dy = 0, at, bracketAt, bracketDur = 18, drift = 3 }) => {
  const showBracket = bracketAt !== null;
  const bAt = bracketAt ?? undefined;
  return (
    <>
      <Cutout kind="human" x={-180} y={380 + dy} w={700} h={615} from="left" at={at} drift={drift} />
      <Cutout kind="robot" x={600} y={340 + dy} w={748} h={615} from="right" at={at === undefined ? undefined : at + 3} drift={drift} />
      {showBracket ? (
        <>
          <WireNode cx={470} cy={330 + dy} at={bAt} />
          <WirePath d={`M470 ${330 + dy} L560 ${330 + dy} L560 ${900 + dy} L650 ${900 + dy}`} w={7} at={bAt === undefined ? undefined : bAt + 2} dur={bracketDur} />
          <WireNode cx={470} cy={330 + dy} at={bAt} />
          <WireNode cx={650} cy={900 + dy} at={bAt === undefined ? undefined : bAt + bracketDur} />
        </>
      ) : null}
    </>
  );
};
