import * as THREE from "three";
import { clampN, rng } from "./util";

// Procedural 16 px textures and item sprites, the same pixels as the ep09 storyboard page (same keys, same seeds,
// same palettes). Original pixels only: nothing here is a Mojang asset. NearestFilter, no mipmaps, sRGB.
// Each texture is built once per browser tab (module-level cache) and shared by every canvas.

export type RGB = readonly [number, number, number];
type Px = (x: number, y: number, rgb: RGB) => void;
type Jit = (rgb: RGB, a: number) => RGB;
type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, R: () => number, px: Px, jit: Jit) => void;

const TEX: Record<string, THREE.CanvasTexture> = {};

/** a w x h canvas texture painted pixel by pixel; cached by key (the key also seeds the jitter, as on the page) */
export function ptex(key: string, w: number, h: number, paint: Paint): THREE.CanvasTexture {
  const hit = TEX[key];
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const R = rng(key.length * 31 + w * 7 + h);
  const px: Px = (x, y, rgb) => {
    ctx.fillStyle = `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`;
    ctx.fillRect(x, y, 1, 1);
  };
  const jit: Jit = (rgb, a) => {
    const d = (R() - 0.5) * 2 * a;
    return [clampN(rgb[0] + d, 0, 255), clampN(rgb[1] + d, 0, 255), clampN(rgb[2] + d, 0, 255)];
  };
  paint(ctx, w, h, R, px, jit);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  TEX[key] = t;
  return t;
}

export const fillTex = (
  _ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _R: () => number,
  px: Px,
  jit: Jit,
  base: RGB,
  amp: number,
) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(x, y, jit(base, amp));
};

export type ItemKind = "chicken" | "axe" | "pick" | "sword";

const D: RGB = [70, 48, 22];

/** the texture set (call T.grassTop() etc.; each call returns the cached texture) */
export const T = {
  grassTop: () =>
    ptex("grassTop", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [118, 170, 58], 16);
      for (let i = 0; i < 22; i++) px((R() * 16) | 0, (R() * 16) | 0, jit([96, 146, 44], 8));
    }),
  grassSide: () =>
    ptex("grassSide", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [134, 96, 67], 16);
      for (let x = 0; x < 16; x++) {
        const d = 2 + ((R() * 3) | 0);
        for (let y = 0; y < d; y++) px(x, y, jit([118, 170, 58], 14));
      }
    }),
  dirt: () =>
    ptex("dirt", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [134, 96, 67], 18);
      for (let i = 0; i < 14; i++) px((R() * 16) | 0, (R() * 16) | 0, jit([104, 72, 48], 8));
      for (let i = 0; i < 8; i++) px((R() * 16) | 0, (R() * 16) | 0, jit([160, 120, 86], 8));
    }),
  stone: () =>
    ptex("stone", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [126, 126, 126], 14);
      for (let i = 0; i < 10; i++) px((R() * 16) | 0, (R() * 16) | 0, jit([100, 100, 100], 8));
    }),
  cobble: () =>
    ptex("cobble", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [122, 122, 122], 12);
      const stones = [
        [1, 1, 5, 4],
        [7, 0, 8, 5],
        [0, 6, 6, 5],
        [7, 6, 9, 4],
        [1, 12, 7, 4],
        [9, 11, 7, 5],
      ];
      for (const [sx, sy, sw, sh] of stones) {
        const b = jit([138, 138, 138], 14);
        for (let y = sy; y < sy + sh; y++)
          for (let x = sx; x < sx + sw; x++) {
            const edge = x === sx || y === sy || x === sx + sw - 1 || y === sy + sh - 1;
            px(x % 16, y % 16, edge ? jit([78, 78, 78], 8) : jit(b, 7));
          }
      }
    }),
  logSide: () =>
    ptex("logSide", 16, 16, (c, w, h, R, px, jit) => {
      for (let x = 0; x < 16; x++) {
        const col: RGB = x % 3 === 0 ? [86, 62, 36] : [108, 80, 46];
        for (let y = 0; y < 16; y++) px(x, y, jit(col, 10));
      }
    }),
  logTop: () =>
    ptex("logTop", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [106, 80, 46], 8);
      for (let r = 2; r < 8; r += 2) {
        for (let a = 0; a < 64; a++) {
          const x = 8 + Math.round(Math.cos((a / 64) * 6.283) * r),
            y = 8 + Math.round(Math.sin((a / 64) * 6.283) * r);
          px(clampN(x, 0, 15), clampN(y, 0, 15), jit([170, 138, 88], 10));
        }
      }
    }),
  planks: () =>
    ptex("planks", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [164, 128, 78], 10);
      for (let y = 3; y < 16; y += 4) for (let x = 0; x < 16; x++) px(x, y, jit([110, 82, 46], 6));
      for (const [x, y] of [
        [7, 0],
        [7, 1],
        [7, 2],
        [3, 4],
        [3, 5],
        [3, 6],
        [11, 8],
        [11, 9],
        [11, 10],
        [6, 12],
        [6, 13],
        [6, 14],
      ])
        px(x, y, jit([110, 82, 46], 6));
    }),
  leaves: () =>
    ptex("leaves", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [62, 110, 38], 20);
      for (let i = 0; i < 46; i++) px((R() * 16) | 0, (R() * 16) | 0, jit([34, 66, 22], 10));
      for (let i = 0; i < 12; i++) px((R() * 16) | 0, (R() * 16) | 0, jit([92, 146, 60], 10));
    }),
  water: () =>
    ptex("water", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [62, 112, 210], 12);
    }),
  sand: () =>
    ptex("sand", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [218, 208, 160], 10);
    }),
  farmland: () =>
    ptex("farmland", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [84, 56, 32], 12);
      for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) px(x, y, jit([60, 38, 20], 6));
    }),
  wheat: () =>
    ptex("wheat", 16, 16, (c, w, h, R, px, jit) => {
      c.clearRect(0, 0, 16, 16);
      for (const x of [2, 5, 9, 13]) {
        for (let y = 4; y < 16; y++) px(x, y, jit([140, 160, 56], 12));
        for (let y = 0; y < 6; y++) {
          px(x, y, jit([214, 184, 76], 10));
          if (y < 4) {
            px(x - 1, y + 1, jit([214, 184, 76], 10));
            px(x + 1, y + 1, jit([214, 184, 76], 10));
          }
        }
      }
    }),
  tallGrass: () =>
    ptex("tallGrass", 16, 16, (c, w, h, R, px, jit) => {
      c.clearRect(0, 0, 16, 16);
      for (let i = 0; i < 9; i++) {
        const x = 1 + ((R() * 14) | 0),
          hh = 5 + ((R() * 9) | 0);
        for (let y = 16 - hh; y < 16; y++) px(x, y, jit([96, 152, 52], 14));
      }
    }),
  chestSide: () =>
    ptex("chestSide", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [150, 110, 56], 10);
      for (let x = 0; x < 16; x++) {
        px(x, 0, jit(D, 4));
        px(x, 15, jit(D, 4));
        px(x, 6, jit(D, 4));
      }
      for (let y = 0; y < 16; y++) {
        px(0, y, jit(D, 4));
        px(15, y, jit(D, 4));
      }
    }),
  chestFront: () =>
    ptex("chestFront", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [150, 110, 56], 10);
      for (let x = 0; x < 16; x++) {
        px(x, 0, jit(D, 4));
        px(x, 15, jit(D, 4));
        px(x, 6, jit(D, 4));
      }
      for (let y = 0; y < 16; y++) {
        px(0, y, jit(D, 4));
        px(15, y, jit(D, 4));
      }
      for (let y = 4; y < 9; y++) for (let x = 7; x < 9; x++) px(x, y, jit([120, 120, 120], 8));
    }),
  chestTop: () =>
    ptex("chestTop", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [160, 120, 62], 10);
      for (let i = 0; i < 16; i++) {
        px(i, 0, D);
        px(i, 15, D);
        px(0, i, D);
        px(15, i, D);
      }
    }),
  craftTop: () =>
    ptex("craftTop", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [164, 128, 78], 8);
      for (let i = 2; i < 14; i++) {
        for (const k of [5, 9]) {
          px(i, k, D);
          px(k, i, D);
        }
        px(i, 2, D);
        px(i, 13, D);
        px(2, i, D);
        px(13, i, D);
      }
    }),
  craftSide: () =>
    ptex("craftSide", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [164, 128, 78], 8);
      for (let x = 0; x < 16; x++) px(x, 0, [90, 66, 36]);
      for (const [x, y] of [
        [3, 4],
        [4, 4],
        [5, 4],
        [4, 5],
        [4, 6],
        [4, 7],
        [4, 8],
        [10, 4],
        [10, 5],
        [10, 6],
        [9, 7],
        [10, 7],
        [11, 7],
        [10, 8],
      ])
        px(x, y, [80, 80, 84]);
    }),
  furnaceFront: () =>
    ptex("furnaceFront", 16, 16, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, [118, 118, 118], 12);
      for (let y = 9; y < 14; y++) for (let x = 4; x < 12; x++) px(x, y, jit([28, 28, 30], 6));
      for (let y = 10; y < 13; y++) for (let x = 5; x < 11; x++) if (R() > 0.4) px(x, y, jit([230, 140, 40], 30));
    }),
  door: () =>
    ptex("door", 16, 32, (c, w, h, R, px, jit) => {
      for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) px(x, y, jit([86, 60, 34], 8));
      for (const [sx, sy, sw, sh] of [
        [2, 2, 12, 10],
        [2, 14, 12, 6],
        [2, 22, 12, 8],
      ])
        for (let y = sy; y < sy + sh; y++)
          for (let x = sx; x < sx + sw; x++) {
            const edge = x === sx || y === sy || x === sx + sw - 1 || y === sy + sh - 1;
            px(x, y, edge ? jit([60, 40, 22], 6) : jit([110, 80, 46], 8));
          }
      for (let y = 4; y < 9; y++) for (let x = 4; x < 12; x++) if (((x + y) & 1) === 0) px(x, y, [180, 210, 230]);
      px(13, 18, [150, 150, 150]);
      px(13, 19, [150, 150, 150]);
    }),
  torchTop: () =>
    ptex("torchTop", 4, 4, (c, w, h, R, px, jit) => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) px(x, y, jit([255, 214, 90], 20));
    }),
  item: (kind: ItemKind) =>
    ptex("item_" + kind, 16, 16, (c, w, h, R, px, jit) => {
      c.clearRect(0, 0, 16, 16);
      if (kind === "chicken") {
        for (let y = 5; y < 13; y++)
          for (let x = 3; x < 12; x++) if (!((x === 3 || x === 11) && (y === 5 || y === 12))) px(x, y, jit([190, 120, 60], 18));
        for (let y = 8; y < 11; y++) for (let x = 11; x < 15; x++) px(x, y, jit([230, 226, 210], 8));
      }
      if (kind === "axe") {
        for (let i = 0; i < 10; i++) px((5 + i * 0.6) | 0, 15 - i, jit([120, 86, 48], 8));
        for (let y = 1; y < 7; y++) for (let x = 8; x < 14; x++) if (x + y > 12) px(x, y, jit([130, 130, 130], 10));
      }
      if (kind === "pick") {
        for (let i = 0; i < 10; i++) px((5 + i * 0.6) | 0, 15 - i, jit([120, 86, 48], 8));
        for (let x = 3; x < 14; x++) px(x, 3, jit([130, 130, 130], 10));
        px(3, 4, [120, 120, 120]);
        px(13, 4, [120, 120, 120]);
        px(4, 5, [120, 120, 120]);
        px(12, 5, [120, 120, 120]);
      }
      if (kind === "sword") {
        for (let i = 0; i < 11; i++) {
          px(3 + i, 14 - i, jit([170, 170, 176], 8));
          px(4 + i, 14 - i, jit([200, 200, 206], 8));
        }
        px(4, 13, [120, 86, 48]);
        px(5, 14, [120, 86, 48]);
        px(6, 13, [120, 86, 48]);
        px(5, 12, [120, 86, 48]);
      }
    }),
};
