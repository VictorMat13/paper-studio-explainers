import React from "react";
import { AbsoluteFill } from "remotion";
import { H, W, theme } from "./theme";

/** Grey ribbons that bleed off the top right and bottom left (stats section). */
export const Swooshes: React.FC<{ drift?: number }> = ({ drift = 0 }) => (
  <svg style={{ position: "absolute", left: 0, top: 0 }} width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
    <g transform={`translate(${drift.toFixed(2)},0)`}>
      <path d="M620 -40 C 900 120, 1040 60, 1180 260" stroke={theme.color.swoosh} strokeWidth={54} strokeLinecap="round" opacity={0.75} style={{ filter: "blur(2px)" }} />
    </g>
    <g transform={`translate(${(-drift).toFixed(2)},0)`}>
      <path d="M-120 1500 C 120 1330, 420 1520, 300 1740 S 60 1960, 40 1990" stroke={theme.color.swoosh} strokeWidth={58} strokeLinecap="round" opacity={0.7} style={{ filter: "blur(2px)" }} />
    </g>
  </svg>
);

/** The full-frame solid grid: 135 px cells (8 across), 3 px lines. */
export const Grid: React.FC<{ opacity?: number; offsetX?: number; offsetY?: number }> = ({ opacity = 1, offsetX = 0, offsetY = 0 }) => {
  const { cell, line, color } = theme.grid;
  const id = React.useId().replace(/:/g, "");
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity }}>
      <defs>
        <pattern id={`psgrid${id}`} x={offsetX} y={theme.grid.offsetY + offsetY} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <path d={`M0 ${line / 2}H${cell}M${line / 2} 0V${cell}`} stroke={color} strokeWidth={line} fill="none" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#psgrid${id})`} />
    </svg>
  );
};

/**
 * Lit off-white paper with the solid grid over the whole frame.
 * `dark` is the slightly darker CTA ground. `swoosh` adds the grey ribbons (stats section).
 */
export const Ground: React.FC<{ grid?: boolean; swoosh?: boolean; dark?: boolean; swooshDrift?: number; gridOpacity?: number }> = ({
  grid = true,
  swoosh = false,
  dark = false,
  swooshDrift = 0,
  gridOpacity = 1,
}) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: dark ? theme.ground.dark : theme.ground.light }} />
    <AbsoluteFill style={{ background: theme.ground.lightOver }} />
    {grid ? <Grid opacity={gridOpacity} /> : null}
    {swoosh ? <Swooshes drift={swooshDrift} /> : null}
  </AbsoluteFill>
);
