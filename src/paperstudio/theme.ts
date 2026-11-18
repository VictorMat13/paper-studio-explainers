// ===========================================================================
// Paper Studio kit: shared tokens. Style rules live in
// CREATORS/Styles/paper-studio/SKILL.md; the visual source of truth is the
// approved ep04 storyboard (Made By AI/ep04 jcode/storyboard/index.html).
// Every coordinate is a 1080x1920 reel pixel. One light from the top left,
// every shadow falls down-right.
// ===========================================================================
import { Easing, interpolate, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const interNormal = loadInter("normal", { weights: ["300", "400", "500", "600", "700", "800"], subsets: ["latin"] });
const interItalic = loadInter("italic", { weights: ["700", "800"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });

export const INTER = interNormal.fontFamily;
export const MONO = mono.fontFamily;
/** resolves once every kit font has loaded (KineticCaption measures text after this) */
export const fontsReady: Promise<unknown> = Promise.all([interNormal.waitUntilDone(), interItalic.waitUntilDone(), mono.waitUntilDone()]);

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const theme = {
  W,
  H,
  fps: FPS,
  /** Instagram Reels safe zone: readable things stay inside; grounds, swooshes and cut-out arms may bleed */
  safe: { x0: 65, x1: 1015, y0: 269, y1: 1248 },
  /** working box inside the safe zone used by the storyboard */
  work: { x0: 100, x1: 980, y0: 300, y1: 1190 },
  /** shared hook overlay band (same text on every hook version) */
  hookBand: { y0: 290, y1: 440 },
  font: { sans: INTER, mono: MONO },
  color: {
    ink: "#111111",
    ghost: "#B5B5B5", // a caption word before it settles
    mute: "#777777",
    label: "#161616",
    paper: "#FFFFFF",
    sheet: "#FBFBFB",
    edge1: "#DCDCDC",
    edge2: "#CFCFCF",
    node: "#F3F3F3",
    hint: "#9A9A9A",
    termBody: "#0E0E10",
    bar: "#EDEDED",
    swoosh: "#D3D3D3",
    crtMat: "#111111",
  },
  grid: { cell: 135, line: 3, color: "rgba(78,74,72,0.30)", offsetY: 15 },
  ground: {
    light:
      "radial-gradient(ellipse 46% 30% at 50% 46%, #FFFFFF 0%, #F8F8F7 40%, rgba(244,243,242,0) 100%), radial-gradient(ellipse 70% 60% at 50% 50%, #F4F3F2 0%, #EAE8E6 70%, #DCD9D6 100%)",
    dark: "linear-gradient(180deg,#EDEDED 0%,#E2E2E2 100%)",
    /** soft top-left highlight + gentle vignette over either ground */
    lightOver:
      "linear-gradient(135deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,0) 45%),radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 48%,rgba(0,0,0,.075) 100%)",
  },
  shadow: {
    card: "3px 3px 0 #DCDCDC,5px 5px 0 #CFCFCF,18px 28px 50px rgba(0,0,0,.18),48px 70px 120px rgba(0,0,0,.10)",
    sheet: "3px 3px 0 #D9D9D9,18px 26px 44px rgba(0,0,0,.12)",
    terminal:
      "0 0 0 1px rgba(0,0,0,.06),14px 24px 40px rgba(0,0,0,.24),40px 60px 110px rgba(0,0,0,.16),inset 0 1px 0 #fff,inset -2px -2px 3px rgba(0,0,0,.06)",
    /** photo cut-outs float above the paper: hairline white edge, contact shadow, wide soft cast shadow */
    cutout: "drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(10px 14px 8px rgba(0,0,0,.14)) drop-shadow(34px 52px 30px rgba(0,0,0,.24))",
    /** lines and nodes read as raised wire */
    wire: "drop-shadow(8px 12px 6px rgba(0,0,0,.16)) drop-shadow(3px 5px 2px rgba(0,0,0,.08))",
    pill: "6px 10px 18px rgba(0,0,0,.16)",
    object: "drop-shadow(10px 16px 14px rgba(0,0,0,.22))",
  },
  radius: { card: 14, sheet: 12, crt: 34 },
  wire: { main: 7, secondary: 4, nodeR: 15, nodeRing: 6, dash: "14 12" },
  caption: {
    reg: { size: 40, weight: 400, italic: false, ls: 0 },
    bi: { size: 64, weight: 800, italic: true, ls: -1.5 },
    bold: { size: 56, weight: 800, italic: false, ls: -1 },
    big: { size: 96, weight: 800, italic: false, ls: -3 },
    huge: { size: 128, weight: 800, italic: false, ls: -4 },
    bar: { size: 44, weight: 700, italic: false, ls: 0 },
    /** frames a word takes to settle from grey to black (2026-10-31 camera pass: 7 -> 10, smoother) */
    settle: 10,
    /** frames a line takes to re-centre / a block to re-flow when a word or a line arrives */
    reflow: 8,
    /** words arriving within this many frames of their line's first word are laid out at the final width at once */
    cluster: 12,
    /** px a word rises while it settles, and its starting blur (screen px, not scaled) */
    rise: 7,
    blur: 6,
  },
} as const;

/** ease curves (bezier only, no springs, nothing overshoots) */
export const EASE = {
  /** entrances: fast out, long soft settle */
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  /** pops (chips, nodes, icons): quick, no overshoot */
  pop: Easing.bezier(0.2, 0.9, 0.1, 1),
  /** travel between two rest positions */
  travel: Easing.bezier(0.65, 0, 0.35, 1),
  /** exits: accelerate away */
  exit: Easing.bezier(0.55, 0, 0.9, 0.4),
  /** camera moves (in-out cubic family; same curve as the Victor-approved fish8 reference camera) */
  cam: Easing.bezier(0.65, 0, 0.35, 1),
  /** slow drifts and push-ins during holds (sine in-out: starts and ends without a kink) */
  drift: Easing.bezier(0.37, 0, 0.63, 1),
  /** soft ease-out for caption words (cubic out: gentler than `enter`, no snap) */
  soft: Easing.bezier(0.33, 1, 0.68, 1),
  linear: (t: number) => t,
} as const;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** eased 0..1 progress of frame f between a and b */
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = EASE.enter) =>
  b <= a ? (f >= a ? 1 : 0) : interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** mix two #RRGGBB colours */
export const mixColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(mix(v, pb[i], t))).join(",")})`;
};

// --------------------------------------------------------------- assets
const ps = (p: string) => staticFile(`paperstudio/${p}`);

/** official logos (public/paperstudio/logos) */
export const LOGO: Record<string, string> = {
  Cursor: ps("logos/cursor.svg"),
  Codex: ps("logos/codex.svg"),
  Claude: ps("logos/claude.svg"),
  ChatGPT: ps("logos/chatgpt.svg"),
  GitHub: ps("logos/github.svg"),
  Rust: ps("logos/rust.svg"),
  JCode: ps("logos/jcode.svg"),
};
/** letters shown on a chip that has no logo file (AI, $0) */
export const MARK: Record<string, string> = { Cursor: "Cu", Codex: "Cx", Claude: "Cl", ChatGPT: "GPT", GitHub: "GH", Rust: "Rs", JCode: "J", AI: "AI" };

/** real page captures */
export const SHOT = {
  cursor: ps("shots/cursor-pricing.png"),
  cursorPremium: ps("shots/cursor-pricing-premium.png"),
  cursorPlus: ps("shots/cursor-plus.png"),
  chatgpt: ps("shots/chatgpt-pricing.png"),
  claude: ps("shots/claude-pricing.png"),
  github: ps("shots/github-jcode.png"),
  bench: ps("shots/jcode-bench.png"),
} as const;

/** real JCode terminal captures */
export const TERM = {
  demo1: ps("jcode/demo-1.png"),
  demo2: ps("jcode/demo-2.png"),
  demo3: ps("jcode/demo-3.png"),
  demo4: ps("jcode/demo-4.png"),
  swarm: ps("jcode/swarm.png"),
  swarmConflict: ps("jcode/swarm-file-conflict.png"),
  resume: ps("jcode/resume-menu.png"),
  fileEdit: ps("jcode/file-edit.png"),
  infoWidgets: ps("jcode/info-widgets.png"),
  accountRouter: ps("jcode/account-router.png"),
  batchToolCalls: ps("jcode/batch-tool-calls.png"),
  cacheCold: ps("jcode/cache-cold.png"),
  completedTodos: ps("jcode/completed-todos.png"),
} as const;
/** storyboard default capture per terminal title */
export const TERM_BY_TITLE: Record<string, string> = { jcode: TERM.demo1, worker: TERM.demo2, helper: TERM.demo4, boss: TERM.swarm, swarm: TERM.swarm };

/** photo cut-outs and 3D objects */
export const PHOTO = {
  human: ps("photos/hand-human.png"), // 1490x1310, cropped to opaque bounds
  robot: ps("photos/hand-robot.png"), // 1592x1308
  harness: ps("photos/harness-icon.png"), // 2048 square
  guide: ps("photos/guide-mock.png"), // 2016x1344
} as const;
