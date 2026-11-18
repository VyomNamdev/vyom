import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import {
  CursorWaypoint,
  SmoothCursor,
  VirtualCamera,
  alpha,
  colors,
  fonts,
} from "../../components";
import { SparkIcon, usePop } from "../../reel/ui";
import { AMBER, usd } from "../config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const CLEAN_PROMPT =
  "Clean this bank export: remove account numbers, standardize merchant names, and tag every row with a budget category.";

const ROWS: { m: string; a: number; tag?: "Recurring" | "Dining" }[] = [
  { m: "Paycheck Deposit", a: 2100 },
  { m: "Streaming Service", a: -15.49, tag: "Recurring" },
  { m: "Coffee Shop", a: -5.25, tag: "Dining" },
  { m: "Grocery Market", a: -86.12 },
  { m: "Food Delivery", a: -32.8, tag: "Dining" },
  { m: "Gym Membership", a: -39.99, tag: "Recurring" },
  { m: "Ride Share", a: -18.4 },
  { m: "Rent Payment", a: -1450 },
  { m: "Music Subscription", a: -10.99, tag: "Recurring" },
  { m: "Pizza Place", a: -24.6, tag: "Dining" },
  { m: "Electric Utility", a: -74.3 },
  { m: "Cloud Storage", a: -2.99, tag: "Recurring" },
  { m: "Coffee Shop", a: -6.1, tag: "Dining" },
  { m: "Gas Station", a: -41.75 },
  { m: "Sushi Bar", a: -58.2, tag: "Dining" },
  { m: "Phone Plan", a: -45, tag: "Recurring" },
  { m: "Online Store", a: -67.45 },
  { m: "Food Delivery", a: -29.9, tag: "Dining" },
  { m: "Paycheck Deposit", a: 2100 },
  { m: "Video App", a: -8.99, tag: "Recurring" },
  { m: "Burger Joint", a: -16.3, tag: "Dining" },
  { m: "Pharmacy", a: -12.4 },
  { m: "Bakery", a: -9.75, tag: "Dining" },
  { m: "News Subscription", a: -12, tag: "Recurring" },
];

const ROW_H = 64;
const BAR = { x: 110, y: 300, w: 860 };
const SEND = { x: BAR.x + BAR.w - 50, y: BAR.y + 170 };
const TYPE_START = 380;
const TYPE_END = 548;
const SUBMIT = 572;

const cursor: CursorWaypoint[] = [
  { frame: 0, x: 900, y: 1250 },
  { frame: 300, x: 700, y: 900 },
  { frame: 370, x: 520, y: 420, click: true },
  { frame: SUBMIT, ...SEND, click: true },
];

const Badge: React.FC<{ label: string; delay: number }> = ({
  label,
  delay,
}) => {
  const s = usePop(delay, { damping: 9, stiffness: 220, mass: 0.6 });
  if (s <= 0.001) return null;
  return (
    <span
      style={{
        marginLeft: 12,
        padding: "3px 12px",
        borderRadius: 999,
        fontSize: 18,
        fontWeight: 700,
        fontFamily: fonts.sans,
        color: AMBER,
        backgroundColor: alpha(AMBER, 0.14),
        border: `1px solid ${alpha(AMBER, 0.45)}`,
        display: "inline-block",
        transform: `scale(${s})`,
        opacity: Math.min(1, s),
      }}
    >
      {label}
    </span>
  );
};

export const Statement: React.FC = () => {
  const frame = useCurrentFrame();
  const scroll = interpolate(
    frame,
    [0, 420],
    [0, -(ROWS.length * ROW_H - 760)],
    {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    },
  );
  const chars = Math.round(
    interpolate(frame, [TYPE_START, TYPE_END], [0, CLEAN_PROMPT.length], clamp),
  );
  const submitted = frame >= SUBMIT + 2;
  const caret = !submitted && frame > 350 && Math.floor(frame / 16) % 2 === 0;
  const flash = interpolate(frame, [SUBMIT, SUBMIT + 20], [1, 0], clamp);

  // 2.5D: tilted while the statement scrolls, flattens for the zoom onto the prompt.
  const tilt = interpolate(frame, [300, 400], [1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const drift = Math.sin(frame / 50);
  let bal = 3240;
  let tagIdx = 0;

  return (
    <>
      <VirtualCamera
        keyframes={[
          { frame: 0, scale: 1, x: 540, y: 960 },
          { frame: 340, scale: 1, x: 540, y: 960 },
          { frame: 400, scale: 1.35, x: 540, y: BAR.y + 110 },
          { frame: 580, scale: 1.35, x: 540, y: BAR.y + 110 },
        ]}
      >
        {/* AI search bar */}
        <div
          style={{
            position: "absolute",
            left: BAR.x,
            top: BAR.y,
            width: BAR.w,
            minHeight: 110,
            zIndex: 2,
            transform: `perspective(1600px) rotateX(${tilt * (14 + drift * 2)}deg) rotateY(${tilt * -6}deg) translateY(${tilt * -10}px) translateZ(${tilt * 50}px)`,
            transformOrigin: "50% 100%",
            padding: "28px 100px 28px 82px",
            borderRadius: 26,
            backgroundColor: colors.surface,
            border: `1.5px solid ${chars > 0 ? alpha(colors.emerald, 0.6 + 0.4 * flash * (submitted ? 1 : 0)) : colors.border}`,
            boxShadow:
              chars > 0
                ? `0 0 0 6px ${alpha(colors.emerald, 0.1)}, 0 0 50px ${alpha(colors.emerald, 0.15)}`
                : "none",
            fontFamily: fonts.sans,
            fontSize: 30,
            lineHeight: 1.45,
            color: chars > 0 ? colors.text : colors.muted,
          }}
        >
          <div style={{ position: "absolute", left: 26, top: 32 }}>
            <SparkIcon size={36} />
          </div>
          {chars > 0
            ? CLEAN_PROMPT.slice(0, chars)
            : "Ask AI to clean your data…"}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 34,
              marginLeft: 2,
              verticalAlign: "middle",
              backgroundColor: colors.emerald,
              opacity: caret ? 1 : 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 22,
              bottom: 22,
              width: 58,
              height: 58,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: chars > 0 ? colors.emerald : colors.border,
            }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24">
              <path
                d="M12 19V5M5.5 11.5L12 5l6.5 6.5"
                fill="none"
                stroke={chars > 0 ? colors.canvas : colors.muted}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* CSV statement */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 520,
            width: 1000,
            height: 860,
            transform: `perspective(2000px) rotateX(${tilt * (16 + drift * 1.5)}deg) rotateY(${tilt * (-8 + drift * 2)}deg) rotateZ(${tilt * -1}deg)`,
            transformOrigin: "50% 30%",
            boxShadow: `0 ${40 * tilt + 20}px ${90 * tilt + 40}px -30px rgba(0,0,0,0.85)`,
            borderRadius: 22,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 62,
              display: "flex",
              alignItems: "center",
              padding: "0 28px",
              gap: 14,
              borderBottom: `1px solid ${colors.border}`,
              fontFamily: fonts.mono,
              fontSize: 22,
              color: colors.muted,
              backgroundColor: "#141D2D",
            }}
          >
            <span style={{ color: colors.text }}>statement_june.csv</span>
            <span>· {ROWS.length} rows</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 170px 170px",
              height: 48,
              alignItems: "center",
              padding: "0 28px",
              fontFamily: fonts.mono,
              fontSize: 19,
              letterSpacing: 1,
              color: colors.muted,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <span>DATE</span>
            <span>MERCHANT</span>
            <span style={{ textAlign: "right" }}>AMOUNT</span>
            <span style={{ textAlign: "right" }}>BALANCE</span>
          </div>
          <div
            style={{
              position: "absolute",
              top: 111,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: "hidden",
            }}
          >
            <div style={{ transform: `translateY(${scroll}px)` }}>
              {ROWS.map((r, i) => {
                bal += r.a;
                const delay = r.tag ? 180 + tagIdx++ * 14 : 0;
                return (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr 170px 170px",
                      height: ROW_H,
                      alignItems: "center",
                      padding: "0 28px",
                      borderBottom: `1px solid ${alpha(colors.border, 0.7)}`,
                      fontSize: 23,
                    }}
                  >
                    <span
                      style={{ fontFamily: fonts.mono, color: colors.muted }}
                    >
                      06/{String(1 + i).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        fontFamily: fonts.sans,
                        color: colors.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.m}
                      {r.tag ? <Badge label={r.tag} delay={delay} /> : null}
                    </span>
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        textAlign: "right",
                        color: r.a > 0 ? colors.emerald : colors.text,
                      }}
                    >
                      {r.a > 0 ? "+" : ""}
                      {usd(r.a, 2)}
                    </span>
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        textAlign: "right",
                        color: colors.muted,
                      }}
                    >
                      {usd(bal, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <SmoothCursor waypoints={cursor} size={46} />
      </VirtualCamera>
    </>
  );
};
