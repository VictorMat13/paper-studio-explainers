import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  CrtPass,
  DashedArrow,
  EASE,
  Ground,
  KineticCaption,
  KnowledgeGraph,
  LogoChip,
  MONO,
  MapUnfold,
  PlanCard,
  ReportedStat,
  ScreenInset,
  SnipCut,
  StreetMap,
  StreetWalker,
  TokenSpill,
  TokenStack,
  UsageMeter,
  WireNode,
  WirePath,
  asset06,
  drift,
  prog,
  words,
} from "./index";

// Kit demo for the ep06 additions: every new component in motion, laid out like the storyboard shots it serves.
// Not a reel. Cut-outs that have not landed in public/paperstudio/photos yet are drawn by the components' fallbacks.
const SEG = {
  snip: [0, 44],
  meter: [44, 44],
  leak: [88, 32],
  graph: [120, 54],
  stacks: [174, 40],
  stat: [214, 44],
  map: [258, 48],
  walker: [306, 40],
  laptop: [346, 40],
} as const;
export const DEMO06_LEN = 386;

const Seg: React.FC<{ s: readonly [number, number]; children: React.ReactNode }> = ({ s, children }) => (
  <Sequence from={s[0]} durationInFrames={s[1]}>
    {children}
  </Sequence>
);

/** H1: the $200 plan card snipped in two by the scissors; the halves drop off the bottom */
const SnipPart: React.FC = () => {
  const rect = { x: 190, y: 660, w: 700, h: 360 };
  return (
    <AbsoluteFill>
      <Ground />
      <LogoChip cx={540} cy={500} name="Claude" r={92} label={false} at={0} />
      <SnipCut rect={rect} at={13} cutDur={12} angle={-4} scissors={{ src: asset06("scissors"), w: 420, snips: 3, enterAt: 3 }} separate={{ dur: 22, drop: 1400 }}>
        <PlanCard {...rect} name="Claude Max" price="$200" sheets={1} enter={{ at: 0, dur: 12, dist: 120 }} />
      </SnipCut>
      <KineticCaption scale={1.4} anchor="bottom" y={1236} lines={[[...words("canceling their", 2, 4), { t: "$200 plan", s: "bi", at: 10 }]]} />
    </AbsoluteFill>
  );
};

/** the meter races to the limit while tokens spill out from under it onto a heap; the wire drains it and the heap shrinks away */
const MeterPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <LogoChip cx={540} cy={430} name="Graphify" src={asset06("logoGraphify")} r={78} label={false} at={0} />
    <TokenSpill ox={540} oy={730} ow={380} count={26} at={5} rate={0.7} mode="pile" pile={{ x: 540, y: 1090, w: 620, h: 150 }} size={92} src={asset06("token")} shrink={{ at: 33, dur: 8, stagger: 0.22 }} />
    <UsageMeter x={260} y={600} w={560} h={150} from={0.3} to={1} at={2} dur={14} limit drain={{ at: 30, to: 0.12, dur: 12 }} />
    <WirePath d="M540 508 L540 600" at={26} dur={6} />
    <WireNode cx={540} cy={510} at={26} />
    <WireNode cx={540} cy={598} at={31} />
    <KineticCaption scale={1.4} anchor="bottom" y={1236} lines={[[{ t: "token problem", s: "bi", at: 3 }, { t: "for good", s: "bar", at: 28 }]]} />
  </AbsoluteFill>
);

/** "eats up your usage": the $20 plan card's usage slot fills while tokens leak from its bottom edge and drain off the frame */
const LeakPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <TokenSpill ox={540} oy={880} ow={560} count={34} at={2} rate={0.75} mode="drain" dir={92} spread={46} speed={[3, 9]} size={84} src={asset06("token")} seed={4} />
    <PlanCard
      x={190}
      y={500}
      w={700}
      h={400}
      name="Claude Pro"
      price="$20"
      chip={{ name: "Claude", r: 46, at: 0 }}
      usage={{ from: 0.2, to: 0.92, at: 0, dur: 30 }}
      enter={{ at: 0, dur: 10, dist: 80 }}
    />
    <KineticCaption scale={1.4} y={300} lines={[[...words("eats up your", 2, 4), { t: "usage", s: "bi", at: 13 }]]} />
  </AbsoluteFill>
);

/** the knowledge graph on the dark card over the real README graph; a path lights, then the rebuild ripple */
const GraphPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <KnowledgeGraph
      x={100}
      y={420}
      w={880}
      h={500}
      card={{ src: asset06("graph"), zoom: 1.3, dim: 0.42, sheets: 1 }}
      at={2}
      rate={1.6}
      edgeDur={6}
      highlightPath={["n0", "n2", "n5", "n7", "n11"]}
      highlightAt={28}
      highlightRate={5}
      pulseAt={44}
      enter={{ at: 0, dur: 10, from: "right", dist: 160 }}
    />
    <LogoChip cx={150} cy={450} name="Graphify" src={asset06("logoGraphify")} r={66} label={false} at={0} />
    <KineticCaption scale={1.4} y={1000} lines={[words("into a", 2, 4), [{ t: "knowledge graph", s: "bi", at: 10 }]]} />
  </AbsoluteFill>
);

/** before: a tall stack that keeps growing off the top; with Graphify: a short one */
const StacksPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <TokenStack x={320} y={1120} size={230} grow at={0} rate={0.45} src={asset06("token")} seed={2} label="before" labelAt={4} />
    <TokenStack x={770} y={1120} size={230} count={5} at={6} rate={3} src={asset06("token")} seed={5} label="with graphify" labelAt={10} />
    <KineticCaption scale={1.3} x={560} w={420} y={560} lines={[words("far", 12, 4), [{ t: "fewer tokens", s: "bi", at: 16 }]]} />
  </AbsoluteFill>
);

/** 49x counts up and holds with the "reported" pill; 71.5x lands as its own stat with Graphify to Obsidian */
const StatPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <ReportedStat x={540} y={360} value={49} at={4} dur={24} size={180} />
    <ReportedStat x={540} y={720} value={71.5} at={30} land="pop" size={150} pillSide="below" pillAt={33} />
    <LogoChip cx={330} cy={1110} name="Graphify" src={asset06("logoGraphify")} r={70} at={32} />
    <DashedArrow d="M420 1110 L640 1110" at={35} dur={8} />
    <LogoChip cx={750} cy={1110} name="Obsidian" src={asset06("logoObsidian")} r={70} at={39} />
  </AbsoluteFill>
);

/** the folded map cut-out cross-fades into six concertina panels that open one by one into the route map */
const ROUTE_WIDE: [number, number][] = [
  [1, 5],
  [1, 4],
  [3, 4],
  [3, 2],
  [6, 2],
  [6, 1],
];
const MapFace: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const f = useCurrentFrame();
  return <StreetMap w={w} h={h} cols={7} rows={5} route={ROUTE_WIDE} routeP={prog(f, 36, 46, EASE.travel)} ends palette="atlas" />;
};
const MapPart: React.FC = () => {
  const f = useCurrentFrame();
  const d = drift(f, 3);
  return (
    <AbsoluteFill>
      <Ground />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${d.x.toFixed(2)}px,${d.y.toFixed(2)}px)` }}>
        <MapUnfold
          x={100}
          y={440}
          w={880}
          h={600}
          panels={6}
          startAngle={62}
          zigzag
          at={12}
          dur={12}
          stagger={3}
          folded={{ src: asset06("mapFolded"), w: 780, aspect: 1982 / 1454 }}
          enter={{ at: 0, dur: 8, dist: 140, fade: false }}
        >
          <MapFace w={880} h={600} />
        </MapUnfold>
      </div>
      <KineticCaption scale={1.4} anchor="bottom" y={1236} lines={[[...words("a map of", 4, 4), { t: "the city", s: "bold", at: 14 }]]} />
    </AbsoluteFill>
  );
};

/** split: the route card on the left, the robot walking every street on the right */
const WalkerPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <StreetWalker x={65} y={440} w={440} h={580} mode="route" at={0} dur={14} ends sheets={0} palette="atlas" />
    <StreetWalker x={575} y={440} w={440} h={580} mode="walk" at={2} dur={36} spriteH={104} sheets={0} palette="atlas" enter={{ at: 0, dur: 10, from: "right", dist: 200 }} />
    <KineticCaption scale={1.4} anchor="bottom" y={1236} lines={[[{ t: "walk", s: "reg", at: 4 }, { t: "every street", s: "bar", at: 10 }]]} />
  </AbsoluteFill>
);

/** the laptop rises; the terminal is composited onto its screen */
const TERM_LINES = ["$ uv tool install graphifyy", "$ graphify install", "$ /graphify .", "  scanning the project", "  building the knowledge graph", "  graph ready"];
const Screen: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, padding: "70px 80px", fontFamily: MONO, fontSize: 58, lineHeight: 1.55, color: "#E8E8E8" }}>
      <div style={{ display: "flex", gap: 22, marginBottom: 40 }}>
        {["#5A5A5A", "#5A5A5A", "#5A5A5A"].map((c, i) => (
          <div key={i} style={{ width: 26, height: 26, borderRadius: 13, background: c }} />
        ))}
      </div>
      {TERM_LINES.map((t, i) => {
        const a = 10 + i * 4;
        const n = Math.max(0, Math.min(t.length, Math.floor((f - a) * 5)));
        if (f < a) return null;
        return (
          <div key={i} style={{ color: t.startsWith("$") ? "#F2F2F2" : "#9FB3A6", whiteSpace: "pre" }}>
            {t.slice(0, n)}
          </div>
        );
      })}
    </div>
  );
};
const LaptopPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <ScreenInset x={130} y={480} w={820} src={asset06("laptop")} on={{ at: 8, dur: 8 }} enter={{ at: 0, dur: 16, dist: 420, fade: false }}>
      <Screen />
    </ScreenInset>
    <KineticCaption scale={1.4} anchor="bottom" y={1236} lines={[[...words("right on your", 8, 4), { t: "own machine", s: "bi", at: 20 }]]} />
  </AbsoluteFill>
);

export const PaperStudioDemo06: React.FC<{ crt: boolean }> = ({ crt }) => (
  <CrtPass enabled={crt}>
    <AbsoluteFill style={{ background: "#F3F2F0" }}>
      <Seg s={SEG.snip}>
        <SnipPart />
      </Seg>
      <Seg s={SEG.meter}>
        <MeterPart />
      </Seg>
      <Seg s={SEG.leak}>
        <LeakPart />
      </Seg>
      <Seg s={SEG.graph}>
        <GraphPart />
      </Seg>
      <Seg s={SEG.stacks}>
        <StacksPart />
      </Seg>
      <Seg s={SEG.stat}>
        <StatPart />
      </Seg>
      <Seg s={SEG.map}>
        <MapPart />
      </Seg>
      <Seg s={SEG.walker}>
        <WalkerPart />
      </Seg>
      <Seg s={SEG.laptop}>
        <LaptopPart />
      </Seg>
    </AbsoluteFill>
  </CrtPass>
);
