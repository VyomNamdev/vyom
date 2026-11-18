import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CursorWaypoint,
  SmoothCursor,
  VirtualCamera,
  alpha,
  colors,
  fonts,
  getCursorPosition,
} from "../../components";
import { usePop } from "../../reel/ui";
import { AMBER, usd } from "../config";

const CUT = 180; // jump cut at 0:03
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Deterministic "messy" spreadsheet rows.
const ITEMS = [
  "Coffee??",
  "rent - LATE FEE",
  "Food delivery",
  "subscription x3",
  "Gas",
  "Amazon??",
  "Dining out",
  "Overdraft fee",
  "Gym (unused)",
  "Concert tix",
  "Groceries",
  "Ride share",
  "Streaming",
  "#REF!",
  "Snacks",
  "Phone bill",
  "Gift",
  "Dining out",
  "ATM fee",
  "???",
  "Clothes",
  "Takeout",
];
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const Spreadsheet: React.FC = () => {
  let bal = 412;
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        top: 470,
        width: 1000,
        height: 1080,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        overflow: "hidden",
        fontFamily: fonts.mono,
        fontSize: 22,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px 130px 1fr 170px 170px",
          height: 52,
          alignItems: "center",
          backgroundColor: "#1A2333",
          color: colors.muted,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {["", "A Date", "B Item", "C Amount", "D Balance"].map((h) => (
          <div key={h} style={{ paddingLeft: 12 }}>
            {h}
          </div>
        ))}
      </div>
      {ITEMS.map((item, i) => {
        const amt = Math.round(8 + rand(i, 1) * 180);
        bal -= amt;
        const bad = rand(i, 2) > 0.42 || bal < 0;
        const warn = !bad && rand(i, 3) > 0.5;
        const jitter = (rand(i, 4) - 0.5) * 14;
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "60px 130px 1fr 170px 170px",
              height: 46,
              alignItems: "center",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: bad
                ? alpha(colors.alert, 0.14 + rand(i, 5) * 0.12)
                : warn
                  ? alpha(AMBER, 0.1)
                  : "transparent",
              color: colors.text,
            }}
          >
            <div style={{ paddingLeft: 12, color: colors.muted }}>{i + 2}</div>
            <div style={{ paddingLeft: 12 + jitter, color: colors.muted }}>
              {rand(i, 6) > 0.8
                ? "??/??"
                : `06/${String(1 + i).padStart(2, "0")}`}
            </div>
            <div
              style={{
                paddingLeft: 12 + jitter,
                fontFamily: fonts.sans,
                textDecoration: rand(i, 7) > 0.85 ? "line-through" : "none",
                color: item.includes("#REF") ? colors.alert : colors.text,
              }}
            >
              {item}
            </div>
            <div style={{ paddingLeft: 12, color: colors.alert }}>
              −{usd(amt)}
            </div>
            <div
              style={{
                paddingLeft: 12 - jitter,
                color: bal < 0 ? colors.alert : colors.muted,
                fontWeight: bal < 0 ? 700 : 400,
              }}
            >
              {usd(bal)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const cards = [
    { label: "Income", value: 4200, accent: colors.text },
    { label: "Spent", value: 3217, accent: colors.text },
    { label: "Saved", value: 983, accent: colors.emerald },
  ];
  return (
    <AbsoluteFill style={{ fontFamily: fonts.sans }}>
      <div
        style={{
          position: "absolute",
          top: 520,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 30,
            color: colors.muted,
            letterSpacing: 4,
            fontFamily: fonts.mono,
          }}
        >
          JUNE BUDGET
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: colors.text,
            marginTop: 8,
          }}
        >
          All sorted.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 720,
          left: 90,
          width: 900,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              height: 170,
              borderRadius: 28,
              backgroundColor: colors.surface,
              border: `1.5px solid ${c.label === "Saved" ? alpha(colors.emerald, 0.6) : colors.border}`,
              boxShadow:
                c.label === "Saved"
                  ? `0 0 60px ${alpha(colors.emerald, 0.25)}`
                  : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 48px",
            }}
          >
            <span
              style={{ fontSize: 38, color: colors.muted, fontWeight: 500 }}
            >
              {c.label}
            </span>
            <span
              style={{
                fontSize: 68,
                fontFamily: fonts.mono,
                fontWeight: 700,
                color: c.accent,
              }}
            >
              {usd(c.value)}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const sweep: CursorWaypoint[] = [
  { frame: CUT, x: -60, y: 980 },
  { frame: CUT + 50, x: 1150, y: 940, duration: 50 },
];

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const snap = spring({
    frame: frame - 12,
    fps,
    config: { damping: 11, stiffness: 260, mass: 0.6 },
  });
  const flicker = frame < CUT ? 0.85 + 0.15 * Math.sin(frame / 3.5) : 1;
  const cx = frame < CUT ? -100 : getCursorPosition(frame, sweep).x;
  const dashIn = usePop(CUT + 30, { damping: 200, stiffness: 120, mass: 1 });

  return (
    <>
      <VirtualCamera
        keyframes={[
          { frame: 0, scale: 1, x: 540, y: 1000 },
          { frame: CUT - 1, scale: 1.18, x: 540, y: 980 },
          { frame: CUT, scale: 1, x: 540, y: 960 },
        ]}
        tilt={false}
      >
        {/* Messy sheet: visible right of the wipe */}
        <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${Math.max(0, cx)}px)` }}>
          <Spreadsheet />
        </AbsoluteFill>
        {/* Clean dashboard: revealed left of the wipe */}
        {frame >= CUT ? (
          <AbsoluteFill
            style={{
              clipPath: `inset(0 ${Math.max(0, 1080 - cx)}px 0 0)`,
              opacity: 0.6 + 0.4 * dashIn,
            }}
          >
            <Dashboard />
          </AbsoluteFill>
        ) : null}
        {frame >= CUT && cx < 1080 ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: cx - 3,
              width: 6,
              backgroundColor: colors.emerald,
              boxShadow: `0 0 40px 12px ${alpha(colors.emerald, 0.6)}`,
            }}
          />
        ) : null}
      </VirtualCamera>

      {/* Red hook overlay */}
      {frame < CUT ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 640,
            background: `linear-gradient(180deg, ${colors.canvas} 0%, ${alpha(colors.canvas, 0.9)} 70%, ${alpha(colors.canvas, 0)} 100%)`,
          }}
        />
      ) : null}
      {frame < CUT ? (
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 50,
            right: 50,
            textAlign: "center",
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 104,
            lineHeight: 1.0,
            letterSpacing: -3,
            color: colors.alert,
            opacity: Math.min(1, snap * 1.5) * flicker,
            transform: `scale(${1.35 - 0.35 * snap})`,
            textShadow: `0 0 40px ${alpha(colors.alert, 0.7)}, 0 0 90px ${alpha(colors.alert, 0.4)}`,
          }}
        >
          MANUAL BUDGETING IS BROKEN.
        </div>
      ) : null}

      {frame >= CUT ? (
        <SmoothCursor waypoints={sweep} size={52} overshoot={0} />
      ) : null}
      {/* fade jump-cut flash */}
      <AbsoluteFill
        style={{
          backgroundColor: colors.emerald,
          opacity:
            interpolate(frame, [CUT, CUT + 6], [0.18, 0], clamp) *
            (frame >= CUT ? 1 : 0),
          pointerEvents: "none",
        }}
      />
    </>
  );
};
