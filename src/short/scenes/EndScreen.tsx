import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { alpha, colors, fonts } from "../../components";
import { usePop } from "../../reel/ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CARD = { x: 110, w: 790, top: 250 };

const Thumbnail: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [0.45, 0.62, 0.5, 0.78, 0.66, 0.9, 0.82];
  return (
    <div
      style={{
        position: "relative",
        height: 444,
        borderRadius: 22,
        overflow: "hidden",
        background: `linear-gradient(150deg, #13283A 0%, ${colors.surface} 50%, #0A1A16 100%)`,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* mini dashboard */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 40,
          display: "flex",
          gap: 16,
        }}
      >
        {["$4,200", "$3,217", "23.4%"].map((v, i) => (
          <div
            key={v}
            style={{
              padding: "14px 20px",
              borderRadius: 14,
              backgroundColor: alpha("#FFFFFF", 0.04),
              border: `1px solid ${i === 2 ? alpha(colors.emerald, 0.6) : colors.border}`,
              fontFamily: fonts.mono,
              fontWeight: 700,
              fontSize: 30,
              color: i === 2 ? colors.emerald : colors.text,
            }}
          >
            {v}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          bottom: 40,
          height: 200,
          display: "flex",
          alignItems: "flex-end",
          gap: 18,
        }}
      >
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${b * interpolate(frame, [10 + i * 4, 50 + i * 4], [0, 100], clamp)}%`,
              borderRadius: 8,
              backgroundColor:
                i === bars.length - 1
                  ? colors.emerald
                  : alpha(colors.emerald, 0.25 + i * 0.06),
            }}
          />
        ))}
      </div>
      {/* play button */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 120,
          height: 120,
          marginLeft: -60,
          marginTop: -60,
          borderRadius: 60,
          backgroundColor: alpha(colors.canvas, 0.75),
          border: `2px solid ${alpha("#FFFFFF", 0.25)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={48} height={48} viewBox="0 0 24 24">
          <path d="M8 5.5v13l11-6.5z" fill={colors.text} />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          right: 18,
          top: 18,
          padding: "6px 14px",
          borderRadius: 999,
          backgroundColor: colors.emerald,
          color: colors.canvas,
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: 2,
        }}
      >
        FULL SETUP
      </div>
      <div
        style={{
          position: "absolute",
          right: 18,
          bottom: 18,
          padding: "4px 10px",
          borderRadius: 8,
          backgroundColor: "rgba(0,0,0,0.75)",
          color: colors.text,
          fontFamily: fonts.mono,
          fontSize: 22,
        }}
      >
        14:32
      </div>
    </div>
  );
};

export const EndScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const card = usePop(4, { damping: 16, stiffness: 120, mass: 0.9 });
  const sub = usePop(40);
  const text = usePop(220);
  const arrowIn = usePop(240);
  const bounce = Math.abs(Math.sin((frame - 240) / 14)) * 26;
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin((frame - 240) / 14));

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.top,
          width: CARD.w,
          fontFamily: fonts.sans,
          opacity: Math.min(1, card),
          transform: `perspective(1600px) translateY(${(1 - card) * 400 + Math.sin(frame / 34) * 10}px) rotateX(${(1 - card) * 40 + 7 + Math.sin(frame / 47) * 3}deg) rotateY(${-9 + Math.sin(frame / 60) * 6}deg) translateZ(${(1 - card) * -300}px)`,
          transformOrigin: "50% 60%",
        }}
      >
        <div
          style={{
            padding: 18,
            borderRadius: 32,
            backgroundColor: colors.surface,
            border: `1.5px solid ${alpha(colors.emerald, 0.35)}`,
            boxShadow: `0 40px 100px -30px rgba(0,0,0,0.9), 0 0 70px ${alpha(colors.emerald, 0.16)}`,
          }}
        >
          <Thumbnail />
          <div style={{ padding: "22px 10px 10px" }}>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: -1,
                color: colors.text,
              }}
            >
              Build Your{" "}
              <span style={{ color: colors.emerald }}>Automated</span> Wealth
              Stack (Full Setup)
            </div>
            <div style={{ fontSize: 26, color: colors.muted, marginTop: 10 }}>
              Tech &amp; Wealth Systems · Full video
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe watermark */}
      <div
        style={{
          position: "absolute",
          top: 1050,
          left: 0,
          width: 1010,
          display: "flex",
          justifyContent: "center",
          opacity: Math.min(1, sub) * 0.9,
          transform: `perspective(900px) rotateX(${(1 - sub) * 70}deg) scale(${0.7 + 0.3 * sub})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 40px",
            borderRadius: 999,
            backgroundColor: colors.emerald,
            color: colors.canvas,
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 36,
          }}
        >
          <svg width={34} height={34} viewBox="0 0 24 24">
            <path
              d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0"
              fill={colors.canvas}
            />
          </svg>
          Subscribe
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 1160,
          left: 60,
          width: 900,
          textAlign: "center",
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 50,
          letterSpacing: -1,
          color: colors.text,
          opacity: Math.min(1, text),
          transform: `translateY(${(1 - text) * 30}px)`,
        }}
      >
        <span style={{ color: colors.emerald }}>Free template</span> inside the
        full video
      </div>

      {/* Pulsing arrow toward the Shorts related-video link */}
      <div
        style={{
          position: "absolute",
          top: 1240 + bounce,
          left: 455,
          opacity: Math.min(1, arrowIn) * pulse,
          filter: `drop-shadow(0 0 18px ${alpha(colors.emerald, 0.8)})`,
        }}
      >
        <svg width={100} height={130} viewBox="0 0 40 52">
          <path
            d="M20 4v38M6 30l14 14 14-14"
            fill="none"
            stroke={colors.emerald}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};
