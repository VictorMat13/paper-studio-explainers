// Scene REPO, B02a "It creates the repo and saves the first version for you."
// Cut in on the repo card already settling (scale 0.94 -> 1): a GitHub chip, 'my-app' in mono, the five file lines
// ticking in one per spoken word from "creates". On "saves" the main wire draws across the frame and node 1 pops; the
// first commit card ('first version') rises in under it on "first"; on "you" the Claude chip lands on the card's
// corner. Camera: opens at 1.06 on the card header, eases back down to the wire on "saves", push.
import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, INTER, MONO, PaperCard, WireNode, WirePath, camPath, prog, theme, zoomAt } from "../../../paperstudio";
import { type BlockSpec } from "./caps";
import { type Cues } from "./cues";
import { EIO } from "./paper";
import { CommitCard, FileTree, Logo } from "./objects";
import { PaperFace, Scene, bump, sway } from "./util";
import { PopIn } from "./paper";

export const REPO = {
  card: { x: 110, y: 236, w: 860, h: 470 },
  wireY: 790,
  node: { x: 540, y: 790 },
  commit: { cx: 540, cy: 905 },
};

const beats = (c: Cues) => ({
  start: c.s.B02a.start,
  creates: c.w("B02a", "creates"),
  repo: c.w("B02a", "repo"),
  saves: c.w("B02a", "saves"),
  first: c.w("B02a", "first"),
  you: c.w("B02a", "you"),
  end: c.s.B03a.start,
});

const World: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = beats(c);
  const R = REPO.card;
  // the repo card lands: slides up with a lean that settles (no fade)
  const pop = prog(f, b.start - 14, b.start + 10, EIO);
  // file lines: one per spoken word from "creates" (creates, the, repo, then 4 frames apart)
  const t0 = b.creates;
  const step = Math.max(3, Math.min(6, (b.repo - b.creates) / 2));
  // the files are on the card as it lands; each gets its tick one per spoken word from "creates"
  const shown = 5 * prog(f, b.start - 10, b.start + 10, EIO);
  const ticks = [0, 1, 2, 3, 4].reduce((a, i) => a + prog(f, t0 + i * step - 2, t0 + i * step + 10, EIO), 0);
  const wire = prog(f, b.start - 6, b.start + 40, EASE.travel);
  const nodeAt = b.saves + 4;
  const youK = prog(f, b.you - 4, b.you + 10, EIO);
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `perspective(2200px) translateY(${(160 * (1 - pop) + sway(f, 2, 80)).toFixed(2)}px) rotateX(${(14 * (1 - pop)).toFixed(3)}deg) rotate(${(-2 * (1 - pop)).toFixed(3)}deg)`,
          transformOrigin: `540px ${R.y + R.h}px`,
        }}
      >
        <PaperCard x={R.x} y={R.y} w={R.w} h={R.h} sheets={2}>
          <PaperFace />
          <div style={{ position: "absolute", left: 52, top: 30, height: 90, display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ position: "relative", width: 84, height: 84 }}>
              <Logo k="github" cx={42} cy={42} r={42} s={1 + 0.08 * bump(f, b.repo, 12)} />
            </div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 58, color: theme.color.ink, letterSpacing: -1 }}>my-app</div>
          </div>
          <div style={{ position: "absolute", right: 46, top: 52, padding: "6px 22px", border: `3px solid ${theme.color.ink}`, borderRadius: 30, fontFamily: INTER, fontWeight: 700, fontSize: 36, color: theme.color.ink, opacity: prog(f, b.repo - 2, b.repo + 12, EIO) }}>
            repo
          </div>
          <div style={{ position: "absolute", left: 50, right: 50, top: 134, height: 3, background: "#E6E6E6" }} />
          <FileTree x={56} y={152} shown={shown} ticks={ticks} fs={42} lineH={60} />
        </PaperCard>
        <Logo k="claude" cx={R.x + R.w - 6} cy={R.y + 8} r={44} p={youK} s={1 + 0.1 * bump(f, b.you + 6, 10)} />
      </div>
      {wire > 0 ? <WirePath d={`M-60 ${REPO.wireY} L1140 ${REPO.wireY}`} p={wire} w={9} /> : null}
      <PopIn at={nodeAt - 2} dur={12} ox={REPO.node.x} oy={REPO.node.y}>
        <WireNode cx={REPO.node.x} cy={REPO.node.y} r={17} ring={7} />
      </PopIn>
      {f >= b.first - 2 ? <CommitCard c={{ hash: "3f9a2c1", msg: "first version", tone: 0.55 }} cx={REPO.commit.cx} cy={REPO.commit.cy + sway(f, 1.5, 70)} w={460} h={170} at={b.first - 2} tf={`scale(${(1 + 0.05 * bump(f, b.first + 8, 10)).toFixed(4)})`} /> : null}
    </>
  );
};

export const repoBlocks = (): BlockSpec[] => [
  { shots: ["B02a"], spec: "It creates | *the *repo", y: 1296, anchor: "bottom" },
  { shots: ["B02a"], spec: "and saves the | *first *version", y: 1296, anchor: "bottom" },
  { shots: ["B02a"], spec: "for *you.", y: 1296, anchor: "bottom" },
];

export const SceneRepo: React.FC<{ c: Cues }> = ({ c }) => {
  const b = beats(c);
  const keys = camPath({ f: b.start, ...zoomAt({ x: 540, y: 470 }, 1.06) })
    .push(b.saves - 8, 0.01)
    .to(b.saves - 8, zoomAt({ x: 540, y: 990 }, 1.04), 24)
    .push(b.end, 0.012).keys;
  return <Scene c={c} from={b.start} to={b.end} keys={keys} world={<World c={c} />} />;
};
