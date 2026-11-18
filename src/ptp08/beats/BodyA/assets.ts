// BodyA assets: copies in public/ptp08/BodyA/ of ep08 storyboard/assets (official logos from SOURCES.md, the reused
// ep06 cut-outs). Every URL is checked against the bundle, so a missing file falls back to the kit's copy or to a
// drawn fallback in the component, never to a broken image.
import { staticFile } from "remotion";
import { hasStatic } from "../../../paperstudio";

const own = (f: string) => `ptp08/BodyA/${f}`;
export const pick = (...paths: string[]): string | undefined => {
  for (const p of paths) if (hasStatic(p)) return staticFile(p);
  return undefined;
};

/** official logos: github.svg = GitHub's own Invertocat (black), github-white.svg for the charcoal slab, git.svg = the
 *  Git logo by Jason Long (orange diamond), claude.svg = the kit's Claude mark */
export const LOGOS = {
  github: pick(own("github.svg")),
  githubWhite: pick(own("github-white.svg")),
  git: pick(own("git.svg")),
  claude: pick(own("claude.svg"), "paperstudio/logos/claude.svg"),
};

/** photo cut-outs (undefined = draw the fallback) */
export const PHOTOS = {
  laptop: pick(own("laptop.png"), "paperstudio/photos/laptop.png"),
  scissors: pick(own("scissors.png"), "paperstudio/photos/scissors.png"),
  robot: pick(own("robot.png"), "paperstudio/photos/robot.png"),
  camera: pick(own("instant-camera.png")),
  tag: pick(own("paper-tag.png")),
};

/** measured aspect ratios (w / h) of the cut-outs (ep06 files, unchanged); generated ones updated when they land */
export const ASPECT = {
  laptop: 1890 / 1506,
  scissors: 1888 / 1012,
  robot: 1134 / 1574,
  camera: 1463 / 1404,
  tag: 617 / 1938,
};
