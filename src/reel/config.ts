/** Edit these to re-skin the reel. */
export const REEL = {
  width: 1080,
  height: 1920,
  fps: 60,
  durationInFrames: 1800, // 30s
  currency: "₹",
  locale: "en-IN",
  keyword: "MONEY",
  pdfTitle: ["The AI", "Budget", "Playbook"],
  pdfSubtitle: "25 copy-paste prompts + 50/30/20 template",
} as const;

/** Scene boundaries (global frames). */
export const SCENES = {
  hook: { from: 0, duration: 210 },
  intro: { from: 210, duration: 210 },
  step1: { from: 420, duration: 420 },
  step2: { from: 840, duration: 420 },
  step3: { from: 1260, duration: 270 },
  cta: { from: 1530, duration: 270 },
} as const;

export const money = (n: number) =>
  `${REEL.currency}${Math.round(n).toLocaleString(REEL.locale)}`;

/** Chat window shared by step 1 and step 2, so it reads as one continuous take. */
export const SHELL = { x: 60, y: 700, w: 960, h: 860 } as const;
/** Top-left of the browser viewport in composition px (1px border + 56px toolbar). */
export const VIEW = { x: SHELL.x + 1, y: SHELL.y + 1 + 56 } as const;
export const at = (x: number, y: number) => ({ x: VIEW.x + x, y: VIEW.y + y });
