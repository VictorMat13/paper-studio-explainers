import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, INTER, prog, theme } from "./theme";
import { Exit, enterState } from "./motion";
import { CONDENSED, reveal } from "./kit05";

// ------------------------------------------------------------- StackedCaps
export type CapsLine = { t: string; at: number; size?: number };
export type StackedCapsProps = {
  /** one line per word (uppercased), each landing on its own frame */
  lines: CapsLine[];
  /** block box: x, top y, width (align inside it) */
  x: number;
  y: number;
  w?: number;
  align?: "left" | "right" | "center";
  /** cap height driver: font size in px (default 124) */
  size?: number;
  /** line pitch as a fraction of the size (default 0.94) */
  lead?: number;
  /** a small lead-in word above the stack ("This"), sentence case */
  kicker?: { t: string; at: number; size?: number };
  /** font (default Roboto Condensed 800); pass INTER for Inter Black squeezed */
  font?: string;
  weight?: number;
  /** horizontal squeeze applied to the glyphs (default 1; use about 0.86 with Inter to fake condensed) */
  squeeze?: number;
  letterSpacing?: number;
  settle?: number;
  exit?: Exit;
  opacity?: number;
};

/**
 * Bold condensed upright caps, one word per line, each line landing on its word: grey, a little low and blurred,
 * settling to black (the KineticCaption reveal). Left, right or centre aligned block. Lines never move sideways.
 */
export const StackedCaps: React.FC<StackedCapsProps> = ({
  lines,
  x,
  y,
  w = 880,
  align = "center",
  size = 124,
  lead = 0.94,
  kicker,
  font = CONDENSED,
  weight = 800,
  squeeze = 1,
  letterSpacing = -1,
  settle = theme.caption.settle,
  exit,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, undefined, exit);
  if (e.o * opacity <= 0.001) return null;
  const origin = align === "left" ? "0% 50%" : align === "right" ? "100% 50%" : "50% 50%";
  const ks = kicker?.size ?? Math.round(size * 0.42);
  let top = 0;
  const rows: React.ReactNode[] = [];
  if (kicker) {
    const r = reveal(f, kicker.at, { settle });
    if (f >= kicker.at)
      rows.push(
        <div key="k" style={{ position: "absolute", left: 0, top, width: w, textAlign: align, fontFamily: INTER, fontWeight: 600, fontSize: ks, lineHeight: 1.1, letterSpacing: -0.5 }}>
          <span style={{ display: "inline-block", ...r.style }}>{kicker.t}</span>
        </div>,
      );
    top += ks * 1.12;
  }
  lines.forEach((l, i) => {
    const sz = l.size ?? size;
    const r = reveal(f, l.at, { settle, rise: 10, blur: 7 });
    if (f >= l.at)
      rows.push(
        <div key={i} style={{ position: "absolute", left: 0, top, width: w, textAlign: align, whiteSpace: "nowrap" }}>
          <span
            style={{
              display: "inline-block",
              fontFamily: font,
              fontWeight: weight,
              fontSize: sz,
              lineHeight: 1,
              letterSpacing,
              textTransform: "uppercase",
              transformOrigin: origin,
              ...r.style,
              transform: `${r.style.transform}${squeeze !== 1 ? ` scaleX(${squeeze})` : ""}`,
            }}
          >
            {l.t}
          </span>
        </div>,
      );
    top += sz * lead;
  });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: top, opacity: e.o * opacity, transform: e.transform, transformOrigin: "50% 50%" }}>{rows}</div>
  );
};

// ------------------------------------------------------------- SideCaption
export type SideLine = {
  t: string;
  /** frame the line's first word appears */
  at: number;
  /** frames between its words (default 3) */
  step?: number;
  /** reg (default), bold (bigger, 800), bar (white on a black bar wiping in) */
  s?: "reg" | "bold" | "bar";
};
export type SideCaptionProps = {
  x: number;
  y: number;
  w?: number;
  align?: "left" | "right" | "center";
  lines: SideLine[];
  /** regular size (default 46; never below 34) */
  size?: number;
  /** bold and bar size (default 1.3x) */
  boldSize?: number;
  lineGap?: number;
  exit?: Exit;
  opacity?: number;
};

/**
 * A small multi-line caption block that types in beside an object (the reference hook's "just released / his
 * entire / claude code / setup / for free" block): words appear one by one on their frames with the house reveal,
 * the block layout is fixed from the start so nothing shifts, the last line can be bold or sit in a black bar.
 */
export const SideCaption: React.FC<SideCaptionProps> = ({ x, y, w = 320, align = "center", lines, size = 46, boldSize, lineGap = 4, exit, opacity = 1 }) => {
  const f = useCurrentFrame();
  const e = enterState(f, undefined, exit);
  if (e.o * opacity <= 0.001) return null;
  const big = boldSize ?? Math.round(size * 1.3);
  let top = 0;
  const just = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: e.o * opacity, transform: e.transform, fontFamily: INTER }}>
      {lines.map((l, i) => {
        const s = l.s ?? "reg";
        const fs = s === "reg" ? size : big;
        const lh = fs * 1.16 + (s === "bar" ? 14 : 0);
        const t = top;
        top += lh + lineGap;
        const ws = l.t.split(" ").filter(Boolean);
        const step = l.step ?? 3;
        const b = prog(f, l.at, l.at + 10, EASE.travel);
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: t, width: w, height: lh, display: "flex", justifyContent: just, alignItems: "center" }}>
            <span style={{ position: "relative", display: "inline-flex", whiteSpace: "nowrap", padding: s === "bar" ? "3px 16px 6px" : 0 }}>
              {s === "bar" && f >= l.at ? (
                <span style={{ position: "absolute", inset: 0, background: theme.color.ink, borderRadius: 5, transform: `scaleX(${b.toFixed(4)})`, transformOrigin: "left center" }} />
              ) : null}
              {ws.map((wd, j) => {
                const r = reveal(f, l.at + j * step, { settle: 8, rise: 5, blur: 4, ink: s === "bar" ? "#ffffff" : theme.color.ink, ghost: s === "bar" ? "#8A8A8A" : theme.color.ghost });
                return (
                  <span
                    key={j}
                    style={{
                      position: "relative",
                      display: "inline-block",
                      marginLeft: j ? fs * 0.26 : 0,
                      fontSize: fs,
                      fontWeight: s === "reg" ? 500 : 800,
                      letterSpacing: s === "reg" ? -0.4 : -1,
                      lineHeight: 1.12,
                      ...(f >= l.at + j * step ? r.style : { opacity: 0 }),
                    }}
                  >
                    {wd}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};
