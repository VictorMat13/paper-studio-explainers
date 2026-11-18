// ===========================================================================
// HC assets: the kit's robot and laptop cut-outs (byte-identical to E/storyboard/assets/photos/robot.png and
// laptop.png, checked 2026-11-07) and the kit's Claude mark (byte-identical to E/storyboard/assets/logos/claude.svg).
// Every URL is checked against the bundle (hasStatic), so a missing file draws a fallback instead of failing.
// ===========================================================================
import { staticFile } from "remotion";
import { hasStatic } from "../../../paperstudio";

const pick = (...paths: string[]): string | undefined => {
  for (const p of paths) if (hasStatic(p)) return staticFile(p);
  return undefined;
};

export const HC_PHOTO = {
  robot: pick("paperstudio/photos/robot.png"),
  laptop: pick("paperstudio/photos/laptop.png"),
};

export const HC_LOGO = {
  claude: pick("ptp08/HC/claude.svg", "paperstudio/logos/claude.svg"),
};

/** robot.png 1134 x 1574, laptop.png 1890 x 1506 */
export const ROBOT_AR = 1134 / 1574;
export const LAPTOP_AR = 1890 / 1506;
