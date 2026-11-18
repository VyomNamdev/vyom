import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  BrowserShell,
  CameraKeyframe,
  CursorWaypoint,
  SmoothCursor,
  TOOLBAR_HEIGHT,
  VirtualCamera,
  colors,
  fonts,
} from "../components";

/**
 * Reference scene exercising every core system. Coordinates for the camera
 * and cursor are composition pixels (1920x1080).
 */

// BrowserShell default placement: 1680x945 centered → viewport origin.
const VIEW_X = (1920 - 1680) / 2;
const VIEW_Y = (1080 - 945) / 2 + TOOLBAR_HEIGHT;
const at = (x: number, y: number) => ({ x: VIEW_X + x, y: VIEW_Y + y });

const CLICK_FRAME = 300;

const balanceCard = at(470, 190);
const sendButton = at(1550, 52);

const camera: CameraKeyframe[] = [
  { frame: 0, scale: 1, x: 960, y: 540 },
  { frame: 50, scale: 1, x: 960, y: 540 },
  { frame: 130, scale: 1.85, ...balanceCard },
  { frame: 200, scale: 1.85, ...balanceCard },
  { frame: 270, scale: 1.6, ...sendButton },
  { frame: 350, scale: 1.6, ...sendButton },
  { frame: 430, scale: 1, x: 960, y: 540 },
];

const cursor: CursorWaypoint[] = [
  { frame: 0, ...at(900, 620) },
  { frame: 120, ...at(420, 205) },
  { frame: 175, ...at(520, 200) },
  { frame: CLICK_FRAME, ...sendButton, click: true },
  { frame: 420, ...at(1100, 560) },
];

const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
}> = ({ x, y, w, h, children }) => (
  <div
    className="absolute rounded-xl border border-border bg-surface p-6"
    style={{ left: x, top: y, width: w, height: h }}
  >
    {children}
  </div>
);

const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const sent = interpolate(frame, [CLICK_FRAME + 4, CLICK_FRAME + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const balance = 248_390.12 - 12_500 * sent;

  // Chart path
  const pts = Array.from({ length: 40 }, (_, i) => {
    const v = 0.5 + 0.25 * Math.sin(i / 4) + 0.12 * Math.sin(i * 1.7) + i * 0.006;
    return `${(i / 39) * 1300},${400 - v * 300}`;
  }).join(" ");
  const draw = interpolate(frame, [10, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <div className="absolute inset-0 font-sans text-text" style={{ fontFamily: fonts.sans }}>
      {/* Sidebar */}
      <div className="absolute top-0 bottom-0 left-0 w-[220px] border-r border-border bg-surface px-5 py-7">
        <div className="mb-8 text-lg font-semibold">
          <span className="text-emerald">●</span> Vyom
        </div>
        {["Overview", "Payments", "Cards", "Insights", "Settings"].map((l, i) => (
          <div
            key={l}
            className={`mb-1 rounded-lg px-3 py-2 text-[15px] ${i === 0 ? "bg-border text-text" : "text-muted"}`}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute left-[260px] top-[30px] text-[26px] font-semibold">Portfolio</div>
      <div
        className="absolute flex items-center justify-center rounded-lg bg-emerald text-[15px] font-semibold text-canvas"
        style={{ left: 1460, top: 30, width: 180, height: 44 }}
      >
        Send payment
      </div>

      <Card x={260} y={110} w={420} h={160}>
        <div className="text-sm text-muted">Total balance</div>
        <div className="mt-3 text-[40px] font-medium" style={{ fontFamily: fonts.mono }}>
          ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-1 text-sm text-emerald" style={{ fontFamily: fonts.mono }}>
          +4.21% this month
        </div>
      </Card>
      <Card x={700} y={110} w={420} h={160}>
        <div className="text-sm text-muted">Monthly spend</div>
        <div className="mt-3 text-[40px] font-medium" style={{ fontFamily: fonts.mono }}>
          $18,204.50
        </div>
        <div className="mt-1 text-sm text-alert" style={{ fontFamily: fonts.mono }}>
          −2.08% vs. budget
        </div>
      </Card>
      <Card x={1140} y={110} w={500} h={160}>
        <div className="text-sm text-muted">Pending transfers</div>
        <div className="mt-3 text-[40px] font-medium" style={{ fontFamily: fonts.mono }}>
          {sent > 0.5 ? 4 : 3}
        </div>
        <div className="mt-1 text-sm text-muted">Next settlement 14:00 UTC</div>
      </Card>

      <Card x={260} y={300} w={1380} h={540}>
        <div className="text-sm text-muted">Net worth · 12 months</div>
        <svg width={1330} height={440} className="mt-4">
          <polyline
            points={pts}
            fill="none"
            stroke={colors.emerald}
            strokeWidth={3}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        </svg>
      </Card>

      {/* Toast after click */}
      <div
        className="absolute rounded-lg border border-emerald/40 bg-surface px-5 py-3 text-[15px]"
        style={{
          left: 1360,
          top: 770,
          width: 280,
          opacity: sent,
          transform: `translateY(${(1 - sent) * -8}px)`,
        }}
      >
        <span className="text-emerald">✓</span> $12,500.00 sent
      </div>
    </div>
  );
};

export const ComponentShowcase: React.FC = () => (
  <AbsoluteFill className="bg-canvas">
    <VirtualCamera keyframes={camera}>
      <BrowserShell url="app.vyom.finance/portfolio" title="Vyom — Portfolio">
        <Dashboard />
      </BrowserShell>
      <SmoothCursor waypoints={cursor} />
    </VirtualCamera>
  </AbsoluteFill>
);
