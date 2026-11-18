import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CursorWaypoint, SmoothCursor, alpha, colors, fonts } from "../../components";
import { REEL } from "../config";
import { CheckIcon, FileIcon, Headline, SparkIcon, usePop } from "../ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const POST = { x: 955, y: 1355 };
const TYPE_START = 64;
const TYPE_END = 104;
const POST_CLICK = 132;

const cursor: CursorWaypoint[] = [
  { frame: 0, x: 900, y: 1760 },
  { frame: 60, x: 700, y: 1500 },
  { frame: POST_CLICK, ...POST, click: true },
  { frame: 230, x: 820, y: 1620 },
];

const PdfCover: React.FC = () => {
  const frame = useCurrentFrame();
  const s = usePop(10, { damping: 16, stiffness: 110, mass: 0.9 });
  const float = Math.sin(frame / 28) * 10;
  const ry = -16 + Math.sin(frame / 40) * 4;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - 230,
        top: 560,
        width: 460,
        height: 620,
        perspective: 1600,
        opacity: Math.min(1, s),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          padding: 44,
          fontFamily: fonts.sans,
          color: colors.text,
          background: `linear-gradient(160deg, #13283A 0%, ${colors.surface} 45%, #0A1A16 100%)`,
          border: `1px solid ${alpha(colors.emerald, 0.35)}`,
          boxShadow: `30px 50px 90px -20px rgba(0,0,0,0.85), 0 0 80px ${alpha(colors.emerald, 0.18)}`,
          transform: `translateY(${float + (1 - s) * 160}px) rotateY(${ry}deg) rotateX(6deg) scale(${0.8 + 0.2 * s})`,
          overflow: "hidden",
        }}
      >
        {/* spine shading */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 22,
            background: "linear-gradient(90deg, rgba(0,0,0,0.45), rgba(0,0,0,0))",
          }}
        />
        <div
          style={{
            display: "inline-block",
            fontFamily: fonts.mono,
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 3,
            padding: "8px 16px",
            borderRadius: 999,
            backgroundColor: colors.emerald,
            color: colors.canvas,
          }}
        >
          FREE PDF
        </div>
        <div style={{ marginTop: 50, fontWeight: 800, fontSize: 74, lineHeight: 1.02, letterSpacing: -2 }}>
          {REEL.pdfTitle.map((l, i) => (
            <div key={l} style={{ color: i === REEL.pdfTitle.length - 1 ? colors.emerald : colors.text }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 30, fontSize: 24, color: colors.muted, lineHeight: 1.4 }}>
          {REEL.pdfSubtitle}
        </div>
        {/* mini chart motif */}
        <svg width={372} height={110} style={{ position: "absolute", left: 44, bottom: 40 }}>
          <polyline
            points="0,90 50,70 95,80 150,45 200,55 250,25 300,32 372,6"
            fill="none"
            stroke={colors.emerald}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points="0,90 50,70 95,80 150,45 200,55 250,25 300,32 372,6 372,110 0,110"
            fill={alpha(colors.emerald, 0.12)}
          />
        </svg>
        {/* glossy sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0) 45%)",
          }}
        />
      </div>
    </div>
  );
};

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const bar = usePop(30);
  const chars = Math.round(interpolate(frame, [TYPE_START, TYPE_END], [0, REEL.keyword.length], clamp));
  const posted = frame >= POST_CLICK + 3;
  const postedP = usePop(POST_CLICK + 3);
  const dm = usePop(POST_CLICK + 34);
  const caretOn = !posted && Math.floor(frame / 16) % 2 === 0;
  const hasText = chars > 0;

  return (
    <>
      <Headline text={`Comment ^${REEL.keyword}^\nfor the *free PDF*`} delay={2} size={96} top={240} />
      <PdfCover />

      {/* Comment composer → posted comment */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 1300,
          height: 110,
          borderRadius: 55,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "0 22px",
          fontFamily: fonts.sans,
          backgroundColor: colors.surface,
          border: `1.5px solid ${hasText && !posted ? alpha(colors.emerald, 0.6) : colors.border}`,
          opacity: Math.min(1, bar),
          transform: `translateY(${(1 - bar) * 80}px)`,
        }}
      >
        <div
          style={{
            width: 66,
            height: 66,
            borderRadius: 33,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${colors.emerald}, #3B82F6)`,
          }}
        />
        <div style={{ flex: 1, fontSize: 38, fontWeight: 700, letterSpacing: 1 }}>
          {posted ? (
            <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ color: colors.muted, fontWeight: 500, fontSize: 28 }}>you</span>
              <span style={{ color: colors.text, transform: `scale(${0.9 + 0.1 * postedP})`, display: "inline-block" }}>
                {REEL.keyword}
              </span>
            </span>
          ) : chars > 0 ? (
            <span style={{ color: colors.text }}>{REEL.keyword.slice(0, chars)}</span>
          ) : (
            <span style={{ color: colors.muted, fontWeight: 500, fontSize: 32 }}>Add a comment…</span>
          )}
          {!posted ? (
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 40,
                marginLeft: 3,
                verticalAlign: "middle",
                backgroundColor: colors.emerald,
                opacity: caretOn && frame > TYPE_START - 20 ? 1 : 0,
              }}
            />
          ) : null}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: posted ? colors.emerald : hasText ? colors.emerald : alpha(colors.emerald, 0.4),
            paddingRight: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {posted ? <CheckIcon size={34} /> : "Post"}
        </div>
      </div>

      {/* DM notification */}
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 1440,
          padding: "22px 26px",
          borderRadius: 28,
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontFamily: fonts.sans,
          backgroundColor: alpha("#1A2436", 0.96),
          border: `1px solid ${alpha("#FFFFFF", 0.08)}`,
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8)",
          opacity: Math.min(1, dm),
          transform: `translateY(${(1 - dm) * 60}px) scale(${0.92 + 0.08 * dm})`,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(colors.emerald, 0.16),
          }}
        >
          <SparkIcon size={36} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, color: colors.muted }}>New message · now</div>
          <div style={{ fontSize: 30, fontWeight: 600, color: colors.text, marginTop: 4 }}>
            Here's your PDF — enjoy!
          </div>
        </div>
        <FileIcon size={52} />
      </div>

      <SmoothCursor waypoints={cursor} size={46} />
    </>
  );
};
