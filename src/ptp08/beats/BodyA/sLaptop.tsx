// A08a-A10b: the laptop (the timeline lives on its screen; it dies), then push (cards fly up a dashed arrow to the
// GitHub slab and the whole history lives online in a GitHub card), then clone (a tool card, a second laptop, the
// timeline copied down onto its screen). World px. The laptop is ep06's laptop.png in the kit ScreenInset.
import React from "react";
import { DashedArrow, EASE, INTER, META06, MONO, PaperCard, Pill, ScreenInset, ShatterOverlay, WirePath, mix, prog, theme } from "../../../paperstudio";
import { PHOTOS } from "./assets";
import { CommitCard } from "./commit";
import type { Cues } from "./cues";
import { Crumbs, ToolCard } from "./objects";
import { MAIN_NODES, TimelineRow, type TLState } from "./timeline";
import { WordChip } from "../Shared/wordChip";
import { Slab } from "./slab";
import { type Squeeze } from "./sCommit";
import { pulse, SM } from "./util";
import { Sheets } from "./depth";
import { Pop } from "./pop";

const ASPECT = META06.laptop.aspect;
const QUAD = META06.laptop.quad;
/** the big laptop (A08) and the two small ones (A09-A10) */
export const BIG = { x: 90, y: 580, w: 900 } as const;
export const L1 = { x: 20, y: 940, w: 430 } as const;
export const L2 = { x: 630, y: 940, w: 430 } as const;
export const SLAB_P = { cx: 170, cy: 720, s: 1.2 } as const;
export const GH = { x: 320, y: 600, w: 720, h: 300 } as const;
/** the mini timeline in the GitHub card: the main row at this scale, placed inside the card */
/** the repo card's rows: the history, newest first (N4, N3, N2 of the main row) */
const ROWS = [MAIN_NODES[4], MAIN_NODES[3], MAIN_NODES[2]];
const ROW_TOP = 92;
const ROW_H = 66;
const rowCentre = (i: number) => ({ x: GH.x + 330, y: GH.y + ROW_TOP + i * ROW_H + ROW_H / 2 - 3 });
export const ARROW_UP = "M150 978 C 138 918, 160 872, 170 852";
export const ARROW_DOWN = "M862 888 C 872 924, 852 954, 836 978";

/** screen centroid of a laptop placed at (x, y, w) */
const centroid = (x: number, y: number, w: number) => {
  const h = w / ASPECT;
  const cx = QUAD.reduce((a, q) => a + q[0], 0) / 4;
  const cy = QUAD.reduce((a, q) => a + q[1], 0) / 4;
  return { x: x + cx * w, y: y + cy * h };
};

export const laptopCues = (c: Cues) => {
  const a8 = c.s.A08a.start;
  const laptopW = c.at("A08a", /^laptop$/, 60);
  const a8b = c.s.A08b.start;
  const dies = c.at("A08b", /^dies$/, 6);
  const gone = c.at("A08b", /^gone$/, 24);
  const a9 = c.s.A09a.start;
  const push = c.at("A09a", /^push$/, 6);
  const words9 = c.w.A09a.map((w) => w.f);
  const github = c.at("A09a", /^github$/, 30);
  const a9b = c.s.A09b.start;
  const history = c.at("A09b", /^history$/, 14);
  const online = c.at("A09b", /^online$/, 40);
  const a10 = c.s.A10a.start;
  const tool = c.at("A10a", /^tool$/, 10);
  const same = c.at("A10a", /^same$/, 50);
  const reverse = c.at("A10a", /^reverse$/, 90);
  const a10b = c.s.A10b.start;
  const cloning = c.at("A10b", /^cloning$/, 2);
  const words10b = c.w.A10b.map((w) => w.f);
  const computer = c.at("A10b", /^computer$/, 60);
  const a11 = c.s.A11a.start;
  return { a8, laptopW, a8b, dies, gone, a9, push, words9, github, a9b, history, online, a10, tool, same, reverse, a10b, cloning, words10b, computer, a11 };
};
export type LaptopCues = ReturnType<typeof laptopCues>;

/** a scene change as one horizontal pan: the old scene leaves left as the new one arrives from the right */
export const PAN = 1300;
export const panOut = (f: number, at: number) => prog(f, at - 10, at + 16, EASE.cam);

/** the big laptop rises in A08a; the flat timeline (sCommit) flies onto its screen and hands over to the inset */
export const ARRIVE = 18;
export const laptopSqueeze = (q: LaptopCues) => (f: number): Squeeze => {
  const p = prog(f, q.a8 - 1, q.a8 + ARRIVE, EASE.cam);
  // the squeezed row's visual centre (A07b) and the screen centroid of the big laptop
  // the pair the camera shows (N3 and N4 with their cards) flies onto the glass
  const from = { x: 640, y: 985 };
  const to = centroid(BIG.x, BIG.y, BIG.w);
  const s = mix(1, 0.52, p);
  const cx = mix(from.x, to.x, p);
  const cy = mix(from.y, to.y, p);
  const o = 1 - prog(f, q.a8 + ARRIVE - 4, q.a8 + ARRIVE + 4, SM);
  return {
    tf: `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) scale(${s.toFixed(4)}) translate(${(-from.x).toFixed(2)}px, ${(-from.y).toFixed(2)}px)`,
    o,
    x0: mix(-420, 0, p),
    x1: mix(1500, 1080, p),
  };
};

/** the laptop's pose (A08a rise, A08b sink, A09a back to life and over to the L1 slot) */
const laptopPose = (f: number, q: LaptopCues) => {
  const rise = prog(f, q.a8 - 6, q.a8 + 16, SM);
  const sink = prog(f, q.dies, q.dies + 20, EASE.cam) * (1 - prog(f, q.a9, q.a9 + 16, EASE.cam));
  const move = prog(f, q.a9 + 2, q.a9 + 22, EASE.cam);
  const x = mix(BIG.x, L1.x, move);
  const w = mix(BIG.w, L1.w, move);
  const y = mix(BIG.y + 900 * (1 - rise) + 60 * sink, L1.y, move);
  return { x, y, w, rise };
};

/** the timeline as it appears on a laptop screen (content px 1600 x 1000) */
const ScreenRow: React.FC<{ states: TLState[]; opacity?: number; t?: number }> = ({ states, opacity = 1, t = 0 }) => {
  // the newest pair (N3, N4: world x 110-1170, y 865-1090) fills the 1600 x 1000 screen
  const k = 1.42;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${(800 - 640 * k).toFixed(1)}px, ${(500 - 978 * k).toFixed(1)}px) scale(${k})`, opacity }}>
      <TimelineRow nodes={MAIN_NODES} states={states} x0={-400} x1={1700} t={t} />
    </div>
  );
};
const HEALTHY: TLState[] = MAIN_NODES.map(() => ({ land: 1 }));

/** a faint mouse pointer drifting over a laptop screen (content px), so the screen is never a frozen picture */
const Pointer: React.FC<{ t: number; seed?: number; opacity?: number }> = ({ t, seed = 0, opacity = 1 }) => {
  const x = 1060 + 170 * Math.sin((t + seed * 40) / 46) + 60 * Math.sin((t + seed * 13) / 17);
  const y = 760 + 70 * Math.cos((t + seed * 21) / 39);
  return (
    <svg width={44} height={60} viewBox="0 0 22 30" style={{ position: "absolute", left: x, top: y, opacity: 0.85 * opacity, filter: "drop-shadow(2px 3px 2px rgba(0,0,0,.3))" }}>
      <path d="M1 1 L1 24 L7 18.5 L11 28 L15 26.3 L11 17 L19 17 Z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
};

/** where card i flies from (the L1 screen) and to (its slot in the GitHub card's mini row) */

export const LaptopScene: React.FC<{ f: number; q: LaptopCues; broken: TLState[] }> = ({ f, q, broken }) => {
  if (f < q.a8 - 6 || f >= q.a11 + 18) return null;
  const L = laptopPose(f, q);
  // into the branch scene: one horizontal pan of the world (the branch scene comes in from the right by the same amount)
  const off = panOut(f, q.a11);
  const offX = -PAN * off;

  // ---- screen content: the broken row (A08a-A08b), dark + crack + crumbs, then healthy again (A09a)
  // the timeline is on the glass from the laptop's first frame (the flying row lands onto it, never a blank screen)
  const insetIn = 1;
  const dark = prog(f, q.dies - 2, q.dies + 8, SM) * (1 - prog(f, q.a9, q.a9 + 12, SM));
  const crackO = 1 - prog(f, q.a9, q.a9 + 10, SM);
  const crumb = prog(f, q.gone - 2, q.gone + 22, SM);
  const rowGone = prog(f, q.gone - 2, q.gone + 8, SM);
  const healthy = prog(f, q.a9 + 2, q.a9 + 12, SM);

  // ---- push (A09a): slab drops in, arrow up, cards fly to the GitHub card slots
  const slabIn = prog(f, q.a9 + 2, q.a9 + 22, SM);
  // oldest first (row 2, then 1, then 0), one per word from "push"
  const flyAt = (i: number) => q.push + 2 + (2 - i) * Math.max(5, Math.round((q.github + 4 - q.push) / 3));
  const rowAt = (i: number) => Math.max(flyAt(i) + 16, q.a9b - 2 + (2 - i) * 4);
  const ghIn = prog(f, q.a9b - 6, q.a9b + 10, SM);
  const pushChip = 1 - prog(f, q.a10, q.a10 + 12, SM);

  // ---- clone (A10a-A10b)
  const l2In = prog(f, q.same - 10, q.same + 10, SM);
  const copyAt = (i: number) => (q.words10b[1 + i] ?? q.cloning + 6 + i * 7) - 2;
  const arrive2 = (i: number) => prog(f, copyAt(i), copyAt(i) + 16, EASE.travel);
  // L2 shows the copied history once the last copy is in
  const l2Row = MAIN_NODES.map(() => ({ land: 1 }));
  const l2Show = prog(f, copyAt(2) + 10, copyAt(2) + 20, SM);
  const firstArrowO = 1 - 0.55 * prog(f, q.reverse - 6, q.reverse + 4, SM);

  const from1 = centroid(L.x, L.y, L.w);
  const to2 = centroid(L2.x, L2.y, L2.w);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translateX(${offX.toFixed(1)}px)` }}>
      {/* stage sheets: behind the big laptop (A08), then behind the GitHub card and under the two laptops (A09-A10) */}
      <Sheets f={f} sheets={[{ x: 30, y: 560, w: 1020, h: 720, rot: -2, tone: 1 }]} opacity={1 - prog(f, q.a9, q.a9 + 12, SM)} dy={760 * (1 - L.rise)} />
      {f >= q.a9 - 2 ? (
        <Sheets
          f={f}
          sheets={[
            { x: 300, y: 560, w: 800, h: 340, rot: 2 },
            { x: -50, y: 930, w: 1180, h: 400, rot: -1, tone: 1 },
          ]}
          dx={-1200 * (1 - prog(f, q.a9 - 2, q.a9 + 16, SM))}
        />
      ) : null}
      {/* ---------------- the GitHub side (A09a-A10b): the repo card lists the history as rows (newest first), mono hash
          38 px and message 34 px, so it reads at every framing */}
      {ghIn > 0.001 ? (
        <Pop at={q.a9b - 6} dur={16} ox={GH.x + GH.w / 2} oy={GH.y + GH.h / 2}>
          <PaperCard x={GH.x} y={GH.y + 0.8 * Math.sin(f / 57)} w={GH.w} h={GH.h} sheets={1}>
            <div style={{ position: "absolute", left: 30, top: 18, fontFamily: MONO, fontWeight: 700, fontSize: 36, color: theme.color.ink }}>my-app</div>
            <div style={{ position: "absolute", left: 28, right: 28, top: 74, height: 3, borderRadius: 2, background: "#ECEBE9" }} />
            {ROWS.map((r, i) => {
              const rp = prog(f, rowAt(i) - 2, rowAt(i) + 10, SM);
              return (
                <div key={i} style={{ position: "absolute", left: 16, right: 16, top: ROW_TOP + i * ROW_H, height: ROW_H - 6, paddingLeft: 14, borderRadius: 10, background: `rgba(0,0,0,${(0.06 * pulse(f, copyAt(i) - 4, 18)).toFixed(3)})`, display: "flex", alignItems: "center", gap: 20, whiteSpace: "nowrap", opacity: rp, transform: `translateY(${(8 * (1 - rp)).toFixed(2)}px)` }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, background: "radial-gradient(circle at 35% 30%, #9a9a9a 0%, #5a5a5a 70%)", flex: "none" }} />
                  <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 38, color: theme.color.ink }}>{r.c.hash}</span>
                  <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 34, color: "#3A3A3A" }}>{r.c.msg}</span>
                </div>
              );
            })}
          </PaperCard>
        </Pop>
      ) : null}
      {/* the three cards fly up from L1 along the arrow (A09a), one after another, and settle into the card's rows */}
      {ROWS.map((r, i) => {
        const t0 = flyAt(i);
        const p = prog(f, t0, t0 + 18, EASE.travel);
        if (p <= 0.001) return null;
        const to = rowCentre(i);
        // a quadratic path up the arrow, then over to the row
        const c1 = { x: 180, y: 700 };
        const u = 1 - p;
        const x = u * u * from1.x + 2 * u * p * c1.x + p * p * to.x;
        const y = u * u * from1.y + 2 * u * p * c1.y + p * p * to.y;
        // it stays a card until the card under it exists, then hands over to its row
        const handOver = prog(f, Math.max(t0 + 16, rowAt(i) - 2), Math.max(t0 + 16, rowAt(i) - 2) + 10, SM);
        if (handOver >= 0.999) return null;
        return <CommitCard key={i} cx={x} cy={y} c={r.c} s={mix(0.26, 0.5, p)} opacity={Math.min(1, p * 4) * (1 - handOver)} rot={8 * Math.sin(Math.PI * p)} />;
      })}
      {/* the tool card pops into the card's lower right (A10a) */}
      {f >= q.tool - 4 ? (
        <ToolCard cx={GH.x + GH.w - 98} cy={GH.y + GH.h - 40} w={160} rot={-4} s={mix(0.6, 1, prog(f, q.tool - 4, q.tool + 8, SM))} opacity={Math.min(1, prog(f, q.tool - 4, q.tool + 8, SM) * 1.6)} />
      ) : null}
      {f >= q.a9 ? <Slab cx={SLAB_P.cx} cy={mix(SLAB_P.cy - 420, SLAB_P.cy, slabIn)} s={SLAB_P.s} opacity={Math.min(1, slabIn * 2)} sheen={prog(f, q.github - 4, q.github + 20, EASE.travel)} /> : null}
      {/* the 'online' pill sets down at the card's top right */}
      {f >= q.online - 4 ? (
        <Pop at={q.online - 4} ox={GH.x + GH.w - 100} oy={GH.y + 40}>
          <Pill x={GH.x + GH.w - 100} y={GH.y + 14} text="online" light fs={34} />
        </Pop>
      ) : null}

      {/* ---------------- arrows */}
      {f >= q.push - 6 ? <DashedArrow d={ARROW_UP} at={q.push - 6} dur={16} w={7} opacity={firstArrowO} /> : null}
      {f >= q.reverse - 10 ? <DashedArrow d={ARROW_DOWN} at={q.reverse - 10} dur={16} w={7} /> : null}

      {/* ---------------- laptops */}
      {L.rise > 0.001 ? (
        <ScreenInset x={L.x} y={L.y} w={L.w} src={PHOTOS.laptop} screenBg="#F3F2EF">
          <ScreenRow states={broken} opacity={insetIn * (1 - rowGone) * (1 - healthy)} t={f} />
          <ScreenRow states={HEALTHY} opacity={healthy} t={f} />
          <Pointer t={f} opacity={insetIn * (1 - dark)} />
          {dark > 0.001 ? <div style={{ position: "absolute", inset: 0, background: "#2F2F31", opacity: 0.88 * dark }} /> : null}
          {f >= q.dies + 1 && crackO > 0.001 ? (
            <div style={{ position: "absolute", inset: 0, opacity: crackO }}>
              <ShatterOverlay x={0} y={0} w={1600} h={1000} ox={1040} oy={360} seed={23} at={q.dies} dur={14} radius={0} />
            </div>
          ) : null}
          {crumb > 0.001 && f < q.a9 ? <Crumbs x={80} y={180} w={1440} h={640} p={crumb} n={70} seed={9} fall={700} /> : null}
        </ScreenInset>
      ) : null}
      {l2In > 0.001 ? (
        <ScreenInset x={L2.x} y={L2.y + 520 * (1 - l2In)} w={L2.w} src={PHOTOS.laptop} screenBg="#F3F2EF">
          <ScreenRow states={l2Row} t={f} opacity={l2Show} />
          <Pointer t={f} seed={3} />
        </ScreenInset>
      ) : null}

      {/* the copies (A10b, FINAL watch fix): each copy slides out from UNDER the repo card's lower edge (clipped to the
          paper below the card, so it never passes over a row's text) and travels down the dashed arrow onto L2's screen;
          its row lights up softly as it is copied */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, clipPath: `inset(${GH.y + GH.h + 2}px -400px -400px -400px)` }}>
      {ROWS.map((r, i) => {
        const p = arrive2(i);
        if (p <= 0.001 || p >= 0.999) return null;
        const fromS = { x: 846, y: GH.y + GH.h - 70 };
        const c1 = { x: 880, y: 990 };
        const u = 1 - p;
        const x = u * u * fromS.x + 2 * u * p * c1.x + p * p * to2.x;
        const y = u * u * fromS.y + 2 * u * p * c1.y + p * p * to2.y;
        return <CommitCard key={`c${i}`} cx={x} cy={y} c={r.c} s={mix(0.42, 0.22, p)} opacity={Math.min(1, p * 6, (1 - p) * 5)} rot={-6 * Math.sin(Math.PI * p)} />;
      })}
      </div>
      {/* ---------------- word chips */}
      {f >= q.push && pushChip > 0.001 ? <WordChip x={540} y={928} word="push" size={52} at={q.push} opacity={pushChip} /> : null}
      {f >= q.cloning ? <WordChip x={540} y={928} word="clone" size={52} at={q.cloning} /> : null}
      {void WirePath}
      {void pulse}
    </div>
  );
};
