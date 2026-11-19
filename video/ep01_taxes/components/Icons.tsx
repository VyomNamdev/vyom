// Chalk-style icons for the board, and small helpers shared by the scenes.
export const CHALK = "#F4F1E8";
export const GREEN = "#4CC66B";
export const RED = "#EF5B4F";
export const GOLD = "#E9C46A";
export const PAPER = "#F7EFDD";
export const INKP = "#1A1612";
export const STAMP = "#C62828";

const sw = 6;
type P = { x: number; y: number; s?: number; c?: string };

export function Banknote({ x, y, s = 1, c = GREEN }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round">
      <rect x={-70} y={-40} width={140} height={80} rx={8} />
      <circle cx={0} cy={0} r={22} />
      <text x={0} y={12} textAnchor="middle" fontFamily="Anton" fontSize={34} fill={c} stroke="none">$</text>
      <circle cx={-50} cy={-22} r={4} fill={c} />
      <circle cx={50} cy={22} r={4} fill={c} />
    </g>
  );
}

export function Bag({ x, y, s = 1, c = CHALK }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d="M -50 -30 L 50 -30 L 60 50 L -60 50 Z" />
      <path d="M -24 -30 Q -24 -66 0 -66 Q 24 -66 24 -30" />
    </g>
  );
}

export function Capitol({ x, y, s = 1, c = CHALK }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d="M -90 -40 L 0 -90 L 90 -40 Z" />
      <line x1={-90} y1={-30} x2={90} y2={-30} />
      {[-66, -33, 0, 33, 66].map((px) => <line key={px} x1={px} y1={-22} x2={px} y2={52} />)}
      <line x1={-100} y1={60} x2={100} y2={60} />
      <line x1={-90} y1={72} x2={90} y2={72} />
    </g>
  );
}

export function Road({ x, y, s = 1, c = CHALK }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round">
      <path d="M -20 -60 L -70 60 M 20 -60 L 70 60" />
      <path d="M 0 -50 L 0 -30 M 0 -10 L 0 14 M 0 34 L 0 60" strokeWidth={8} stroke={GOLD} />
    </g>
  );
}

export function School({ x, y, s = 1, c = CHALK }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <rect x={-70} y={-10} width={140} height={70} />
      <path d="M -80 -10 L 0 -55 L 80 -10" />
      <rect x={-14} y={22} width={28} height={38} />
      <rect x={-52} y={8} width={24} height={20} />
      <rect x={28} y={8} width={24} height={20} />
      <path d="M 0 -55 L 0 -85 L 26 -78 L 0 -70" />
    </g>
  );
}

export function FireTruck({ x, y, s = 1, c = RED }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d="M -80 30 L -80 -20 L 20 -20 L 20 -40 L 60 -40 L 82 0 L 82 30 Z" />
      <circle cx={-48} cy={36} r={16} fill="#2F3B33" />
      <circle cx={50} cy={36} r={16} fill="#2F3B33" />
      <path d="M -76 -34 L 10 -50 M -70 -40 L -64 -28 M -48 -44 L -42 -32 M -26 -48 L -20 -36" stroke={CHALK} />
      <rect x={30} y={-32} width={22} height={18} />
    </g>
  );
}

export function Hospital({ x, y, s = 1, c = CHALK }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <rect x={-60} y={-60} width={120} height={120} />
      <path d="M -12 -40 h 24 v 22 h 22 v 24 h -22 v 22 h -24 v -22 h -22 v -24 h 22 Z" stroke={RED} />
      <rect x={-14} y={30} width={28} height={30} />
    </g>
  );
}

export function Tree({ x, y, s = 1, c = GREEN }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d="M 0 -70 C 50 -70 60 -20 40 0 C 60 30 20 50 0 40 C -20 50 -60 30 -40 0 C -60 -20 -50 -70 0 -70 Z" />
      <path d="M 0 40 L 0 70 M 0 20 L -16 4 M 0 30 L 18 10" stroke={CHALK} />
    </g>
  );
}

export function Faucet({ x, y, s = 1, c = CHALK, t = 0 }: P & { t?: number }) {
  const drop = (t % 30) / 30;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d="M -60 -30 L 20 -30 Q 50 -30 50 0 L 50 10" />
      <path d="M -60 -50 L -60 -10" />
      <path d="M -10 -30 L -10 -50 M -30 -54 L 10 -54" />
      <path d={`M 50 ${30 + drop * 34} q 10 14 0 20 q -10 -6 0 -20 Z`} stroke="#8FC7E8" fill="#8FC7E8" opacity={1 - drop * 0.6} />
    </g>
  );
}

export function Leaf({ x, y, s = 1, c = GREEN }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw - 1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M -26 26 C -30 -10 0 -30 30 -30 C 30 0 10 30 -26 26 Z" />
      <path d="M -26 26 L 14 -12" />
    </g>
  );
}

export function Highway({ x, y, s = 1, c = CHALK }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round">
      <path d="M -90 10 Q 0 -30 90 10" />
      <path d="M -90 40 Q 0 0 90 40" />
      {[-60, -20, 20, 60].map((px) => <line key={px} x1={px} y1={24 - (px * px) / 900} x2={px} y2={60} />)}
    </g>
  );
}

export function Hoodie({ x, y, s = 1, c = INKP }: P) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} strokeLinejoin="round" strokeLinecap="round">
      <path d="M -30 -50 Q 0 -78 30 -50 L 70 -30 L 84 40 L 58 44 L 50 -4 L 50 60 L -50 60 L -50 -4 L -58 44 L -84 40 L -70 -30 Z" fill="#6E7A45" stroke={c} strokeWidth={5} />
      <path d="M -30 -50 Q 0 -10 30 -50" fill="#5C6738" stroke={c} strokeWidth={4} />
      <path d="M -26 30 L 26 30 L 22 50 L -22 50 Z" fill="none" stroke={c} strokeWidth={4} />
    </g>
  );
}

// a tiny background stick person in the same anatomy (cream head, ink outline, stick limbs)
export function Mini({ x, y, s = 1, arm = 0, hat = "#5C4A3A", body = "#8C7A62" }: P & { arm?: number; hat?: string; body?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} strokeLinecap="round" strokeLinejoin="round">
      <line x1={-8} y1={0} x2={-12} y2={36} stroke={INKP} strokeWidth={5} />
      <line x1={8} y1={0} x2={12} y2={36} stroke={INKP} strokeWidth={5} />
      <rect x={-18} y={-44} width={36} height={48} rx={8} fill={body} stroke={INKP} strokeWidth={4} />
      <line x1={-16} y1={-38} x2={-30} y2={-10} stroke={INKP} strokeWidth={5} />
      <line x1={16} y1={-38} x2={16 + Math.sin(arm) * 26} y2={-38 - Math.cos(arm) * 26} stroke={INKP} strokeWidth={5} />
      <circle cx={0} cy={-66} r={22} fill="#F7F3EA" stroke={INKP} strokeWidth={4} />
      <circle cx={-7} cy={-68} r={3} fill={INKP} />
      <circle cx={7} cy={-68} r={3} fill={INKP} />
      <path d="M -7 -58 q 7 5 14 0" fill="none" stroke={INKP} strokeWidth={3} />
      <path d="M -24 -80 Q 0 -100 24 -80 Z" fill={hat} stroke={INKP} strokeWidth={3.5} />
    </g>
  );
}

export function money(n: number, dec = 0) {
  const neg = n < 0;
  const v = Math.abs(n);
  const fixed = v.toFixed(dec);
  const [int, frac] = fixed.split(".");
  let out = "";
  for (let i = 0; i < int.length; i++) {
    if (i > 0 && (int.length - i) % 3 === 0) out += ",";
    out += int[i];
  }
  return `${neg ? "−" : ""}$${out}${frac ? "." + frac : ""}`;
}
