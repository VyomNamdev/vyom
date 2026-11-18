import React from "react";
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import {
  CameraKeyframe,
  VirtualCamera,
  alpha,
  colors,
  fonts,
} from "../../components";
import { SparkIcon, TopScrim, usePop } from "../../reel/ui";
import { usd } from "../config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const PANEL_Y = 430;
const PANEL_H = 960;
const LEFT = { x: 30, w: 495 };
const RIGHT = { x: 555, w: 495 };

const RAW = [
  "06/02 STRM*SVC 15.49",
  "06/03 SQ*COFFEE 5.25",
  "06/03 GROC MKT #2231 86.12",
  "06/05 FOODDLV*ORDER 32.80",
  "06/06 GYM MBR 39.99",
  "06/07 RIDE*SHR TRIP 18.40",
  "06/08 ACH RENT 1450.00",
  "06/09 ELEC UTIL 74.30",
];
const TAGGED: { m: string; cat: string; color: string }[] = [
  { m: "Streaming", cat: "Subscriptions", color: "#A78BFA" },
  { m: "Coffee", cat: "Dining", color: "#F59E0B" },
  { m: "Groceries", cat: "Groceries", color: "#34D399" },
  { m: "Food delivery", cat: "Dining", color: "#F59E0B" },
  { m: "Gym", cat: "Subscriptions", color: "#A78BFA" },
  { m: "Ride share", cat: "Transport", color: "#60A5FA" },
  { m: "Rent", cat: "Housing", color: "#94A3B8" },
  { m: "Electric", cat: "Utilities", color: "#FBBF24" },
];

const CATS = [
  { c: "Housing", b: 1500, s: 1450 },
  { c: "Groceries", b: 500, s: 486 },
  { c: "Shopping", b: 450, s: 500 },
  { c: "Dining", b: 300, s: 312 },
  { c: "Transport", b: 250, s: 214 },
  { c: "Utilities", b: 175, s: 159 },
  { c: "Subscriptions", b: 80, s: 96 },
];
const INCOME = 4200;
const SPENT = CATS.reduce((a, c) => a + c.s, 0); // 3217 → 23.4%

// Local frame timings (scene = 1200 frames)
const T = {
  paste: 30,
  stream: 250,
  rows: 530,
  totals: 790,
  savings: 960,
};

const cam: CameraKeyframe[] = [
  { frame: 0, scale: 1, x: 540, y: 960 },
  { frame: 230, scale: 1, x: 540, y: 960 },
  { frame: 290, scale: 1.85, x: 277, y: 900 },
  { frame: 480, scale: 1.85, x: 277, y: 900 },
  { frame: 560, scale: 1.6, x: 802, y: 900 },
  { frame: 940, scale: 1.6, x: 802, y: 900 },
  { frame: 1010, scale: 1.85, x: 802, y: 640 },
  { frame: 1200, scale: 1.85, x: 802, y: 640 },
];

const Panel: React.FC<{
  x: number;
  w: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  enterFrom: number;
}> = ({ x, w, title, icon, children, enterFrom }) => {
  const frame = useCurrentFrame();
  // Open-book 2.5D: panels angle toward the split, swing in, then flatten for the close-ups.
  const side = enterFrom < 0 ? 1 : -1;
  const swing = spring({
    frame,
    fps: 60,
    config: { damping: 14, stiffness: 70, mass: 1 },
  });
  const open = interpolate(frame, [230, 290], [1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const angle = -side * ((1 - swing) * 55 + 18 * open);
  const { fps } = useVideoConfig();
  const s = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: PANEL_Y,
        width: w,
        height: PANEL_H,
        borderRadius: 20,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        fontFamily: fonts.sans,
        color: colors.text,
        transform: `perspective(1500px) translateX(${(1 - s) * enterFrom}px) rotateY(${angle}deg) rotateX(${6 * open}deg) translateZ(${-60 * open}px)`,
        transformOrigin: side > 0 ? "100% 50%" : "0% 50%",
        boxShadow: `${side * -30 * open}px ${30 + 30 * open}px 80px -30px rgba(0,0,0,0.85)`,
      }}
    >
      <div
        style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 18px",
          fontSize: 18,
          fontWeight: 600,
          color: colors.muted,
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: "#141D2D",
        }}
      >
        <div style={{ display: "flex", gap: 6, marginRight: 6 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div
              key={c}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: c,
              }}
            />
          ))}
        </div>
        {icon}
        {title}
      </div>
      <div style={{ position: "relative", padding: 18 }}>{children}</div>
    </div>
  );
};

const ChatSide: React.FC = () => {
  const frame = useCurrentFrame();
  const paste = usePop(T.paste);
  const ai = usePop(T.stream - 20);
  return (
    <>
      <div
        style={{
          marginLeft: 40,
          padding: 14,
          borderRadius: 14,
          backgroundColor: alpha(colors.emerald, 0.1),
          border: `1px solid ${alpha(colors.emerald, 0.3)}`,
          fontFamily: fonts.mono,
          fontSize: 14,
          lineHeight: 1.6,
          color: colors.muted,
          opacity: Math.min(1, paste),
          transform: `translateY(${(1 - paste) * 30}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.text,
            marginBottom: 6,
          }}
        >
          Categorize these and audit for waste:
        </div>
        {RAW.map((r) => (
          <div key={r} style={{ whiteSpace: "nowrap" }}>
            {r}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 18,
          opacity: Math.min(1, ai),
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(colors.emerald, 0.14),
          }}
        >
          <SparkIcon size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, color: colors.muted, marginBottom: 8 }}>
            Categorized 8 transactions:
          </div>
          {TAGGED.map((t, i) => {
            const st = T.stream + i * 26;
            const p = interpolate(frame, [st, st + 14], [0, 1], clamp);
            if (p <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: 34,
                  fontSize: 15,
                  opacity: p,
                  transform: `translateX(${(1 - p) * -12}px)`,
                }}
              >
                <span>{t.m}</span>
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    color: t.color,
                    backgroundColor: alpha(t.color, 0.14),
                  }}
                >
                  {t.cat}
                </span>
              </div>
            );
          })}
          {frame > T.stream + TAGGED.length * 26 + 10 ? (
            <div
              style={{
                fontSize: 14,
                color: colors.alert,
                marginTop: 8,
                opacity: interpolate(
                  frame,
                  [T.stream + 230, T.stream + 250],
                  [0, 1],
                  clamp,
                ),
              }}
            >
              Audit: 2 overlapping subscriptions
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

const SheetSide: React.FC = () => {
  const frame = useCurrentFrame();
  const totalSpent = interpolate(frame, [T.totals, T.totals + 90], [0, SPENT], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const card = usePop(T.savings, { damping: 10, stiffness: 200, mass: 0.6 });
  const glow = 0.5 + 0.5 * Math.sin((frame - T.savings) / 9);
  const cols = "1.25fr 0.8fr 0.8fr 0.9fr";

  return (
    <>
      {/* Savings card slot */}
      <div
        style={{
          height: 128,
          borderRadius: 14,
          border: `1.5px ${card > 0.05 ? "solid" : "dashed"} ${card > 0.05 ? alpha(colors.emerald, 0.7) : colors.border}`,
          backgroundColor:
            card > 0.05 ? alpha(colors.emerald, 0.1) : "transparent",
          boxShadow:
            card > 0.05
              ? `0 0 ${30 + glow * 30}px ${alpha(colors.emerald, 0.3)}`
              : "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 20px",
          marginBottom: 14,
        }}
      >
        {card > 0.02 ? (
          <div
            style={{
              transform: `perspective(700px) rotateX(${(1 - card) * -60}deg) translateZ(${(1 - card) * 120}px) scale(${0.6 + 0.4 * card})`,
              transformOrigin: "0 50%",
              opacity: Math.min(1, card * 1.5),
            }}
          >
            <div
              style={{
                fontSize: 15,
                color: colors.muted,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              SAVINGS RATE
            </div>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 46,
                fontWeight: 700,
                color: colors.emerald,
                lineHeight: 1.1,
              }}
            >
              23.4%
            </div>
            <div style={{ fontSize: 14, color: colors.muted }}>
              <span style={{ fontFamily: fonts.mono, color: colors.text }}>
                {usd(INCOME - SPENT)}
              </span>{" "}
              saved this month
            </div>
          </div>
        ) : (
          <div
            style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}
          >
            =1-(SPENT/INCOME)
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.5,
          color: colors.muted,
          padding: "8px 8px",
          borderBottom: `1px solid ${colors.border}`,
          fontFamily: fonts.mono,
        }}
      >
        <span>Category</span>
        <span style={{ textAlign: "right" }}>Budgeted</span>
        <span style={{ textAlign: "right" }}>Spent</span>
        <span style={{ textAlign: "right" }}>Remaining</span>
      </div>
      {CATS.map((c, i) => {
        const st = T.rows + i * 30;
        const p = interpolate(frame, [st, st + 16], [0, 1], clamp);
        const g = interpolate(frame, [st, st + 10, st + 40], [0, 1, 0], clamp);
        const bar = interpolate(
          frame,
          [T.totals + i * 8, T.totals + i * 8 + 50],
          [0, c.s / 1450],
          {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          },
        );
        const rem = c.b - c.s;
        return (
          <div
            key={c.c}
            style={{
              opacity: p,
              borderBottom: `1px solid ${alpha(colors.border, 0.7)}`,
              backgroundColor: alpha(colors.emerald, 0.16 * g),
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                alignItems: "center",
                height: 38,
                padding: "0 8px",
                fontSize: 15,
              }}
            >
              <span style={{ fontWeight: 500 }}>{c.c}</span>
              <span
                style={{
                  textAlign: "right",
                  fontFamily: fonts.mono,
                  color: colors.muted,
                }}
              >
                {usd(c.b)}
              </span>
              <span style={{ textAlign: "right", fontFamily: fonts.mono }}>
                {usd(c.s)}
              </span>
              <span
                style={{
                  textAlign: "right",
                  fontFamily: fonts.mono,
                  color: rem < 0 ? colors.alert : colors.emerald,
                }}
              >
                {rem < 0 ? "" : "+"}
                {usd(rem)}
              </span>
            </div>
            <div
              style={{
                height: 5,
                margin: "0 8px 9px",
                borderRadius: 3,
                backgroundColor: alpha(colors.border, 0.8),
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${bar * 100}%`,
                  borderRadius: 3,
                  backgroundColor: c.s > c.b ? colors.alert : colors.emerald,
                }}
              />
            </div>
          </div>
        );
      })}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 8px 0",
          fontSize: 16,
          fontWeight: 700,
          opacity: interpolate(
            frame,
            [T.totals - 10, T.totals + 10],
            [0, 1],
            clamp,
          ),
        }}
      >
        <span>Total Spent</span>
        <span style={{ fontFamily: fonts.mono, fontSize: 22 }}>
          {usd(totalSpent)}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 8px 0",
          fontSize: 15,
          color: colors.muted,
          opacity: interpolate(
            frame,
            [T.totals - 10, T.totals + 10],
            [0, 1],
            clamp,
          ),
        }}
      >
        <span>Income</span>
        <span style={{ fontFamily: fonts.mono }}>{usd(INCOME)}</span>
      </div>
    </>
  );
};

const SheetIcon: React.FC = () => (
  <svg width={18} height={18} viewBox="0 0 24 24">
    <rect
      x={4}
      y={3}
      width={16}
      height={18}
      rx={2}
      fill={alpha(colors.emerald, 0.2)}
      stroke={colors.emerald}
      strokeWidth={1.6}
    />
    <path
      d="M4 9h16M4 15h16M10 9v12"
      stroke={colors.emerald}
      strokeWidth={1.4}
    />
  </svg>
);

export const Transform: React.FC = () => {
  const frame = useCurrentFrame();
  const label =
    frame < 520
      ? "RAW DATA  →  AI"
      : frame < 940
        ? "AI  →  GOOGLE SHEETS"
        : "AUTO-CALCULATED";
  const labelPop = usePop(frame < 520 ? 8 : frame < 940 ? 520 : 940);
  return (
    <>
      <VirtualCamera keyframes={cam}>
        <Panel
          x={LEFT.x}
          w={LEFT.w}
          title="AI Assistant"
          icon={<SparkIcon size={18} />}
          enterFrom={-600}
        >
          <ChatSide />
        </Panel>
        <Panel
          x={RIGHT.x}
          w={RIGHT.w}
          title="June Budget — Sheets"
          icon={<SheetIcon />}
          enterFrom={600}
        >
          <SheetSide />
        </Panel>
        {/* split line */}
        <div
          style={{
            position: "absolute",
            left: 539,
            top: PANEL_Y - 30,
            width: 2,
            height: PANEL_H + 60,
            background: `linear-gradient(${alpha(colors.emerald, 0)}, ${alpha(colors.emerald, 0.5)}, ${alpha(colors.emerald, 0)})`,
          }}
        />
      </VirtualCamera>
      <TopScrim height={360} />
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 3,
            color: colors.emerald,
            padding: "12px 28px",
            borderRadius: 999,
            border: `2px solid ${alpha(colors.emerald, 0.5)}`,
            backgroundColor: alpha(colors.canvas, 0.85),
            transform: `scale(${0.7 + 0.3 * labelPop})`,
            opacity: Math.min(1, labelPop),
            whiteSpace: "pre",
          }}
        >
          {label}
        </div>
      </div>
    </>
  );
};
