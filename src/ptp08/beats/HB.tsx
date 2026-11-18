import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera, EASE, INTER, WirePath, camPath, drift, mixColor, prog, theme, useCamera } from "../../paperstudio";
import { bodyOf, useVariant, useWords } from "../timing";
import { BackCard, CHandoff, GithubTraveller, HO, handoffState, tipTf } from "./HB/handoff";
import { CaptionBlocks, HOOK_ID, cap1, findWord, hbAsset, hookPose, restyle, splitAt, useHookSpans, useLine } from "./HB/hook";
import {
  BackSheet,
  Crumbs,
  Eraser,
  FileCard,
  Flakes,
  GlassTerminal,
  HbLaptop,
  LAPTOP_AR,
  PhoneApp,
  PopDisc,
  PopNode,
  SmoothBubble,
  StrikeBar,
  contactX,
  eraseClip,
  makeCrumbs,
  phoneGeom,
  type FileCardSpec,
  type GlassLine,
} from "./HB/objects";

// ===========================================================================
// HB (ep08 hook 2 "fear of loss", variants B, BA, BC and their YT cuts):
// "If you're building apps with AI and you're not using GitHub, one bad prompt can wipe out everything you made."
//   HB1  frame 0 is the poster (the cover): the 880 px laptop, the three file cards, the phone and the paper sheets all
//        in place and "If" on; the scene settles over 20 frames and breathes. The glass types "> build an app" on the
//        words and ticks a line per file; on "apps" / "with" / "AI" the phone's rows tick, the Claude chip pops on "AI".
//   HB2  a wire draws out of the lid toward the top right; part 2: the GitHub chip pops on its end, goes grey and a
//        thick black strike bar draws across it (the wire greys too).
//   HB3  a chat bubble "add dark mode" grows out of the Claude chip, the glass types it; the app goes dark on "bad";
//        a crack web spreads over the phone on "prompt".
//   HB4  the eraser slides in from the left edge and rubs left to right along the front row, one item per word (part
//        2: the phone), each erased to pale grey paper along its contact line, rubber crumbs; each grey remain sags
//        and sheds flakes; the eraser comes to rest at the right edge.
//   Hand-off (the last HANDOFF_LEN frames): one continuous tip-over onto the body's first card, see ./HB/handoff.tsx.
// STYLE UPLIFT (big hero, three depth layers with parallax, paper grain, one-line captions on a paper lane, life on
// every object) and SMOOTHNESS (entrances 14+ f, pops 12 f, camera moves 22-24 f, cubic in-out everywhere, zero
// velocity at every join, sine drift only, no rounding on animated transforms) both applied.
// Every frame from ../timing (group-local) via word cues; the shell draws the overlay (y 290-440) and the CRT pass.
// ===========================================================================

// ---- layout (world px at the identity camera; the shell pads 0.9 about (540, 758.5): hook box = world y 427-1293).
// STYLE UPLIFT: the laptop is the hero at 880 px; the phone and the file cards stand in front of it (foreground), the
// GitHub chip on its wire beside the lid; two paper sheets lie behind everything (background); parallax 0.7 / 0.9 / 1.
const LAP = { x: 60, y: 438, w: 880 } as const;
const CLAUDE = { cx: 98, cy: 518, r: 44 } as const;
const GH = { cx: 930, cy: 528, r: 64 } as const;
const WIRE0 = { x: 678, y: 606 } as const;
const WIRE_D = `M${WIRE0.x} ${WIRE0.y} C ${WIRE0.x + 90} ${WIRE0.y}, ${GH.cx - 150} ${GH.cy}, ${GH.cx - GH.r + 6} ${GH.cy}`;
const BAR = { len: 2 * GH.r + 74, rot: -16 } as const;
const PHONE = { x: 812, y: 726, w: 230 } as const;
const CARDS: (FileCardSpec & { lean: number })[] = [
  { name: "index.html", x: 22, y: 896, w: 270, h: 212, rot: -5, lean: -8, bars: [200, 160, 176, 130] },
  { name: "App.jsx", x: 270, y: 914, w: 270, h: 212, rot: 2.5, lean: 6, bars: [180, 190, 150, 170] },
  { name: "styles.css", x: 518, y: 902, w: 270, h: 212, rot: -3, lean: -6, bars: [200, 140, 176, 150] },
];
const BUBBLE = { x: 152, y: 416, fs: 50 } as const;
/** the eraser's centre line: its long axis spans the front row (y 707-1136), below the glass's text and above the
 *  caption, so it never crosses either */
const ERASER_Y = 922;
/** the background paper (parallax 0.7): a big stage sheet under the laptop, the cards and the phone (it carries the
 *  composition down to the caption), and a small sheet behind the GitHub chip; both fully inside the frame on frame 0 */
const SHEETS = [
  { id: "hbstage", x: 24, y: 650, w: 1032, h: 640, rot: -2 },
  { id: "hbsheetR", x: 748, y: 452, w: 290, h: 220, rot: 5 },
] as const;

/** one depth layer under the kit Camera: rate 1 = the camera's own motion, below 1 = further back (moves and zooms
 *  less); exactly the world at the identity pose, so hand-offs and boundaries never shift */
const Par: React.FC<{ r: number; children: React.ReactNode }> = ({ r, children }) => {
  const { pose, anchor } = useCamera();
  const tx = (1 - r) * (pose.x - anchor.x);
  const ty = (1 - r) * (pose.y - anchor.y);
  const k = Math.pow(pose.zoom, r - 1);
  const still = Math.abs(tx) < 0.01 && Math.abs(ty) < 0.01 && Math.abs(k - 1) < 1e-5;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transformOrigin: `${(pose.x - tx).toFixed(2)}px ${(pose.y - ty).toFixed(2)}px`,
        transform: still ? undefined : `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${k.toFixed(5)})`,
      }}
    >
      {children}
    </div>
  );
};

/** monotone cubic (Fritsch-Carlson) through {f, v} keys: C1-smooth speed, never runs backwards, at rest at both ends */
const smoothPath = (keys: { f: number; v: number }[], f: number) => {
  const n = keys.length;
  if (f <= keys[0].f) return keys[0].v;
  if (f >= keys[n - 1].f) return keys[n - 1].v;
  const d = keys.slice(0, -1).map((k, i) => (keys[i + 1].v - k.v) / Math.max(1e-6, keys[i + 1].f - k.f));
  // the path starts and ends at rest (SMOOTHNESS: zero velocity at the joins)
  const m = keys.map((_, i) => (i === 0 || i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let i = 0;
  while (f > keys[i + 1].f) i++;
  const h = keys[i + 1].f - keys[i].f;
  const t = (f - keys[i].f) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * keys[i].v + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * keys[i + 1].v + (t3 - t2) * h * m[i + 1];
};

export const HB: React.FC = () => {
  const f = useCurrentFrame();
  const { s, end, ho } = useHookSpans();
  const body = bodyOf(useVariant());
  const ghSrc = hbAsset("github.svg") ?? undefined;
  const clSrc = hbAsset("claude.svg") ?? undefined;

  // ---- word cues (group-local), found in order on the real transcript; fallbacks never fire on a healthy timeline
  const ws = useWords({ from: 0, to: end });
  let cursor = -Infinity;
  const cue = (re: RegExp, fb: number) => {
    const w = findWord(ws, re, cursor);
    if (!w) return Math.max(fb, cursor);
    cursor = w.f + 1;
    return w.f;
  };
  const appsAt = cue(/^apps$/, s.HB1.start + 17);
  const withAt = cue(/^with$/, appsAt + 9);
  const aiAt = cue(/^ai$/, withAt + 5);
  const andAt = cue(/^and$/, s.HB2.start);
  const usingAt = cue(/^using$/, andAt + 24);
  const githubAt = cue(/^github$/, usingAt + 10);
  const oneAt = cue(/^one$/, s.HB3.start + 10);
  const badAt = cue(/^bad$/, oneAt + 10);
  const promptAt = cue(/^prompt$/, badAt + 8);
  const canAt = cue(/^can$/, s.HB4.start);
  const wipeAt = cue(/^wipe$/, canAt + 8);
  const outAt = cue(/^out$/, wipeAt + 8);
  const everyAt = cue(/^everything$/, outAt + 6);
  const youAt = cue(/^you$/, everyAt + 17);
  const st = handoffState(f, ho, end);

  // ---- HB1 (the poster on frame 0: the laptop rising, the prompt typing, cards dropping, the first word landing)
  // FRAME 0 POSTER: everything is already in place on frame 0 (laptop, three cards, phone, both sheets, the first
  // caption word); from there the scene settles over 20 frames (cubic in-out, from rest) and breathes
  const settle = prog(f, 0, 20, EASE.cam);
  const lapDy = 18 * (1 - settle);
  const cardDy = -10 * (1 - settle);
  const phoneDy = -8 * (1 - settle);
  // the glass types the prompt on "If you're building", then a tick line per file
  const tickLineAt = [14, 18, 22];
  const tickAt = [appsAt + 4, withAt + 1, aiAt + 1];
  const ticks = tickAt.map((a) => prog(f, a, a + 12, EASE.cam));
  // ---- HB2: the wire (20 f), the chip (12 f pop), grey (14 f), the strike bar (16 f)
  const wireP = prog(f, andAt - 2, andAt + 18, EASE.cam);
  const greyP = prog(f, githubAt, githubAt + 14, EASE.cam);
  const barP = prog(f, githubAt + 4, githubAt + 20, EASE.cam);
  const ghLabel = prog(f, usingAt + 2, usingAt + 14, EASE.cam);
  // ---- HB3: dark mode (14 f); the crack spreads over 20 f (kit ShatterOverlay)
  const darkP = prog(f, badAt - 2, badAt + 12, EASE.cam);

  // ---- HB4: the eraser path (monotone, at rest at both ends): in from the left edge before "can", the contact line
  // crosses one item per word over the whole HB4 window, then the eraser settles at the right edge (it stays on the
  // paper and turns over with the rest at the hand-off)
  const keyF = [canAt - 12, wipeAt, outAt, everyAt, youAt - 3, youAt + 7, ho - 1];
  for (let i = 1; i < keyF.length; i++) keyF[i] = Math.max(keyF[i], keyF[i - 1] + 3);
  const EX = [-300, 213, 461, 709, 950, 1150, 1230];
  const pathKeys = keyF.map((kf, i) => ({ f: kf, v: EX[i] }));
  const exAt = (fr: number) => smoothPath(pathKeys, fr);
  const lineAt = (fr: number) => (y: number) => contactX(exAt(fr), ERASER_Y, y);
  const ex = exAt(f);
  const eraserOn = f >= keyF[0];
  const pg = phoneGeom(PHONE);
  // the frame each item is fully erased (scan once from the eraser's entrance)
  const items = [...CARDS.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h, rot: c.rot })), { x: PHONE.x, y: PHONE.y, w: PHONE.w, h: pg.H, rot: 0 }];
  const doneAt = items.map((it) => {
    for (let fr = keyF[0]; fr <= end; fr++) if (eraseClip(lineAt(fr), it.x, it.y, it.w, it.h, it.rot) === "all") return fr;
    return Infinity;
  });
  const clips = items.map((it) => (f < keyF[0] ? ("none" as const) : eraseClip(lineAt(f), it.x, it.y, it.w, it.h, it.rot)));
  const sag = doneAt.map((d) => prog(f, d, d + 16, EASE.cam));
  const passAt = (x: number, y: number) => {
    for (let fr = keyF[0]; fr <= end; fr++) if (contactX(exAt(fr), ERASER_Y, y) >= x) return fr;
    return Infinity;
  };
  const crumbs = makeCrumbs(
    26,
    items.map((it) => ({ x: it.x, y: it.y, w: it.w, h: it.h })),
    passAt,
  );

  // ---- the glass: the prompt, a tick line per landed card, the dark-mode prompt; HB3 scrolls one line (14 f) and on
  // "can" the file lines scroll off the top (16 f), so the eraser, which stays below the glass's top line, never
  // crosses text on the glass
  const scroll = 172 * prog(f, oneAt - 4, oneAt + 10, EASE.cam) + 516 * prog(f, canAt - 8, canAt + 8, EASE.cam);
  const typing1 = 2 + 12 * prog(f, 1, 12, EASE.drift);
  const typing2 = 2 + 13 * prog(f, oneAt + 1, promptAt + 6, EASE.drift);
  const wiped = prog(f, doneAt[3], doneAt[3] + 12, EASE.cam);
  const blink = f % 30 < 18;
  const glassLines: GlassLine[] = [
    { text: "> build an app", chars: typing1, o: 1 - prog(f, oneAt - 4, oneAt + 6, EASE.cam), cursor: f < oneAt - 1 },
    ...CARDS.map((c, i) => ({ text: c.name, tick: true, chars: 99, o: prog(f, tickLineAt[i], tickLineAt[i] + 10, EASE.cam) * (1 - prog(f, canAt - 8, canAt + 4, EASE.cam)) })),
    { text: "> add dark mode", chars: typing2, o: f >= oneAt - 1 ? 1 - wiped : 0, cursor: f < doneAt[3] },
    { text: ">", slot: 4, chars: 1, o: wiped, cursor: true },
  ];
  const typingNow = (f >= 1 && f <= 13) || (f >= oneAt && f <= promptAt + 7);
  const glass = <GlassTerminal lines={glassLines} scroll={scroll} cursorOn={typingNow || blink} />;

  // ---- captions: one line per beat (STYLE UPLIFT), each replacing the last on the voice
  // block grouping chosen so each block's last word gets about 6 frames before the next one lands (RED TEAM RT-HB-4):
  // "If you're building apps" | "with AI" | "and you're not" | "using GitHub" | "one bad prompt" |
  // "can wipe out everything" | "you made"
  const [l1a, l1b] = splitAt(cap1(useLine("HB1")), /^with$/);
  const [l2a, l2b] = splitAt(useLine("HB2"), /^using$/);
  const l3 = restyle(useLine("HB3"), /^(bad|prompt)$/, "bi");
  const [l4a, l4b] = splitAt(useLine("HB4"), /^you$/);
  // the cover (frame 0) carries no caption; the first word's reveal starts on frame 1 (in sync with "If")
  const l1first = restyle(l1a, /^apps$/, "bi").map((tk, i) => (i === 0 ? { ...tk, at: Math.max(1, Math.min(tk.at, 1)) } : tk));
  const blocks = [[l1first], [restyle(l1b, /./, "bi")], [restyle(l2a, /^not$/, "bi")], [restyle(l2b, /./, "bar")], [l3], [restyle(l4a, /^(wipe|out)$/, "bi")], [restyle(l4b, /^made$/, "bi")]];

  // ---- camera: hold, move (22-24 f, cubic in-out), hold with a sine push; at most 1.04 (the layout fills the box);
  // one move in flight at a time; at identity and still from ho
  const keys = camPath(hookPose({ x: 540, y: 880 }, 1.0))
    .push(appsAt - 10, 0.01)
    .to(appsAt - 10, hookPose({ x: 600, y: 880 }, 1.03), 24)
    .push(andAt - 8, 0.006)
    .to(andAt - 8, hookPose({ x: 760, y: 640 }, 1.04), 24)
    .push(oneAt - 14, 0.008)
    .to(oneAt - 14, hookPose({ x: 640, y: 660 }, 1.0), 22)
    .push(canAt - 14, 0.03)
    .to(canAt - 14, hookPose({ x: 540, y: 880 }, 1.02), 22)
    .push(ho - 26, 0.006)
    .to(ho - 25, HOOK_ID, 24)
    .hold(end).keys;

  // ---- the GitHub chip travels on its own in BA; in BC the laptop and the Claude chip go to CHandoff
  const aTravel = body === "A" && f >= ho - 6;
  const cTravel = body === "C" && st.on;
  // ambient life on every object (sines, periods 60-150 f, own phases), settling to rest before the hand-off
  const still = 1 - prog(f, ho - 20, ho, EASE.cam);
  const dr = (amp: number, period: number, seed: number) => {
    const d = drift(f, amp, period, seed);
    return { x: d.x * still, y: d.y * still };
  };
  const dL = dr(1.2, 120, 3);
  const dP = dr(1.6, 96, 7);
  const dG = dr(1.4, 88, 11);
  const sway = (amp: number, period: number, seed: number) => amp * still * Math.sin(((f + seed * 13) / period) * Math.PI * 2);
  /** a paper sheet dips 2 px and settles (one smooth 18-frame dip) when something lands near it */
  const jig = (ats: number[]) => ats.reduce((a, t) => a + 2 * Math.sin(Math.PI * prog(f, t, t + 18, EASE.cam)), 0);
  const lapH = LAP.w / LAPTOP_AR;
  const tipStyle: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${HO.pivot.x}px ${HO.pivot.y}px`, transform: st.on ? tipTf(st.frontDeg, st.s) : undefined };

  return (
    <AbsoluteFill>
      <Camera box="hook" keys={keys} blur={false} hud={<CaptionBlocks f={f} blocks={blocks} lastExit={ho + 8} />}>
        {/* background: two paper sheets lying under everything (turn over with the front at the hand-off) */}
        {st.front ? (
          <div style={tipStyle}>
            <Par r={0.7}>
              <BackSheet {...SHEETS[0]} />
              <BackSheet {...SHEETS[1]} jig={jig([usingAt - 2, appsAt + 4])} />
            </Par>
          </div>
        ) : null}

        {/* C: the laptop glides into BodyC's laptop, above the sheets and under the turning remains */}
        {cTravel ? (
          <CHandoff f={f} ho={ho} end={end} from={LAP} chip={{ u: (CLAUDE.cx - LAP.x) / LAP.w, v: ((CLAUDE.cy - LAP.y) / LAP.w) * LAPTOP_AR, r: CLAUDE.r, src: clSrc }} glassFront={glass} />
        ) : null}

        {/* the front: subject and foreground layers; turns over at the hand-off */}
        {st.front ? (
          <div style={tipStyle}>
            {/* subject: the laptop with the terminal on its glass, the Claude chip on its lid, the GitHub wire and chip */}
            <Par r={0.9}>
              {cTravel ? null : (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 1080,
                    height: 1920,
                    transformOrigin: `${LAP.x + LAP.w / 2}px ${LAP.y + lapH}px`,
                    transform: `translate(${dL.x.toFixed(3)}px, ${(lapDy + dL.y).toFixed(3)}px) rotate(${sway(0.3, 140, 2).toFixed(4)}deg)`,
                  }}
                >
                  <HbLaptop b={LAP}>{glass}</HbLaptop>
                  <PopDisc f={f} cx={CLAUDE.cx} cy={CLAUDE.cy} r={CLAUDE.r} name="Claude" src={clSrc} at={aiAt - 3} />
                </div>
              )}
              {wireP > 0 ? (
                <>
                  <WirePath d={WIRE_D} p={wireP} color={mixColor(theme.color.ink, "#BDBDBD", greyP)} />
                  <PopNode f={f} cx={WIRE0.x} cy={WIRE0.y} at={andAt - 6} />
                  {f < usingAt + 4 ? <PopNode f={f} cx={GH.cx - GH.r + 6} cy={GH.cy} at={andAt + 12} /> : null}
                </>
              ) : null}
              {aTravel ? null : (
                <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${dG.x.toFixed(3)}px, ${dG.y.toFixed(3)}px)` }}>
                  <PopDisc f={f} cx={GH.cx} cy={GH.cy} r={GH.r} name="GitHub" src={ghSrc} at={usingAt - 4} opacity={1 - greyP} />
                  {greyP > 0 ? <PopDisc f={f} cx={GH.cx} cy={GH.cy} r={GH.r} name="GitHub" src={ghSrc} at={usingAt - 4} grey opacity={greyP} /> : null}
                  <StrikeBar cx={GH.cx} cy={GH.cy} len={BAR.len} p={barP} rot={BAR.rot} />
                </div>
              )}
              {ghLabel > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: GH.cx - 120,
                    top: GH.cy + GH.r + 14,
                    width: 240,
                    textAlign: "center",
                    fontFamily: INTER,
                    fontSize: 40,
                    fontWeight: 700,
                    letterSpacing: -0.6,
                    color: mixColor(theme.color.label, "#9C9C9C", greyP),
                    transform: `translateY(${(6 * (1 - ghLabel)).toFixed(3)}px)`,
                    willChange: "transform",
                    opacity: ghLabel * (body === "A" ? 1 - prog(f, ho - 6, ho + 6, EASE.cam) : 1),
                  }}
                >
                  github
                </div>
              ) : null}
              {/* HB3: the prompt bubble grows out of the Claude chip and shrinks back into it on "can" */}
              <SmoothBubble f={f} text="add dark mode" x={BUBBLE.x} y={BUBBLE.y} ox={CLAUDE.cx + 24} oy={CLAUDE.cy + 8} at={oneAt - 4} dur={14} fs={BUBBLE.fs} out={{ at: canAt - 10, dur: 14 }} />
            </Par>

            {/* foreground: the file cards in front of the laptop's deck, the phone, the eraser and its crumbs */}
            <Par r={1}>
              {CARDS.map((c, i) => {
                const cs = dr(0.8, 100 + i * 17, 20 + i);
                return (
                  <FileCard
                    key={c.name}
                    c={c}
                    clip={clips[i]}
                    sag={sag[i]}
                    lean={c.lean + sway(0.4, 110 + i * 9, i)}
                    tf={`translate(${cs.x.toFixed(3)}px, ${(cardDy + cs.y).toFixed(3)}px)`}
                  />
                );
              })}
              {
                <PhoneApp
                  p={{ x: PHONE.x + dP.x * (1 - sag[3]), y: PHONE.y + dP.y * (1 - sag[3]), w: PHONE.w }}
                  ticks={ticks}
                  dark={darkP}
                  crack={{ at: promptAt - 2, dur: 20 }}
                  clip={clips[3]}
                  sag={sag[3]}
                  tf={`translateY(${phoneDy.toFixed(3)}px) rotate(${sway(0.3, 130, 5).toFixed(4)}deg) perspective(1600px) rotateY(-9deg)`}
                />
              }
              <Crumbs f={f} crumbs={crumbs} />
              {items.map((it, i) => (
                <Flakes key={i} f={f} at={doneAt[i]} x0={it.x} x1={it.x + it.w} y={it.y + it.h + 6} seed={60 + i * 7} n={i === 3 ? 6 : 4} />
              ))}
              {eraserOn ? (
                <Eraser
                  cx={ex}
                  cy={ERASER_Y + 4 * still * Math.sin(((f - keyF[0]) / 46) * Math.PI * 2)}
                  rot={1.2 * still * Math.sin(((f - keyF[0]) / 58) * Math.PI * 2)}
                />
              ) : null}
            </Par>
          </div>
        ) : null}

        {/* A: the struck GitHub chip flies to the card's slot, turning with the board */}
        {aTravel ? <GithubTraveller f={f} ho={ho} end={end} lead={6} from={{ cx: GH.cx + dG.x, cy: GH.cy + dG.y, r: GH.r }} src={ghSrc} bar={BAR} /> : null}

        {/* A / B: the body's first card on the board's back; exactly the body's frame 0 on the last hook frame */}
        {(body === "A" || body === "B") && st.back ? <BackCard body={body} deg={st.backDeg} s={st.s} last={st.last} /> : null}
      </Camera>
    </AbsoluteFill>
  );
};
