// ===========================================================================
// HC solid icons for the backs of the word chips (HC4, "what those words actually mean"): an instant camera (commit =
// a snapshot), a thick up arrow onto a base bar (push = send it up), a forked wire with nodes (branch). Drawn solid
// black ink (no line art) with a darker thickness edge offset down-right and the kit's object shadow, lit from the top
// left. viewBox 0 0 140 110; `h` sets the drawn height.
// ===========================================================================
import React from "react";
import { theme } from "../../../paperstudio";

export type IconKind = "camera" | "push" | "branch";

const EDGE = "#4B4846";

const Glyph: React.FC<{ kind: IconKind; ink: string; light: string }> = ({ kind, ink, light }) => {
  if (kind === "camera")
    return (
      <>
        {/* body with a viewfinder bump and a print slot */}
        <rect x={14} y={30} width={112} height={72} rx={16} fill={ink} />
        <rect x={26} y={18} width={34} height={18} rx={5} fill={ink} />
        <rect x={98} y={22} width={18} height={12} rx={3} fill={ink} />
        {/* lens: paper ring, black glass, a highlight from the top left */}
        <circle cx={70} cy={66} r={27} fill={light} />
        <circle cx={70} cy={66} r={19} fill={ink} />
        <circle cx={63} cy={59} r={5.5} fill={light} />
        {/* flash window */}
        <rect x={96} y={42} width={18} height={11} rx={3} fill={light} />
      </>
    );
  if (kind === "push")
    return (
      <>
        <path d="M70 6 L114 52 L86 52 L86 82 L54 82 L54 52 L26 52 Z" fill={ink} strokeLinejoin="round" stroke={ink} strokeWidth={6} />
        <rect x={20} y={92} width={100} height={14} rx={7} fill={ink} />
      </>
    );
  // branch: a main line with two nodes, a branch curving up off it to its own node
  return (
    <>
      <path d="M16 84 L124 84" stroke={ink} strokeWidth={13} strokeLinecap="round" fill="none" />
      <path d="M44 84 C 60 84, 62 34, 92 30 L118 30" stroke={ink} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={22} cy={84} r={14} fill={ink} />
      <circle cx={118} cy={84} r={14} fill={ink} />
      <circle cx={118} cy={30} r={14} fill={ink} />
      <circle cx={22} cy={84} r={5.5} fill={light} />
      <circle cx={118} cy={84} r={5.5} fill={light} />
      <circle cx={118} cy={30} r={5.5} fill={light} />
    </>
  );
};

/** a solid icon centred at (cx, cy) in its parent, `h` px tall */
export const SolidIcon: React.FC<{ kind: IconKind; cx: number; cy: number; h: number; opacity?: number }> = ({ kind, cx, cy, h, opacity = 1 }) => {
  const w = (h * 140) / 110;
  const k = h / 110;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 140 110"
      style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, overflow: "visible", opacity, filter: "drop-shadow(5px 8px 6px rgba(0,0,0,.20))" }}
    >
      {/* thickness: the same glyph in a darker ink, a few px down-right */}
      <g transform={`translate(${(2.6 / k).toFixed(2)} ${(3.4 / k).toFixed(2)})`}>
        <Glyph kind={kind} ink={EDGE} light={EDGE} />
      </g>
      <Glyph kind={kind} ink={theme.color.ink} light="#F4F3F2" />
    </svg>
  );
};
