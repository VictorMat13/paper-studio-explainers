// The Paper Studio kit as the ep08 shell sees it (Ground, CrtPass, theme, HookOverlay).
// Builders may import anything else straight from "../../paperstudio" (its index.ts), including the ep05 and ep06
// additions (PortraitCutout, BrandBurst, StackedCaps, SideCaption, DeviceFrame, UiCounter, CommitStrip, PageTurn,
// KnowledgeGraph, UsageMeter, PlanCard, SnipCut, TokenStack/TokenSpill, MapUnfold, StreetWalker, ReportedStat,
// ScreenInset; see src/paperstudio/README.md). The kit is read-only in ep08: local helpers go in beats/<Group>/.
export { Ground, CrtPass, theme, HookOverlay as KitHookOverlay } from "../paperstudio";
