// Scenes on the to-do app phone (kit DeviceFrame, the app drawn by objects/TodoApp, no brand, no colour):
//   WORKS  B03a "Then, every time something works," (until the console cut on "you"): the phone at the left, its rows
//          tick one per spoken word, and on "works" a big tick chip pops at the right with its tick drawing on.
//   BREAK  B05a "When a prompt breaks your app, don't argue with it.": the phone at the left; a chat bubble
//          'add dark mode' on "prompt"; on "breaks" the app goes half dark and a crack web runs over the screen;
//          'fix it' and 'no, fix it properly' stack up on "don't" / "argue", grey out, and a thick black bar strikes
//          through each.
import React from "react";
import { useCurrentFrame } from "remotion";
import { ChatBubble, DeviceFrame, EASE, ShatterOverlay, bubbleHeight, camPath, deviceHeight, prog, theme, zoomAt } from "../../../paperstudio";
import { type BlockSpec } from "./caps";
import { type Cues } from "./cues";
import { EIO } from "./paper";
import { Btn, TickGlyph, TodoApp } from "./objects";
import { Scene, bump, sway } from "./util";

/** the phone: outer box (DeviceFrame x, y, w) */
export const PHONE = { x: 90, y: 250, w: 420 };
export const phoneScreen = (P: { x: number; y: number; w: number }) => {
  const b = Math.round(P.w * 0.05);
  const sw = P.w - 2 * b;
  return { x: P.x + b, y: P.y + b, w: sw, h: (sw * 1920) / 1080, r: Math.round(P.w * 0.11) };
};

/** the phone with the app; `crack` = frame the crack starts (undefined = none) */
export const Phone: React.FC<{ P?: { x: number; y: number; w: number }; ticks: number; dark?: number; crack?: number; dy?: number; rot?: number; opacity?: number; seed?: number }> = ({
  P = PHONE,
  ticks,
  dark = 0,
  crack,
  dy = 0,
  rot = 0,
  opacity = 1,
  seed = 5,
}) => {
  const S = phoneScreen(P);
  const h = deviceHeight(P.w);
  if (opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`, transformOrigin: `${P.x + P.w / 2}px ${P.y + h / 2}px`, opacity }}>
      <DeviceFrame x={P.x} y={P.y} w={P.w} at={-1000}>
        <TodoApp ticks={ticks} dark={dark} />
      </DeviceFrame>
      {crack !== undefined ? <ShatterOverlay x={S.x} y={S.y} w={S.w} h={S.h} ox={S.w * 0.68} oy={S.h * 0.42} seed={seed} at={crack} dur={26} radius={S.r} /> : null}
    </div>
  );
};

// ------------------------------------------------------------- WORKS (B03a part 1)
const worksBeats = (c: Cues) => ({
  start: c.s.B03a.start,
  every: c.w("B03a", "every"),
  time: c.w("B03a", "time"),
  something: c.w("B03a", "something"),
  works: c.w("B03a", "works"),
  end: c.w("B03a", "you") - 1,
});

const WorksWorld: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = worksBeats(c);
  const tickAt = [b.every, b.time, b.something];
  const ticks = tickAt.reduce((a, at) => a + prog(f, at, at + 14, EIO), 0);
  const pTick = prog(f, b.works - 2, b.works + 12, EIO);
  const draw = prog(f, b.works + 2, b.works + 16, EASE.travel);
  // the phone slides in from the left edge as the scene cuts in
  const slide = prog(f, b.start - 6, b.start + 14, EIO);
  return (
    <>
      <Phone P={{ x: 90 - 520 * (1 - slide), y: 236, w: 480 }} ticks={ticks} dy={sway(f, 3, 90)} rot={-3 * (1 - slide)} />
      <Btn cx={815} cy={620} r={165} p={pTick} s={1 + 0.06 * bump(f, b.works + 10, 14)} rot={sway(f, 1.2, 100, 2)}>
        <TickGlyph p={draw} />
      </Btn>
    </>
  );
};

export const worksBlocks = (): BlockSpec[] => [{ shots: ["B03a"], spec: "Then, every time | *something *works,", y: 1296, anchor: "bottom" }];

export const SceneWorks: React.FC<{ c: Cues }> = ({ c }) => {
  const b = worksBeats(c);
  const keys = camPath({ f: b.start, ...zoomAt({ x: 330, y: 1050 }, 1.02) })
    .push(b.works - 8, 0.01)
    .to(b.works - 8, zoomAt({ x: 560, y: 650 }, 1.04), 22)
    .push(b.end, 0.02).keys;
  return <Scene c={c} from={b.start} to={b.end} keys={keys} world={<WorksWorld c={c} />} />;
};

// ------------------------------------------------------------- BREAK (B05a)
const breakBeats = (c: Cues) => ({
  start: c.s.B05a.start,
  prompt: c.w("B05a", "prompt"),
  breaks: c.w("B05a", "breaks"),
  dont: c.w("B05a", ["don't", "dont"]),
  argue: c.w("B05a", "argue"),
  end: c.s.B05b.start,
});

const BUB = { x: 500, fs: 42 };
const BreakWorld: React.FC<{ c: Cues }> = ({ c }) => {
  const f = useCurrentFrame();
  const b = breakBeats(c);
  const P = { x: 40 - 480 * (1 - prog(f, b.start - 6, b.start + 14, EIO)), y: 262, w: 440 };
  const S = phoneScreen(P);
  const dark = 0.42 * prog(f, b.breaks - 4, b.breaks + 24, EIO);
  const bh = bubbleHeight(BUB.fs);
  const src = { x: P.x + P.w - 10, y: S.y + S.h * 0.3 };
  // the two "arguing" bubbles grey out as the bars strike
  const strike = [prog(f, b.argue + 2, b.argue + 16, EASE.travel), prog(f, b.argue + 7, b.argue + 21, EASE.travel)];
  const grey = prog(f, b.argue, b.argue + 14, EIO);
  const items = [
    { text: "fix it", at: b.dont, y: 620, w: Math.round(BUB.fs * 0.62 * 6 + BUB.fs * 1.44) },
    { text: "no, fix it properly", at: b.argue - 3, y: 620 + bh + 56, w: Math.round(BUB.fs * 0.6 * 19 + BUB.fs * 1.44) },
  ];
  return (
    <>
      <Phone P={P} ticks={3} dark={dark} crack={b.breaks} dy={sway(f, 3, 90)} seed={7} />
      <ChatBubble text="add dark mode" x={BUB.x} y={360} ox={src.x} oy={src.y} at={b.prompt - 2} dur={16} fs={BUB.fs} />
      {items.map((it, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, filter: grey > 0.01 ? `invert(${(0.38 * grey).toFixed(3)})` : undefined }}>
          <ChatBubble text={it.text} x={BUB.x} y={it.y} ox={src.x} oy={src.y} at={it.at - 2} dur={16} fs={BUB.fs} />
        </div>
      ))}
      {items.map((it, i) =>
        strike[i] > 0 ? (
          <div
            key={`s${i}`}
            style={{
              position: "absolute",
              left: BUB.x - 26,
              top: it.y + bh / 2 - 9,
              width: it.w + 52,
              height: 18,
              borderRadius: 5,
              background: theme.color.ink,
              transform: `scaleX(${strike[i].toFixed(4)}) rotate(-2deg)`,
              transformOrigin: "left center",
              boxShadow: "6px 9px 10px rgba(0,0,0,.22)",
            }}
          />
        ) : null,
      )}
    </>
  );
};

export const breakBlocks = (): BlockSpec[] => [
  { shots: ["B05a"], spec: "When a prompt | *breaks *your *app,", y: 1296, anchor: "bottom" },
  { shots: ["B05a"], spec: "#don't #argue | with it.", y: 1296, anchor: "bottom" },
];

export const SceneBreak: React.FC<{ c: Cues }> = ({ c }) => {
  const b = breakBeats(c);
  const keys = camPath({ f: b.start, ...zoomAt({ x: 260, y: 640 }, 1.03) })
    .push(b.breaks - 8, 0.01)
    .to(b.breaks - 8, zoomAt({ x: 260, y: 640 }, 1.07), 20)
    .to(b.dont - 6, zoomAt({ x: 540, y: 640 }, 1.0), 22)
    .push(b.end, 0.025).keys;
  return <Scene c={c} from={b.start} to={b.end} keys={keys} world={<BreakWorld c={c} />} />;
};
