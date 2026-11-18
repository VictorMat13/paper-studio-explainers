// Scene SNAP, B03b "That stores a snapshot of your whole project with a note on what changed."
// Cut in on the board: the main wire with node 1 ('first version', its card above the wire) and node 2, whose card
// ('add login page') rises in under the wire. On "snapshot" that card grows into the snapshot card (the same paper
// card, now showing the whole file tree): the file lines land one per spoken word from "of", then on "note" the black
// note line wipes in ("note: add login page") and pulses on "changed". Camera: push, then a 1.15 zoom about a point
// near the card's bottom so the grown card fills the frame above the caption (node 1 leaves the top).
import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, WireNode, WirePath, camPath, mix, prog } from "../../../paperstudio";
import { type BlockSpec } from "./caps";
import { type Cues } from "./cues";
import { EIO } from "./paper";
import { CommitCard, SnapshotCard } from "./objects";
import { Scene, swell } from "./util";
import { PopIn } from "./paper";

export const BOARD1 = {
  wireY: 320,
  n1: { x: 220, y: 320 },
  n2: { x: 640, y: 320 },
  card1: { cx: 220, cy: 435 },
  card2: { cx: 640, cy: 435 },
  snap: { x: 120, y: 372, w: 840, h: 690 },
};
const SMALL = { w: 460, h: 170 };

const beats = (c: Cues) => ({
  start: c.s.B03b.start,
  snapshot: c.w("B03b", "snapshot"),
  // the five file lines land evenly from "snapshot" to "project" (the card is never shown empty for long)
  lines: [0, 1, 2, 3, 4].map((i) => Math.round(c.w("B03b", "snapshot") - 6 + ((c.w("B03b", "project") - c.w("B03b", "snapshot") + 6) * i) / 4)),
  note: c.w("B03b", "note"),
  changed: c.w("B03b", "changed"),
  end: c.s.B04a.start,
});

const World: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = beats(c);
  const B = BOARD1;
  // the new commit card rises in at the cut and grows into the snapshot card right away (24 frames)
  const g = prog(f, b.start - 10, b.start + 16, EASE.travel);
  const small = { x: B.card2.cx - SMALL.w / 2, y: B.card2.cy - SMALL.h / 2, w: SMALL.w, h: SMALL.h };
  const r = { x: mix(small.x, B.snap.x, g), y: mix(small.y, B.snap.y, g), w: mix(small.w, B.snap.w, g), h: mix(small.h, B.snap.h, g) };
  // the whole project is in the snapshot as it grows (lines land in the first 24 frames); each line gets its tick on
  // the words from "snapshot" to "project"
  const shown = [0, 1, 2, 3, 4].reduce((a, i) => a + prog(f, b.start + 2 + i * 4, b.start + 16 + i * 4, EIO), 0);
  const ticks = b.lines.reduce((a, at) => a + prog(f, at - 6, at + 18, EIO), 0);
  const note = prog(f, b.note, b.note + 14, EASE.travel);
  const notePulse = 1 + 0.04 * swell(f, b.changed - 1, 14);
  return (
    <>
      <WirePath d={`M-60 ${B.wireY} L1140 ${B.wireY}`} w={9} />
      <WireNode cx={B.n1.x} cy={B.n1.y} r={17} ring={7} />
      <PopIn at={b.start - 6} dur={12} ox={B.n2.x} oy={B.n2.y}>
        <WireNode cx={B.n2.x} cy={B.n2.y} r={17} ring={7} />
      </PopIn>
      {g < 0.75 ? <CommitCard c={{ hash: "b7e21d4", msg: "add login page", tone: 0.4 }} cx={B.card2.cx} cy={B.card2.cy} w={SMALL.w} h={SMALL.h} at={b.start - 4} opacity={1 - prog(f, b.start - 8, b.start + 4, EIO)} /> : null}
      {g > 0.02 ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${notePulse.toFixed(4)})`, transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h - 70}px` }}>
          <SnapshotCard x={r.x} y={r.y} w={r.w} h={r.h} hash="b7e21d4" msg="add login page" shown={shown} ticks={ticks} note={note} inner={prog(f, b.start, b.start + 14, EIO)} opacity={prog(f, b.start - 8, b.start + 2, EIO)} k={1.22} />
        </div>
      ) : null}
    </>
  );
};

export const snapBlocks = (): BlockSpec[] => [
  { shots: ["B03b"], spec: "That stores | a *snapshot", y: 1296, anchor: "bottom" },
  { shots: ["B03b"], spec: "of your | *whole *project", y: 1296, anchor: "bottom" },
  { shots: ["B03b"], spec: "with a note | on *what *changed.", y: 1296, anchor: "bottom" },
];

export const SceneSnap: React.FC<{ c: Cues }> = ({ c }) => {
  const b = beats(c);
  // one slow push across the whole shot (the card fills the frame; the push keeps it alive)
  const keys = camPath({ f: b.start, x: 540, y: 758.5, zoom: 1 }).push(b.end, 0.012).keys;
  return <Scene c={c} from={b.start} to={b.end} keys={keys} world={<World c={c} />} />;
};
