import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { VirtualCamera, alpha, colors, fonts } from "../../components";
import { money } from "../config";
import { Headline, StepPill, usePop } from "../ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SPLIT = [
  { label: "Needs", pct: 50, amt: 32500, color: "#94A3B8" },
  { label: "Wants", pct: 30, amt: 19500, color: "#475569" },
  { label: "Savings", pct: 20, amt: 13000, color: colors.emerald },
];

const R = 230;
const STROKE = 70;
const C = 2 * Math.PI * R;
const GAP = 10;

export const Budget: React.FC = () => {
  const frame = useCurrentFrame();
  let offset = 0;
  const yearly = interpolate(frame, [110, 200], [0, 13000 * 12], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const center = usePop(90);

  return (
    <>
      <VirtualCamera
        keyframes={[
          { frame: 0, scale: 1.08, x: 540, y: 1080 },
          { frame: 260, scale: 1, x: 540, y: 960 },
        ]}
      >
        <svg
          width={1080}
          height={1920}
          style={{ position: "absolute", inset: 0 }}
          viewBox="0 0 1080 1920"
        >
          <g transform={`translate(540 1010) rotate(-90)`}>
            <circle r={R} fill="none" stroke={colors.border} strokeWidth={STROKE} opacity={0.6} />
            {SPLIT.map((s, i) => {
              const start = 14 + i * 20;
              const p = interpolate(frame, [start, start + 45], [0, 1], {
                ...clamp,
                easing: Easing.inOut(Easing.cubic),
              });
              const len = Math.max(0, (s.pct / 100) * C - GAP) * p;
              const el = (
                <circle
                  key={s.label}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${len} ${C}`}
                  strokeDashoffset={-offset}
                  style={
                    s.label === "Savings"
                      ? { filter: `drop-shadow(0 0 18px ${alpha(colors.emerald, 0.6)})` }
                      : undefined
                  }
                />
              );
              offset += (s.pct / 100) * C;
              return el;
            })}
          </g>
        </svg>

        <div
          style={{
            position: "absolute",
            top: 1010 - 110,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.sans,
            opacity: Math.min(1, center),
            transform: `scale(${0.85 + 0.15 * center})`,
          }}
        >
          <div style={{ fontSize: 30, color: colors.muted, fontWeight: 500 }}>Saved per year</div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontWeight: 700,
              fontSize: 60,
              color: colors.emerald,
              letterSpacing: -2,
              margin: "6px 0",
            }}
          >
            {money(yearly)}
          </div>
          <div style={{ fontSize: 26, color: colors.muted }}>on autopilot</div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 1340,
            left: 110,
            right: 110,
            fontFamily: fonts.sans,
            display: "flex",
            gap: 20,
          }}
        >
          {SPLIT.map((s, i) => (
            <Legend key={s.label} {...s} delay={60 + i * 12} />
          ))}
        </div>
      </VirtualCamera>
      <StepPill n={3} top={200} delay={2} />
      <Headline text={"AI builds your\n*auto-budget*"} delay={8} size={84} top={300} />
    </>
  );
};

const Legend: React.FC<(typeof SPLIT)[number] & { delay: number }> = ({
  label,
  pct,
  amt,
  color,
  delay,
}) => {
  const s = usePop(delay);
  return (
    <div
      style={{
        flex: 1,
        padding: "22px 20px",
        borderRadius: 22,
        backgroundColor: colors.surface,
        border: `1px solid ${label === "Savings" ? alpha(colors.emerald, 0.5) : colors.border}`,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 40}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 26, color: colors.muted }}>
        <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color }} />
        {label} {pct}%
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 34,
          marginTop: 10,
          color: label === "Savings" ? colors.emerald : colors.text,
        }}
      >
        {money(amt)}
      </div>
    </div>
  );
};
