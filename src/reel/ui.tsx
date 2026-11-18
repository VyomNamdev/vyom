import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { alpha, colors, fonts } from "../components";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const usePop = (delay: number, config = { damping: 14, stiffness: 160, mass: 0.6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

export const useSmooth = (delay: number, durationInFrames = 30) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, durationInFrames, config: { damping: 200 } });
};

/** Persistent animated backdrop (uses the global frame, so it never "cuts"). */
export const ReelBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${30 + Math.sin(t * 0.4) * 12}% ${18 + Math.cos(t * 0.3) * 6}%, ${alpha(colors.emerald, 0.16)}, transparent 70%),
            radial-gradient(800px 800px at ${80 + Math.cos(t * 0.35) * 10}% ${85 + Math.sin(t * 0.25) * 5}%, ${alpha("#3B82F6", 0.08)}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${alpha(colors.border, 0.55)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(colors.border, 0.55)} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          backgroundPosition: `0 ${(frame * 0.4) % 72}px`,
          maskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};

/** Fades/scales a scene in and out at its edges. */
export const SceneWrap: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], clamp);
  const scale = interpolate(frame, [0, 12, duration - 10, duration], [0.97, 1, 1, 1.03], clamp);
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>{children}</AbsoluteFill>
  );
};

type Token = { text: string; style: "plain" | "green" | "red" | "pill" };

/** "*green words*", "~red words~", "^pill^" markup → word tokens per line. */
const parse = (text: string): Token[][] =>
  text.split("\n").map((line) => {
    const out: Token[] = [];
    const re = /\*([^*]+)\*|~([^~]+)~|\^([^^]+)\^|(\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m[1]) m[1].split(" ").forEach((w) => out.push({ text: w, style: "green" }));
      else if (m[2]) m[2].split(" ").forEach((w) => out.push({ text: w, style: "red" }));
      else if (m[3]) out.push({ text: m[3], style: "pill" });
      else out.push({ text: m[4], style: "plain" });
    }
    return out;
  });

/** Kinetic headline: words pop in one after another. */
export const Headline: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  top?: number;
  stagger?: number;
}> = ({ text, delay = 0, size = 92, top = 300, stagger = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = parse(text);
  let i = 0;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: -2,
        color: colors.text,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 0.26em" }}>
          {line.map((tok) => {
            const s = spring({
              frame: frame - delay - i++ * stagger,
              fps,
              config: { damping: 13, stiffness: 170, mass: 0.6 },
            });
            const base: React.CSSProperties = {
              display: "inline-block",
              opacity: Math.min(1, s * 1.4),
              transform: `translateY(${(1 - s) * 46}px) scale(${0.9 + 0.1 * s})`,
              filter: `blur(${Math.max(0, (1 - s) * 8)}px)`,
            };
            if (tok.style === "pill") {
              return (
                <span
                  key={i}
                  style={{
                    ...base,
                    backgroundColor: colors.emerald,
                    color: colors.canvas,
                    padding: "0 0.22em",
                    borderRadius: 18,
                    boxShadow: `0 0 50px ${alpha(colors.emerald, 0.5)}`,
                  }}
                >
                  {tok.text}
                </span>
              );
            }
            const color =
              tok.style === "green" ? colors.emerald : tok.style === "red" ? colors.alert : colors.text;
            return (
              <span
                key={i}
                style={{
                  ...base,
                  color,
                  textShadow:
                    tok.style === "plain" ? "0 4px 30px rgba(0,0,0,0.5)" : `0 0 40px ${alpha(color, 0.45)}`,
                }}
              >
                {tok.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const StepPill: React.FC<{ n: number; top?: number; delay?: number }> = ({
  n,
  top = 200,
  delay = 0,
}) => {
  const s = usePop(delay);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 4,
          color: colors.emerald,
          padding: "10px 26px",
          borderRadius: 999,
          border: `2px solid ${alpha(colors.emerald, 0.5)}`,
          backgroundColor: alpha(colors.emerald, 0.1),
          opacity: Math.min(1, s),
          transform: `scale(${0.6 + 0.4 * s})`,
        }}
      >
        STEP {n} / 3
      </div>
    </div>
  );
};

/** Darkens the top so headlines stay legible over zoomed UI. */
export const TopScrim: React.FC<{ height?: number }> = ({ height = 800 }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height,
      background: `linear-gradient(180deg, ${colors.canvas} 0%, ${colors.canvas} 52%, ${alpha(colors.canvas, 0.85)} 72%, ${alpha(colors.canvas, 0)} 100%)`,
    }}
  />
);

export const SparkIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = colors.emerald,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M12 2l2.2 6.3L20.5 10.5l-6.3 2.2L12 19l-2.2-6.3L3.5 10.5l6.3-2.2z"
      fill={color}
    />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill={color} opacity={0.7} />
  </svg>
);

export const CheckIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = colors.emerald,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FileIcon: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M6 2h8l5 5v15H6z" fill={alpha(colors.alert, 0.18)} stroke={colors.alert} strokeWidth={1.6} strokeLinejoin="round" />
    <path d="M14 2v5h5" fill="none" stroke={colors.alert} strokeWidth={1.6} strokeLinejoin="round" />
    <text x={12.5} y={17.5} fontSize={5.2} fontWeight={700} fill={colors.alert} textAnchor="middle" fontFamily="sans-serif">
      PDF
    </text>
  </svg>
);
