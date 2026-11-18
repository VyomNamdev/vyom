import React from "react";
import { Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { VirtualCamera, alpha, colors, fonts } from "../../components";
import { money } from "../config";
import { Headline, SparkIcon, usePop } from "../ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const TXNS = [
  { label: "Food delivery", amt: 1240 },
  { label: "Online shopping", amt: 4999 },
  { label: "Cab rides", amt: 680 },
  { label: "Subscriptions", amt: 1847 },
  { label: "Weekend plans", amt: 3500 },
  { label: "New gadget", amt: 12999 },
];

const TxnRow: React.FC<{ label: string; amt: number; delay: number }> = ({ label, amt, delay }) => {
  const s = usePop(delay);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 76,
        padding: "0 28px",
        borderRadius: 16,
        backgroundColor: alpha("#FFFFFF", 0.03),
        border: `1px solid ${colors.border}`,
        marginBottom: 12,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * -30}px)`,
      }}
    >
      <span style={{ fontSize: 30, color: colors.text, fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: fonts.mono, fontSize: 30, color: colors.alert }}>−{money(amt)}</span>
    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const balance = interpolate(frame, [20, 185], [65000, 3240], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const balColor = interpolateColors(balance, [8000, 30000], [colors.alert, colors.text]);
  const card = usePop(4, { damping: 200, stiffness: 120, mass: 1 });
  const shake = frame > 150 && frame < 175 ? Math.sin(frame * 2.2) * 5 : 0;

  // Newest transaction on top.
  const visible = TXNS.map((t, i) => ({ ...t, delay: 30 + i * 24 }))
    .filter((t) => frame >= t.delay)
    .reverse()
    .slice(0, 5);

  return (
    <>
      <VirtualCamera
        keyframes={[
          { frame: 0, scale: 1, x: 540, y: 960 },
          { frame: 200, scale: 1.12, x: 540, y: 1050 },
        ]}
      >
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 700,
            width: 900,
            height: 820,
            borderRadius: 32,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            padding: 44,
            fontFamily: fonts.sans,
            boxShadow: "0 40px 100px -30px rgba(0,0,0,0.8)",
            opacity: card,
            transform: `translateY(${(1 - card) * 80 + 0}px) translateX(${shake}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 30, color: colors.muted }}>Account balance</span>
            <span style={{ fontSize: 26, color: colors.muted, fontFamily: fonts.mono }}>Day {Math.round(interpolate(frame, [20, 185], [1, 20], clamp))}</span>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontWeight: 700,
              fontSize: 112,
              letterSpacing: -4,
              color: balColor,
              margin: "14px 0 32px",
              textShadow: `0 0 50px ${alpha(balColor, 0.3)}`,
            }}
          >
            {money(balance)}
          </div>
          {visible.map((t) => (
            <TxnRow key={t.label} {...t} />
          ))}
        </div>
      </VirtualCamera>
      <Headline text={"Your salary\n~vanishes~ by the ~20th?~"} delay={6} top={250} />
    </>
  );
};

export const Intro: React.FC = () => {
  const items = ["Upload your statement", "Find your money leaks", "Get an auto-budget"];
  return (
    <>
      <Headline text={"Fix it with *AI*\nin 3 steps"} delay={4} size={112} top={430} />
      <div style={{ position: "absolute", top: 820, left: 110, right: 110, fontFamily: fonts.sans }}>
        {items.map((label, i) => (
          <IntroRow key={label} n={i + 1} label={label} delay={50 + i * 22} />
        ))}
      </div>
    </>
  );
};

const IntroRow: React.FC<{ n: number; label: string; delay: number }> = ({ n, label, delay }) => {
  const s = usePop(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        height: 130,
        padding: "0 36px",
        marginBottom: 26,
        borderRadius: 26,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        opacity: Math.min(1, s),
        transform: `translateX(${(1 - s) * 120}px)`,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: alpha(colors.emerald, 0.14),
          color: colors.emerald,
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 38,
        }}
      >
        {n}
      </div>
      <span style={{ fontSize: 44, fontWeight: 600, color: colors.text, flex: 1 }}>{label}</span>
      <SparkIcon size={36} />
    </div>
  );
};
