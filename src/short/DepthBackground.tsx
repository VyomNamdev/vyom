import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { alpha, colors, fonts } from "../components";
import { ReelBackground } from "../reel/ui";

/** Floating glass chips at different depths: far ones are smaller, blurrier and slower (parallax). */
const CHIPS = [
  { x: 70, y: 260, z: 0.35, label: "$" },
  { x: 900, y: 420, z: 0.6, label: "%" },
  { x: 40, y: 1180, z: 0.8, label: "+23.4%" },
  { x: 930, y: 1250, z: 0.3, label: "$" },
  { x: 820, y: 120, z: 0.25, label: "↗" },
  { x: 110, y: 760, z: 0.2, label: "%" },
  { x: 960, y: 900, z: 0.45, label: "$" },
  { x: 260, y: 1700, z: 0.55, label: "$983" },
];

const Chip: React.FC<(typeof CHIPS)[number] & { i: number }> = ({
  x,
  y,
  z,
  label,
  i,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const size = 50 + z * 70;
  const wide = label.length > 2;
  const dy = ((((y - t * (12 + z * 40)) % 2100) + 2100) % 2100) - 90;
  return (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(t * 0.5 + i) * 18 * z,
        top: dy,
        height: size,
        minWidth: size,
        padding: wide ? `0 ${size * 0.28}px` : 0,
        borderRadius: size * 0.28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.mono,
        fontWeight: 700,
        fontSize: size * (wide ? 0.36 : 0.5),
        color: colors.emerald,
        background: `linear-gradient(140deg, ${alpha("#FFFFFF", 0.09)}, ${alpha("#FFFFFF", 0.02)})`,
        border: `1px solid ${alpha(colors.emerald, 0.25 + z * 0.2)}`,
        boxShadow: `0 ${20 * z}px ${40 * z}px -10px rgba(0,0,0,0.6)`,
        opacity: 0.18 + z * 0.3,
        filter: `blur(${(1 - z) * 5}px)`,
        transform: `perspective(800px) rotateX(${Math.sin(t * 0.7 + i) * 25}deg) rotateY(${Math.cos(t * 0.6 + i * 2) * 30}deg)`,
      }}
    >
      {label}
    </div>
  );
};

/** Persistent 2.5D backdrop: receding perspective floor grid + parallax glass chips. */
export const DepthBackground: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ReelBackground />
      {/* Perspective floor */}
      <AbsoluteFill
        style={{
          perspective: 700,
          perspectiveOrigin: "50% 30%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -1200,
            right: -1200,
            top: 1150,
            height: 1800,
            transform: "rotateX(76deg)",
            transformOrigin: "50% 0%",
            backgroundImage: `linear-gradient(${alpha(colors.emerald, 0.22)} 2px, transparent 2px), linear-gradient(90deg, ${alpha(colors.emerald, 0.22)} 2px, transparent 2px)`,
            backgroundSize: "120px 120px",
            backgroundPosition: `0 ${(frame * 1.6) % 120}px`,
            maskImage:
              "linear-gradient(180deg, transparent 0%, black 35%, black 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, black 35%, black 70%, transparent 100%)",
            opacity: 0.55,
          }}
        />
      </AbsoluteFill>
      {CHIPS.map((c, i) => (
        <Chip key={i} i={i} {...c} />
      ))}
    </AbsoluteFill>
  );
};
