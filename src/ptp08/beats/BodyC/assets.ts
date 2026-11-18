// BodyC assets: copies in public/ptp08/BodyC/ of ep08 storyboard/assets (official logos per logos/SOURCES.md, the
// reused ep06/ep07 cut-outs, the generated ones when they land). Every URL is checked against the bundle, so a missing
// file falls back to the kit's identical copy (laptop, robot, scissors are byte-identical to public/paperstudio/photos)
// or to a drawn fallback in the component, never to a broken image.
import { staticFile } from "remotion";
import { hasStatic } from "../../../paperstudio";

const own = (f: string) => `ptp08/BodyC/${f}`;
export const pick = (...paths: string[]): string | undefined => {
  for (const p of paths) if (hasStatic(p)) return staticFile(p);
  return undefined;
};

/** official logos: github.svg = GitHub's Invertocat (black), github-white.svg for the charcoal slab, git.svg = the Git
 *  logo by Jason Long, claude.svg = the kit's Claude mark */
export const LOGOS = {
  github: pick(own("github.svg")),
  githubWhite: pick(own("github-white.svg")),
  git: pick(own("git.svg")),
  claude: pick(own("claude.svg"), "paperstudio/logos/claude.svg"),
};

/** photo cut-outs (undefined = draw the fallback) */
export const PHOTOS = {
  laptop: pick(own("laptop.png"), "paperstudio/photos/laptop.png"),
  robot: pick(own("robot.png"), "paperstudio/photos/robot.png"),
  scissors: pick(own("scissors.png"), "paperstudio/photos/scissors.png"),
  tag: pick(own("paper-tag.png")),
};

/** the kit's laptop only (always bundled with the kit): the first card uses it so a hook that imports FirstCard never
 *  depends on this folder's copies */
export const KIT_LAPTOP = pick("paperstudio/photos/laptop.png");

/** measured aspect ratios (w / h) of the cut-outs (ep06 files, unchanged) */
export const ASPECT = {
  laptop: 1890 / 1506,
  robot: 1134 / 1574,
  scissors: 1888 / 1012,
  tag: 0.62,
};
