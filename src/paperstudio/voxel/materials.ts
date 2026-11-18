import * as THREE from "three";
import { fillTex, ptex, T, type ItemKind, type RGB } from "./textures";

// Block materials and agent skins, ported from the ep09 storyboard page (`mat()`, `SKINS`, `skinMats()`).
// Lambert (flat per-face light like the game), cached per process. Face order is three's BoxGeometry order:
// +x, -x, +y (top), -y (bottom), +z (front), -z (back).

export type BlockKind =
  | "grass"
  | "dirt"
  | "stone"
  | "cobble"
  | "sand"
  | "log"
  | "planks"
  | "leaves"
  | "water"
  | "farmland"
  | "chest"
  | "craft"
  | "furnace";

export const lamb = (map: THREE.Texture, o: THREE.MeshLambertMaterialParameters = {}) =>
  new THREE.MeshLambertMaterial(Object.assign({ map }, o));

type Mat = THREE.Material | THREE.Material[];
const MAT: Record<string, Mat> = {};

/** the block material (an array of six for blocks with distinct faces) */
export function mat(kind: BlockKind | string): Mat {
  const hit = MAT[kind];
  if (hit) return hit;
  let m: Mat;
  switch (kind) {
    case "grass":
      m = [lamb(T.grassSide()), lamb(T.grassSide()), lamb(T.grassTop()), lamb(T.dirt()), lamb(T.grassSide()), lamb(T.grassSide())];
      break;
    case "dirt":
      m = lamb(T.dirt());
      break;
    case "stone":
      m = lamb(T.stone());
      break;
    case "cobble":
      m = lamb(T.cobble());
      break;
    case "sand":
      m = lamb(T.sand());
      break;
    case "log":
      m = [lamb(T.logSide()), lamb(T.logSide()), lamb(T.logTop()), lamb(T.logTop()), lamb(T.logSide()), lamb(T.logSide())];
      break;
    case "planks":
      m = lamb(T.planks());
      break;
    case "leaves":
      m = lamb(T.leaves());
      break;
    case "water":
      m = lamb(T.water(), { transparent: true, opacity: 0.78 });
      break;
    case "farmland":
      m = [lamb(T.dirt()), lamb(T.dirt()), lamb(T.farmland()), lamb(T.dirt()), lamb(T.dirt()), lamb(T.dirt())];
      break;
    case "chest":
      m = [lamb(T.chestSide()), lamb(T.chestSide()), lamb(T.chestTop()), lamb(T.chestTop()), lamb(T.chestFront()), lamb(T.chestSide())];
      break;
    case "craft":
      m = [lamb(T.craftSide()), lamb(T.craftSide()), lamb(T.craftTop()), lamb(T.planks()), lamb(T.craftSide()), lamb(T.craftSide())];
      break;
    case "furnace":
      m = [lamb(T.stone()), lamb(T.stone()), lamb(T.stone()), lamb(T.stone()), lamb(T.furnaceFront()), lamb(T.stone())];
      break;
    default:
      m = lamb(T.stone());
  }
  MAT[kind] = m;
  return m;
}

/** one shared unit cube for every block */
export const BOX = new THREE.BoxGeometry(1, 1, 1);

// ---- misc shared materials (torches, doors, plants, items)
const MISC: Record<string, THREE.Material> = {};
const misc = (key: string, make: () => THREE.Material) => MISC[key] ?? (MISC[key] = make());
export const torchHandleMat = () => misc("torchHandle", () => lamb(T.logSide()));
export const torchTopMat = () => misc("torchTop", () => new THREE.MeshBasicMaterial({ map: T.torchTop(), fog: false }));
export const doorMat = () => misc("door", () => new THREE.MeshLambertMaterial({ map: T.door(), side: THREE.DoubleSide }));
export const wheatMat = () =>
  misc("wheat", () => new THREE.MeshLambertMaterial({ map: T.wheat(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
export const tallGrassMat = () =>
  misc("tallGrass", () => new THREE.MeshLambertMaterial({ map: T.tallGrass(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
export const itemMat = (kind: ItemKind) =>
  misc("item_" + kind, () => new THREE.MeshLambertMaterial({ map: T.item(kind), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }) as THREE.Material);

export const itemGlowMat = (kind: ItemKind) =>
  misc("itemGlow_" + kind, () => new THREE.MeshBasicMaterial({ map: T.item(kind), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }) as THREE.Material);

// ---- skins: eight generated colour sets (never a copied skin), plus grey (dead / respawning) and zombie
export type SkinSet = { skin: RGB; hair: RGB; shirt: RGB; pants: RGB; shoe: RGB };
export const SKINS: SkinSet[] = [
  { skin: [227, 195, 162], hair: [66, 42, 26], shirt: [62, 124, 196], pants: [64, 66, 110], shoe: [60, 56, 54] },
  { skin: [200, 154, 114], hair: [28, 24, 22], shirt: [204, 70, 70], pants: [52, 52, 64], shoe: [40, 36, 34] },
  { skin: [240, 210, 180], hair: [214, 170, 80], shirt: [84, 160, 98], pants: [74, 58, 46], shoe: [60, 56, 54] },
  { skin: [180, 126, 90], hair: [40, 30, 26], shirt: [220, 166, 60], pants: [62, 76, 110], shoe: [40, 36, 34] },
  { skin: [232, 200, 168], hair: [120, 60, 30], shirt: [134, 88, 196], pants: [44, 44, 44], shoe: [60, 56, 54] },
  { skin: [215, 174, 139], hair: [60, 40, 30], shirt: [50, 142, 142], pants: [60, 48, 42], shoe: [40, 36, 34] },
  { skin: [243, 220, 198], hair: [200, 120, 60], shirt: [216, 106, 154], pants: [52, 58, 80], shoe: [60, 56, 54] },
  { skin: [166, 107, 72], hair: [30, 26, 24], shirt: [226, 226, 226], pants: [46, 46, 46], shoe: [40, 36, 34] },
];
export const GREY: SkinSet = { skin: [150, 150, 150], hair: [110, 110, 110], shirt: [135, 135, 135], pants: [115, 115, 115], shoe: [90, 90, 90] };
export const ZOMBIE: SkinSet = { skin: [86, 142, 70], hair: [50, 96, 44], shirt: [44, 110, 110], pants: [62, 74, 140], shoe: [50, 50, 60] };

export type SkinMats = { head: THREE.Material[]; body: THREE.Material; arm: THREE.Material; leg: THREE.Material };
const SKINMAT: Record<string, SkinMats> = {};

/** the skin key the page uses: "grey", "zombie" or "skin<n>" (n = skin % 8) */
export const skinKey = (o: { grey?: boolean; zombie?: boolean; skin?: number }) =>
  o.grey ? "grey" : o.zombie ? "zombie" : "skin" + (((o.skin || 0) % SKINS.length) + SKINS.length) % SKINS.length;

export const skinSetOf = (k: string): SkinSet => (k === "grey" ? GREY : k === "zombie" ? ZOMBIE : SKINS[Number(k.slice(4)) || 0]);

/** the six head faces + body, arm and leg materials for a skin set (cached by key) */
export function skinMats(S: SkinSet, k: string): SkinMats {
  const hit = SKINMAT[k];
  if (hit) return hit;
  const head = [
    lamb(
      ptex(k + "hs", 8, 8, (c, w, h, R, px, jit) => {
        fillTex(c, w, h, R, px, jit, S.skin, 8);
        for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) px(x, y, jit(S.hair, 8));
      }),
    ),
    lamb(
      ptex(k + "hs2", 8, 8, (c, w, h, R, px, jit) => {
        fillTex(c, w, h, R, px, jit, S.skin, 8);
        for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) px(x, y, jit(S.hair, 8));
      }),
    ),
    lamb(
      ptex(k + "ht", 8, 8, (c, w, h, R, px, jit) => {
        fillTex(c, w, h, R, px, jit, S.hair, 10);
      }),
    ),
    lamb(
      ptex(k + "hb", 8, 8, (c, w, h, R, px, jit) => {
        fillTex(c, w, h, R, px, jit, S.skin, 8);
      }),
    ),
    lamb(
      ptex(k + "hf", 8, 8, (c, w, h, R, px, jit) => {
        fillTex(c, w, h, R, px, jit, S.skin, 8);
        for (let x = 0; x < 8; x++) {
          px(x, 0, jit(S.hair, 8));
          px(x, 1, jit(S.hair, 8));
        }
        px(0, 2, S.hair);
        px(7, 2, S.hair);
        px(2, 4, [240, 240, 240]);
        px(3, 4, [40, 40, 120]);
        px(4, 4, [40, 40, 120]);
        px(5, 4, [240, 240, 240]);
        px(3, 6, jit([150, 100, 80], 6));
        px(4, 6, jit([150, 100, 80], 6));
      }),
    ),
    lamb(
      ptex(k + "hk", 8, 8, (c, w, h, R, px, jit) => {
        fillTex(c, w, h, R, px, jit, S.skin, 8);
        for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) px(x, y, jit(S.hair, 8));
      }),
    ),
  ];
  const body = lamb(
    ptex(k + "bo", 8, 12, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, S.shirt, 10);
    }),
  );
  const arm = lamb(
    ptex(k + "ar", 4, 12, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, S.skin, 8);
      for (let y = 0; y < 5; y++) for (let x = 0; x < 4; x++) px(x, y, jit(S.shirt, 10));
    }),
  );
  const leg = lamb(
    ptex(k + "le", 4, 12, (c, w, h, R, px, jit) => {
      fillTex(c, w, h, R, px, jit, S.pants, 8);
      for (let y = 10; y < 12; y++) for (let x = 0; x < 4; x++) px(x, y, jit(S.shoe, 6));
    }),
  );
  const out = { head, body, arm, leg };
  SKINMAT[k] = out;
  return out;
}
