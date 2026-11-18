import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Kind = "fade" | "up" | "left" | "split" | "none";
const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRANSITION = 24;

/** Scene enter/exit transitions (slide up, slide left, fade, none). */
export const SlideWrap: React.FC<{
  duration: number;
  enter?: Kind;
  exit?: Kind;
  children: React.ReactNode;
}> = ({ duration, enter = "fade", exit = "fade", children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pin = interpolate(frame, [0, TRANSITION], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const pout = interpolate(frame, [duration - TRANSITION, duration], [0, 1], {
    ...clamp,
    easing: ease,
  });

  let tx = 0;
  let ty = 0;
  let opacity = 1;
  if (enter === "up") ty += (1 - pin) * height;
  if (enter === "left") tx += (1 - pin) * width;
  if (enter === "fade") opacity *= Math.min(1, frame / 10);
  if (exit === "up") ty -= pout * height;
  if (exit === "left") tx -= pout * width;
  if (exit === "fade")
    opacity *= 1 - interpolate(frame, [duration - 10, duration], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ opacity, transform: `translate(${tx}px, ${ty}px)` }}>
      {children}
    </AbsoluteFill>
  );
};
