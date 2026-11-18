import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { alpha, colors, fonts } from "../../components";
import { CheckIcon, Headline, usePop } from "../../reel/ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const STEPS = [
  { title: "Export CSV", sub: "Download last month from your bank", on: 20 },
  { title: "AI Categorize", sub: "One free prompt sorts every row", on: 260 },
  {
    title: "Zero-Effort Budget",
    sub: "Totals and savings update themselves",
    on: 500,
  },
];
const CARD = { x: 110, w: 790, h: 200, top: 560, gap: 90 };
const ALL_GLOW = 520;
const BADGE = 735;

const StepCard: React.FC<{
  i: number;
  title: string;
  sub: string;
  on: number;
}> = ({ i, title, sub, on }) => {
  const frame = useCurrentFrame();
  const enter = usePop(8 + i * 8, { damping: 200, stiffness: 120, mass: 1 });
  const lit = interpolate(frame, [on, on + 18], [0, 1], clamp);
  const pulse =
    frame > ALL_GLOW ? 0.5 + 0.5 * Math.sin((frame - ALL_GLOW) / 10) : 0;
  const glow = lit * (0.35 + 0.25 * pulse);
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.top + i * (CARD.h + CARD.gap),
        width: CARD.w,
        height: CARD.h,
        borderRadius: 30,
        display: "flex",
        alignItems: "center",
        gap: 34,
        padding: "0 40px",
        fontFamily: fonts.sans,
        backgroundColor:
          lit > 0 ? alpha(colors.emerald, 0.06 + 0.06 * lit) : colors.surface,
        border: `2px solid ${lit > 0 ? alpha(colors.emerald, 0.3 + 0.6 * lit) : colors.border}`,
        boxShadow: `0 0 ${50 + pulse * 40}px ${alpha(colors.emerald, glow)}`,
        opacity:
          Math.min(1, enter) *
          (0.45 + 0.55 * Math.max(lit, frame < on ? 0.4 : 1)),
        transform: `translateY(${(1 - enter) * 60}px) rotateX(${(1 - enter) * -85}deg) translateZ(${lit * 70 + pulse * 14}px) scale(${1 + 0.03 * Math.sin(lit * Math.PI)})`,
        transformOrigin: "50% 0%",
      }}
    >
      <div
        style={{
          width: 104,
          height: 104,
          borderRadius: 28,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: lit > 0.5 ? colors.emerald : alpha("#FFFFFF", 0.05),
          color: lit > 0.5 ? colors.canvas : colors.muted,
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 48,
        }}
      >
        {lit > 0.5 ? <CheckIcon size={56} color={colors.canvas} /> : i + 1}
      </div>
      <div>
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            letterSpacing: -1,
            color: lit > 0.5 ? colors.emerald : colors.text,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 28, color: colors.muted, marginTop: 6 }}>
          {sub}
        </div>
      </div>
    </div>
  );
};

const Connector: React.FC<{ i: number; fireAt: number }> = ({ i, fireAt }) => {
  const frame = useCurrentFrame();
  const top = CARD.top + (i + 1) * CARD.h + i * CARD.gap;
  const p = interpolate(frame, [fireAt - 26, fireAt], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const filled = frame >= fireAt;
  const cx = CARD.x + 92;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: cx - 2,
          top,
          width: 4,
          height: CARD.gap,
          borderRadius: 2,
          backgroundColor: filled ? colors.emerald : colors.border,
        }}
      />
      {p > 0 && p < 1 ? (
        <div
          style={{
            position: "absolute",
            left: cx - 10,
            top: top + p * CARD.gap - 10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.emerald,
            boxShadow: `0 0 24px 6px ${alpha(colors.emerald, 0.7)}`,
          }}
        />
      ) : null}
    </>
  );
};

export const Pipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const slide = interpolate(frame, [BADGE, BADGE + 30], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
  const badge = usePop(BADGE + 6, { damping: 14, stiffness: 140, mass: 0.7 });
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${-slide * 30}px)`,
          opacity: 1 - slide * 0.15,
        }}
      >
        <Headline
          text={"Your budget on\n*autopilot*"}
          delay={4}
          size={86}
          top={250}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            perspective: 1700,
            perspectiveOrigin: "50% 45%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transformOrigin: "50% 55%",
              transform: `rotateX(${20 - 6 * Math.min(1, frame / 600)}deg) rotateY(${-14 + Math.sin(frame / 90) * 6}deg) rotateZ(-2deg)`,
            }}
          >
            {STEPS.map((s, i) => (
              <StepCard key={s.title} i={i} {...s} />
            ))}
            <Connector i={0} fireAt={STEPS[1].on} />
            <Connector i={1} fireAt={STEPS[2].on} />
          </div>
        </div>
      </div>
      {/* Glowing corner badge */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 60,
          padding: "14px 24px",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: fonts.sans,
          fontSize: 28,
          fontWeight: 700,
          color: colors.text,
          backgroundColor: alpha(colors.emerald, 0.14),
          border: `1.5px solid ${alpha(colors.emerald, 0.7)}`,
          boxShadow: `0 0 40px ${alpha(colors.emerald, 0.35)}`,
          opacity: Math.min(1, badge),
          transform: `translateX(${(1 - badge) * 700}px)`,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.emerald,
            boxShadow: `0 0 12px ${colors.emerald}`,
          }}
        />
        <span>
          <span style={{ color: colors.emerald }}>100% Free</span> • No Bank
          Login Required
        </span>
      </div>
    </>
  );
};
