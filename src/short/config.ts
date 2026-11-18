/** "I Used Free AI to Automate My Entire Monthly Budget in 60 Seconds" — Tech & Wealth Systems */
export const SHORT = {
  width: 1080,
  height: 1920,
  fps: 60,
  durationInFrames: 3600, // 60s
} as const;

const s = (sec: number) => Math.round(sec * SHORT.fps);

/** Global frame ranges. `overlap` lets slide transitions run under the next scene. */
export const SCENES = {
  hook: { from: 0, duration: s(5) },
  statement: { from: s(5), duration: s(10) },
  transform: { from: s(15), duration: s(20) },
  pipeline: { from: s(35), duration: s(15) },
  end: { from: s(50), duration: s(10) },
} as const;

/** Voiceover, split into caption phrases with start/end in seconds. */
export const VOICEOVER: { text: string; start: number; end: number }[] = [
  // Scene 1
  { text: "Most people quit budgeting by week two.", start: 0.15, end: 2.4 },
  { text: "Manual tracking is a second job.", start: 2.5, end: 4.0 },
  { text: "Let's fix it.", start: 4.05, end: 4.9 },
  // Scene 2
  { text: "Still typing numbers into a calculator", start: 5.2, end: 7.4 },
  { text: "or sorting statements by hand?", start: 7.45, end: 9.2 },
  { text: "That's hours of busywork every month,", start: 9.6, end: 11.8 },
  { text: "and AI can do it instantly.", start: 11.9, end: 14.2 },
  // Scene 3
  { text: "Watch this.", start: 15.2, end: 16.4 },
  { text: "We export a raw bank statement,", start: 16.6, end: 18.9 },
  { text: "drop it into a free AI prompt,", start: 19.2, end: 21.8 },
  {
    text: "and within seconds every dollar is categorized,",
    start: 23.0,
    end: 26.4,
  },
  { text: "audited,", start: 26.7, end: 27.6 },
  {
    text: "and mapped into a clean Google Sheets template.",
    start: 27.9,
    end: 31.6,
  },
  // Scene 4
  { text: "No expensive subscription apps,", start: 35.3, end: 37.4 },
  {
    text: "no handing your bank login to a third party,",
    start: 37.6,
    end: 40.4,
  },
  { text: "and zero manual data entry.", start: 40.6, end: 42.8 },
  { text: "Just a personal finance system", start: 43.5, end: 45.5 },
  { text: "that runs on autopilot.", start: 45.55, end: 47.3 },
  // Scene 5
  { text: "Want this exact Google Sheets template?", start: 50.3, end: 52.6 },
  { text: "Tap the linked video below.", start: 53.0, end: 54.8 },
  { text: "The full build and the free template", start: 55.3, end: 57.3 },
  { text: "are waiting there.", start: 57.35, end: 58.7 },
];

/** Words highlighted in emerald in captions. */
export const KEY_WORDS = [
  "free",
  "automated",
  "automate",
  "savings",
  "budget",
  "budgeting",
  "ai",
  "autopilot",
  "template",
  "instantly",
];

export const usd = (n: number, decimals = 0) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

export const AMBER = "#F59E0B";
