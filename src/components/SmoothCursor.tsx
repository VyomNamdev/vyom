import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors } from "./theme";

export type CursorWaypoint = {
  /** Frame at which the cursor arrives at (x, y). Clicks fire on this frame. */
  frame: number;
  x: number;
  y: number;
  click?: boolean;
  /**
   * Travel time in frames for the move that ends at this waypoint.
   * Defaults to a distance-based duration (Fitts-like), capped by the gap
   * since the previous waypoint.
   */
  duration?: number;
};

type Props = {
  waypoints: CursorWaypoint[];
  /** Pointer height in px. Default 30 (macOS-ish at 1080p). */
  size?: number;
  /** Curvature of travel arcs, 0 = straight. Default 0.08. */
  arc?: number;
  /** Max overshoot distance in px. Default 7. */
  overshoot?: number;
  rippleColor?: string;
};

const CLICK_FRAMES = 6;
const CLICK_SCALE = 0.85;
const RIPPLE_FRAMES = 32;
const OVERSHOOT_SPLIT = 0.84; // fraction of travel time spent reaching the overshoot point

const moveEase = Easing.inOut(Easing.cubic);
const settleEase = Easing.inOut(Easing.quad);

type Vec = { x: number; y: number };

const cubicBezier = (p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
};

const defaultDuration = (dist: number) =>
  Math.round(Math.min(56, Math.max(22, 16 + dist / 28)));

const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Cursor position at `frame`, following arcs with a micro-overshoot + settle. */
export const getCursorPosition = (
  frame: number,
  waypoints: CursorWaypoint[],
  arc = 0.08,
  overshoot = 7,
): Vec => {
  if (waypoints.length === 0) return { x: 0, y: 0 };
  const w = [...waypoints].sort((a, b) => a.frame - b.frame);
  if (frame <= w[0].frame) return { x: w[0].x, y: w[0].y };

  // Find the segment whose arrival frame is next.
  let i = 1;
  while (i < w.length && frame >= w[i].frame) i++;
  if (i >= w.length) {
    const last = w[w.length - 1];
    return { x: last.x, y: last.y };
  }

  const from = w[i - 1];
  const to = w[i];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) return { x: from.x, y: from.y };

  // Leave room after a click so the press finishes before the cursor departs.
  const earliestStart = from.frame + (from.click ? CLICK_FRAMES : 0);
  const gap = Math.max(1, to.frame - earliestStart);
  const duration = Math.max(1, Math.min(gap, to.duration ?? defaultDuration(dist)));
  const start = to.frame - duration;
  if (frame <= start) return { x: from.x, y: from.y };

  const t = (frame - start) / duration;
  const dir = { x: dx / dist, y: dy / dist };
  // Perpendicular, always bowing the same way like a natural wrist arc.
  const normal = { x: -dir.y, y: dir.x };
  const bow = Math.min(70, dist * arc) * (dir.x >= 0 ? -1 : 1);

  const over = Math.min(overshoot, dist * 0.03);
  const overPt = { x: to.x + dir.x * over, y: to.y + dir.y * over };

  if (t < OVERSHOOT_SPLIT || over < 0.5) {
    const span = over < 0.5 ? 1 : OVERSHOOT_SPLIT;
    const p = moveEase(Math.min(1, t / span));
    const end = over < 0.5 ? { x: to.x, y: to.y } : overPt;
    const p1 = {
      x: from.x + dx * 0.3 + normal.x * bow,
      y: from.y + dy * 0.3 + normal.y * bow,
    };
    const p2 = {
      x: from.x + dx * 0.75 + normal.x * bow * 0.6,
      y: from.y + dy * 0.75 + normal.y * bow * 0.6,
    };
    return cubicBezier(from, p1, p2, end, p);
  }

  const s = settleEase((t - OVERSHOOT_SPLIT) / (1 - OVERSHOOT_SPLIT));
  return {
    x: overPt.x + (to.x - overPt.x) * s,
    y: overPt.y + (to.y - overPt.y) * s,
  };
};

/** Crisp macOS-style arrow. Hotspot is the tip at (0, 0). */
const MacPointer: React.FC<{ size: number }> = ({ size }) => {
  // Path designed on a 20x30 grid with the tip at (2, 2).
  const scale = size / 30;
  return (
    <svg
      width={22 * scale}
      height={32 * scale}
      viewBox="0 0 22 32"
      style={{
        position: "absolute",
        left: -2 * scale,
        top: -2 * scale,
        overflow: "visible",
        filter:
          "drop-shadow(0 1.5px 2px rgba(0,0,0,0.45)) drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
      }}
    >
      <path
        d="M2 2 L2 25.2 L7.6 19.9 L11.3 28.6 L15.4 26.9 L11.8 18.4 L19.4 18.4 Z"
        fill="#0A0A0A"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinejoin="round"
        shapeRendering="geometricPrecision"
      />
    </svg>
  );
};

/**
 * Smooth, human cursor. Place it inside the same coordinate space as the UI
 * it points at (e.g. inside <VirtualCamera/>), absolutely positioned.
 */
export const SmoothCursor: React.FC<Props> = ({
  waypoints,
  size = 30,
  arc = 0.08,
  overshoot = 7,
  rippleColor = colors.emerald,
}) => {
  const frame = useCurrentFrame();
  const pos = getCursorPosition(frame, waypoints, arc, overshoot);

  const clicks = waypoints.filter((w) => w.click);

  // Press compression: 1 → 0.85 → 1 across 6 frames.
  let pressScale = 1;
  for (const c of clicks) {
    if (frame >= c.frame && frame <= c.frame + CLICK_FRAMES) {
      pressScale = interpolate(
        frame,
        [c.frame, c.frame + 2, c.frame + 4, c.frame + CLICK_FRAMES],
        [1, CLICK_SCALE, CLICK_SCALE, 1],
        { ...clamp01, easing: Easing.inOut(Easing.quad) },
      );
    }
  }

  const ripples = clicks
    .filter((c) => frame >= c.frame && frame < c.frame + RIPPLE_FRAMES)
    .map((c) => {
      const p = interpolate(frame, [c.frame, c.frame + RIPPLE_FRAMES], [0, 1], {
        ...clamp01,
        easing: Easing.out(Easing.cubic),
      });
      return {
        key: c.frame,
        x: c.x,
        y: c.y,
        radius: 6 + p * 34,
        opacity: interpolate(p, [0, 0.15, 1], [0, 0.95, 0], clamp01),
        border: 3 - p * 1.5,
        fill: interpolate(p, [0, 0.2, 1], [0, 0.22, 0], clamp01),
      };
    });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {ripples.map((r) => (
        <div
          key={r.key}
          style={{
            position: "absolute",
            left: r.x - r.radius,
            top: r.y - r.radius,
            width: r.radius * 2,
            height: r.radius * 2,
            borderRadius: "50%",
            border: `${r.border}px solid ${rippleColor}`,
            backgroundColor: rippleColor.startsWith("#")
              ? `${rippleColor}${Math.round(r.fill * 255)
                  .toString(16)
                  .padStart(2, "0")}`
              : undefined,
            opacity: r.opacity,
            boxShadow: `0 0 18px ${rippleColor}`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: 0,
          height: 0,
          // Compress toward the hotspot, like the real macOS press.
          transform: `scale(${pressScale})`,
          transformOrigin: "0 0",
        }}
      >
        <MacPointer size={size} />
      </div>
    </div>
  );
};
