# vyom

Remotion project (1920x1080 · 60fps · TypeScript + Tailwind v4) for fintech product videos.

```bash
npm i
npm run dev       # Remotion Studio
npx remotion render ComponentShowcase
```

## Core component library — `src/components/`

| File | What it does |
| --- | --- |
| `theme.ts` | Colors, Inter / JetBrains Mono fonts, radii, shadows, video defaults. Tailwind tokens mirrored in `src/index.css` (`bg-canvas`, `bg-surface`, `border-border`, `text-emerald`, `text-alert`, `text-text`, `text-muted`). |
| `VirtualCamera.tsx` | Camera rig. `keyframes: { frame, scale, x, y }[]` — `x/y` is the focal point in composition px, `scale` 1–1.85. Eased with `Easing.bezier(0.25, 0.1, 0.25, 1)`, ≤0.5° 2.5D tilt while moving, edge-clamped. |
| `SmoothCursor.tsx` | macOS pointer. `waypoints: { frame, x, y, click?, duration? }[]` — `frame` is the arrival frame. Arcing cubic-bezier paths, `Easing.inOut(Easing.cubic)`, micro-overshoot, 0.85× press for 6 frames, emerald ripple. |
| `BrowserShell.tsx` | Dark macOS browser window with traffic lights, address bar and static glass reflection. Children render in the viewport below `TOOLBAR_HEIGHT`. |

`src/scenes/ComponentShowcase.tsx` is a reference scene using all four.
