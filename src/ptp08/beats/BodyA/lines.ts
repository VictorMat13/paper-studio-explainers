// BodyA caption blocks, from the real spoken words (useLine). One block per thought; a block is gone before the next
// one appears. On screen only the figure v1 (from the storyboard list).
import type { CapWord } from "../../../paperstudio";
import { type Block, cap1, figure, restyle, splitAt, useLine } from "./captions";
import type { Cues } from "./cues";

/** tokens in [a, b) */
const span = (l: CapWord[], a: number, b = Infinity) => l.filter((t) => t.at >= a && t.at < b);

export const useBodyACaptions = (c: Cues): Block[] => {
  const a01 = restyle(cap1(useLine("A01a")), /^(runs|on|git)$/, "bi");
  const a02 = restyle(useLine("A02a"), /^(almost|every|developer)$/, "bar");
  const almost = c.at("A02a", /^almost$/, 40);
  const a03 = cap1(useLine("A03a", () => "big"));
  const a04 = restyle(cap1(useLine("A04a")), /^(save|commit)$/, "bi");
  const thats = c.at("A04a", /^that's$/, 60);
  const a05 = restyle(restyle(cap1(useLine("A05a")), /^snapshot$/, "bi"), /^(every|file)$/, "bold");
  const inW = c.at("A05a", /^in$/, 60);
  const a05b = restyle(useLine("A05b"), /^linked$/, "bi");
  const a06 = restyle(cap1(useLine("A06a")), /^timeline$/, "bi");
  const and6 = c.at("A06a", /^and$/, 20);
  const a07 = restyle(cap1(useLine("A07a")), /^breaks$/, "bi");
  const a07b = restyle(restyle(useLine("A07b"), /^(go|back)$/, "bi"), /^worked$/, "bi");
  const to2 = c.w.A07b.filter((w) => /^to$/i.test(w.w.replace(/[.,]/g, "")))[1]?.f ?? c.at("A07b", /^last$/, 70) - 6;
  const a08 = restyle(cap1(useLine("A08a")), /^(only|laptop)$/, "bi");
  const a08b = restyle(cap1(useLine("A08b")), /^(dies|gone)$/, "bi");
  const a09 = restyle(cap1(useLine("A09a")), /^push$/, "bi");
  const a09b = restyle(useLine("A09b"), /^online$/, "bi");
  const a10 = restyle(cap1(useLine("A10a")), /^reverse$/, "bi");
  const does = c.at("A10a", /^does$/, 50);
  const a10b = restyle(cap1(useLine("A10b")), /^cloning$/, "bi");
  const onto = c.at("A10b", /^onto$/, 50);
  const a11 = restyle(cap1(useLine("A11a")), /^(feature|works)$/, "bi");
  const without = c.at("A11a", /^without$/, 56);
  const a11b = restyle(cap1(useLine("A11b")), /^branch$/, "bi");
  const second = c.at("A11b", /^a$/, 20, c.at("A11b", /^branch$/, 6) + 1);
  const a12 = restyle(cap1(useLine("A12a")), /^merge$/, "bi");
  const a12b = restyle(cap1(useLine("A12b")), /^delete$/, "bi");
  let a13 = restyle(restyle(cap1(useLine("A13a")), /^(solid|tag)$/, "bi"), /^(v1|anytime)$/, "bi");
  a13 = figure(a13, [/^v$/, /^one$/], "v1", "bi");
  a13 = restyle(a13, /^v1$/, "bi");
  const tagW = c.at("A13a", /^tag$/, 56);
  const so = c.at("A13a", /^so$/, 96);
  const a14 = restyle(cap1(useLine("A14a")), /^(commit|push)$/, "bi");
  const just = c.at("A14a", /^just$/, 70);
  const a14b = restyle(restyle(cap1(useLine("A14b")), /^(for|you)$/, "bi"), /^commands$/, "bold");

  const big = { scale: 1.5, cy: 740 };
  const blocks: Block[] = [
    { lines: splitAt(a01, [/^runs$/]) },
    // RED TEAM RT-A-1: one sentence spoken without a pause stays one block (no swap inside continuous speech)
    { lines: [span(a02, -Infinity, almost), ...splitAt(span(a02, almost), [/^uses$/])], cy: 396 },
    // A03a: the words are drawn on the text card in the world (sIntro); the hidden block keeps the schedule
    { lines: splitAt(a03, [/^it$/]), ...big, hidden: true },
    { lines: splitAt(span(a04, -Infinity, thats), [/^save$/]) },
    { lines: splitAt(span(a04, thats), [/^a$/]) },
    { lines: [...splitAt(span(a05, -Infinity, inW), [/^of$/]), span(a05, inW)], cy: 396 },
    { lines: splitAt(a05b, [/^the$/]) },
    { lines: [span(a06, -Infinity, and6)] },
    { lines: splitAt(span(a06, and6), [/^app's$/]) },
    { lines: splitAt(a07, [/^breaks$/]) },
    // one block: "you tell Claude to go back to the last version that worked" is spoken without a pause
    { lines: [...splitAt(span(a07b, -Infinity, to2), [/^to$/]), ...splitAt(span(a07b, to2), [/^that$/])], cy: 420 },
    { lines: splitAt(a08, [/^lives$/]) },
    { lines: splitAt(a08b, [/^it's$/]) },
    { lines: splitAt(a09, [/^to$/]) },
    { lines: splitAt(a09b, [/^lives$/]) },
    { lines: [span(a10, -Infinity, does), ...splitAt(span(a10, does), [/^in$/])], cy: 396 },
    { lines: splitAt(span(a10b, -Infinity, onto), [/^its$/]) },
    { lines: [span(a10b, onto)] },
    { lines: splitAt(span(a11, -Infinity, without), [/^a$/]) },
    { lines: splitAt(span(a11, without), [/^version$/]) },
    { lines: [span(a11b, -Infinity, second)] },
    { lines: splitAt(span(a11b, second), [/^that$/]) },
    { lines: splitAt(a12, [/^you$/]) },
    { lines: splitAt(a12b, [/^you$/]) },
    { lines: splitAt(span(a13, -Infinity, tagW), [/^is$/]) },
    { lines: splitAt(span(a13, tagW, so), [/^like$/]) },
    { lines: splitAt(span(a13, so), [/^to$/]) },
    { lines: splitAt(span(a14, -Infinity, just), [/^to$/]) },
    { lines: splitAt(span(a14, just), [/^to$/]) },
    { lines: splitAt(a14b, [/^for$/]) },
  ];
  return blocks;
};
