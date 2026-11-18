// ===========================================================================
// BodyB's first card (B01a) and the target every hook hands off into when the body is B (variants B, AB, CB and their
// YT cuts). Owner: BB. Pure component (no timing hooks):
//   <FirstCard t={0} />   draws the card exactly as BodyB frame 0 does (world px, identity camera, no ground, no caption)
// `t` is the body-local frame (0 = BodyB's first frame; negative is fine during a hook's hand-off). At t = 0:
//   - the Claude Code terminal (kit TerminalCard bezel, face from ./terminalPrompt) x 110, y 567, w 860, h 520, the
//     welcome box, an empty prompt with the white block cursor ON (it blinks 16 on / 14 off from t = 0)
//   - the Claude chip (kit LogoChip, r 44, no label) on the terminal's top-left corner (118, 575)
//   - the step strip: a white paper strip x 200-880, y 1117-1213, a 7 px wire, four hollow step nodes r 30 numbered
//     1 2 3 4 (all empty at t = 0)
// The group's centre is (540, 890). Import from a hook:  import { FirstCard } from "./BodyB/firstCard";
// The optional props are BodyB's own (typing, filled steps ...); a hook passes only `t`.
// ===========================================================================
import React from "react";
import { INTER, LogoChip, WirePath, mix, mixColor, prog, theme } from "../../../paperstudio";
import { EIO, PAPER_TEX } from "./paper";
import { TerminalPrompt, claudeMark, type ResultLine } from "./terminalPrompt";

export const FIRST_CARD = {
  centre: { x: 540, y: 890 },
  term: { x: 110, y: 567, w: 860, h: 520 },
  chip: { cx: 118, cy: 575, r: 44 },
  strip: { x: 200, y: 1117, w: 680, h: 96, wireY: 1165, nodes: [290, 453, 617, 780], r: 30, ring: 6, fs: 40 },
} as const;

// ------------------------------------------------------------- the step strip
export type StepStripProps = {
  /** strip box (default the first card's) */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /** node centres x (default the first card's four) */
  nodes?: readonly number[];
  /** 0..1 fill per step (0 hollow, 1 black disc with a white number) */
  fills?: readonly number[];
  /** extra scale per step (pulses) */
  pulse?: readonly number[];
  opacity?: number;
  /** transform on the whole strip (about its centre) */
  tf?: string;
};

/** the numbered paper strip: four hollow step nodes 1 2 3 4 on a 7 px wire, filling black as the routine moves on */
export const StepStrip: React.FC<StepStripProps> = ({
  x = FIRST_CARD.strip.x,
  y = FIRST_CARD.strip.y,
  w = FIRST_CARD.strip.w,
  h = FIRST_CARD.strip.h,
  nodes,
  fills = [0, 0, 0, 0],
  pulse = [1, 1, 1, 1],
  opacity = 1,
  tf,
}) => {
  const S = FIRST_CARD.strip;
  // node x relative to the strip (default: the first card's spacing, scaled to this strip's width)
  const xs = nodes ?? S.nodes.map((nx) => x + ((nx - S.x) / S.w) * w);
  const cy = y + h / 2;
  if (opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity, transform: tf, transformOrigin: `${x + w / 2}px ${cy}px` }}>
      {/* the paper strip: card face, hard edge, two-layer shadow */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          background: theme.color.paper,
          backgroundImage: PAPER_TEX,
          borderRadius: theme.radius.card,
          boxShadow: `${theme.shadow.card},inset 0 -6px 12px rgba(0,0,0,.035),inset 0 2px 0 rgba(255,255,255,.9)`,
        }}
      />
      <WirePath d={`M${xs[0]} ${cy} L${xs[xs.length - 1]} ${cy}`} />
      {xs.map((nx, i) => {
        const fl = Math.max(0, Math.min(1, fills[i] ?? 0));
        const k = pulse[i] ?? 1;
        const r = S.r;
        const ring = S.ring;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: nx - r,
              top: cy - r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: "50%",
              boxSizing: "border-box",
              border: `${ring}px solid ${theme.color.ink}`,
              background: mixColor("#F3F3F3", "#111111", fl),
              boxShadow: "6px 9px 8px rgba(0,0,0,.16),2px 3px 2px rgba(0,0,0,.08)",
              transform: k !== 1 ? `scale(${k.toFixed(4)})` : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: INTER,
              fontWeight: 800,
              fontSize: S.fs,
              letterSpacing: -1,
              lineHeight: 1,
              color: mixColor("#111111", "#FFFFFF", fl),
            }}
          >
            {i + 1}
          </div>
        );
      })}
    </div>
  );
};

/** fill progress of a step node that fills at frame `at` (8 frames, no overshoot); undefined = never */
export const stepFill = (f: number, at?: number) => (at === undefined ? 0 : prog(f, at, at + 14, EIO));
/** the small swell a step node does as it fills (smooth cosine bell, zero velocity at both ends) */
export const stepPulse = (f: number, at?: number) => (at === undefined || f < at ? 1 : 1 + 0.06 * (1 - Math.cos(2 * Math.PI * Math.min(1, (f - at) / 18))));

// ------------------------------------------------------------- the card
export type FirstCardProps = {
  /** body-local frame (0 = BodyB frame 0); drives the cursor blink */
  t: number;
  // ---- BodyB's own (a hook leaves these out) ----
  prompt?: string;
  typed?: number;
  submitAt?: number;
  history?: ResultLine[];
  welcome?: boolean;
  /** step fills 0..1 and pulses */
  fills?: readonly number[];
  pulse?: readonly number[];
  /** Claude chip offset (bob) */
  chipDy?: number;
  /** anything drawn on top (e.g. the chips that pop on the terminal's top edge) */
  children?: React.ReactNode;
  opacity?: number;
};

/** BodyB frame 0: the Claude Code terminal with the blinking cursor, the Claude chip, the 1 2 3 4 step strip */
export const FirstCard: React.FC<FirstCardProps> = ({ t, prompt = "", typed, submitAt, history, welcome = true, fills, pulse, chipDy = 0, children, opacity = 1 }) => {
  const G = FIRST_CARD;
  if (opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity }}>
      <StepStrip fills={fills} pulse={pulse} />
      <TerminalPrompt x={G.term.x} y={G.term.y} w={G.term.w} h={G.term.h} f={t} prompt={prompt} typed={typed} submitAt={submitAt} history={history} welcome={welcome} />
      <LogoChip cx={G.chip.cx} cy={G.chip.cy + chipDy} name="Claude" src={claudeMark()} r={G.chip.r} label={false} />
      {children}
    </div>
  );
};

/** the Claude chip's gentle bob (0 at t = 0, so frame 0 is exact) */
export const chipBob = (t: number) => 3 * Math.sin((t / 64) * Math.PI * 2) * mix(0, 1, Math.min(1, Math.max(0, t / 12)));
