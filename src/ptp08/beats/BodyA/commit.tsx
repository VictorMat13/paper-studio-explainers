// One kit commit card at a position (the kit's CommitStrip with a single commit and no scroll, so the card is the
// exact kit Commit look every body uses: 340 x 128, mono 7-hex hash, one-line message, avatar dot), plus the hanging
// stem that ties a card to its timeline node. World px.
import React from "react";
import { CommitStrip, WirePath, type Commit } from "../../../paperstudio";

export const CW = 460;
export const CH = 170;

export const COMMITS: Commit[] = [
  { hash: "e83b6d4", msg: "first version", tone: 0.35 },
  { hash: "4b7d2e0", msg: "add login page", tone: 0.55 },
  { hash: "a1f3c9e", msg: "save progress", tone: 0.45 },
  { hash: "9c05f1a", msg: "fix list", tone: 0.6 },
  { hash: "27fa0c8", msg: "add dark mode", tone: 0.4 },
  { hash: "b61e90d", msg: "new header", tone: 0.5 },
  { hash: "5d2a7f3", msg: "dark mode colors", tone: 0.65 },
  { hash: "c40e8b1", msg: "try new font", tone: 0.3 },
];

export type CommitCardProps = {
  /** card centre, world px */
  cx: number;
  cy: number;
  c: Commit;
  /** uniform scale about the centre */
  s?: number;
  rot?: number;
  opacity?: number;
  /** 0..1 fade to grey (the broken version) */
  grey?: number;
  /** extra transform after the position (e.g. a 3D tilt) */
  tf?: string;
  children?: React.ReactNode;
};

/** a commit card at rest (the kit card, no entrance of its own: callers animate position / scale / opacity) */
export const CommitCard: React.FC<CommitCardProps> = ({ cx, cy, c, s = 1, rot = 0, opacity = 1, grey = 0, tf = "", children }) => {
  if (opacity <= 0.001 || s <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - CW / 2,
        top: cy - CH / 2,
        width: CW,
        height: CH,
        transform: `${tf} rotate(${rot.toFixed(3)}deg) scale(${s.toFixed(4)})`,
        transformOrigin: "50% 50%",
        opacity,
        filter: grey > 0.001 ? `grayscale(${grey.toFixed(3)}) brightness(${(1 - 0.12 * grey).toFixed(3)}) contrast(${(1 - 0.45 * grey).toFixed(3)})` : undefined,
      }}
    >
      {/* the kit strip, one card at x0 = 0 inside this box, never scrolling */}
      <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH }}>
        <CommitStrip y={CH / 2} commits={[c]} x0={0} speed={0} at={-1000} cardW={CW} cardH={CH} />
      </div>
      {children}
    </div>
  );
};

/** the short 4 px stem from a node to the card hanging under (dir 1) or over (dir -1) it */
export const Stem: React.FC<{ x: number; y0: number; y1: number; p?: number; opacity?: number }> = ({ x, y0, y1, p = 1, opacity = 1 }) =>
  p <= 0.001 || opacity <= 0.001 ? null : <WirePath d={`M${x.toFixed(1)} ${y0.toFixed(1)} L${x.toFixed(1)} ${y1.toFixed(1)}`} w={4} p={p} opacity={opacity} />;
