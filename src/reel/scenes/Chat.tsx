import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import {
  BrowserShell,
  CameraKeyframe,
  CursorWaypoint,
  SmoothCursor,
  VirtualCamera,
  alpha,
  colors,
  fonts,
} from "../../components";
import { SHELL, at, money } from "../config";
import { CheckIcon, FileIcon, Headline, SparkIcon, StepPill, TopScrim, usePop } from "../ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CURSOR_SIZE = 46;
const VIEW_W = SHELL.w - 2;

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserShell x={SHELL.x} y={SHELL.y} width={SHELL.w} height={SHELL.h} url="chat.ai/new">
    <div style={{ position: "absolute", inset: 0, fontFamily: fonts.sans, color: colors.text }}>
      {children}
    </div>
  </BrowserShell>
);

const Avatar: React.FC = () => (
  <div
    style={{
      width: 52,
      height: 52,
      borderRadius: 16,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: alpha(colors.emerald, 0.14),
      border: `1px solid ${alpha(colors.emerald, 0.4)}`,
    }}
  >
    <SparkIcon size={30} />
  </div>
);

const FileChip: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      height: 46,
      padding: "0 16px 0 10px",
      borderRadius: 12,
      backgroundColor: alpha("#FFFFFF", 0.05),
      border: `1px solid ${colors.border}`,
      fontSize: 22,
      ...style,
    }}
  >
    <FileIcon size={28} />
    <span style={{ fontWeight: 600 }}>bank_statement.pdf</span>
    <span style={{ color: colors.muted, fontFamily: fonts.mono, fontSize: 18 }}>2.1 MB</span>
  </div>
);

const PROMPT = "Categorize my spending & find money leaks";

// ---------- STEP 1 ----------
const S1 = {
  clip: at(76, 720),
  send: at(878, 720),
  clipClick: 62,
  typeStart: 92,
  typeEnd: 200,
  sendClick: 236,
};

const step1Camera: CameraKeyframe[] = [
  { frame: 0, scale: 1, x: 540, y: 960 },
  { frame: 40, scale: 1, x: 540, y: 960 },
  { frame: 85, scale: 1.45, x: 420, y: 1440 },
  { frame: 120, scale: 1.45, x: 420, y: 1440 },
  { frame: 210, scale: 1.45, x: 720, y: 1440 },
  { frame: 262, scale: 1.45, x: 720, y: 1440 },
  { frame: 320, scale: 1, x: 540, y: 960 },
];

const step1Cursor: CursorWaypoint[] = [
  { frame: 0, x: 860, y: 1700 },
  { frame: S1.clipClick, ...S1.clip, click: true },
  { frame: 150, x: 260, y: 1540 },
  { frame: S1.sendClick, ...S1.send, click: true },
  { frame: 330, x: 820, y: 1260 },
];

export const Step1: React.FC = () => {
  const frame = useCurrentFrame();
  const sent = frame >= S1.sendClick + 3;
  const chip = usePop(S1.clipClick + 3);
  const chars = Math.round(
    interpolate(frame, [S1.typeStart, S1.typeEnd], [0, PROMPT.length], clamp),
  );
  const typed = sent ? "" : PROMPT.slice(0, chars);
  const caretOn = !sent && frame >= S1.typeStart - 20 && Math.floor(frame / 16) % 2 === 0;
  const greet = interpolate(frame, [S1.sendClick, S1.sendClick + 14], [1, 0], clamp);
  const bubble = usePop(S1.sendClick + 6);
  const thinking = usePop(S1.sendClick + 30);
  const sendActive = chars > 0 && !sent;

  return (
    <>
      <VirtualCamera keyframes={step1Camera}>
        <Shell>
          {/* Greeting */}
          <div
            style={{
              position: "absolute",
              top: 170,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: greet,
            }}
          >
            <div style={{ display: "inline-block", marginBottom: 22 }}>
              <SparkIcon size={64} />
            </div>
            <div style={{ fontSize: 40, fontWeight: 700 }}>What should we fix today?</div>
            <div style={{ fontSize: 26, color: colors.muted, marginTop: 12 }}>
              Drop a statement and I'll audit your spending.
            </div>
          </div>

          {/* Sent message */}
          {sent ? (
            <div
              style={{
                position: "absolute",
                top: 40,
                right: 32,
                maxWidth: 680,
                padding: 20,
                borderRadius: 22,
                backgroundColor: alpha(colors.emerald, 0.12),
                border: `1px solid ${alpha(colors.emerald, 0.3)}`,
                opacity: Math.min(1, bubble),
                transform: `translateY(${(1 - bubble) * 60}px)`,
                transformOrigin: "100% 100%",
              }}
            >
              <FileChip />
              <div style={{ fontSize: 26, marginTop: 14 }}>{PROMPT}</div>
            </div>
          ) : null}

          {sent ? (
            <div
              style={{
                position: "absolute",
                top: 260,
                left: 32,
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: Math.min(1, thinking),
              }}
            >
              <Avatar />
              <span style={{ fontSize: 26, color: colors.muted }}>Analyzing 214 transactions</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((d) => (
                  <div
                    key={d}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 9,
                      backgroundColor: colors.emerald,
                      opacity: 0.3 + 0.7 * Math.max(0, Math.sin((frame - d * 8) / 7)),
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Input */}
          <div
            style={{
              position: "absolute",
              left: 32,
              width: VIEW_W - 64,
              top: 610,
              height: 160,
              borderRadius: 24,
              backgroundColor: colors.surface,
              border: `1.5px solid ${chars > 0 && !sent ? alpha(colors.emerald, 0.55) : colors.border}`,
              boxShadow: chars > 0 && !sent ? `0 0 0 5px ${alpha(colors.emerald, 0.1)}` : "none",
            }}
          >
            {!sent && chip > 0.01 ? (
              <FileChip
                style={{
                  position: "absolute",
                  left: 20,
                  top: 16,
                  opacity: Math.min(1, chip),
                  transform: `scale(${0.7 + 0.3 * chip})`,
                  transformOrigin: "0 50%",
                }}
              />
            ) : null}
            {/* Paperclip */}
            <svg
              width={48}
              height={48}
              viewBox="0 0 24 24"
              style={{ position: "absolute", left: 20, top: 86 }}
            >
              <path
                d="M16.5 6.5l-7.8 7.8a2 2 0 0 0 2.8 2.8l8-8a4 4 0 0 0-5.6-5.6l-8.2 8.2a6 6 0 0 0 8.5 8.5l7.3-7.3"
                fill="none"
                stroke={colors.muted}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                left: 84,
                top: 94,
                fontSize: 27,
                color: typed ? colors.text : colors.muted,
                whiteSpace: "nowrap",
              }}
            >
              {typed || (sent ? "Ask anything…" : "")}
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 32,
                  marginLeft: 2,
                  verticalAlign: "middle",
                  backgroundColor: colors.emerald,
                  opacity: caretOn ? 1 : 0,
                }}
              />
            </div>
            {/* Send */}
            <div
              style={{
                position: "absolute",
                right: 20,
                top: 82,
                width: 56,
                height: 56,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: sendActive ? colors.emerald : colors.border,
              }}
            >
              <svg width={28} height={28} viewBox="0 0 24 24">
                <path
                  d="M12 19V5M5.5 11.5L12 5l6.5 6.5"
                  fill="none"
                  stroke={sendActive ? colors.canvas : colors.muted}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </Shell>
        <SmoothCursor waypoints={step1Cursor} size={CURSOR_SIZE} />
      </VirtualCamera>
      <TopScrim />
      <StepPill n={1} top={200} delay={2} />
      <Headline text={"Give AI your\n*bank statement*"} delay={8} size={84} top={300} />
    </>
  );
};

// ---------- STEP 2 ----------
const CATS = [
  { label: "Rent", pct: 30, amt: 18500, color: colors.muted },
  { label: "Food delivery", pct: 24, amt: 14820, color: "#F59E0B" },
  { label: "Shopping", pct: 19, amt: 11730, color: "#8B5CF6" },
  { label: "Transport", pct: 9, amt: 5560, color: "#3B82F6" },
  { label: "Subscriptions", pct: 8, amt: 4940, color: colors.alert },
];

const S2 = { button: at(807, 690), click: 300 };

const step2Camera: CameraKeyframe[] = [
  { frame: 0, scale: 1, x: 540, y: 960 },
  { frame: 165, scale: 1, x: 540, y: 960 },
  { frame: 210, scale: 1.15, x: 540, y: 1330 },
  { frame: 245, scale: 1.15, x: 540, y: 1330 },
  { frame: 290, scale: 1.85, ...S2.button },
  { frame: 350, scale: 1.85, ...S2.button },
  { frame: 400, scale: 1, x: 540, y: 960 },
];

const step2Cursor: CursorWaypoint[] = [
  { frame: 0, x: 820, y: 1260 },
  { frame: 230, x: 640, y: 1330 },
  { frame: S2.click, ...S2.button, click: true },
  { frame: 400, x: 760, y: 1250 },
];

const CategoryRow: React.FC<(typeof CATS)[number] & { delay: number }> = ({
  label,
  pct,
  amt,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const s = usePop(delay, { damping: 200, stiffness: 100, mass: 1 });
  const w = interpolate(frame, [delay, delay + 40], [0, pct / 30], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ marginBottom: 20, opacity: s }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 25, marginBottom: 10 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: fonts.mono, color: colors.muted }}>
          {pct}% · {money(amt)}
        </span>
      </div>
      <div style={{ height: 14, borderRadius: 8, backgroundColor: colors.border }}>
        <div
          style={{
            height: "100%",
            width: `${w * 100}%`,
            borderRadius: 8,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

export const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  const total = CATS.reduce((a, c) => a + c.amt, 0);
  const alertIn = usePop(150);
  const done = frame >= S2.click + 3;
  const doneP = interpolate(frame, [S2.click + 3, S2.click + 18], [0, 1], clamp);
  const press = frame >= S2.click && frame < S2.click + 6 ? 0.96 : 1;
  const borderColor = done ? colors.emerald : colors.alert;

  return (
    <>
      <VirtualCamera keyframes={step2Camera}>
        <Shell>
          <div
            style={{
              position: "absolute",
              top: 28,
              left: 32,
              right: 32,
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
            }}
          >
            <Avatar />
            <div style={{ flex: 1, paddingTop: 8 }}>
              <div style={{ fontSize: 28, marginBottom: 26 }}>
                Here's where{" "}
                <span style={{ fontFamily: fonts.mono, fontWeight: 700 }}>{money(total)}</span> went
                this month:
              </div>
              {CATS.map((c, i) => (
                <CategoryRow key={c.label} {...c} delay={20 + i * 16} />
              ))}
            </div>
          </div>

          {/* Leak alert */}
          <div
            style={{
              position: "absolute",
              left: 32,
              right: 32,
              top: 600,
              height: 180,
              borderRadius: 22,
              padding: "26px 28px",
              backgroundColor: alpha(borderColor, 0.08),
              border: `2px solid ${alpha(borderColor, 0.7)}`,
              boxShadow: `0 0 40px ${alpha(borderColor, 0.18)}`,
              opacity: Math.min(1, alertIn),
              transform: `translateY(${(1 - alertIn) * 50}px)`,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
                color: borderColor,
                fontFamily: fonts.mono,
              }}
            >
              {done ? "LEAK FIXED" : "MONEY LEAK FOUND"}
            </div>
            <div style={{ fontSize: 30, fontWeight: 600, marginTop: 12 }}>
              3 unused subscriptions
            </div>
            <div style={{ fontSize: 24, color: colors.muted, marginTop: 8 }}>
              <span style={{ fontFamily: fonts.mono, color: done ? colors.emerald : colors.alert }}>
                {money(1847)}/mo
              </span>{" "}
              · {done ? "you save" : "that's"}{" "}
              <span style={{ fontFamily: fonts.mono, color: colors.text }}>{money(22164)}</span> a year
            </div>
            <div
              style={{
                position: "absolute",
                right: 24,
                top: 62,
                width: 190,
                height: 56,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 24,
                fontWeight: 700,
                backgroundColor: done ? colors.emerald : colors.alert,
                color: done ? colors.canvas : colors.text,
                transform: `scale(${press * (1 + 0.06 * Math.sin(doneP * Math.PI))})`,
              }}
            >
              {done ? (
                <>
                  <CheckIcon size={26} color={colors.canvas} /> Cancelled
                </>
              ) : (
                "Cancel all"
              )}
            </div>
          </div>
        </Shell>
        <SmoothCursor waypoints={step2Cursor} size={CURSOR_SIZE} />
      </VirtualCamera>
      <TopScrim />
      <StepPill n={2} top={200} delay={2} />
      <Headline text={"AI finds your\n~money leaks~"} delay={8} size={84} top={300} />
    </>
  );
};
