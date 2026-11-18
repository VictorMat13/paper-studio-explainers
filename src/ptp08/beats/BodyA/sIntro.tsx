// A01a-A03a: the first card (GitHub on Git), the robot row (almost every developer), then the card and the row slide
// off left under the text-only "Here's how it works.". World px.
import React from "react";
import { EASE, PaperCard, mix, prog } from "../../../paperstudio";
import { SmoothCaption, smoothCaptionHeight } from "../Shared/smoothCaption";
import { PRE } from "./captions";
import { PAN } from "./sLaptop";
import type { Cues } from "./cues";
import { FIRST_CARD, FirstCard } from "./firstCard";
import { RobotSprite } from "./objects";
import { Sheets } from "./depth";
import { pulse, SM } from "./util";

export const introCues = (c: Cues) => {
  const s1 = c.s.A01a.start;
  const runs = c.at("A01a", /^runs$/, 8);
  const git = c.at("A01a", /^git$/, 24);
  const a2 = c.s.A02a.start;
  const words2 = c.w.A02a.map((w) => w.f);
  const almost = c.at("A02a", /^almost$/, 40);
  const a3 = c.s.A03a.start;
  const end = c.s.A03a.end;
  const words3 = c.w.A03a;
  const here = words3[0]?.f ?? a3 + 6;
  return { s1, runs, git, a2, words2, almost, a3, end, words3, here, a4: c.s.A04a.start };
};
export type IntroCues = ReturnType<typeof introCues>;

/** the A02a -> A03a move (the card and robots leave left as the text card comes in from the right), timed so the card's
 *  left part (where "Here's" is written) slides into the frame as the word eases in */
export const conveyIn = (f: number, q: IntroCues) => prog(f, q.here - 12, q.here + 14, EASE.cam);
/** the A03a -> A04a move (the text card leaves left as the folder card comes in from the right) */
export const conveyOut = (f: number, q: IntroCues) => prog(f, q.a4 - 10, q.a4 + 16, EASE.cam);

/** the A02a layout (coordinator fix round): the card lifts and shrinks to the top of the visual, a 4 x 2 grid of 220 px
 *  robots fills the lower half, one per spoken word */
export const ROW = { cardS: 0.42, cardY: 714, x0: 70, x1: 1010, y0: 840, rowH: 240, cols: 4, robotH: 220 } as const;
/** camera pose for the robot grid */
export const ROW_CAM = { x: 540, y: 800, zoom: 1.0 } as const;
/** pop frame of robot k: one per spoken word of A02a (eight robots; evenly spread if the voice has fewer words) */
const robotStarts = (q: IntroCues) => {
  const ws = q.words2;
  if (ws.length >= 8) return ws.slice(0, 8);
  const a = ws[0] ?? q.a2 + 4;
  const b = ws[ws.length - 1] ?? a + 40;
  return Array.from({ length: 8 }, (_, k) => Math.round(a + ((b - a) * k) / 7));
};

export const IntroScene: React.FC<{ f: number; q: IntroCues }> = ({ f, q }) => {
  if (f >= q.end + 30) return null;
  // A03a (RED TEAM RT-A-2): the text card arrives from the right in the same move that takes the card and robots off
  // left, carrying "Here's how it works." (each word eases in on its spoken word, 3 frames early); it holds, and leaves
  // left in one pan as the folder card comes in from the right (sCommit), so the frame is never a blank card
  const conv = conveyIn(f, q);
  const convOut = conveyOut(f, q);
  const words = q.words3;
  const line1 = words.slice(0, 2);
  const line2 = words.slice(2);
  const tok = (w: { w: string; f: number }) => ({ t: w.w.replace(/[.,!?]+$/, ""), s: "big" as const, at: w.f - PRE });
  const textLines = [line1.map(tok), line2.map(tok)].filter((l) => l.length);
  const hh = smoothCaptionHeight(textLines, 4, 1.5);
  const textStage =
    conv > 0.001 && convOut < 0.999 ? (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transform: `translate(${(PAN * (1 - conv) - PAN * convOut + 4 * Math.sin((f - q.a3) / 37)).toFixed(2)}px, ${(3 * Math.sin((f - q.a3) / 29)).toFixed(2)}px) rotate(${(-1.5 + 0.4 * Math.sin((f - q.a3) / 53)).toFixed(3)}deg)`,
          transformOrigin: "540px 760px",
          willChange: "transform",
        }}
      >
        <PaperCard x={90} y={540} w={900} h={440} sheets={2} />
        <SmoothCaption lines={textLines} x={90} w={900} y={760 - hh / 2} scale={1.5} lineGap={4} />
      </div>
    ) : null;
  if (f >= q.end + 2) return <>{textStage}</>;
  // the card lifts for the row (A02a), everything slides off left for A03a
  const lift = prog(f, q.a2 - 3, q.a2 + 15, EASE.cam);
  const off = conveyIn(f, q);
  const offX = -PAN * off;
  const k = mix(1, ROW.cardS, lift);
  const dy = mix(0, ROW.cardY - FIRST_CARD.cy, lift);
  const flow = f < q.runs - 2 ? undefined : prog(f, q.runs - 2, q.git + 8, EASE.travel);
  const starts = robotStarts(q);
  const cellW = (ROW.x1 - ROW.x0) / ROW.cols;
  return (
    <>
    {textStage}
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translateX(${offX.toFixed(1)}px)` }}>
      {lift > 0.001 ? <Sheets f={f} sheets={[{ x: -60, y: 826, w: 1200, h: 520, rot: 1.2, tone: 1 }]} dy={620 * (1 - lift)} /> : null}
      <FirstCard t={f} flow={flow !== undefined && flow < 1 ? flow : undefined} tf={`translateY(${dy.toFixed(2)}px) scale(${k.toFixed(4)})`} />
      {starts.map((st, i) => {
        const p = prog(f, st, st + 12, SM);
        if (p <= 0.001) return null;
        const col = i % ROW.cols;
        const row = Math.floor(i / ROW.cols);
        const bob = 2.5 * Math.sin(((f - st) / (62 + (i % 5) * 7)) * Math.PI * 2);
        // every robot blinks once in a while and turns its head toward the card
        const blink = pulse(f, st + 14 + ((i * 23) % 37), 9) + pulse(f, st + 58 + ((i * 31) % 29), 9);
        const tilt = -2.5 * prog(f, st + 6, st + 20, EASE.cam) * (col < 3 ? -1 : 1);
        return <RobotSprite key={i} cx={ROW.x0 + (col + 0.5) * cellW} by={ROW.y0 + (row + 1) * ROW.rowH - 20} h={ROW.robotH} p={p} bob={bob} blink={Math.min(1, blink)} tilt={tilt} />;
      })}
    </div>
    </>
  );
};
