import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  Camera,
  EASE,
  INTER,
  LogoChip,
  Pill,
  camPath,
  frameRect,
  mix,
  prog,
  BlurBreak,
  CrtPass,
  DashedArrow,
  Ground,
  GuideMock,
  HandsScene,
  HookOverlay,
  IconList,
  IconObject,
  InlineChip,
  KineticCaption,
  LogoChipLine,
  MONO,
  PaperCard,
  RaceBars,
  SHOT,
  ShatterOverlay,
  SparkleList,
  StatRow,
  TERM,
  TerminalCard,
  TerminalStrip,
  drift,
  words,
} from "./index";

// Kit demo: every component in motion, laid out like the storyboard shots it serves. Not a reel.
const SEG = {
  hook: [0, 40],
  shatter: [40, 35],
  hands: [75, 40],
  list: [115, 35],
  stats: [150, 40],
  strip: [190, 30],
  notes: [220, 30],
  cta: [250, 30],
  camera: [280, 160],
} as const;
export const DEMO_LEN = 440;

const Seg: React.FC<{ s: readonly [number, number]; children: React.ReactNode }> = ({ s, children }) => (
  <Sequence from={s[0]} durationInFrames={s[1]}>
    {children}
  </Sequence>
);

/** S01-S03: chips pop onto the line, the pricing stack rises (hook overlay band kept clear) */
const HookPart: React.FC = () => {
  const f = useCurrentFrame();
  const d = drift(f, 3);
  return (
    <AbsoluteFill>
      <Ground />
      <HookOverlay />
      <LogoChipLine
        y={540}
        lineAt={0}
        chips={[
          { name: "Cursor", x: 200, at: 2 },
          { name: "Codex", x: 400, at: 10 },
          { name: "Claude", x: 600, at: 18 },
        ]}
      />
      <PaperCard x={300} y={660 + d.y} w={480} h={520} src={SHOT.claude} sheets={2} tilt enter={{ at: 8, dur: 16, dist: 90 }} />
    </AbsoluteFill>
  );
};

/** S04-S07: the stack shrinks up, the crack web spreads, the caption block builds to the black bar */
const ShatterPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <HookOverlay />
    <PaperCard x={300} y={520} w={480} h={520} src={SHOT.claude} sheets={2} tf="scale(.9)" />
    <ShatterOverlay x={324} y={546} w={432} h={468} at={12} dur={10} />
    <KineticCaption
      anchor="bottom"
      y={1235}
      lines={[words("one developer built something that", 0, 3), [{ t: "beats all of them", s: "bi", at: 12 }], [{ t: "free & open source", s: "bar", at: 22 }]]}
    />
  </AbsoluteFill>
);

/** S12-S14: the hands slide in from the edges, the bracket draws node to node */
const HandsPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <HandsScene at={0} bracketAt={10} />
    <KineticCaption y={1060} lines={[words("every coding agent has a", 6, 3), [{ t: "Middle Layer", s: "bi", at: 22 }]]} />
  </AbsoluteFill>
);

/** S15-S17: icon list one row per beat, the harness icon pops under a dashed arrow, then a blur break */
const ListPart: React.FC = () => (
  <BlurBreak at={26} dur={9} mode="in">
    <Ground />
    <KineticCaption y={400} lines={[[{ t: "that's the part handling", s: "bi", at: 0 }]]} />
    <IconList
      x={330}
      y={540}
      rows={[
        { icon: "prompt", text: "Your Prompts", at: 4 },
        { icon: "tools", text: "Your Tools", at: 8 },
        { icon: "memory", text: "Your Memory", at: 12 },
        { icon: "sessions", text: "Your Sessions", at: 16 },
      ]}
    />
    <DashedArrow d="M540 880 C 470 930, 610 960, 540 1010" at={14} dur={10} />
    <IconObject cx={540} cy={1090} s={120} at={20} float={2} />
  </BlurBreak>
);

/** S23-S28: the counter ticks to 20x with the Claude chip, then the race bars */
const StatsPart: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ground swoosh swooshDrift={drift(f, 6, 120).x} />
      <KineticCaption align="left" x={140} w={820} y={560} lines={[words("every extra session uses", 0, 3)]} />
      <StatRow y={640} value={20} suffix="x" label="less memory than" chip="Claude" at={8} countDur={14} />
      <KineticCaption align="left" x={140} w={820} y={790} lines={[words("opens in", 18, 3)]} />
      <RaceBars
        y={860}
        rows={[
          { name: "JCode", valueText: "14 ms", fill: 1, trackW: 80, at: 22, dur: 3 },
          { name: "Codex", valueText: "883 ms", fill: 1, trackW: 500, at: 26, dur: 12 },
        ]}
      />
    </AbsoluteFill>
  );
};

/** S41-S42: the wide swarm strip pans inside a frame that stays in the safe box; pills pop as panes arrive */
const StripPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <TerminalStrip
      x={100}
      y={500}
      w={880}
      h={420}
      speed={14}
      panes={[
        { src: TERM.swarm, label: "boss" },
        { src: TERM.demo2, label: "worker" },
        { src: TERM.demo3, label: "worker" },
      ]}
      enter={{ at: 0, dur: 10, from: "scale" }}
    />
    <KineticCaption y={990} lines={[[...words("it turns into the", 2, 3), { t: "boss", s: "bi", at: 14 }]]} />
  </AbsoluteFill>
);

/** S29-S32: terminal card with a notes card, sparkle bullets land on the voice */
const NotesPart: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Ground />
      <TerminalCard x={140} y={320} w={800} h={460} src={TERM.demo1} tiltY={-8} tf={`scale(${(1 + f * 0.0008).toFixed(4)})`} enter={{ at: 0, from: "left", dist: 240 }} />
      <PaperCard x={690} y={560} w={300} h={200} tf="rotate(6deg)" enter={{ at: 6, from: "right", dist: 120 }}>
        <pre style={{ margin: 0, padding: 18, font: `400 19px/1.5 ${MONO}`, color: "#333" }}>{"notes.md\n\n- prefers small commits\n- tests before push\n- uses pnpm"}</pre>
      </PaperCard>
      <SparkleList
        x={250}
        y={880}
        rows={[[{ t: "right on your computer", s: "bold", at: 8 }], [words("so it remembers how you", 16, 2), [{ t: "like things done", s: "bi", at: 26 }]]]}
      />
    </AbsoluteFill>
  );
};

/** S58-S61: darker CTA ground, the keyword lands huge, the guide mock rises */
const CtaPart: React.FC = () => (
  <AbsoluteFill>
    <Ground dark />
    <KineticCaption y={400} lines={[[{ t: "Comment", at: 0 }], [{ t: "“HARNESS”", s: "huge", at: 3 }]]} />
    <GuideMock x={240} y={660} w={600} h={400} rot={-4} enter={{ at: 6, dur: 14, dist: 120 }} />
    <KineticCaption
      y={1090}
      lines={[[...words("I'll send you the", 12, 2), { t: "exact steps", s: "bold", at: 20 }], [{ t: <InlineChip name="JCode" r={26} />, w: 52, at: 24 }, ...words("to set it up.", 24, 2)]]}
    />
  </AbsoluteFill>
);


// ------------------------------------------------------------------ camera system demo (2026-10-31)
// One world under the kit Camera: push-in during a hold, a zoom-in to a detail, a tracking move that follows a
// card flying across the frame (lag-smoothed), and a pull-back to the big picture. Captions are the new smooth
// KineticCaption in the screen-space HUD (fast words 3-5 frames apart so the no-overlap glide is visible).
const PRICE = { x: 600, y: 860, w: 360, h: 260 };
const FLY = { w: 300, h: 190, a: 74, b: 106, from: { x: 330, y: 1010 }, to: { x: 820, y: 560 } };
/** the travelling card's centre in world px at (possibly fractional) frame fr */
const flyAt = (fr: number) => {
  const t = prog(fr, FLY.a, FLY.b, EASE.travel);
  // a gentle arc: x eases, y eases with a lift in the middle
  return { x: mix(FLY.from.x, FLY.to.x, t), y: mix(FLY.from.y, FLY.to.y, t) - 140 * Math.sin(Math.PI * t) };
};
const CAM_KEYS = camPath({ f: 0, zoom: 1 })
  .push(26, 0.05) // slow push-in while the terminal scrolls
  .to(26, frameRect(PRICE, { margin: 70, max: 2 }), 18) // zoom in to the $0 detail
  .push(64, 0.02) // hold on the detail while the MIT pill pops
  .to(62, { x: FLY.from.x, y: FLY.from.y + 120, zoom: 1.15 }, 14) // over to the card waiting at the chips
  // the keyed base travels with the card, so when the follow lets go nothing swings back
  .to(FLY.a, { x: FLY.to.x, y: FLY.to.y + 120 }, FLY.b - FLY.a, EASE.travel)
  .hold(114)
  .to(114, { x: 540, y: 820, zoom: 0.84 }, 22) // pull back: the whole board
  .push(160, 0.015).keys;

const CameraPart: React.FC = () => {
  const f = useCurrentFrame();
  const fly = flyAt(f);
  const tilt = 8 * Math.sin(Math.PI * prog(f, FLY.a, FLY.b, EASE.travel));
  return (
    <Camera
      keys={CAM_KEYS}
      follow={[{ from: 66, to: 116, target: flyAt, lag: 4, ramp: 8, dy: 120, weight: 0.8 }]} // dy: hold the card above the caption band
      hud={
        <>
          <KineticCaption
            scale={1.4}
            anchor="bottom"
            y={1236}
            x={90}
            w={900}
            exit={{ at: 62, dur: 8, to: "top", dist: 16 }}
            lines={[words("the camera pushes in, then", 2, 4), [...words("moves to the", 20, 3), { t: "detail", s: "bi", at: 30 }]]}
          />
          <KineticCaption
            scale={1.4}
            anchor="bottom"
            y={1236}
            x={90}
            w={900}
            lines={[words("it tracks the card as it travels", 70, 3), [{ t: "and pulls back", s: "bar", at: 112 }]]}
          />
        </>
      }
    >
      <TerminalCard x={140} y={330} w={800} h={460} src={TERM.demo1} scroll={0.6 * f} />
      <PaperCard {...PRICE} sheets={1} exit={{ at: 64, dur: 14, to: "right", dist: 700, fade: false }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", font: `800 132px/1 ${INTER}`, letterSpacing: -4, color: "#111" }}>$0</div>
      </PaperCard>
      <Pill x={PRICE.x + PRICE.w / 2} y={PRICE.y + PRICE.h - 52} text="MIT license" fs={26} at={48} opacity={1 - prog(f, 62, 68, EASE.exit)} />
      <LogoChip cx={200} cy={900} name="Claude" r={52} at={4} />
      <LogoChip cx={360} cy={900} name="ChatGPT" r={52} at={8} />
      <PaperCard
        x={fly.x - FLY.w / 2}
        y={fly.y - FLY.h / 2}
        w={FLY.w}
        h={FLY.h}
        src={SHOT.github}
        tf={`rotate(${tilt.toFixed(2)}deg)`}
        enter={{ at: 60, dur: 10, from: "scale" }}
      />
    </Camera>
  );
};

export const PaperStudioDemo: React.FC<{ crt: boolean }> = ({ crt }) => (
  <CrtPass enabled={crt}>
    <AbsoluteFill style={{ background: "#F3F2F0" }}>
      <Seg s={SEG.hook}>
        <HookPart />
      </Seg>
      <Seg s={SEG.shatter}>
        <ShatterPart />
      </Seg>
      <Seg s={SEG.hands}>
        <HandsPart />
      </Seg>
      <Seg s={SEG.list}>
        <ListPart />
      </Seg>
      <Seg s={SEG.stats}>
        <StatsPart />
      </Seg>
      <Seg s={SEG.strip}>
        <StripPart />
      </Seg>
      <Seg s={SEG.notes}>
        <NotesPart />
      </Seg>
      <Seg s={SEG.cta}>
        <CtaPart />
      </Seg>
      <Seg s={SEG.camera}>
        <CameraPart />
      </Seg>
    </AbsoluteFill>
  </CrtPass>
);
