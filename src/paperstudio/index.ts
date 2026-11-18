// Paper Studio Remotion kit. Import everything from here:
//   import { theme, Ground, CrtPass, PaperCard, ... } from "../paperstudio";
export { theme, EASE, prog, mix, mixColor, clamp, INTER, MONO, W, H, FPS, LOGO, MARK, SHOT, TERM, TERM_BY_TITLE, PHOTO, fontsReady } from "./theme";
export { type Enter, type Exit, enterState, drift } from "./motion";
export { Ground, Grid, Swooshes } from "./Ground";
export { CrtPass } from "./CrtPass";
export { PaperCard, type PaperCardProps } from "./PaperCard";
export { TerminalCard, TerminalStrip, type TerminalCardProps, type StripPane } from "./Terminal";
export { LogoChip, LogoChipLine, LogoDisc, InlineChip, type LogoChipProps } from "./LogoChip";
export { Cutout, HandsScene, type CutoutProps } from "./Cutout";
export { WirePath, WireNode, DashedArrow, HintArrow, type WirePathProps } from "./Wire";
export { KineticCaption, words, phrase, captionHeight, type CapWord, type CapStyle } from "./KineticCaption";
export { Icon, IconList, Sparkle, SparkleList, StatRow, RaceBars, type IconKind, type RaceRow } from "./Lists";
export { ShatterOverlay, BlurBreak, IconObject, GuideMock } from "./Effects";
export { Pill, HookOverlay } from "./Pill";
export {
  Camera,
  PadCtx,
  useCamera,
  camPath,
  camAt,
  camAtKeys,
  camSpeed,
  camTransform,
  frameRect,
  zoomAt,
  pushIn,
  toScreen,
  toWorld,
  boxCentre,
  CAM_BOX,
  type CamKey,
  type CamPose,
  type CamFollow,
  type CamGround,
  type CamBlur,
  type CamSpec,
  type CameraProps,
  type Box,
  type Pt,
} from "./Camera";
// ep05 additions (2026-10-31): new files and new exports only; nothing above changed.
export { PHOTO05, ROBOT_ASPECT, CONDENSED, reveal, keyed, ghCount } from "./kit05";
export { RimImage, PortraitCutout, BrandBurst, type RimImageProps, type PortraitCutoutProps, type BrandBurstProps, type BurstKey } from "./Hero";
export { StackedCaps, SideCaption, type StackedCapsProps, type CapsLine, type SideCaptionProps, type SideLine } from "./Captions05";
export {
  ChatBubble,
  ChatStack,
  bubbleHeight,
  SpriteGrid,
  LineTrack,
  type ChatBubbleProps,
  type ChatStackProps,
  type SpriteGridProps,
  type LineTrackProps,
  type TrackItem,
} from "./Army";
export { DeviceFrame, deviceHeight, Toggle, type DeviceFrameProps, type ToggleProps } from "./Device";
export { UiCounter, CommitStrip, PageTurn, type UiCounterProps, type CommitStripProps, type Commit, type PageTurnProps } from "./UiBits";
// ep06 additions (2026-11-02): new files and new exports only; nothing above changed.
export { PHOTO06, META06, asset06, hasStatic, rng, hash01, polyLen, polyAt, polyUpTo, polyD, quadMatrix3d, clipHalf, centroid, type Asset06, type P2, type Quad } from "./kit06";
export { KnowledgeGraph, GRAPH_DEFAULT, graphFromSeed, graphWalk, type KnowledgeGraphProps, type GraphNode, type GraphEdge, type GraphData, type GraphCard } from "./Graph";
export { UsageMeter, PlanCard, ReportedStat, type UsageMeterProps, type PlanCardProps, type ReportedStatProps, type FillKey } from "./Plans";
export { SnipCut, Scissors, snipPoint, type SnipCutProps, type ScissorsProps } from "./Snip";
export { Token, TokenStack, TokenSpill, TokenHeap, type TokenProps, type TokenStackProps, type TokenSpillProps } from "./Tokens";
export { StreetMap, StreetWalker, MapUnfold, streetGeom, snakePath, ROUTE_DEFAULT, type StreetMapProps, type StreetWalkerProps, type MapUnfoldProps, type GridPt } from "./Streets";
export { ScreenInset, screenQuad, type ScreenInsetProps } from "./ScreenInset";
