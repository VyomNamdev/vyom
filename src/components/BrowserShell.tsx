import React from "react";
import { useVideoConfig } from "remotion";
import { alpha, colors, fonts, radii, shadows } from "./theme";

type Props = {
  url?: string;
  /** Tab title shown left of the address bar. */
  title?: string;
  /** Window size in px. Default 1680x945. */
  width?: number;
  height?: number;
  /** Absolute position of the window's top-left corner. Defaults to centered. */
  x?: number;
  y?: number;
  children?: React.ReactNode;
  /** Ambient glass reflection strength, 0–1. Default 1. */
  reflection?: number;
  /** Highlight the address bar (e.g. while the cursor types into it). */
  addressFocused?: boolean;
};

export const TOOLBAR_HEIGHT = 56;

const TrafficLights: React.FC = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    {[
      { fill: "#FF5F57", ring: "#E0443E" },
      { fill: "#FEBC2E", ring: "#DEA123" },
      { fill: "#28C840", ring: "#1AAB29" },
    ].map((c) => (
      <div
        key={c.fill}
        style={{
          width: 13,
          height: 13,
          borderRadius: "50%",
          backgroundColor: c.fill,
          boxShadow: `inset 0 0 0 0.5px ${c.ring}, inset 0 1px 1px rgba(255,255,255,0.25)`,
        }}
      />
    ))}
  </div>
);

const Chevron: React.FC<{ dir: "left" | "right"; dim?: boolean }> = ({
  dir,
  dim,
}) => (
  <svg width={18} height={18} viewBox="0 0 24 24" style={{ opacity: dim ? 0.35 : 0.8 }}>
    <path
      d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
      fill="none"
      stroke={colors.muted}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon: React.FC = () => (
  <svg width={12} height={12} viewBox="0 0 24 24">
    <rect x={5} y={10.5} width={14} height={10} rx={2.2} fill={colors.muted} />
    <path
      d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
      fill="none"
      stroke={colors.muted}
      strokeWidth={2.2}
    />
  </svg>
);

/**
 * Dark-mode macOS browser window. Children render in the page viewport,
 * which is `width x (height - TOOLBAR_HEIGHT)`.
 *
 * The reflection is static (not frame-driven), so cutting between scenes that
 * share a BrowserShell reads as one continuous capture.
 */
export const BrowserShell: React.FC<Props> = ({
  url = "app.vyom.finance/dashboard",
  title,
  width = 1680,
  height = 945,
  x,
  y,
  children,
  reflection = 1,
  addressFocused = false,
}) => {
  const { width: compW, height: compH } = useVideoConfig();
  const left = x ?? (compW - width) / 2;
  const top = y ?? (compH - height) / 2;
  const [host, ...rest] = url.replace(/^https?:\/\//, "").split("/");
  const path = rest.length ? `/${rest.join("/")}` : "";

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: radii.window,
        overflow: "hidden",
        backgroundColor: colors.surface,
        boxShadow: shadows.window,
        border: `1px solid ${colors.border}`,
        fontFamily: fonts.sans,
        color: colors.text,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          height: TOOLBAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          gap: 18,
          background: `linear-gradient(180deg, #161F30 0%, #131B2A 100%)`,
          borderBottom: `1px solid ${colors.border}`,
          position: "relative",
        }}
      >
        <TrafficLights />
        <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
          <Chevron dir="left" />
          <Chevron dir="right" dim />
        </div>
        {title ? (
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: colors.muted,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
        ) : null}

        {/* Address bar */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: Math.min(640, width * 0.42),
            height: 34,
            borderRadius: 9,
            backgroundColor: addressFocused ? "#0E1626" : alpha("#FFFFFF", 0.045),
            border: `1px solid ${addressFocused ? alpha(colors.emerald, 0.6) : alpha("#FFFFFF", 0.06)}`,
            boxShadow: addressFocused ? `0 0 0 3px ${alpha(colors.emerald, 0.18)}` : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 14,
            letterSpacing: 0.1,
          }}
        >
          <LockIcon />
          <span style={{ color: colors.text, fontWeight: 500 }}>{host}</span>
          <span style={{ color: colors.muted, marginLeft: -8 }}>{path}</span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 14, opacity: 0.7 }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `1.8px solid ${colors.muted}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Viewport */}
      <div
        style={{
          position: "absolute",
          top: TOOLBAR_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          backgroundColor: colors.canvas,
        }}
      >
        {children}
      </div>

      {/* Ambient glass reflection */}
      {reflection > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: radii.window,
            opacity: reflection,
            background: [
              // Broad diagonal sheen from the top-left
              "linear-gradient(115deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 22%, rgba(255,255,255,0) 38%)",
              // Faint secondary streak
              "linear-gradient(115deg, rgba(255,255,255,0) 52%, rgba(255,255,255,0.022) 58%, rgba(255,255,255,0) 66%)",
              // Soft top light falloff
              "radial-gradient(120% 60% at 50% -10%, rgba(148,163,184,0.06) 0%, rgba(148,163,184,0) 60%)",
            ].join(", "),
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        />
      ) : null}
    </div>
  );
};
