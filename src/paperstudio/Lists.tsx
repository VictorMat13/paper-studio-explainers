import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, INTER, mix, mixColor, prog, theme } from "./theme";
import { CapWord, KineticCaption } from "./KineticCaption";
import { InlineChip } from "./LogoChip";

export type IconKind = "prompt" | "tools" | "memory" | "sessions" | "folder";

/** The four solid black list icons (+ folder), drawn on a 48 grid. */
export const Icon: React.FC<{ kind: IconKind; x: number; y: number; s?: number; color?: string; scale?: number; opacity?: number }> = ({
  kind,
  x,
  y,
  s = 48,
  color = theme.color.ink,
  scale = 1,
  opacity = 1,
}) => {
  const c = color;
  const body: Record<IconKind, React.ReactNode> = {
    prompt: (
      <>
        <rect x="4" y="8" width="40" height="28" rx="8" fill={c} />
        <path d="M14 36 L14 44 L24 36" fill={c} />
        <rect x="21" y="16" width="6" height="12" fill="#fff" />
        <rect x="18" y="19" width="12" height="6" fill="#fff" />
      </>
    ),
    tools: (
      <>
        <path d="M8 40 L26 22 M26 22 L34 14 A8 8 0 1 1 38 18 L30 26" stroke={c} strokeWidth="7" strokeLinecap="round" fill="none" />
        <rect x="4" y="34" width="12" height="12" rx="3" transform="rotate(-45 10 40)" fill={c} />
      </>
    ),
    memory: (
      <>
        <path d="M24 6 C10 6 6 16 8 24 C4 30 8 40 18 40 L20 46 L30 46 L30 40 C40 40 44 30 40 24 C42 16 38 6 24 6 Z" fill={c} />
        <path d="M18 20 L30 20 M18 28 L28 28" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    sessions: (
      <>
        <rect x="4" y="6" width="24" height="18" rx="4" fill={c} />
        <rect x="14" y="16" width="24" height="18" rx="4" fill="#fff" stroke={c} strokeWidth="4" />
        <rect x="24" y="26" width="20" height="16" rx="4" fill={c} />
      </>
    ),
    folder: <path d="M4 12 L18 12 L22 18 L44 18 L44 40 L4 40 Z" fill={c} />,
  };
  return (
    <svg
      style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: "center", opacity, overflow: "visible", filter: "drop-shadow(3px 5px 4px rgba(0,0,0,.14))" }}
      width={s}
      height={s}
      viewBox="0 0 48 48"
    >
      {body[kind]}
    </svg>
  );
};

/** settle progress for text that lands like a caption word */
const landing = (f: number, at: number) => prog(f, at, at + theme.caption.settle, EASE.enter);

/** One icon row per beat: the icon pops, the bold label lands grey to black. */
export const IconList: React.FC<{
  x: number;
  y: number;
  rows: { icon: IconKind; text: string; at: number }[];
  rowH?: number;
  fs?: number;
  /** scroll the list up by this many px (S16: the list scrolls off the top) */
  scroll?: number;
}> = ({ x, y, rows, rowH = 80, fs = 44, scroll = 0 }) => {
  const f = useCurrentFrame();
  return (
    <>
      {rows.map((r, i) => {
        if (f < r.at) return null;
        const pop = prog(f, r.at, r.at + 8, EASE.pop);
        const p = landing(f, r.at + 1);
        const ry = y + i * rowH - scroll;
        return (
          <React.Fragment key={i}>
            <Icon kind={r.icon} x={x} y={ry + 2} scale={mix(0.5, 1, pop)} opacity={Math.min(1, pop * 2)} />
            <div
              style={{
                position: "absolute",
                left: x + 72,
                top: ry,
                fontFamily: INTER,
                fontSize: fs,
                fontWeight: 700,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                color: mixColor(theme.color.ghost, theme.color.ink, p),
                transform: `translate(${(4 * (1 - p)).toFixed(2)}px,${(5 * (1 - p)).toFixed(2)}px)`,
                filter: p < 0.98 ? `blur(${(2 * (1 - p)).toFixed(2)}px)` : undefined,
              }}
            >
              {r.text}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

/** Four-point sparkle star. */
export const Sparkle: React.FC<{ x: number; y: number; s?: number; scale?: number; rotate?: number; opacity?: number }> = ({ x, y, s = 44, scale = 1, rotate = 0, opacity = 1 }) => (
  <svg
    style={{ position: "absolute", left: x, top: y, transform: `scale(${scale}) rotate(${rotate}deg)`, transformOrigin: "center", opacity, filter: "drop-shadow(3px 5px 4px rgba(0,0,0,.14))" }}
    width={s}
    height={s}
    viewBox="0 0 44 44"
  >
    <path d="M22 0 C24 14 30 20 44 22 C30 24 24 30 22 44 C20 30 14 24 0 22 C14 20 20 14 22 0 Z" fill={theme.color.ink} />
  </svg>
);

/**
 * Sparkle bullets: the star pops (with a quarter turn) at the row's first word, words land like captions.
 * A row is one line (CapWord[]) or several lines (CapWord[][]) that wrap under the first, indented past the star.
 */
export const SparkleList: React.FC<{ x: number; y: number; rows: (CapWord[] | CapWord[][])[]; rowH?: number; lineH?: number }> = ({ x, y, rows, rowH = 80, lineH = 70 }) => {
  const f = useCurrentFrame();
  let cursor = y;
  return (
    <>
      {rows.map((row, i) => {
        const lines = (Array.isArray(row[0]) ? row : [row]) as CapWord[][];
        const ry = cursor;
        cursor += rowH + (lines.length - 1) * lineH;
        const at = Math.min(...lines.flat().map((w) => w.at));
        if (f < at) return null;
        const pop = prog(f, at, at + 9, EASE.pop);
        return (
          <React.Fragment key={i}>
            <Sparkle x={x} y={ry + 4} scale={mix(0.3, 1, pop)} rotate={mix(-90, 0, pop)} opacity={Math.min(1, pop * 2)} />
            {lines.map((ln, j) => (
              <KineticCaption key={j} lines={[ln]} y={ry - 10 + j * lineH} x={x + 68} w={1015 - x - 68} align="left" lineGap={0} />
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
};

/**
 * A stat row: a counter that ticks up to the value, a bold label, a logo chip at the end.
 * e.g. <StatRow y={680} value={20} suffix="x" label="less memory than" chip="Claude" at={0} />
 */
export const StatRow: React.FC<{
  y: number;
  x?: number;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: React.ReactNode;
  chip?: string;
  /** frame the counter starts */
  at: number;
  countDur?: number;
  /** frame the label lands (default at + 4) */
  labelAt?: number;
  /** frame the chip pops (default at + countDur) */
  chipAt?: number;
  numWidth?: number;
}> = ({ y, x = 140, value, decimals = 0, prefix = "", suffix = "", label, chip, at, countDur = 18, labelAt, chipAt, numWidth = 170 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const c = prog(f, at, at + countDur, EASE.travel);
  const shown = (Math.floor(value * c * 10 ** decimals) / 10 ** decimals).toFixed(decimals);
  const np = landing(f, at);
  const lp = landing(f, labelAt ?? at + 4);
  const cAt = chipAt ?? at + countDur;
  const cp = prog(f, cAt, cAt + 9, EASE.pop);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 1015 - x, display: "flex", alignItems: "center", gap: 26, fontFamily: INTER }}>
      <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, minWidth: numWidth, color: mixColor(theme.color.ghost, theme.color.ink, np), fontVariantNumeric: "tabular-nums" }}>
        {prefix}
        {shown}
        {suffix}
      </span>
      <span
        style={{
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.05,
          color: mixColor(theme.color.ghost, theme.color.ink, lp),
          opacity: f < (labelAt ?? at + 4) ? 0 : 1,
          transform: `translateY(${(5 * (1 - lp)).toFixed(2)}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {chip && f >= cAt ? (
        <span style={{ display: "inline-block", transform: `scale(${mix(0.6, 1, cp)})`, opacity: Math.min(1, cp * 2) }}>
          <InlineChip name={chip} />
        </span>
      ) : null}
    </div>
  );
};

export type RaceRow = {
  name: string;
  /** shown when the bar lands, e.g. "14 ms" */
  valueText: string;
  /** final fill of the track, 0..1 */
  fill: number;
  /** track width in px (default 620) */
  trackW?: number;
  at: number;
  /** frames the bar takes to fill (14 ms: 3 frames; 883 ms: the long one) */
  dur: number;
};

/** Race bars: each bar fills to its value, the number lands bold when it stops. Optional result line under them. */
export const RaceBars: React.FC<{ x?: number; y: number; rows: RaceRow[]; rowH?: number; result?: { text: string; at: number } }> = ({ x = 140, y, rows, rowH = 70, result }) => {
  const f = useCurrentFrame();
  return (
    <>
      {rows.map((r, i) => {
        if (f < r.at - 4) return null;
        const appear = prog(f, r.at - 4, r.at + 2, EASE.enter);
        const fill = prog(f, r.at, r.at + r.dur, EASE.travel) * r.fill;
        const landed = prog(f, r.at + r.dur, r.at + r.dur + 6, EASE.pop);
        const tw = r.trackW ?? 620;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y + i * rowH, display: "flex", alignItems: "center", gap: 18, fontFamily: INTER, opacity: appear }}>
            <InlineChip name={r.name} r={26} />
            <div style={{ width: tw, height: 34, borderRadius: 8, background: theme.color.bar, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,.06)" }}>
              <div style={{ width: `${(fill * 100).toFixed(3)}%`, height: "100%", background: theme.color.ink, borderRadius: 8 }} />
            </div>
            {landed > 0 ? (
              <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1, whiteSpace: "nowrap", opacity: Math.min(1, landed * 2), transform: `scale(${mix(0.8, 1, landed)})`, transformOrigin: "left center" }}>
                {r.valueText}
              </span>
            ) : null}
          </div>
        );
      })}
      {result && f >= result.at ? (
        <div
          style={{
            position: "absolute",
            left: x + 80,
            top: y + rows.length * rowH + 4,
            fontFamily: INTER,
            fontSize: 36,
            fontWeight: 700,
            color: mixColor(theme.color.ghost, theme.color.ink, landing(f, result.at)),
          }}
        >
          {result.text}
        </div>
      ) : null}
    </>
  );
};
