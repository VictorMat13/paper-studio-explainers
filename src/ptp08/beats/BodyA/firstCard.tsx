// BodyA's first card (A01a): the GitHub-on-Git stack card, the hand-off target of every hook (HA, HB, HC branch on
// bodyOf(variant) and draw <FirstCard t={0} /> full size on their last frame). Imports only the kit and ./assets.
//
// <FirstCard t={0} /> with no other props is EXACTLY BodyA's frame 0 (camera at identity, centre (540, 890) world px,
// i.e. before the shell's 0.9 pad, the same world px a hook's own Camera uses). For t > 0 the card only adds an ambient
// bob that starts from rest (so t = 0 is the rest pose); BodyA drives the rest of A01a (the ink puck riding the wire,
// the card lifting for A02a) through the optional props.
//
// Look (storyboard A01a, STYLE UPLIFT 2026-11-07): white paper card 880 x 560 with thickness, a soft inner edge and
// two sheets peeking right, on a stage: a larger warm paper sheet under it, turned -3 deg, with its own shadow. The
// GitHub chip (GitHub's own Invertocat, black, in the kit's white button) sits on top of the Git chip (the official
// orange Git diamond by Jason Long) with a short 7 px wire between them; lowercase labels 'github' / 'git' in Inter
// 800 beside them. Chips are r 92 here (bigger than the kit's r 44 default: on the first card they are the story).
import React from "react";
import { INTER, LogoChip, WirePath, mix, theme } from "../../../paperstudio";
import { LOGOS } from "./assets";

/** the card in world px; centre (540, 890) = the hand-off point */
export const FIRST_CARD = { x: 100, y: 610, w: 880, h: 560, cx: 540, cy: 890, sheets: 2 } as const;
/** the stage sheet under the card (world px, before its -3 deg turn about its centre) */
export const STAGE_SHEET = { x: 62, y: 572, w: 940, h: 640, rot: -3 } as const;
/** chip column, chip centres and radius, label column (world px) */
export const FC = {
  chipX: 318,
  githubY: 742,
  gitY: 1036,
  r: 92,
  labelX: 470,
  labelSize: 116,
} as const;

export type FirstCardProps = {
  /** body-local frame (0 = BodyA's frame 0); only drives the ambient bob, which starts from rest */
  t: number;
  /** extra transform on the whole card, origin the card centre (BodyA's A02a lift, hand-off flips) */
  tf?: string;
  opacity?: number;
  /** 0..1: an ink puck rides the wire from the Git chip up to the GitHub chip ("runs on"); undefined = none */
  flow?: number;
  /** 0..1 how far the labels have inked (1 = black, the rest look) */
  labelInk?: number;
  /** extra content over the card, world px */
  children?: React.ReactNode;
};

/** ambient bob, 0 at t = 0 and easing in over the first 20 frames so frame 0 is the rest pose */
const bob = (t: number, amp: number, period: number, phase: number) => {
  if (t <= 0) return 0;
  const ramp = Math.min(1, t / 20);
  return amp * ramp * Math.sin((t / period) * Math.PI * 2 + phase) - amp * ramp * Math.sin(phase);
};

export const FirstCard: React.FC<FirstCardProps> = ({ t, tf = "", opacity = 1, flow, labelInk = 1, children }) => {
  const C = FIRST_CARD;
  const gy = bob(t, 2.5, 74, 0.6);
  const ty = bob(t, 2.5, 82, 2.1);
  const wireTop = FC.githubY + gy;
  const wireBot = FC.gitY + ty;
  const puckY = flow === undefined ? null : mix(wireBot - FC.r + 4, wireTop + FC.r - 4, Math.max(0, Math.min(1, flow)));
  const puckO = flow === undefined ? 0 : Math.min(1, flow * 6) * Math.min(1, (1 - flow) * 6 + 0.0001);
  const label = (text: string, cy: number) => (
    <div
      style={{
        position: "absolute",
        left: FC.labelX,
        top: cy - FC.labelSize * 0.62,
        height: FC.labelSize * 1.24,
        display: "flex",
        alignItems: "center",
        fontFamily: INTER,
        fontWeight: 800,
        fontSize: FC.labelSize,
        letterSpacing: -3.5,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: theme.color.ink,
        opacity: mix(0.25, 1, labelInk),
      }}
    >
      {text}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${C.cx}px ${C.cy}px`, transform: tf, opacity }}>
      <StageSheet />
      <PaperCardFace />
      {/* the short wire between the two chips (behind them) */}
      <WirePath d={`M${FC.chipX} ${wireTop.toFixed(2)} L${FC.chipX} ${wireBot.toFixed(2)}`} />
      {puckY !== null && puckO > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: FC.chipX - 15,
            top: puckY - 15,
            width: 30,
            height: 30,
            borderRadius: 15,
            background: theme.color.ink,
            opacity: puckO,
            boxShadow: "4px 6px 6px rgba(0,0,0,.25)",
          }}
        />
      ) : null}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${gy.toFixed(2)}px)`, willChange: "transform" }}>
        <LogoChip cx={FC.chipX} cy={FC.githubY} name="GitHub" src={LOGOS.github} r={FC.r} label={false} />
        {label("github", FC.githubY)}
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${ty.toFixed(2)}px)`, willChange: "transform" }}>
        <LogoChip cx={FC.chipX} cy={FC.gitY} name="Git" src={LOGOS.git} r={FC.r} label={false} />
        {label("git", FC.gitY)}
      </div>
      {children}
    </div>
  );
};

/** the card body itself (PaperCard look, drawn here so FirstCard has no entrance state of its own) */
const PaperCardFace: React.FC = () => {
  const C = FIRST_CARD;
  return (
    <div style={{ position: "absolute", left: C.x, top: C.y, width: C.w, height: C.h }}>
      {Array.from({ length: C.sheets }, (_, k) => C.sheets - k).map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * 30,
            top: i * 10,
            width: C.w,
            height: C.h - i * 6,
            background: theme.color.sheet,
            borderRadius: theme.radius.card - 2,
            boxShadow: theme.shadow.sheet,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(150deg,#FFFFFF 0%,#FFFFFF 55%,#FBFAF8 100%)",
          borderRadius: theme.radius.card,
          boxShadow: `${theme.shadow.card},inset 0 0 0 1px rgba(0,0,0,.035),inset 0 -10px 22px rgba(0,0,0,.025),inset 0 2px 0 #fff`,
        }}
      />
    </div>
  );
};

/** the warm paper sheet the first card stands on (a stage, so the card never floats alone on the grid) */
export const StageSheet: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const S = STAGE_SHEET;
  return (
    <div
      style={{
        position: "absolute",
        left: S.x,
        top: S.y,
        width: S.w,
        height: S.h,
        transform: `rotate(${S.rot}deg)`,
        borderRadius: 10,
        background: "linear-gradient(160deg,#FBFAF7 0%,#F4F2EE 100%)",
        boxShadow: "2px 2px 0 #E3E1DD,10px 16px 28px rgba(0,0,0,.10),30px 46px 80px rgba(0,0,0,.06),inset 0 0 0 1px rgba(0,0,0,.025)",
        opacity,
      }}
    />
  );
};
