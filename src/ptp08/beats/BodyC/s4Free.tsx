// Scene 4, FREE: C09a (one kit Camera).
//   .1 'It's free': a white paper GitHub card (the slab on it, 'github' in mono) is already in at the cut; a big 'free'
//      ink pill stamps onto the card's right half (scale 1.4 -> 1, a small turn, the card dips).
//   .2 'two hundred and twenty-five million': a 156 px black '225M+' stamps in under the card on 'two' (scale 1.3 -> 1,
//      no in-between values: only the verified figure is ever on screen) and pulses once on 'million'.
//   .3 'developers work this way': robot sprites fill a 6 x 2 grid under the counter in a smooth wave (one by one across the
//      line), a GitHub chip lands at the end of the bottom row with a tiny blip; the camera pulls back to 0.9.
// The counter stands in for the spoken number in the captions (the caption pages skip those words and show the rest).
import React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, INTER, LogoChip, PaperCard, camPath, mix, prog, theme, zoomAt } from "../../../paperstudio";
import type { BC } from "./cues";
import { LOGOS } from "./assets";
import { InkPill } from "./firstCard";
import { BackSheets, GithubSlab, Place } from "./objects";
import { capLayout, Pages, Robot, SMOOTH, sway, swell, wsFrom, type CapBlock } from "./parts";
import { CAP_TOP } from "./s1Laptop";

const CARD = { x: 100, y: 530, w: 880, h: 320 };
const COUNTER = { cx: 540, top: 878, size: 156 };
const GRID = { x: 60, y: 1036, w: 840, h: 280, cols: 6, rows: 2 };
const CHIP = { cx: 952, cy: 1236 };

export const FreeScene: React.FC<{ c: BC }> = ({ c }) => {
  const f = useCurrentFrame();
  const S = c.s;
  const s0 = S.C09a.start;
  const k = {
    free: c.at("C09a", "free"),
    two: c.at("C09a", "two"),
    million: c.at("C09a", "million"),
    developers: c.at("C09a", "developers"),
    way: c.at("C09a", "way"),
  };
  const cardIn = prog(f, s0 - 8, s0 + 10, SMOOTH);
  const stamp = prog(f, k.free - 2, k.free + 12, SMOOTH);
  const dip = swell(f, k.free + 3, 14);
  const cntIn = prog(f, k.two - 2, k.two + 12, SMOOTH);
  const pulse = swell(f, k.million + 6, 14);
  const gridFrom = Math.min(k.million - 2, k.two + 16);
  const gridTo = Math.max(gridFrom + 16, k.way + 2);
  const n = GRID.cols * GRID.rows;
  const starts = Array.from({ length: n }, (_, i) => mix(gridFrom, gridTo, i / (n - 1)));
  const chipAt = gridTo + 3;
  const chipP = prog(f, chipAt, chipAt + 14, SMOOTH);

  const keys = camPath({ f: s0, ...zoomAt({ x: 540, y: 680 }, 1.04) })
    .push(k.two - 4, 0.015)
    .to(k.two - 3, { x: 540, y: 790, zoom: 1.0 }, 22)
    .push(k.developers - 4, 0.035)
    .to(k.developers - 3, { x: 540, y: 830, zoom: 0.92 }, 22)
    .push(S.C09a.end + 10, 0.024).keys;

  const w9 = c.ws("C09a");
  const top = (lines: ReturnType<typeof capLayout>): CapBlock => ({ lines, y: CAP_TOP, anchor: "top", w: 980 });
  const pages: CapBlock[][] = [
    [top(capLayout(w9, "It's *free,* / and over"))],
    [top(capLayout(wsFrom(w9, "developers"), "*developers* / work this way."))],
  ];

  return (
    <Camera keys={keys} blur={false} hud={<Pages pages={pages} until={S.C09a.end - 6} />}>
      <BackSheets f={f} layout={1} />
      {/* the GitHub card */}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(260 * (1 - cardIn) + 6 * dip).toFixed(2)}px)`, opacity: Math.min(1, cardIn * 2) }}>
        <PaperCard x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} sheets={1} />
        <Place cx={CARD.x + 190} cy={CARD.y + CARD.h / 2 + sway(f, 1.5, 70, 2)}>
          <GithubSlab w={240} />
        </Place>
        <InkPill cx={CARD.x + 590} cy={CARD.y + CARD.h / 2 + 12} text="free" fs={128} p={stamp} scale={mix(1.35, 1, stamp)} rot={-4 + 3 * (1 - stamp)} />
      </div>
      {/* the counter */}
      {cntIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: COUNTER.cx - 420,
            width: 840,
            top: COUNTER.top,
            textAlign: "center",
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: COUNTER.size,
            letterSpacing: -COUNTER.size * 0.04,
            lineHeight: 1,
            color: theme.color.ink,
            opacity: Math.min(1, cntIn * 2),
            willChange: "transform",
            transform: `translateY(${(10 * (1 - cntIn)).toFixed(3)}px) scale(${(mix(1.3, 1, cntIn) * (1 + 0.06 * pulse)).toFixed(4)})`,
            transformOrigin: "50% 50%",
            fontVariantNumeric: "tabular-nums",
            textShadow: "3px 5px 0 rgba(0,0,0,.06)",
          }}
        >
          225M+
        </div>
      ) : null}
      {/* the developers: a smooth wave of robot sprites (each rises 30 px and fades in over 14 frames, ease in-out,
          staggered across the line; then a slow bob with its own phase and a blink) */}
      {starts.map((st, i) => {
        const col = i % GRID.cols;
        const row = Math.floor(i / GRID.cols);
        const cw = GRID.w / GRID.cols;
        const ch = GRID.h / GRID.rows;
        const p = prog(f, st, st + 14, SMOOTH);
        if (p <= 0.001) return null;
        return (
          <Robot
            key={i}
            cx={GRID.x + cw * (col + 0.5)}
            bottom={GRID.y + ch * (row + 1) - 6}
            h={ch * 0.92 * mix(0.88, 1, p)}
            dy={30 * (1 - p) + sway(f, 2.5, 70 + 6 * i, i * 1.7) * p}
            tilt={sway(f, 1.5, 84 + 5 * i, i * 2.3) * p}
            opacity={p}
            blink={swell(f, st + 30 + 7 * i, 14)}
          />
        );
      })}
      {/* the GitHub chip at the end of the bottom row */}
      {chipP > 0 ? (
        <Place cx={CHIP.cx} cy={CHIP.cy} p={chipP} k={1 + 0.1 * swell(f, chipAt + 6, 14)}>
          <div style={{ position: "absolute", left: 0, top: 0 }}>
            <LogoChip cx={0} cy={0} name="GitHub" src={LOGOS.github} r={56} label={false} />
          </div>
        </Place>
      ) : null}
    </Camera>
  );
};
