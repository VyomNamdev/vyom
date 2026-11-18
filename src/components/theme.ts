import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Dark fintech studio aesthetic.
 * Keep in sync with the `@theme` tokens in `src/index.css` (Tailwind classes
 * such as `bg-canvas`, `text-muted`, `font-mono`).
 */

const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const jetbrains = loadJetBrainsMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export const colors = {
  /** Deep slate canvas behind everything */
  canvas: "#0B1120",
  /** Elevated app window surface */
  surface: "#111827",
  /** Subtle hairline borders / dividers */
  border: "#1E293B",
  /** Emerald highlight: gains, CTAs, cursor ripple */
  emerald: "#10B981",
  /** Alert red: losses, errors */
  alert: "#EF4444",
  /** Primary text */
  text: "#F8FAFC",
  /** Secondary / muted text */
  muted: "#94A3B8",
} as const;

export const fonts = {
  /** UI font */
  sans: `${inter.fontFamily}, system-ui, -apple-system, sans-serif`,
  /** Code & numbers font */
  mono: `${jetbrains.fontFamily}, ui-monospace, SFMono-Regular, monospace`,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  window: 14,
} as const;

export const shadows = {
  window:
    "0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px -20px rgba(0,0,0,0.7), 0 12px 30px -12px rgba(0,0,0,0.6)",
  card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px -12px rgba(0,0,0,0.55)",
  emeraldGlow: "0 0 0 1px rgba(16,185,129,0.35), 0 0 24px rgba(16,185,129,0.25)",
} as const;

/** Composition defaults every scene shares. */
export const video = {
  width: 1920,
  height: 1080,
  fps: 60,
} as const;

/** Hex color → rgba() string. */
export const alpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const theme = { colors, fonts, radii, shadows, video, alpha } as const;
export type Theme = typeof theme;
