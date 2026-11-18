// BodyA's timeline row: the 7 px wire, hollow nodes (WireNode r 15 / 6 px ring) and the kit commit cards hanging from
// their nodes on stems. Drawn in its own px (a layer the caller positions: the world, a laptop screen, the GitHub card),
// every state passed in (no frame logic here), so the same row is reused in every scene.
import React from "react";
import { ShatterOverlay, WireNode, WirePath, mix, mixColor, theme, type Commit } from "../../../paperstudio";
import { CH, CW, CommitCard, Stem } from "./commit";
import { COMMITS } from "./commit";

export type TLNode = { x: number; c: Commit; /** stem length from the wire to the card's near edge */ stem: number; /** 1 = card under the node, -1 = over it */ side: 1 | -1; /** card centre x offset from the node */ dx?: number };
export type TLState = {
  /** 0..1 card landed (drops in from the far side of its stem) */
  land?: number;
  /** 0..1 node popped (default follows land) */
  node?: number;
  /** 0..1 node filled black */
  fill?: number;
  /** 0..1 the card fades to grey */
  grey?: number;
  /** frame the crack web starts drawing over the card (undefined = none) */
  crackAt?: number;
  /** card rotation (deg) and lift (px toward the wire side away) */
  tilt?: number;
  lift?: number;
  /** extra card scale (1 = rest) */
  pop?: number;
  opacity?: number;
};

/** the ep08 BodyA main timeline (A05b-A08a), coordinator fix round: big kit commit cards (460 x 170, 37 px text) all
 *  hanging under the wire, nodes 600 apart, so a camera framing of one card (zoom 1.25) or of a pair (zoom 1.0) never
 *  cuts a neighbour's text at the frame edge. Nodes 0 and 1 are the older history off the left of every framing. */
export const MAIN_Y = 880;
export const SHORT = 40;
export const LONG = 40;
export const MAIN_NODES: TLNode[] = [
  { x: -1460, c: COMMITS[0], stem: SHORT, side: 1 },
  { x: -860, c: COMMITS[5], stem: SHORT, side: 1 },
  { x: -260, c: COMMITS[1], stem: SHORT, side: 1 },
  { x: 340, c: COMMITS[3], stem: SHORT, side: 1 },
  { x: 940, c: COMMITS[2], stem: SHORT, side: 1 },
];
/** camera poses on the row: the newest pair, the pair before it, the newest card alone, the pair with the terminal */
export const PAIR34 = { x: 640, y: 900, zoom: 1.0 } as const;
export const PAIR23 = { x: 40, y: 900, zoom: 1.0 } as const;
export const N4ZOOM = { x: 940, y: 900, zoom: 1.25 } as const;
export const PAIR34T = { x: 640, y: 960, zoom: 1.0 } as const;

/** a 2-frame landing squash: peaks just before the card settles (land 0.9), 0 at rest */
const squash = (land: number, side: 1 | -1) => {
  const q = Math.max(0, 1 - Math.abs(land - 0.9) / 0.1) * 0.06;
  return q > 0.001 ? `translateY(${(side * 4 * q * 10).toFixed(2)}px) scale(${(1 + q * 0.6).toFixed(4)}, ${(1 - q).toFixed(4)})` : "";
};

/** the card centre of a node at rest */
export const cardCentre = (n: TLNode, y: number) => ({ x: n.x + (n.dx ?? 0), y: y + n.side * (n.stem + CH / 2) });

export const TimelineRow: React.FC<{
  y?: number;
  nodes: TLNode[];
  states: TLState[];
  /** wire from x0 to x1, drawn to fraction wireP (0..1, left to right) */
  x0?: number;
  x1?: number;
  wireP?: number;
  /** crack frame reference: the group-local frame (ShatterOverlay reads useCurrentFrame) */
  cardScale?: number;
  /** draw only the nodes and wire (no cards) */
  noCards?: boolean;
  wireW?: number;
  /** frame for the cards' ambient breathing (0.6 px, 0.3 deg) */
  t?: number;
  children?: React.ReactNode;
}> = ({ y = MAIN_Y, nodes, states, x0 = -1800, x1 = 1800, wireP = 1, cardScale = 1, noCards, wireW = theme.wire.main, t = 0, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
    {wireP > 0.001 ? <WirePath d={`M${x0} ${y} L${x1} ${y}`} p={wireP} w={wireW} /> : null}
    {nodes.map((n, i) => {
      const st = states[i] ?? {};
      const land = st.land ?? 0;
      const o = st.opacity ?? 1;
      if (noCards || land <= 0.001 || o <= 0.001) return null;
      const cc = cardCentre(n, y);
      const k = cardScale;
      // card centre with the scale applied about the node (so a smaller card keeps hanging under its node)
      const cy0 = y + n.side * (n.stem * k + (CH * k) / 2);
      const drop = n.side * 46 * (1 - land);
      const lift = -n.side * (st.lift ?? 0);
      const stemEnd = y + n.side * n.stem * k;
      return (
        <React.Fragment key={i}>
          <Stem x={n.x} y0={y} y1={stemEnd} p={Math.min(1, land * 1.3)} opacity={o * (1 - 0.5 * (st.grey ?? 0))} />
          <CommitCard
            cx={cc.x}
            cy={cy0 + drop + lift + 0.8 * Math.sin((t + i * 29) / 41)}
            c={n.c}
            s={k * (st.pop ?? 1)}
            rot={(st.tilt ?? 0) + 0.3 * Math.sin((t + i * 17) / 53)}
            opacity={o * Math.min(1, land * 3)}
            grey={st.grey ?? 0}
            tf={squash(land, n.side)}
          >
            {st.crackAt !== undefined ? <ShatterOverlay x={0} y={0} w={CW} h={CH} ox={CW * 0.62} oy={CH * 0.45} seed={11} at={st.crackAt} dur={14} radius={12} /> : null}
          </CommitCard>
        </React.Fragment>
      );
    })}
    {nodes.map((n, i) => {
      const st = states[i] ?? {};
      const p = st.node ?? st.land ?? 0;
      const o = st.opacity ?? 1;
      if (p <= 0.001 || o <= 0.001) return null;
      return (
        <WireNode
          key={`n${i}`}
          cx={n.x}
          cy={y}
          r={theme.wire.nodeR * mix(0.4, 1, Math.min(1, p))}
          fill={mixColor(theme.color.node, theme.color.ink, st.fill ?? 0)}
          color={mixColor(theme.color.ink, "#9A9A9A", st.grey ?? 0)}
          opacity={o * Math.min(1, p * 2)}
        />
      );
    })}
    {children}
  </div>
);
