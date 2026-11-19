// The set: a warm vintage living room with a big wooden chalkboard on the right wall.
// Thin sepia linework, warm tan / wood / olive palette (character_bible.json background rules).

const SEPIA = "#3B2A1C";
export const BOARD = { x: 880, y: 150, w: 960, h: 600 }; // the slate's outer frame

function Wallpaper() {
  const motifs = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 17; col++) {
      const x = col * 120 + (row % 2 ? 60 : 0);
      const y = 40 + row * 85;
      motifs.push(
        <g key={`${row}-${col}`} transform={`translate(${x},${y})`} opacity={0.32}>
          <path d="M 0 -18 C 10 -8 10 8 0 18 C -10 8 -10 -8 0 -18 Z" fill="none" stroke="#B8935F" strokeWidth={2.2} />
          <circle cx={0} cy={0} r={3} fill="#B8935F" />
          <path d="M -14 0 q 7 -6 14 0 q 7 6 14 0" fill="none" stroke="#B8935F" strokeWidth={1.6} />
        </g>,
      );
    }
  }
  return <g>{motifs}</g>;
}

export function Room({ dim = 0, lampPulse = 0 }: { dim?: number; lampPulse?: number }) {
  return (
    <g>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9D3AE" />
          <stop offset="1" stopColor="#DDBF92" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A5E3B" />
          <stop offset="1" stopColor="#6E4A2E" />
        </linearGradient>
        <radialGradient id="lampglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFD58A" stopOpacity={0.55 + lampPulse * 0.1} />
          <stop offset="1" stopColor="#FFD58A" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="windowlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF4D6" />
          <stop offset="1" stopColor="#F3D9A4" />
        </linearGradient>
        <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#1A0F06" stopOpacity={0.45} />
        </radialGradient>
      </defs>

      {/* wall */}
      <rect x={0} y={0} width={1920} height={760} fill="url(#wall)" />
      <Wallpaper />
      {/* crown moulding */}
      <rect x={0} y={0} width={1920} height={34} fill="#6B4426" />
      <rect x={0} y={34} width={1920} height={8} fill="#8A5A34" stroke={SEPIA} strokeWidth={2} />

      {/* window, far left */}
      <g>
        <rect x={60} y={150} width={250} height={430} fill="#7A5232" stroke={SEPIA} strokeWidth={4} />
        <rect x={78} y={168} width={214} height={394} fill="url(#windowlight)" stroke={SEPIA} strokeWidth={3} />
        {/* distant rooftops */}
        <path d="M 78 470 L 120 470 L 120 430 L 160 430 L 160 455 L 205 455 L 205 410 L 250 410 L 250 445 L 292 445 L 292 562 L 78 562 Z" fill="#E2C38E" opacity={0.8} />
        <path d="M 78 365 L 292 365 M 185 168 L 185 562" stroke="#7A5232" strokeWidth={9} />
        {/* curtains */}
        <path d="M 40 130 Q 70 360 46 610 L 98 610 Q 86 360 104 130 Z" fill="#8E3B2E" stroke={SEPIA} strokeWidth={3} />
        <path d="M 330 130 Q 300 360 324 610 L 272 610 Q 284 360 266 130 Z" fill="#8E3B2E" stroke={SEPIA} strokeWidth={3} />
        <rect x={30} y={120} width={310} height={14} rx={7} fill="#5A3A22" stroke={SEPIA} strokeWidth={2} />
        {/* sill */}
        <rect x={50} y={578} width={270} height={18} fill="#8A5A34" stroke={SEPIA} strokeWidth={3} />
        {/* plant on the sill */}
        <path d="M 250 578 l -14 -40 h 44 l -12 40 Z" fill="#A0522D" stroke={SEPIA} strokeWidth={3} />
        {[[-22, -78], [-4, -96], [16, -82], [28, -64], [-30, -58]].map(([dx, dy], i) => (
          <path key={i} d={`M 258 540 q ${dx / 2} ${dy / 2 - 10} ${dx} ${dy}`} fill="none" stroke="#5E6B3A" strokeWidth={7} strokeLinecap="round" />
        ))}
      </g>

      {/* wainscoting */}
      <rect x={0} y={760} width={1920} height={150} fill="#7A5232" />
      <rect x={0} y={752} width={1920} height={14} fill="#5E3E25" stroke={SEPIA} strokeWidth={2} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={20 + i * 192} y={782} width={160} height={106} rx={4} fill="none" stroke="#5E3E25" strokeWidth={4} />
      ))}
      {/* floor */}
      <rect x={0} y={905} width={1920} height={175} fill="url(#floor)" />
      <rect x={0} y={900} width={1920} height={10} fill="#4E3420" />
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={i} x1={0} y1={935 + i * 24} x2={1920} y2={935 + i * 24} stroke="#5E3E25" strokeWidth={2} opacity={0.6} />
      ))}
      {/* rug */}
      <g>
        <ellipse cx={720} cy={1012} rx={690} ry={62} fill="#8E3B2E" stroke={SEPIA} strokeWidth={4} />
        <ellipse cx={720} cy={1012} rx={630} ry={46} fill="none" stroke="#C9A13B" strokeWidth={4} opacity={0.8} />
        <ellipse cx={720} cy={1012} rx={560} ry={32} fill="none" stroke="#5C1F17" strokeWidth={3} strokeDasharray="14 10" />
      </g>

      {/* floor lamp between Sam and the board */}
      <g>
        <circle cx={790} cy={400} r={260} fill="url(#lampglow)" />
        <line x1={790} y1={460} x2={790} y2={980} stroke="#3A2A1C" strokeWidth={8} />
        <ellipse cx={790} cy={985} rx={50} ry={12} fill="#3A2A1C" />
        <path d="M 735 460 L 845 460 L 820 370 L 760 370 Z" fill="#F3D9A4" stroke={SEPIA} strokeWidth={4} strokeLinejoin="round" />
        <path d="M 760 370 L 820 370" stroke="#C9A13B" strokeWidth={4} />
      </g>

      {/* the chalkboard */}
      <g>
        <rect x={BOARD.x - 8} y={BOARD.y + 12} width={BOARD.w + 16} height={BOARD.h} rx={8} fill="#000" opacity={0.18} />
        <rect x={BOARD.x} y={BOARD.y} width={BOARD.w} height={BOARD.h} rx={8} fill="#7A4E2C" stroke={SEPIA} strokeWidth={5} />
        <rect x={BOARD.x + 26} y={BOARD.y + 26} width={BOARD.w - 52} height={BOARD.h - 52} rx={4} fill="#2F3B33" stroke="#1F2722" strokeWidth={4} />
        {/* chalk dust smudges */}
        {[[1050, 260, 120], [1500, 420, 160], [1300, 650, 140], [1700, 280, 90]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.35} fill="#E9E6DA" opacity={0.045} />
        ))}
        {/* chalk tray */}
        <rect x={BOARD.x + 10} y={BOARD.y + BOARD.h - 8} width={BOARD.w - 20} height={20} rx={4} fill="#6B4426" stroke={SEPIA} strokeWidth={3} />
        <rect x={BOARD.x + 120} y={BOARD.y + BOARD.h - 16} width={46} height={10} rx={5} fill="#F4F1E8" />
        <rect x={BOARD.x + 190} y={BOARD.y + BOARD.h - 15} width={30} height={9} rx={4} fill="#E9C46A" />
        <rect x={BOARD.x + BOARD.w - 220} y={BOARD.y + BOARD.h - 20} width={70} height={16} rx={4} fill="#8A5A34" stroke={SEPIA} strokeWidth={2} />
      </g>

      {/* soft overall warmth + vignette */}
      <rect x={0} y={0} width={1920} height={1080} fill="url(#vignette)" />
      {dim > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#0E0904" opacity={dim} /> : null}
    </g>
  );
}
