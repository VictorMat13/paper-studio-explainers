import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { EASE, INTER, LOGO, MARK, mix, prog, theme } from "./theme";
import { WirePath } from "./Wire";

/**
 * A physical button: white disc with a thick rim (about 11% of the diameter), the official logo on an inner
 * disc with a faint inner highlight, a soft shadow down-right. Names without a logo file show their mark
 * letters (AI, $0). `dark` = black face with white letters; `grey` = desaturated, inverted logo on grey.
 */
export const LogoDisc: React.FC<{ name: string; r: number; dark?: boolean; grey?: boolean; fs?: number; src?: string }> = ({ name, r, dark, grey, fs, src }) => {
  const rim = Math.round(r * 0.22);
  const inner = dark ? "#111" : grey ? "#9C9C9C" : "#fff";
  const col = dark || grey ? "#fff" : "#111";
  const logo = src ?? LOGO[name];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: `0 0 0 1px rgba(0,0,0,.05),${Math.round(r * 0.22)}px ${Math.round(r * 0.32)}px ${Math.round(r * 0.6)}px rgba(0,0,0,.20),${Math.round(r * 0.06)}px ${Math.round(
          r * 0.08,
        )}px ${Math.round(r * 0.12)}px rgba(0,0,0,.10),inset 0 2px 0 #fff,inset 0 -3px 5px rgba(0,0,0,.05)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: rim,
          borderRadius: "50%",
          background: inner,
          boxShadow: "inset 0 2px 4px rgba(0,0,0,.10),inset 0 -2px 2px rgba(255,255,255,.7)",
          overflow: "hidden",
        }}
      >
        {logo && !dark ? (
          <Img
            src={logo}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              // the logo fills about 58% of the button, like the reference chips; the JCode halftone donut has its
              // own empty margin, so it gets almost no padding or it reads as a small dark bead
              padding: Math.round(r * (/jcode/i.test(String(logo)) ? 0.02 : 0.2)),
              boxSizing: "border-box",
              objectFit: "contain",
              filter: grey ? "grayscale(1) invert(1) brightness(1.2)" : undefined,
            }}
          />
        ) : (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: INTER,
              fontSize: fs ?? r * 0.6,
              fontWeight: 800,
              letterSpacing: -1,
              color: col,
            }}
          >
            {MARK[name] ?? name}
          </span>
        )}
      </div>
    </div>
  );
};

/** pop progress: scale 0.6 -> 1 with no overshoot, quick fade */
const popAt = (f: number, at: number | undefined, dur = 9) => (at === undefined ? 1 : prog(f, at, at + dur, EASE.pop));

export type LogoChipProps = {
  cx: number;
  cy: number;
  name: string;
  r?: number;
  /** label under the chip: default the name in lowercase; false hides it */
  label?: string | false;
  labelSize?: number;
  dark?: boolean;
  grey?: boolean;
  fs?: number;
  src?: string;
  /** frame the chip pops in (undefined = already there) */
  at?: number;
  opacity?: number;
};

/** A logo chip with its lowercase label below; pops in with a gentle, overshoot-free ease. */
export const LogoChip: React.FC<LogoChipProps> = ({ cx, cy, name, r = 44, label, labelSize = 36, dark, grey, fs, src, at, opacity = 1 }) => {
  const f = useCurrentFrame();
  const p = popAt(f, at);
  if (p <= 0 || opacity <= 0) return null;
  const s = mix(0.6, 1, p);
  const lp = at === undefined ? 1 : prog(f, at + 3, at + 3 + 7);
  const text = label === false ? null : (label ?? name).toLowerCase();
  return (
    <>
      <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, transform: `scale(${s.toFixed(4)})`, opacity: Math.min(1, p * 2) * opacity }}>
        <LogoDisc name={name} r={r} dark={dark} grey={grey} fs={fs} src={src} />
      </div>
      {text ? (
        <div
          style={{
            position: "absolute",
            left: cx - 130,
            top: cy + r + 18 + (1 - lp) * 5,
            width: 260,
            textAlign: "center",
            fontFamily: INTER,
            fontSize: labelSize,
            fontWeight: 400,
            color: theme.color.label,
            letterSpacing: -0.3,
            lineHeight: 1.1,
            opacity: lp * opacity,
          }}
        >
          {text}
        </div>
      ) : null}
    </>
  );
};

/** Inline chip for captions and rows (no label). Give KineticCaption words that hold one `w: 2 * r`. */
export const InlineChip: React.FC<{ name: string; r?: number; ghost?: boolean; dark?: boolean; grey?: boolean }> = ({ name, r = 32, ghost, dark, grey }) => (
  <span style={{ display: "inline-block", position: "relative", width: 2 * r, height: 2 * r, verticalAlign: "middle", opacity: ghost ? 0.3 : 1 }}>
    <LogoDisc name={name} r={r} dark={dark} grey={grey} />
  </span>
);

/**
 * Logo chips popping onto a thin black line that casts its own shadow (the reference's opening move).
 * The line draws from x0 to x1 starting at `lineAt`; each chip pops at its own `at`.
 */
export const LogoChipLine: React.FC<{
  y: number;
  x0?: number;
  x1?: number;
  chips: { name: string; x: number; at?: number; label?: string | false; dark?: boolean; grey?: boolean }[];
  r?: number;
  lineAt?: number;
  lineDur?: number;
  lineWidth?: number;
  opacity?: number;
}> = ({ y, x0 = -40, x1 = 1120, chips, r = 44, lineAt, lineDur = 12, lineWidth = 4, opacity = 1 }) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    <WirePath d={`M${x0} ${y} L${x1} ${y}`} w={lineWidth} at={lineAt} dur={lineDur} />
    {chips.map((c, i) => (
      <LogoChip key={i} cx={c.x} cy={y} name={c.name} r={r} at={c.at} label={c.label} dark={c.dark} grey={c.grey} />
    ))}
  </div>
);
