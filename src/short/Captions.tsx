import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, colors, fonts } from "../components";
import { KEY_WORDS, VOICEOVER } from "./config";

/**
 * Burned-in word-by-word captions. Words appear across each phrase's window,
 * weighted by word length so pacing tracks natural speech.
 * Sits just above the bottom 20% safe zone and clear of the right 15%.
 */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const phrase = VOICEOVER.find((p) => t >= p.start && t < p.end + 0.12);
  if (!phrase) return null;

  const words = phrase.text.split(" ");
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = (phrase.end - phrase.start) * 0.92;
  let acc = 0;
  const starts = weights.map((w) => {
    const st = phrase.start + (acc / total) * span;
    acc += w;
    return st;
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        width: 800,
        top: 1400,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 16px",
          padding: "14px 26px",
          borderRadius: 22,
          backgroundColor: alpha(colors.canvas, 0.72),
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.18,
          letterSpacing: -0.5,
          textAlign: "center",
        }}
      >
        {words.map((w, i) => {
          const startFrame = starts[i] * fps;
          if (frame < startFrame) {
            return (
              <span key={i} style={{ opacity: 0 }}>
                {w}
              </span>
            );
          }
          const sp = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 12, stiffness: 220, mass: 0.5 },
          });
          const clean = w.toLowerCase().replace(/[^a-z]/g, "");
          const key = KEY_WORDS.includes(clean);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: key ? colors.emerald : colors.text,
                transform: `scale(${0.75 + 0.25 * sp}) translateY(${(1 - sp) * 10}px)`,
                textShadow: key
                  ? `0 0 26px ${alpha(colors.emerald, 0.55)}, 0 3px 10px rgba(0,0,0,0.7)`
                  : "0 3px 12px rgba(0,0,0,0.8)",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
