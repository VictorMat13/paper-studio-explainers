// Scene 1, LAPTOP: C01a, C01b, C02a, C03a (one kit Camera; frame 0 = the first card at identity).
//   C01a  the text beat "Here's the / problem." lands word by word above the laptop (110 px on screen, hud).
//   C01b  pull back to 0.92; five robots rise behind the lid one per spoken word ('most people building'); on 'copy'
//         the '1 copy' pill bumps and an ink ring draws round the app; on 'one laptop' a second pill pops on the deck
//         and the robots duck; on 'every request rewrites it' the camera pushes onto the glass and three black chat
//         bubbles pop over the deck one after another, each reshuffling two lines of the file tree.
//   C02a  'breaks': a crack web runs over the app window and it greys; 'no way': a clock chip pops right of the lid and
//         a dashed ghost of the app (an hour ago) slides out from behind the laptop under it; 'back': a black bar
//         strikes across the ghost; 'hour ago': the clock winds back one hour and the struck ghost fades to nothing.
//   C03a  'dies': the screen goes dark grey and a crack runs over the glass, the clock drops away; 'whole project':
//         the laptop tilts and starts to sink; 'goes with it': it sinks toward the bottom (the cut lands on the slab).
// Captions in the hud, top band (screen y 290+). Every frame from cues (group-local).
import React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, ChatBubble, EASE, ShatterOverlay, camPath, mix, prog, zoomAt, type CapWord } from "../../../paperstudio";
import type { BC } from "./cues";
import { APP, AppScreen, FC, InkPill, LAP, Laptop, SCREEN, cardAmbient, screenPoint } from "./firstCard";
import { BackSheets, ClockChip, GhostCard, Place, StrikeBar } from "./objects";
import { capLayout, Pages, Robot, SMOOTH, sway, swell, wsFrom, type CapBlock } from "./parts";

/** hud y of the top caption band (screen 290 through the 0.9 pad) */
export const CAP_TOP = 240;

const ROBOT_X = [168, 288, 408, 528, 646];
const ROBOT_H = 230;
/** the lid's outer top edge (world y at x) */
const lidY = (x: number) => 625 - 0.11 * (x - 95);

const CLOCK = { cx: 880, cy: 648, r: 104 };
const GHOST = { cx: 868, cy: 862, w: 290, h: 200 };
const BUBBLE = { x: 470, y: 968, fs: 44 };
const LAPTOP_PILL = { cx: 290, cy: 1186 };

/** world point the camera pushes onto for the glass */
const GLASS_P = { x: 470, y: 830 };

const cues = (c: BC) => {
  const S = c.s;
  return {
    S,
    most: c.at("C01b", "most"),
    buildEnd: c.end("C01b", "building"),
    copy: c.at("C01b", "copy"),
    one2: c.at("C01b", "one", 1),
    laptop: c.at("C01b", "laptop"),
    every: c.at("C01b", "every"),
    request: c.at("C01b", "request"),
    rewrites: c.at("C01b", "rewrites"),
    breaks: c.at("C02a", "breaks"),
    no: c.at("C02a", "no"),
    back: c.at("C02a", "back"),
    hour: c.at("C02a", "hour"),
    ago: c.at("C02a", "ago"),
    dies: c.at("C03a", "dies"),
    whole: c.at("C03a", "whole"),
    goes: c.at("C03a", "goes"),
  };
};

/** the file tree's row slot of each file after 0..3 reshuffles (each swaps two files) */
const SHUFFLES: [number, number][] = [
  [0, 2],
  [1, 4],
  [3, 0],
];
const slotsAfter = (n: number) => {
  const s = [0, 1, 2, 3, 4];
  for (let i = 0; i < n; i++) {
    const [a, b] = SHUFFLES[i];
    const t = s[a];
    s[a] = s[b];
    s[b] = t;
  }
  return s;
};

export const LaptopScene: React.FC<{ c: BC }> = ({ c }) => {
  const f = useCurrentFrame();
  const k = cues(c);
  const S = k.S;

  // ---------------------------------------------------------------- the laptop and its glass
  const amb = cardAmbient(f);
  const shuffleAt = [k.every + 3, k.request + 3, k.rewrites + 3];
  const prev = shuffleAt.filter((a) => f >= a + 10).length;
  let slots = slotsAfter(prev);
  const hot = [0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const a = shuffleAt[i];
    if (f >= a && f < a + 10) {
      const from = slotsAfter(i);
      const to = slotsAfter(i + 1);
      const p = prog(f, a, a + 14, EASE.travel);
      slots = from.map((v, j) => mix(v, to[j], p));
    }
    const [x, y] = SHUFFLES[i];
    const h = prog(f, a, a + 14, SMOOTH) * (1 - prog(f, a + 16, a + 30, SMOOTH));
    hot[x] = Math.max(hot[x], h);
    hot[y] = Math.max(hot[y], h);
  }
  // C01b: an ink ring draws round the app window on 'copy' and fades on 'laptop'
  const ringP = prog(f, k.copy - 1, k.copy + 13, EASE.travel);
  const ringO = 1 - prog(f, k.laptop, k.laptop + 14, SMOOTH);
  // C02a: the crack and the grey veil on the app; the glass crack and power off in C03a
  const broken = prog(f, k.breaks, k.breaks + 14, SMOOTH);
  const power = 1 - prog(f, k.dies - 2, k.dies + 12, SMOOTH);
  const appKids = (
    <>
      {ringP > 0.001 && ringO > 0.001 ? (
        <svg width={APP.w} height={APP.h} style={{ position: "absolute", left: 0, top: 0, opacity: ringO }}>
          <rect x={7} y={7} width={APP.w - 14} height={APP.h - 14} rx={APP.r - 6} fill="none" stroke="#111" strokeWidth={14} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ringP} />
        </svg>
      ) : null}
      {broken > 0.001 ? <div style={{ position: "absolute", inset: 0, background: "#8E8E8E", opacity: 0.32 * broken, mixBlendMode: "multiply" }} /> : null}
      {/* the crack is drawn at 1/2.4 size and scaled up, so its ink reads at the glass's small scale */}
      <div style={{ position: "absolute", left: 0, top: 0, width: APP.w / 2.4, height: APP.h / 2.4, transform: "scale(2.4)", transformOrigin: "0 0" }}>
        <ShatterOverlay x={0} y={0} w={APP.w / 2.4} h={APP.h / 2.4} ox={(APP.w * 0.78) / 2.4} oy={(APP.h * 0.8) / 2.4} seed={11} at={k.breaks} dur={16} radius={APP.r / 2.4} />
      </div>
    </>
  );
  const glass =
    f >= k.dies - 2 ? (
      <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN.w / 2.4, height: SCREEN.h / 2.4, transform: "scale(2.4)", transformOrigin: "0 0" }}>
        <ShatterOverlay x={0} y={0} w={SCREEN.w / 2.4} h={SCREEN.h / 2.4} ox={(SCREEN.w * 0.62) / 2.4} oy={(SCREEN.h * 0.42) / 2.4} seed={23} at={k.dies} dur={16} radius={0} />
      </div>
    ) : null;

  // C03a: tilt and sink (the pill rides along)
  const tilt = -4 * prog(f, k.whole - 2, k.whole + 18, EASE.travel);
  const sink = 600 * prog(f, k.whole - 2, S.C03a.end + 10, EASE.travel);
  const lapTf = `translateY(${(amb.bob + sink).toFixed(2)}px) rotate(${tilt.toFixed(3)}deg)`;

  // '1 copy' pill: bumps on 'copy'
  const pillK = 1 + 0.14 * swell(f, k.copy - 1, 14);

  // ---------------------------------------------------------------- robots behind the lid (C01b)
  const robots = ROBOT_X.map((x, i) => {
    const at = Math.round(mix(k.most - 1, k.buildEnd - 4, i / 4));
    const up = prog(f, at, at + 14, SMOOTH);
    const down = prog(f, k.laptop - 3 + 2 * i, k.laptop + 13 + 2 * i, EASE.travel);
    const dy = 250 * (1 - up) + 270 * down + sway(f, 3, 64 + 9 * i, i);
    const blink = swell(f, at + 26 + 9 * i, 14);
    if (up <= 0.001 || down >= 0.999) return null;
    return <Robot key={i} cx={x} bottom={lidY(x) + 82} h={ROBOT_H} dy={dy} tilt={sway(f, 1.6, 70 + 7 * i, i + 3)} blink={blink} />;
  });

  // ---------------------------------------------------------------- 'one laptop' pill on the deck (C01b .4)
  const lpP = prog(f, k.one2 - 1, k.one2 + 13, SMOOTH);
  const lpOut = prog(f, S.C02a.start, S.C02a.start + 14, EASE.travel);
  const lpK = 1 + 0.12 * swell(f, k.laptop - 1, 14);

  // ---------------------------------------------------------------- chat bubbles (C01b .5)
  const src = screenPoint(1180, 860);
  // SMOOTHNESS: the voice gives 'every request rewrites' only 11-15 frames a word, too little for three bubbles to
  // replace each other without overlapping, so one request bubble pops on 'every' (the tree still reshuffles on all
  // three words) and leaves before the prompt that breaks the app ('add dark mode') pops as C02a starts.
  const bubbleAt = [k.every, S.C02a.start - 4];
  const bubbleText = ["add a login", "add dark mode"];
  const bubbleOut = [S.C02a.start - 22, k.breaks + 10];
  const bubbles = bubbleAt.map((at, i) => {
    const out = bubbleOut[i];
    if (f < at || f >= out + 16) return null;
    return <ChatBubble key={i} text={bubbleText[i]} x={BUBBLE.x} y={BUBBLE.y} ox={src.x} oy={src.y} at={at} dur={16} arc={40} fs={BUBBLE.fs} opacity={1 - prog(f, out, out + 16, EASE.drift)} />;
  });

  // ---------------------------------------------------------------- clock and ghost (C02a)
  const clockP = prog(f, k.no - 3, k.no + 11, SMOOTH);
  const wind = prog(f, k.hour - 3, k.hour + 21, EASE.travel);
  const clockFall = prog(f, k.dies, k.dies + 16, EASE.travel);
  const ghostIn = prog(f, k.no - 1, k.no + 13, SMOOTH);
  const ghostGone = prog(f, k.ago - 2, k.ago + 14, SMOOTH);
  const barP = prog(f, k.back - 2, k.back + 12, EASE.travel);

  // ---------------------------------------------------------------- camera
  const P_BACK = { x: 540, y: 732, zoom: 0.92 };
  const P_GLASS = zoomAt(GLASS_P, 1.12);
  const P_CRACK = zoomAt({ x: FC.app.x, y: FC.app.y }, 1.16);
  const P_RIGHT = zoomAt({ x: 820, y: 720 }, 1.04);
  const P_CLOCK = zoomAt({ x: CLOCK.cx, y: CLOCK.cy }, 1.12);
  const P_DIE = { x: 540, y: 790, zoom: 0.96 };
  const keys = camPath({ f: 0 })
    .push(S.C01b.start - 2, 0.02)
    .to(S.C01b.start - 2, P_BACK, 22)
    .push(k.every - 5, 0.015)
    .to(k.every - 4, P_GLASS, 22)
    .push(k.breaks - 4, 0.012)
    .to(k.breaks - 3, P_CRACK, 22)
    .push(k.no - 5, 0.01)
    .to(k.no - 4, P_RIGHT, 22)
    .push(k.hour - 5, 0.012)
    .to(k.hour - 4, P_CLOCK, 22)
    .push(S.C03a.start - 2, 0.01)
    .to(S.C03a.start - 2, P_DIE, 22)
    .push(S.C03a.end + 10, 0.024).keys;

  // ---------------------------------------------------------------- captions (hud)
  const w1 = c.ws("C01a");
  const beat: CapWord[][] = [
    w1.slice(0, 2).map((w) => ({ t: w.w, s: "huge" as const, at: w.f })),
    w1.slice(2).map((w) => ({ t: w.w, s: "huge" as const, at: w.f })),
  ].filter((l) => l.length);
  const w2 = c.ws("C01b");
  const w3 = c.ws("C02a");
  const w4 = c.ws("C03a");
  const top = (lines: CapWord[][]): CapBlock => ({ lines, y: CAP_TOP, anchor: "top", w: 980 });
  const pages: CapBlock[][] = [
    [{ lines: beat, y: CAP_TOP - 6, anchor: "top", w: 1040, k: 1.03 }],
    [top(capLayout(w2, "Most people / *building with AI*"))],
    [top(capLayout(wsFrom(w2, "have"), "have *one copy* / of their app,"))],
    [top(capLayout(wsFrom(w2, "on"), "on *one laptop,*"))],
    [top(capLayout(wsFrom(w2, "and"), "and *every request* / *rewrites it.*"))],
    [top(capLayout(w3, "So a prompt / *breaks something,*"))],
    [top(capLayout(wsFrom(w3, "and"), "and there's / [no way back]"))],
    [top(capLayout(wsFrom(w3, "to"), "to the version / *from an hour ago.*"))],
    [top(capLayout(w4, "Or the laptop / *dies,*"))],
    [top(capLayout(wsFrom(w4, "and"), "and the *whole project* / goes with it."))],
  ];

  return (
    <Camera keys={keys} blur={false} hud={<Pages pages={pages} until={S.C03a.end - 6} />}>
      {/* background paper sheets peeking at the edges (parallax 0.7) */}
      <BackSheets f={f} layout={0} inP={prog(f, 4, 22, SMOOTH)} />
      {/* robots behind the lid */}
      {robots}
      {/* the ghost card slides out from behind the laptop (drawn under it) */}
      {ghostIn > 0.001 && ghostGone < 0.999 ? (
        <Place cx={GHOST.cx - 120 * (1 - ghostIn)} cy={GHOST.cy} k={mix(0.9, 1, ghostIn) * mix(1, 0.94, ghostGone)} opacity={Math.min(1, ghostIn * 1.5) * (1 - ghostGone)} rot={-3 * (1 - ghostIn)}>
          <GhostCard w={GHOST.w} h={GHOST.h} />
          <StrikeBar x0={-GHOST.w / 2 - 24} x1={GHOST.w / 2 + 24} y={0} p={barP} h={20} rot={-6} />
        </Place>
      ) : null}
      {/* the laptop with the app on its glass and the '1 copy' pill (frame 0 = FirstCard t 0) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${FC.centre.x}px ${LAP.y + LAP.h}px`, transform: lapTf }}>
        <Laptop t={f} power={power} glass={glass}>
          <AppScreen t={f} tree={{ slots, hot }} appChildren={appKids} />
        </Laptop>
        <InkPill cx={FC.pill.cx} cy={FC.pill.cy + amb.pillBob} rot={FC.pill.rot + amb.sway} text={FC.pill.text} fs={FC.pill.fs} scale={pillK} />
      </div>
      {/* 'one laptop' pill on the deck's front-left corner */}
      <InkPill cx={LAPTOP_PILL.cx} cy={LAPTOP_PILL.cy + sway(f, 1.5, 58, 4)} rot={-4 + sway(f, 0.6, 70, 2)} text="one laptop" fs={44} p={lpP} scale={lpK * mix(1, 0.7, lpOut)} opacity={1 - lpOut} />
      {/* chat bubbles over the deck */}
      {bubbles}
      {/* the clock chip right of the lid */}
      <Place cx={CLOCK.cx + 30 * clockFall} cy={CLOCK.cy + 420 * clockFall} p={clockP} rot={sway(f, 1.2, 64, 5) + 24 * clockFall} opacity={1 - prog(f, k.dies + 6, k.dies + 20, SMOOTH)}>
        <ClockChip r={CLOCK.r} hour={305 - 30 * wind} minute={60 - 360 * wind} />
      </Place>
    </Camera>
  );
};

