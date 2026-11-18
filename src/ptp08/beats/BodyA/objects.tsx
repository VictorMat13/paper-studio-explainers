// BodyA local drawn objects (the kit has none of these): the instant camera (photo cut-out when ASSETS ships
// instant-camera.png, a drawn solid camera until then), the project folder card with its file tree, the tick chip,
// the paper tag (paper-tag.png or a drawn kraft tag), the ring marker, the tool card, crumbs (dust), the robot sprite
// with its Git chip. Solid objects with thickness and one light from the top left; no line art, no glow.
import React from "react";
import { Img } from "remotion";
import { INTER, LogoDisc, MONO, PaperCard, mix, mixColor, quadMatrix3d, theme, type P2, type Quad } from "../../../paperstudio";
import { ASPECT, LOGOS, PHOTOS } from "./assets";
import { hash01 } from "../../../paperstudio";

// ---------------------------------------------------------------- tick chip
/** a black disc with a white tick (solid, raised); `p` 0..1 pops it (no overshoot) */
export const TickChip: React.FC<{ cx: number; cy: number; r?: number; p?: number; dark?: boolean }> = ({ cx, cy, r = 26, p = 1, dark = true }) => {
  if (p <= 0.001) return null;
  const s = mix(0.5, 1, p);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        background: dark ? "radial-gradient(circle at 35% 30%,#3A3A3A 0%,#151515 60%,#0A0A0A 100%)" : "#fff",
        boxShadow: `${(r * 0.18).toFixed(1)}px ${(r * 0.28).toFixed(1)}px ${(r * 0.4).toFixed(1)}px rgba(0,0,0,.28),inset 0 1.5px 0 rgba(255,255,255,.22)`,
        transform: `scale(${s.toFixed(4)})`,
        opacity: Math.min(1, p * 2),
      }}
    >
      <svg width={2 * r} height={2 * r} viewBox="0 0 52 52" style={{ position: "absolute", inset: 0 }}>
        <path d="M15 27 L23 35 L38 18" fill="none" stroke={dark ? "#fff" : theme.color.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, p * 1.4)} />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- ring marker
/** the hollow ring that rides a wire and lands on a node */
export const RingMarker: React.FC<{ cx: number; cy: number; r?: number; ring?: number; p?: number }> = ({ cx, cy, r = 30, ring = 8, p = 1 }) => {
  if (p <= 0.001) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: theme.shadow.wire, opacity: Math.min(1, p * 2) }}>
      <circle cx={cx} cy={cy} r={r * mix(0.5, 1, p)} fill="none" stroke={theme.color.ink} strokeWidth={ring} />
    </svg>
  );
};

// ---------------------------------------------------------------- instant camera
export const CAMERA_W = 440;
/** the instant camera, centre (cx, cy), width w. `press` 0..1 the shutter press (body dips, lens iris closes),
 *  `flash` 0..1 the flash window lit (white, soft, no glow halo). Returns the slot line y offset via CAMERA_SLOT. */
export const CAMERA_SLOT = 0.9; // fraction of the drawn height where the print comes out (bottom front)
export const InstantCamera: React.FC<{ cx: number; cy: number; w?: number; press?: number; flash?: number; rot?: number; opacity?: number; develop?: number; printO?: number }> = ({
  cx,
  cy,
  w = CAMERA_W,
  press = 0,
  flash = 0,
  rot = 0,
  opacity = 1,
  develop = 0,
  printO = 1,
}) => {
  if (opacity <= 0.001) return null;
  const photo = PHOTOS.camera;
  const h = photo ? w / ASPECT.camera : w * 0.8;
  const dip = 4 * press;
  const wrap: React.CSSProperties = {
    position: "absolute",
    left: cx - w / 2,
    top: cy - h / 2 + dip,
    width: w,
    height: h,
    transform: `rotate(${rot.toFixed(3)}deg)`,
    opacity,
    filter: theme.shadow.cutout,
  };
  if (photo) {
    // instant-camera.png (1463 x 1404): the print's picture area (ASSETS' measured quad) gets the commit card's face as
    // it develops; the shutter press darkens the lens a touch; the flash is a soft white wash over the camera's top
    const q = CAMERA_PRINT_QUAD.map(([u, v]) => [u * w, v * h] as P2) as Quad;
    const m = quadMatrix3d(400, 300, q);
    return (
      <div style={wrap}>
        <Img src={photo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        {press > 0.001 ? (
          <div style={{ position: "absolute", left: w * (673 / 1463) - w * 0.14, top: h * (490 / 1404) - w * 0.14, width: w * 0.28, height: w * 0.28, borderRadius: "50%", background: "#000", opacity: 0.45 * press }} />
        ) : null}
        {develop > 0.001 ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: 400, height: 300, transformOrigin: "0 0", transform: m, opacity: develop * printO }}>
            <PrintFace develop={develop} />
          </div>
        ) : null}
        {flash > 0.001 ? <div style={{ position: "absolute", left: "18%", top: "4%", width: "64%", height: "34%", borderRadius: "40%", background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.95) 0%, rgba(255,255,255,0) 70%)", opacity: 0.8 * flash }} /> : null}
      </div>
    );
  }
  // drawn fallback: a white instant camera seen from the front, slightly from above
  const lensR = w * 0.2;
  return (
    <div style={wrap}>
      {/* body thickness (bottom edge) */}
      <div style={{ position: "absolute", left: 0, top: h * 0.06, width: w, height: h * 0.94, borderRadius: w * 0.09, background: "linear-gradient(180deg,#D6D3CF 0%,#BDB9B4 100%)" }} />
      {/* body face */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h * 0.92,
          borderRadius: w * 0.09,
          background: "linear-gradient(160deg,#FFFFFF 0%,#F4F2EF 55%,#E6E3DF 100%)",
          boxShadow: "inset 0 2px 0 #fff,inset -3px -4px 8px rgba(0,0,0,.07)",
        }}
      />
      {/* top step (the viewfinder and flash housing) */}
      <div style={{ position: "absolute", left: w * 0.05, top: h * 0.05, width: w * 0.9, height: h * 0.2, borderRadius: w * 0.05, background: "linear-gradient(180deg,#F7F6F4 0%,#E9E7E4 100%)", boxShadow: "inset 0 -2px 3px rgba(0,0,0,.08)" }} />
      {/* flash window */}
      <div
        style={{
          position: "absolute",
          left: w * 0.1,
          top: h * 0.08,
          width: w * 0.26,
          height: h * 0.13,
          borderRadius: 8,
          background: mixColor("#C9CDD2", "#FFFFFF", flash),
          boxShadow: "inset 0 2px 4px rgba(0,0,0,.25),inset 0 -1px 0 rgba(255,255,255,.6)",
          backgroundImage: flash < 0.5 ? "repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 4px,rgba(0,0,0,0) 4px 9px)" : undefined,
        }}
      />
      {/* viewfinder */}
      <div style={{ position: "absolute", left: w * 0.72, top: h * 0.09, width: w * 0.14, height: h * 0.11, borderRadius: 7, background: "#1B1C1F", boxShadow: "inset 0 2px 3px rgba(0,0,0,.6),0 1px 0 #fff" }} />
      {/* shutter button */}
      <div style={{ position: "absolute", left: w * 0.8, top: h * (0.3 + 0.012 * press), width: w * 0.1, height: w * 0.1, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#4A4A4A,#141414)", boxShadow: "2px 3px 3px rgba(0,0,0,.3)" }} />
      {/* lens: barrel, glass, iris */}
      <div
        style={{
          position: "absolute",
          left: w / 2 - lensR * 1.18,
          top: h * 0.5 - lensR * 1.18,
          width: lensR * 2.36,
          height: lensR * 2.36,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%,#FFFFFF 0%,#E7E4E0 60%,#C9C5C0 100%)",
          boxShadow: "6px 9px 14px rgba(0,0,0,.18),inset 0 2px 0 #fff",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: w / 2 - lensR,
          top: h * 0.5 - lensR,
          width: lensR * 2,
          height: lensR * 2,
          borderRadius: "50%",
          background: "radial-gradient(circle at 38% 34%,#5B6068 0%,#25272B 38%,#0B0B0D 72%,#000 100%)",
          boxShadow: "inset 0 0 0 6px #2A2B2E,inset 0 4px 10px rgba(0,0,0,.8)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: "26%", top: "20%", width: "22%", height: "16%", borderRadius: "50%", background: "rgba(255,255,255,.55)", filter: "blur(2px)" }} />
        {press > 0.001 ? <div style={{ position: "absolute", inset: `${(50 - 50 * press).toFixed(1)}%`, borderRadius: "50%", background: "#050505" }} /> : null}
      </div>
      {/* print slot */}
      <div style={{ position: "absolute", left: w * 0.16, top: h * CAMERA_SLOT - 6, width: w * 0.68, height: 12, borderRadius: 6, background: "#2A2A2C", boxShadow: "inset 0 3px 4px rgba(0,0,0,.7),0 1px 0 rgba(255,255,255,.8)" }} />
    </div>
  );
};
/** the print's picture area on instant-camera.png (TL, TR, BR, BL as fractions of the image), from COMPLETION-ASSETS */
export const CAMERA_PRINT_QUAD: Quad = [
  [355 / 1463, 783 / 1404],
  [993 / 1463, 883 / 1404],
  [805 / 1463, 1232 / 1404],
  [137 / 1463, 1112 / 1404],
];
/** the print's centre on the photo (fractions) and its tilt (deg) */
export const CAMERA_PRINT = { u: 572 / 1463, v: 1002 / 1404, rot: 11 } as const;

/** the commit card's face as it develops on the print (400 x 300 px, mapped onto the picture area) */
const PrintFace: React.FC<{ develop: number }> = ({ develop }) => (
  <div style={{ position: "absolute", inset: 0, background: mixColor("#E9E6E1", "#FFFFFF", develop), display: "flex", alignItems: "center", gap: 26, padding: "0 30px", boxSizing: "border-box" }}>
    <div style={{ width: 70, height: 70, borderRadius: "50%", flex: "none", background: "radial-gradient(circle at 35% 30%, #bdbdbd 0%, #8a8a8a 55%, #6a6a6a 100%)", opacity: develop }} />
    <div style={{ opacity: develop }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 48, color: theme.color.ink, lineHeight: 1.2 }}>a1f3c9e</div>
      <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 42, color: "#444", lineHeight: 1.25, whiteSpace: "nowrap" }}>save progress</div>
    </div>
  </div>
);
/** drawn height of the camera at width w */
export const cameraH = (w = CAMERA_W) => (PHOTOS.camera ? w / ASPECT.camera : w * 0.8);

// ---------------------------------------------------------------- folder card
export const FILES = ["index.html", "package.json", "src/App.jsx", "src/List.jsx", "styles.css"] as const;

/** a little solid folder icon (dark, with a tab), drawn at (x, y) size s */
const FolderIcon: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <div style={{ position: "absolute", left: x, top: y, width: s, height: s * 0.78 }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: s * 0.44, height: s * 0.2, borderRadius: `${s * 0.06}px ${s * 0.06}px 0 0`, background: "#2A2A2C" }} />
    <div style={{ position: "absolute", left: 0, top: s * 0.12, width: s, height: s * 0.66, borderRadius: s * 0.08, background: "linear-gradient(160deg,#3A3A3D 0%,#1A1A1C 100%)", boxShadow: "3px 4px 5px rgba(0,0,0,.25),inset 0 1.5px 0 rgba(255,255,255,.18)" }} />
  </div>
);

/** the project folder card: header (folder icon + my-app), the mono file tree; `ticks[i]` 0..1 per file line */
export const FileTree: React.FC<{ w: number; fs?: number; lineH?: number; ticks?: readonly number[]; header?: boolean; ink?: number }> = ({ w, fs = 40, lineH = 66, ticks = [], header = true, ink = 1 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w }}>
    {header ? (
      <>
        <FolderIcon x={34} y={30} s={58} />
        <div style={{ position: "absolute", left: 108, top: 26, fontFamily: INTER, fontWeight: 800, fontSize: 48, letterSpacing: -1.5, color: theme.color.ink, lineHeight: 1.1 }}>my-app</div>
        <div style={{ position: "absolute", left: 30, top: 100, width: w - 60, height: 3, borderRadius: 2, background: "#ECEBE9" }} />
      </>
    ) : null}
    {FILES.map((name, i) => {
      const t = ticks[i] ?? 0;
      const indent = name.startsWith("src/") ? 34 : 0;
      const label = name.startsWith("src/") ? name.slice(4) : name;
      const y = (header ? 128 : 20) + i * lineH;
      return (
        <React.Fragment key={name}>
          {indent ? <div style={{ position: "absolute", left: 44, top: y + lineH * 0.22, width: 3, height: lineH * 0.56, background: "#D8D7D4", borderRadius: 2 }} /> : null}
          <div style={{ position: "absolute", left: 40 + indent, top: y, height: lineH, display: "flex", alignItems: "center", fontFamily: MONO, fontWeight: 500, fontSize: fs, color: mixColor("#9B9B9B", "#1A1A1A", ink), whiteSpace: "nowrap" }}>
            {indent ? <span style={{ color: "#8A8A8A", marginRight: 2 }}>src/</span> : null}
            {label}
          </div>
          <TickChip cx={w - 52} cy={y + lineH / 2} r={22} p={t} />
        </React.Fragment>
      );
    })}
  </div>
);

export const FolderCard: React.FC<{ x: number; y: number; w: number; h: number; ticks?: readonly number[]; tf?: string; opacity?: number; sheets?: number; flash?: number }> = ({
  x,
  y,
  w,
  h,
  ticks,
  tf = "",
  opacity = 1,
  sheets = 1,
  flash = 0,
}) => (
  <PaperCard x={x} y={y} w={w} h={h} sheets={sheets} tf={tf} opacity={opacity}>
    <FileTree w={w} ticks={ticks} />
    {flash > 0.001 ? <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.75 * flash }} /> : null}
  </PaperCard>
);

// ---------------------------------------------------------------- paper tag
export const TAG_W = 200;
/** a kraft paper tag hanging from its string's top point (sx, sy); the tag body hangs `len` below, swinging `rot` deg
 *  about the string's top; 'v1' on its face in Inter 800 (`ink` 0..1 writes it in) */
export const PaperTag: React.FC<{ sx: number; sy: number; len?: number; w?: number; rot?: number; ink?: number; opacity?: number; text?: string }> = ({
  sx,
  sy,
  len = 110,
  w = TAG_W,
  rot = 0,
  ink = 1,
  opacity = 1,
  text = "v1",
}) => {
  if (opacity <= 0.001) return null;
  const photo = PHOTOS.tag;
  if (photo) {
    // paper-tag.png (617 x 1938): the twine's top (313, 0) is the hang point; the blank face is x 40-580, y 990-1860
    const ph = w / ASPECT.tag;
    return (
      <div style={{ position: "absolute", left: sx, top: sy, width: 0, height: 0, transform: `rotate(${rot.toFixed(3)}deg)`, transformOrigin: "0 0", opacity }}>
        <div style={{ position: "absolute", left: -w * (313 / 617), top: 0, width: w, height: ph, filter: theme.shadow.cutout }}>
          <Img src={photo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
          <div
            style={{
              position: "absolute",
              left: w * (40 / 617),
              width: w * (540 / 617),
              top: ph * (1000 / 1938),
              height: ph * (840 / 1938),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: INTER,
              fontWeight: 800,
              fontSize: w * 0.5,
              letterSpacing: -w * 0.02,
              color: "#1A140D",
              opacity: ink,
              transform: `skewY(-2deg) translateY(${(6 * (1 - ink)).toFixed(2)}px)`,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    );
  }
  const h = w * 1.45;
  return (
    <div style={{ position: "absolute", left: sx, top: sy, width: 0, height: 0, transform: `rotate(${rot.toFixed(3)}deg)`, transformOrigin: "0 0", opacity }}>
      {/* string */}
      <svg width={40} height={len + 40} style={{ position: "absolute", left: -20, top: -6, overflow: "visible", filter: "drop-shadow(3px 5px 2px rgba(0,0,0,.18))" }}>
        <path d={`M20 6 C 26 ${len * 0.35}, 14 ${len * 0.7}, 20 ${len + 26}`} fill="none" stroke="#B49A72" strokeWidth={5} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: -w / 2, top: len, width: w, height: h, filter: theme.shadow.cutout }}>
        {(
          <svg width={w} height={h} viewBox="0 0 200 290" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <linearGradient id="baTagKraft" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#E3C99E" />
                <stop offset="0.55" stopColor="#D2B282" />
                <stop offset="1" stopColor="#BF9C6A" />
              </linearGradient>
            </defs>
            {/* thickness */}
            <path d="M44 6 H156 L194 44 V276 Q194 288 182 288 H18 Q6 288 6 276 V44 Z" fill="#A98757" transform="translate(4 4)" />
            <path d="M44 6 H156 L194 44 V276 Q194 288 182 288 H18 Q6 288 6 276 V44 Z" fill="url(#baTagKraft)" />
            {/* reinforcement ring and hole */}
            <circle cx={100} cy={44} r={22} fill="#EFE3CC" />
            <circle cx={100} cy={44} r={11} fill="#5B4A33" />
          </svg>
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: w,
            top: h * 0.36,
            height: h * 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: w * 0.5,
            letterSpacing: -w * 0.02,
            color: "#161310",
            opacity: ink,
            transform: `translateY(${(6 * (1 - ink)).toFixed(2)}px)`,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- tool card
/** a small repo card: a wrench icon chip + 'a-tool' mono + two grey lines (no real repo, no counts) */
export const ToolCard: React.FC<{ cx: number; cy: number; w?: number; s?: number; opacity?: number; rot?: number }> = ({ cx, cy, w = 300, s = 1, opacity = 1, rot = 0 }) => {
  if (opacity <= 0.001) return null;
  const h = w * 0.42;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${s.toFixed(4)})`, opacity }}>
      <div style={{ position: "absolute", inset: 0, background: theme.color.paper, borderRadius: 12, boxShadow: "3px 3px 0 #DCDCDC,10px 16px 26px rgba(0,0,0,.16),28px 40px 60px rgba(0,0,0,.08)" }} />
      <div style={{ position: "absolute", left: h * 0.18, top: h * 0.18, width: h * 0.64, height: h * 0.64, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#3A3A3A,#111)", boxShadow: "3px 5px 6px rgba(0,0,0,.25)" }}>
        <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ position: "absolute", inset: 0, padding: "22%", boxSizing: "border-box" }}>
          <path
            d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.6 17.1a1.6 1.6 0 0 0 2.3 2.3l5.7-5.7a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.2-.4-.4-2.2z"
            fill="#fff"
          />
        </svg>
      </div>
      <div style={{ position: "absolute", left: h * 0.98, top: h * 0.2, fontFamily: MONO, fontWeight: 700, fontSize: h * 0.26, color: theme.color.ink, whiteSpace: "nowrap" }}>a-tool</div>
      <div style={{ position: "absolute", left: h * 0.98, top: h * 0.6, width: w * 0.42, height: h * 0.08, borderRadius: 4, background: "#E2E1DE" }} />
      <div style={{ position: "absolute", left: h * 0.98, top: h * 0.74, width: w * 0.28, height: h * 0.08, borderRadius: 4, background: "#ECEBE8" }} />
    </div>
  );
};

// ---------------------------------------------------------------- crumbs
/** paper crumbs falling and fading from a rect (content px): `p` 0..1 */
export const Crumbs: React.FC<{ x: number; y: number; w: number; h: number; p: number; n?: number; seed?: number; color?: string; fall?: number }> = ({ x, y, w, h, p, n = 46, seed = 5, color = "#E9E7E3", fall = 360 }) => {
  if (p <= 0.001 || p >= 0.999) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const r0 = hash01(seed, i, 0);
        const r1 = hash01(seed, i, 1);
        const r2 = hash01(seed, i, 2);
        const d = Math.max(0, Math.min(1, (p - r2 * 0.35) / 0.65));
        if (d <= 0) return null;
        const sz = 10 + r0 * 22;
        const px = x + r1 * w + (r0 - 0.5) * 60 * d;
        const py = y + r0 * h * 0.8 + fall * d * d;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: sz,
              height: sz * (0.6 + r2 * 0.6),
              background: i % 3 === 0 ? "#BDBBB7" : color,
              transform: `rotate(${(r1 * 360 + 300 * d).toFixed(1)}deg)`,
              opacity: 1 - d,
              borderRadius: 2,
              boxShadow: "2px 3px 3px rgba(0,0,0,.18)",
            }}
          />
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- robot sprite with a Git chip
/** one robot sprite (bottom centre at (cx, by), height h) with a small Git chip on its chest; `p` pops it */
/** robot.png eye boxes (image px of 1134 x 1574), for the blink */
const EYES = [
  { x0: 374, y0: 334, x1: 458, y1: 500 },
  { x0: 732, y0: 383, x1: 823, y1: 546 },
];
export const RobotSprite: React.FC<{ cx: number; by: number; h: number; p?: number; bob?: number; chip?: boolean; blink?: number; tilt?: number }> = ({ cx, by, h, p = 1, bob = 0, chip = true, blink = 0, tilt = 0 }) => {
  if (p <= 0.001 || !PHOTOS.robot) return null;
  const w = h * ASPECT.robot;
  const k = Math.round(h * 0.04);
  const s = mix(0.2, 1, p);
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: by - h + bob, width: w, height: h, transform: `rotate(${tilt.toFixed(2)}deg) scale(${s.toFixed(4)})`, transformOrigin: "50% 90%", opacity: Math.min(1, p * 2) }}>
      <Img src={PHOTOS.robot} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: `drop-shadow(${k}px ${Math.round(k * 1.5)}px ${Math.round(k * 1.2)}px rgba(0,0,0,.20)) drop-shadow(${k * 3}px ${k * 4}px ${k * 4}px rgba(0,0,0,.14))` }} />
      {blink > 0.01
        ? EYES.map((e, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: ((e.x0 - 4) / 1134) * w,
                top: ((e.y0 - 6) / 1574) * h,
                width: ((e.x1 - e.x0 + 8) / 1134) * w,
                height: ((e.y1 - e.y0 + 12) / 1574) * h * blink,
                background: "#1E1D21",
                borderRadius: "0 0 40% 40%",
              }}
            />
          ))
        : null}
      {chip ? (
        <div style={{ position: "absolute", left: w * 0.62, top: h * 0.56, width: h * 0.3, height: h * 0.3 }}>
          <LogoDisc name="Git" r={h * 0.15} src={LOGOS.git} />
        </div>
      ) : null}
    </div>
  );
};
