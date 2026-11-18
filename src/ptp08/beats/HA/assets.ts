// ===========================================================================
// HA assets (builder HA, ep08 hook A). Copies in public/ptp08/HA/ of ep08 storyboard/assets (official logos per
// logos/SOURCES.md, the reused ep06 robot and laptop cut-outs). Every URL is checked against the bundle, so a missing
// file falls back to the kit's copy or to a drawn fallback, never to a broken image.
// ===========================================================================
import { staticFile } from "remotion";
import { hasStatic } from "../../../paperstudio";

const pick = (...paths: string[]): string | undefined => {
  for (const p of paths) if (hasStatic(p)) return staticFile(p);
  return undefined;
};
const own = (f: string) => `ptp08/HA/${f}`;

/** github = GitHub's Invertocat (black, chips), githubWhite = the same mark in white (the charcoal slab),
 *  git = the Git logo by Jason Long, claude = the Claude mark */
export const HA_LOGO = {
  github: pick(own("github.svg")),
  githubWhite: pick(own("github-white.svg")),
  git: pick(own("git.svg")),
  claude: pick(own("claude.svg"), "paperstudio/logos/claude.svg"),
};

export const HA_PHOTO = {
  robot: pick(own("robot.png"), "paperstudio/photos/robot.png"),
  laptop: pick(own("laptop.png"), "paperstudio/photos/laptop.png"),
};

/** w / h of the cut-outs (ep06 files, unchanged) */
export const HA_ASPECT = { robot: 1134 / 1574, laptop: 1890 / 1506 };

/** laptop.png screen (black lid face) corners as fractions, TL TR BR BL (ASSETS note: (28,186) (1236,41) (1365,792)
 *  (162,1006) in file px), and the screen's centre */
export const LAPTOP_SCREEN = {
  quad: [
    [28 / 1890, 186 / 1506],
    [1236 / 1890, 41 / 1506],
    [1365 / 1890, 792 / 1506],
    [162 / 1890, 1006 / 1506],
  ] as [number, number][],
  cx: (28 + 1236 + 1365 + 162) / 4 / 1890,
  cy: (186 + 41 + 792 + 1006) / 4 / 1506,
};
