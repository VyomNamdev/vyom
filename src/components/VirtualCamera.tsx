import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "./theme";

export type CameraKeyframe = {
  /** Frame (relative to the enclosing Sequence) at which this pose is reached. */
  frame: number;
  /** Zoom factor. 1 = full frame. Clamped to [1, MAX_ZOOM]. */
  scale: number;
  /** Focal point X in composition pixels (the point that ends up centered). */
  x: number;
  /** Focal point Y in composition pixels. */
  y: number;
};

export const MAX_ZOOM = 1.85;
const MAX_TILT_DEG = 0.5;
const cameraEase = Easing.bezier(0.25, 0.1, 0.25, 1);

type Pose = { scale: number; x: number; y: number };

type Props = {
  keyframes: CameraKeyframe[];
  children: React.ReactNode;
  /**
   * Keep the frame filled: shifts the focal point so the zoomed content never
   * reveals empty canvas at the edges. Default true.
   */
  clampToEdges?: boolean;
  /** Enables the subtle 2.5D tilt while the camera is moving. Default true. */
  tilt?: boolean;
  background?: string;
};

const sortKeyframes = (k: CameraKeyframe[]) =>
  [...k].sort((a, b) => a.frame - b.frame);

/** Eased pose at `frame`, plus the active segment (for tilt). */
const sampleCamera = (
  frame: number,
  keyframes: CameraKeyframe[],
  width: number,
  height: number,
): { pose: Pose; progress: number; from: Pose; to: Pose } => {
  const fallback: Pose = { scale: 1, x: width / 2, y: height / 2 };
  if (keyframes.length === 0) {
    return { pose: fallback, progress: 0, from: fallback, to: fallback };
  }
  const k = sortKeyframes(keyframes);
  if (frame <= k[0].frame || k.length === 1) {
    return { pose: k[0], progress: 0, from: k[0], to: k[0] };
  }
  const last = k[k.length - 1];
  if (frame >= last.frame) {
    return { pose: last, progress: 0, from: last, to: last };
  }
  let i = 0;
  while (i < k.length - 1 && frame >= k[i + 1].frame) i++;
  const a = k[i];
  const b = k[i + 1];
  const t = interpolate(frame, [a.frame, b.frame], [0, 1], {
    easing: cameraEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Interpolate zoom in log space so zoom-in and zoom-out feel equally paced.
  const scale = Math.exp(
    Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * t,
  );
  const linearT = (frame - a.frame) / (b.frame - a.frame);
  return {
    pose: { scale, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
    progress: linearT,
    from: a,
    to: b,
  };
};

/**
 * Smooth camera rig. Wrap a scene (e.g. a <BrowserShell/>) and pass keyframes
 * to push in on UI elements and pull back out.
 *
 * Content stays DOM/SVG, so it is re-rasterized at the zoomed size each frame:
 * text and vectors stay crisp at 1.85x (no bitmap upscaling). Avoid putting
 * low-res raster images in zoom targets.
 */
export const VirtualCamera: React.FC<Props> = ({
  keyframes,
  children,
  clampToEdges = true,
  tilt = true,
  background = colors.canvas,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const safeKeyframes = keyframes.map((kf) => ({
    ...kf,
    scale: Math.min(MAX_ZOOM, Math.max(1, kf.scale)),
  }));

  const { pose, progress, from, to } = sampleCamera(
    frame,
    safeKeyframes,
    width,
    height,
  );

  let { x, y } = pose;
  const { scale } = pose;
  if (clampToEdges) {
    const halfW = width / (2 * scale);
    const halfH = height / (2 * scale);
    x = Math.min(width - halfW, Math.max(halfW, x));
    y = Math.min(height - halfH, Math.max(halfH, y));
  }

  // Translate so the focal point lands in the center of the frame.
  const tx = width / 2 - x * scale;
  const ty = height / 2 - y * scale;

  // 2.5D tilt: peaks mid-move, zero at rest. Direction follows the pan; a pure
  // zoom leans slightly "forward" (rotateX) like a dolly push.
  let rotX = 0;
  let rotY = 0;
  let tiltCover = 1;
  if (tilt && progress > 0 && progress < 1) {
    const envelope = Math.sin(Math.PI * progress);
    const dx = (to.x - from.x) / width;
    const dy = (to.y - from.y) / height;
    const dz = Math.log(to.scale) - Math.log(from.scale);
    const mag = Math.hypot(dx, dy, dz * 0.5) || 1;
    rotY = (dx / mag) * MAX_TILT_DEG * envelope;
    rotX = (-(dy / mag) + (dz * 0.5) / mag) * MAX_TILT_DEG * envelope;
    const total = Math.hypot(rotX, rotY);
    if (total > MAX_TILT_DEG) {
      rotX = (rotX / total) * MAX_TILT_DEG;
      rotY = (rotY / total) * MAX_TILT_DEG;
    }
    // Tiny overscan so the tilted plane never exposes the canvas at its edges.
    tiltCover = 1 + 0.008 * envelope;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "50% 50%",
          transform: `perspective(2400px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${tiltCover})`,
        }}
      >
        <AbsoluteFill
          style={{
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            backfaceVisibility: "hidden",
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
