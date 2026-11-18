import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  BrandBurst,
  ChatStack,
  CommitStrip,
  CrtPass,
  DeviceFrame,
  Ground,
  HookOverlay,
  KineticCaption,
  LineTrack,
  LogoChip,
  MONO,
  PHOTO05,
  PageTurn,
  PaperCard,
  PortraitCutout,
  SHOT,
  SideCaption,
  SpriteGrid,
  StackedCaps,
  Toggle,
  UiCounter,
  deviceHeight,
  drift,
  prog,
  EASE,
  words,
} from "./index";

// Kit demo for the ep05 additions: every new component in motion, laid out like the storyboard shots it serves.
// Not a reel. The portrait slot uses the robot in black and white until the episode's portrait cut-out lands.
const SEG = {
  hook: [0, 45],
  counter: [45, 36],
  chat: [81, 38],
  army: [119, 36],
  track: [155, 60],
  device: [215, 52],
  commits: [267, 38],
  page: [305, 42],
} as const;
export const DEMO05_LEN = 347;

const Seg: React.FC<{ s: readonly [number, number]; children: React.ReactNode }> = ({ s, children }) => (
  <Sequence from={s[0]} durationInFrames={s[1]}>
    {children}
  </Sequence>
);

const OVERLAY = (
  <>
    How to turn Claude Code into
    <br />a full dev team for free
  </>
);

/** H1: portrait cut-out with the Claude burst behind it, stacked caps, the side caption types in */
const HookPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <BrandBurst cx={340} cy={1100} size={600} rot={8} spin={0.45} at={0} dur={10} />
    <PortraitCutout src={PHOTO05.robot} x={-40} y={800} w={600} h={833} from="left" at={0} dur={16} rim={10} />
    <HookOverlay text={OVERLAY} />
    <StackedCaps
      x={100}
      y={466}
      w={880}
      size={104}
      kicker={{ t: "This", at: 2, size: 46 }}
      lines={[
        { t: "Anthropic", at: 5 },
        { t: "Hackathon", at: 11 },
        { t: "Winner", at: 17 },
      ]}
    />
    <SideCaption
      x={600}
      y={880}
      w={380}
      size={46}
      lines={[
        { t: "just released", at: 21 },
        { t: "the entire", at: 25 },
        { t: "claude code", at: 29 },
        { t: "setup", at: 33 },
        { t: "for free", at: 36, s: "bar" },
      ]}
    />
  </AbsoluteFill>
);

/** the stars counter ticking inside the real GitHub sidebar crop (patched number, GitHub type) */
const CROP = { x: 1925, y: 1040, w: 635, h: 410 };
const CounterPart: React.FC = () => {
  const f = useCurrentFrame();
  const W = 840;
  const H = Math.round((W * CROP.h) / CROP.w);
  return (
    <AbsoluteFill>
      <Ground />
      <PaperCard x={120} y={430} w={W} h={H} sheets={2} tf={`scale(${(1 + f * 0.0012).toFixed(4)})`} enter={{ at: 0, dur: 12, from: "scale" }}>
        <UiCounter src={SHOT.github} srcW={2560} srcH={3010} crop={CROP} w={W} h={H} num={{ x: 1996, y: 1159, w: 86, h: 42 }} fontSize={29} from={21300} to={294000} at={6} dur={22} />
      </PaperCard>
      <KineticCaption scale={1.4} y={1060} lines={[words("it now has over", 3, 3), [{ t: "294K stars", s: "bi", at: 14 }]]} />
    </AbsoluteFill>
  );
};

/** the Claude burst swings in from off frame, chat bubbles pop out of it and stack, the burst slides off */
const ChatPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <BrandBurst
      size={560}
      spin={1.1}
      path={[
        { f: 0, x: -260, y: 260, s: 0.9 },
        { f: 12, x: 300, y: 640 },
        { f: 26, x: 330, y: 660 },
        { f: 38, x: 1300, y: 420, s: 0.9 },
      ]}
    />
    <ChatStack
      x={250}
      y={980}
      ox={330}
      oy={680}
      fs={44}
      bubbles={[
        { text: "fix this bug", at: 9 },
        { text: "write the tests", at: 16, dx: 60 },
        { text: "review my PR", at: 23, dx: 20 },
      ]}
    />
    <KineticCaption scale={1.4} anchor="bottom" y={1236} lines={[[...words("instead of just", 4, 3), { t: "chatting", s: "bi", at: 13 }]]} />
  </AbsoluteFill>
);

/** the army fill: one robot per beat into a 4x4 grid, a few pop bigger, the counter runs to 71 */
const ArmyPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <KineticCaption scale={1.4} y={300} lines={[words("you get", 0, 3), [{ t: "71 specialized agents", s: "bi", at: 6 }]]} />
    <SpriteGrid
      cols={4}
      rows={4}
      x={100}
      y={545}
      w={880}
      h={600}
      at={4}
      rate={1.5}
      big={[2, 7, 12]}
      order="shuffle"
      counter={{ x: 540, y: 1150, to: 71, suffix: "agents", size: 84, align: "center" }}
    />
  </AbsoluteFill>
);

/** the sideways whip along a line: one robot and one role card per hold, motion blur on each whip */
const TrackPart: React.FC = () => (
  <AbsoluteFill>
    <Ground />
    <LineTrack
      y={720}
      lineAt={0}
      holds={[0, 22, 44]}
      whip={11}
      items={[{ role: "planning features" }, { role: "security review" }, { role: "fixing build errors" }]}
    />
  </AbsoluteFill>
);

/** a 2x2 logo grid whose toggles flip on, then the whole board pulls back into a phone */
const PHONE = { x: 330, w: 420 };
const DevicePart: React.FC = () => {
  const ph = deviceHeight(PHONE.w);
  const chips = [
    { name: "GitHub", cx: 330, cy: 640 },
    { name: "Claude", cx: 750, cy: 640 },
    { name: "Cursor", cx: 330, cy: 960 },
    { name: "Codex", cx: 750, cy: 960 },
  ];
  return (
    <AbsoluteFill>
      <Ground />
      <DeviceFrame x={PHONE.x} y={290} w={PHONE.w} at={24} dur={16}>
        <KineticCaption scale={1.4} y={340} lines={[words("pre-built MCP", 0, 3), [{ t: "configured for", s: "bi", at: 6 }]]} />
        {chips.map((c, i) => (
          <React.Fragment key={c.name}>
            <LogoChip cx={c.cx} cy={c.cy} name={c.name} r={92} at={2 + i * 3} />
            <Toggle x={c.cx - 55} y={c.cy + 152} w={110} appear={4 + i * 3} at={13 + i * 3} />
          </React.Fragment>
        ))}
      </DeviceFrame>
      <KineticCaption scale={1.4} y={290 + ph + 28} lines={[[...words("all wired", 36, 3), { t: "together", s: "bi", at: 43 }]]} />
    </AbsoluteFill>
  );
};

/** commit cards scroll past, then fold into the SKILL.md card */
const CommitsPart: React.FC = () => {
  const f = useCurrentFrame();
  const hit = prog(f, 26, 34, EASE.soft) * (1 - prog(f, 34, 38, EASE.soft));
  return (
    <AbsoluteFill>
      <Ground />
      <PaperCard x={330} y={800} w={420} h={300} sheets={2} enter={{ at: 0, dur: 12 }} tf={`scale(${(1 + 0.04 * hit).toFixed(4)})`}>
        <pre style={{ margin: 0, padding: 26, font: `500 26px/1.5 ${MONO}`, color: "#222" }}>{"SKILL.md\n\n# commit style\n- small commits\n- tests first"}</pre>
      </PaperCard>
      <CommitStrip
        y={540}
        speed={7}
        x0={110}
        at={0}
        fold={{ at: 14, x: 540, y: 950, dur: 14, stagger: 2, scale: 0.2 }}
        commits={[
          { hash: "a1f3c9e", msg: "fix flaky auth test", tone: 0.2 },
          { hash: "7be0d42", msg: "add retry to fetch", tone: 0.6 },
          { hash: "c93a5f1", msg: "split the parser", tone: 0.4 },
          { hash: "e04b7d8", msg: "rename config keys", tone: 0.8 },
          { hash: "5d21aa0", msg: "cache build output", tone: 0.3 },
        ]}
      />
      <KineticCaption scale={1.4} anchor="bottom" y={1236} lines={[[...words("it reads your", 2, 3), { t: "git history", s: "bi", at: 10 }]]} />
    </AbsoluteFill>
  );
};

/** CTA: the guide lies on the paper and its pages turn */
const PagePart: React.FC = () => {
  const f = useCurrentFrame();
  const d = drift(f, 3);
  return (
    <AbsoluteFill>
      <Ground dark />
      <KineticCaption y={300} lines={[[{ t: "Comment", s: "bi", at: 0 }], [{ t: "“SETUP”", s: "huge", at: 3 }]]} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${d.x.toFixed(2)}px,${d.y.toFixed(2)}px)` }}>
        <PageTurn x={300} y={590} w={440} h={500} at={8} dur={22} turns={2} stagger={9} title="ECC setup guide" enter={{ at: 0, dur: 12, dist: 120 }} />
      </div>
      <KineticCaption scale={1.4} anchor="bottom" y={1236} lines={[[...words("the", 14, 3), { t: "exact steps", s: "bi", at: 17 }]]} />
    </AbsoluteFill>
  );
};

export const PaperStudioDemo05: React.FC<{ crt: boolean }> = ({ crt }) => (
  <CrtPass enabled={crt}>
    <AbsoluteFill style={{ background: "#F3F2F0" }}>
      <Seg s={SEG.hook}>
        <HookPart />
      </Seg>
      <Seg s={SEG.counter}>
        <CounterPart />
      </Seg>
      <Seg s={SEG.chat}>
        <ChatPart />
      </Seg>
      <Seg s={SEG.army}>
        <ArmyPart />
      </Seg>
      <Seg s={SEG.track}>
        <TrackPart />
      </Seg>
      <Seg s={SEG.device}>
        <DevicePart />
      </Seg>
      <Seg s={SEG.commits}>
        <CommitsPart />
      </Seg>
      <Seg s={SEG.page}>
        <PagePart />
      </Seg>
    </AbsoluteFill>
  </CrtPass>
);
