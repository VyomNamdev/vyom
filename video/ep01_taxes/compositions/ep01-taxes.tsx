// EP01 — How Taxes Actually Work (Explained Simply), Part 1. Sam (late 20s) explains taxes to his little brother (you).
// Everything is cued from the voice's line timings (components/timeline.gen.ts, made by assets/build_audio.py).
import { AbsoluteFill, Audio, Composition, Easing, Mix, Sequence, interpolate, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Sam, Expr, Pose } from "../components/Sam";
import { Room, BOARD } from "../components/Room";
import {
  Bag, Banknote, Capitol, CHALK, Faucet, FireTruck, GOLD, GREEN, Highway, Hoodie, Hospital, INKP, Leaf, Mini, PAPER, RED,
  Road, School, STAMP, Tree, money,
} from "../components/Icons";
import { MOUTH, TIMELINE } from "../components/timeline.gen";

const FPS = 30;
const END_HOLD = 60;
const TOTAL = TIMELINE.totalFrames + END_HOLD;

// ------------------------------------------------------------------ timing helpers
type LineId = (typeof TIMELINE.lines)[number]["id"];
const LINES: Record<string, { from: number; to: number; text: string; idx: number }> = {};
TIMELINE.lines.forEach((l, idx) => (LINES[l.id] = { from: l.from, to: l.to, text: l.text, idx }));
const L = (id: LineId) => LINES[id];
// the frame a phrase is said: its share of the line's characters (Kokoro speaks at an even pace)
function cue(id: LineId, phrase: string, offset = 0) {
  const l = L(id);
  const i = l.text.indexOf(phrase);
  if (i < 0) throw new Error(`cue: "${phrase}" not in line ${id}`);
  return Math.round(l.from + (i / l.text.length) * (l.to - l.from)) + offset;
}
// a section runs from a few frames before its line to a few frames before the next
function section(id: LineId) {
  const l = L(id);
  const next = TIMELINE.lines[l.idx + 1];
  return { a: l.idx === 0 ? 0 : l.from - 8, b: next ? next.from - 8 : TOTAL };
}

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const out = Easing.out(Easing.cubic);
const ip = (f: number, i: number[], o: number[], e = out) => interpolate(f, i, o, { ...clamp, easing: e });
const pop = (f: number, at: number) => interpolate(f, [at, at + 6, at + 11], [0, 1.14, 1], clamp);
const appear = (f: number, at: number, d = 8) => ip(f, [at, at + d], [0, 1]);

// ------------------------------------------------------------------ text helpers
function T({ x, y, size, font = "Fraunces", color = CHALK, anchor = "middle", weight = 700, children, opacity = 1, scale = 1, rotate = 0 }:
  { x: number; y: number; size: number; font?: string; color?: string; anchor?: "start" | "middle" | "end"; weight?: number; children: any; opacity?: number; scale?: number; rotate?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      <text x={0} y={0} textAnchor={anchor} fontFamily={font} fontWeight={weight} fontSize={size} fill={color}>{children}</text>
    </g>
  );
}
// chalk "writing" reveal, left to right
function Write({ id, f, at, d = 14, x, y, w, h, children }: { id: string; f: number; at: number; d?: number; x: number; y: number; w: number; h: number; children: any }) {
  const p = ip(f, [at, at + d], [0, 1], Easing.inOut(Easing.quad));
  return (
    <g>
      <clipPath id={id}><rect x={x} y={y} width={w * p} height={h} /></clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
}
function Paper({ x, y, w, h, rotate = 0, children, opacity = 1, dx = 0, dy = 0 }: { x: number; y: number; w: number; h: number; rotate?: number; children?: any; opacity?: number; dx?: number; dy?: number }) {
  return (
    <g transform={`translate(${dx},${dy}) rotate(${rotate} ${x + w / 2} ${y + h / 2})`} opacity={opacity}>
      <rect x={x + 8} y={y + 12} width={w} height={h} rx={6} fill="#000" opacity={0.25} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill={PAPER} stroke={INKP} strokeWidth={5} />
      {children}
    </g>
  );
}
function Check({ x, y, s = 1, c = GREEN }: { x: number; y: number; s?: number; c?: string }) {
  return <path transform={`translate(${x},${y}) scale(${s})`} d="M -26 0 L -8 20 L 28 -22" fill="none" stroke={c} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />;
}
function Cross({ x, y, s = 1, c = RED }: { x: number; y: number; s?: number; c?: string }) {
  return <path transform={`translate(${x},${y}) scale(${s})`} d="M -22 -22 L 22 22 M 22 -22 L -22 22" fill="none" stroke={c} strokeWidth={10} strokeLinecap="round" />;
}

// a section's board content fades/slides in and out
function Section({ id, f, children, slide = 60 }: { id: LineId; f: number; children: (f: number) => any; slide?: number }) {
  const { a, b } = section(id);
  if (f < a - 2 || f >= b + 10) return null;
  const inT = ip(f, [a, a + 10], [0, 1]);
  const outT = ip(f, [b - 2, b + 8], [0, 1], Easing.in(Easing.cubic));
  return <g opacity={inT * (1 - outT)} transform={`translate(${(1 - inT) * slide - outT * 40},0)`}>{children(f)}</g>;
}

const BX = BOARD.x + BOARD.w / 2; // board centre x (1360)

// ------------------------------------------------------------------ scenes
function Hook({ f }: { f: number }) {
  const at = cue("hook", "almost eight hundred");
  const school = cue("hook", "School taught");
  const cardIn = ip(f, [6, 22], [700, 0]);
  const cardOut = ip(f, [school - 6, school + 6], [0, 1], Easing.in(Easing.cubic));
  const amount = ip(f, [at + 4, at + 34], [4166, 3378], Easing.inOut(Easing.quad));
  const counting = f > at + 4;
  return (
    <g>
      {cardOut < 1 ? (
        <Paper x={1010} y={215} w={700} h={430} rotate={-2} dx={cardIn} dy={cardOut * 500} opacity={1 - cardOut}>
          <T x={1360} y={290} size={52} color={INKP}>PAYCHECK</T>
          <line x1={1060} y1={318} x2={1660} y2={318} stroke={INKP} strokeWidth={3} />
          <T x={1080} y={380} size={34} anchor="start" color={INKP} font="Bricolage Grotesque" weight={600}>Pay to: YOU</T>
          <T x={1080} y={430} size={34} anchor="start" color={INKP} font="Bricolage Grotesque" weight={600}>{counting ? "What you actually get:" : "What you expect:"}</T>
          <T x={1360} y={570} size={140} font="Anton" color={counting ? STAMP : INKP} weight={400}>{money(amount)}</T>
        </Paper>
      ) : null}
      {f >= at && cardOut < 1 ? (
        <T x={1640} y={250} size={84} font="Anton" color={STAMP} weight={400} rotate={-8} scale={pop(f, at)} opacity={1 - cardOut}>−$788</T>
      ) : null}
      {f >= school - 2 ? (
        <g>
          <Write id="w-school" f={f} at={school} x={920} y={190} w={880} h={110}>
            <T x={BX} y={280} size={64}>SCHOOL TAUGHT YOU</T>
          </Write>
          {f >= cue("hook", "photosynthesis") ? (
            <g transform={`translate(0,0)`} opacity={appear(f, cue("hook", "photosynthesis"))}>
              <Check x={1010} y={400} s={pop(f, cue("hook", "photosynthesis"))} />
              <Leaf x={1100} y={400} s={1.2} />
              <T x={1160} y={420} size={56} anchor="start">Photosynthesis</T>
            </g>
          ) : null}
          {f >= cue("hook", "never this") ? (
            <g opacity={appear(f, cue("hook", "never this"))}>
              <Cross x={1010} y={540} s={pop(f, cue("hook", "never this"))} />
              <T x={1070} y={562} size={56} anchor="start" color={GOLD}>How taxes take your pay</T>
            </g>
          ) : null}
          {f >= cue("hook", "where that money") ? (
            <T x={BX} y={680} size={44} font="Bricolage Grotesque" weight={700} opacity={appear(f, cue("hook", "where that money"))}>Let's follow the money  →</T>
          ) : null}
        </g>
      ) : null}
    </g>
  );
}

function Define({ f }: { f: number }) {
  const l = L("define");
  const earn = cue("define", "what you earn");
  const buy = cue("define", "what you buy");
  const gov = cue("define", "government");
  const coinsOn = Math.max(earn, gov) + 6;
  const coins = [];
  if (f > coinsOn) {
    for (let k = 0; k < 6; k++) {
      const p = ((f - coinsOn + k * 9) % 50) / 50;
      const fromY = k % 2 ? 610 : 440;
      const x = 1180 + p * (1480 - 1180);
      const y = fromY + p * (520 - fromY);
      if (k % 2 === 1 && f < buy + 6) continue;
      coins.push(<circle key={k} cx={x} cy={y} r={13} fill={GOLD} stroke={INKP} strokeWidth={3} opacity={Math.sin(p * Math.PI)} />);
    }
  }
  return (
    <g>
      <Write id="w-what" f={f} at={l.from} x={920} y={190} w={880} h={110}>
        <T x={BX} y={275} size={76}>WHAT ARE TAXES?</T>
      </Write>
      {f >= earn ? (
        <g opacity={appear(f, earn)} transform={`translate(1060,440) scale(${pop(f, earn)}) translate(-1060,-440)`}>
          <Banknote x={1060} y={420} s={0.9} />
          <T x={1060} y={500} size={34} font="Bricolage Grotesque">WHAT YOU EARN</T>
        </g>
      ) : null}
      {f >= buy ? (
        <g opacity={appear(f, buy)} transform={`translate(1060,610) scale(${pop(f, buy)}) translate(-1060,-610)`}>
          <Bag x={1060} y={600} s={0.85} c={GOLD} />
          <T x={1060} y={686} size={34} font="Bricolage Grotesque">WHAT YOU BUY</T>
        </g>
      ) : null}
      {f >= gov ? (
        <g opacity={appear(f, gov)}>
          <path d="M 1190 440 L 1460 510 M 1190 610 L 1460 540" stroke={CHALK} strokeWidth={5} strokeDasharray="14 12" strokeDashoffset={-f * 1.5} fill="none" />
          <g transform={`translate(1620,510) scale(${pop(f, gov)}) translate(-1620,-510)`}>
            <Capitol x={1620} y={500} s={1.1} />
            <T x={1620} y={620} size={36} font="Bricolage Grotesque">GOVERNMENT</T>
          </g>
        </g>
      ) : null}
      {coins}
    </g>
  );
}

function Disclaimer({ f }: { f: number }) {
  const a = cue("define", "Quick note");
  const b = L("define").to + 20;
  if (f < a || f > b + 10) return null;
  const o = ip(f, [a, a + 8], [0, 1]) * (1 - ip(f, [b, b + 10], [0, 1]));
  return (
    <g opacity={o}>
      <rect x={1010} y={800} width={700} height={70} rx={10} fill={PAPER} stroke={INKP} strokeWidth={4} />
      <T x={1360} y={847} size={34} font="Bricolage Grotesque" color={INKP}>Education, not personal financial advice</T>
    </g>
  );
}

function Salary({ f }: { f: number }) {
  const l = L("salary");
  const fifty = cue("salary", "fifty thousand");
  const month = cue("salary", "about four thousand");
  const yearly = ip(f, [l.from + 4, fifty + 22], [0, 50000], Easing.inOut(Easing.quad));
  const monthly = ip(f, [month + 6, month + 34], [0, 4166], Easing.out(Easing.quad));
  return (
    <g>
      <T x={BX} y={262} size={52}>YOUR FIRST JOB</T>
      <T x={1660} y={410} size={44} anchor="start" font="Bricolage Grotesque" opacity={0.85}>/ year</T>
      <T x={1640} y={420} size={150} font="Anton" anchor="end" weight={400}>{money(yearly)}</T>
      {f >= month ? (
        <g opacity={appear(f, month)}>
          <T x={BX} y={515} size={56} color={GOLD}>÷ 12 months</T>
          <T x={1640} y={665} size={150} font="Anton" anchor="end" color={GREEN} weight={400} scale={f > month + 34 ? pop(f, month + 34) * 0.06 + 0.94 : 1}>{money(monthly)}</T>
          <T x={1660} y={655} size={44} anchor="start" font="Bricolage Grotesque" color={GREEN}>/ month</T>
        </g>
      ) : null}
    </g>
  );
}

const DEDUCTIONS: { label: string; amt: number; phrase: string }[] = [
  { label: "Federal income tax", amt: 330, phrase: "Federal income tax" },
  { label: "Social Security", amt: 258, phrase: "Social Security" },
  { label: "Medicare", amt: 60, phrase: "Medicare" },
  { label: "State income tax*", amt: 140, phrase: "your state" },
];
function Deductions({ f }: { f: number }) {
  let bal = 4166;
  const rows = DEDUCTIONS.map((d, i) => {
    const at = cue("deductions", d.phrase);
    bal -= ip(f, [at + 4, at + 16], [0, d.amt]);
    if (f < at) return null;
    const y = 400 + i * 62;
    return (
      <g key={d.label} opacity={appear(f, at, 6)} transform={`translate(${(1 - appear(f, at, 8)) * 80},0)`}>
        <T x={1010} y={y} size={36} anchor="start" color={INKP} font="Bricolage Grotesque" weight={600}>{d.label}</T>
        <T x={1710} y={y} size={44} anchor="end" color={STAMP} font="Anton" weight={400}>{money(-d.amt)}</T>
      </g>
    );
  });
  return (
    <Paper x={970} y={182} w={780} h={540} rotate={1}>
      <T x={1360} y={245} size={42} color={INKP}>PAY STUB · MONTHLY</T>
      <line x1={1000} y1={268} x2={1720} y2={268} stroke={INKP} strokeWidth={3} />
      <T x={1010} y={325} size={38} anchor="start" color={INKP} font="Bricolage Grotesque" weight={700}>Gross pay</T>
      <T x={1710} y={328} size={50} anchor="end" color={INKP} font="Anton" weight={400}>$4,166</T>
      <line x1={1000} y1={352} x2={1720} y2={352} stroke={INKP} strokeWidth={2} strokeDasharray="8 8" />
      {rows}
      <rect x={1000} y={630} width={720} height={70} rx={6} fill="#E7DCC2" stroke={INKP} strokeWidth={3} />
      <T x={1020} y={678} size={36} anchor="start" color={INKP} font="Bricolage Grotesque" weight={800}>LEFT FOR YOU</T>
      <T x={1700} y={684} size={58} anchor="end" color="#2C7A3F" font="Anton" weight={400}>{money(bal)}</T>
      <T x={1740} y={760} size={26} anchor="end" color={CHALK} font="Bricolage Grotesque" weight={500}>*Varies by state. Some states have none.</T>
    </Paper>
  );
}

function TakeHome({ f }: { f: number }) {
  const l = L("takehome");
  const take = cue("takehome", "take home");
  const gone = cue("takehome", "gone");
  const v = ip(f, [take, take + 26], [4166, 3378], Easing.inOut(Easing.quad));
  const fall = ip(f, [gone, gone + 26], [0, 1], Easing.in(Easing.quad));
  const W = 760, green = (W * 3378) / 4166;
  return (
    <g>
      <T x={BX} y={262} size={52}>EVERY MONTH</T>
      <rect x={980} y={320} width={green} height={80} rx={6} fill={GREEN} stroke={INKP} strokeWidth={4} />
      <T x={980 + green / 2} y={374} size={36} font="Bricolage Grotesque" color={INKP} weight={800}>YOU KEEP</T>
      <g transform={`translate(${980 + green},${320 + fall * 300}) rotate(${fall * 38})`} opacity={1 - fall * 0.9}>
        <rect x={0} y={0} width={W - green} height={80} rx={6} fill={RED} stroke={INKP} strokeWidth={4} />
        <T x={(W - green) / 2} y={54} size={30} font="Bricolage Grotesque" color={INKP} weight={800}>TAXES</T>
      </g>
      {f >= take ? <T x={BX} y={560} size={150} font="Anton" color={GREEN} weight={400} opacity={appear(f, take)}>{money(v)}</T> : null}
      {f >= gone ? <T x={BX} y={690} size={84} font="Anton" color={RED} weight={400} scale={pop(f, gone)} rotate={-3}>−$788 GONE</T> : null}
      {f < take ? <T x={BX} y={560} size={150} font="Anton" color={CHALK} weight={400} opacity={appear(f, l.from)}>$4,166</T> : null}
    </g>
  );
}

function SalesTax({ f }: { f: number }) {
  const l = L("salestax");
  const hood = cue("salestax", "twenty-dollar hoodie");
  const pct = cue("salestax", "eight percent");
  const tot = cue("salestax", "twenty-one sixty");
  const h = ip(f, [l.from, l.from + 18], [120, 540]);
  const row = (at: number, y: number, a: string, b: string, bold = false, color = INKP) =>
    f >= at ? (
      <g opacity={appear(f, at, 5)}>
        <T x={1170} y={y} size={bold ? 40 : 34} anchor="start" font="DejaVu Sans Mono" color={color} weight={bold ? 800 : 500}>{a}</T>
        <T x={1560} y={y} size={bold ? 44 : 34} anchor="end" font="DejaVu Sans Mono" color={color} weight={bold ? 800 : 500}>{b}</T>
      </g>
    ) : null;
  const teeth = Array.from({ length: 12 }).map((_, k) => { const i = 12 - k; return `L ${1140 + i * 37.5 - 18.75} ${190 + h + 14} L ${1140 + (i - 1) * 37.5} ${190 + h}`; }).join(" ");
  return (
    <g>
      <path d={`M 1140 190 L 1590 190 L 1590 ${190 + h} ${teeth} Z`} fill="#FFFDF6" stroke={INKP} strokeWidth={4} strokeLinejoin="round" />
      <T x={1365} y={245} size={36} font="DejaVu Sans Mono" color={INKP} weight={800}>THE CORNER SHOP</T>
      {f >= hood ? <g opacity={appear(f, hood)} transform={`translate(1365,330) scale(${pop(f, hood) * 0.8}) translate(-1365,-330)`}><Hoodie x={1365} y={330} /></g> : null}
      {row(hood, 450, "HOODIE", "$20.00")}
      {row(pct, 510, "SALES TAX 8%", "+$1.60", false, STAMP)}
      {f >= pct ? <line x1={1170} y1={545} x2={1560} y2={545} stroke={INKP} strokeWidth={3} strokeDasharray="10 8" opacity={appear(f, pct)} /> : null}
      {row(tot, 610, "TOTAL", "$21.60", true)}
      {f >= tot ? <T x={1700} y={420} size={60} font="Anton" color={GOLD} weight={400} rotate={8} scale={pop(f, tot)}>+8%</T> : null}
      <T x={920} y={660} size={26} anchor="start" font="Bricolage Grotesque" color={CHALK} weight={500} opacity={appear(f, pct)}>Example rate:</T>
      <T x={920} y={694} size={26} anchor="start" font="Bricolage Grotesque" color={CHALK} weight={500} opacity={appear(f, pct)}>varies by place</T>
    </g>
  );
}

function Why({ f }: { f: number }) {
  const l = L("why");
  const wob = (k: number) => Math.sin((f + k * 13) / 6) * 6;
  return (
    <g>
      <T x={BX} y={540} size={260} scale={pop(f, cue("why", "why would"))} rotate={wob(0) * 0.4}>WHY?!</T>
      {[0, 1, 2].map((k) => (
        <T key={k} x={1000 + k * 330} y={300 + (k % 2) * 380} size={90} color={GOLD} rotate={wob(k + 1) * 2} opacity={appear(f, l.from + 4 + k * 6)}>?</T>
      ))}
    </g>
  );
}

const SERVICES: { label: string; phrase: string; icon: (x: number, y: number, f: number) => any }[] = [
  { label: "ROADS", phrase: "roads", icon: (x, y) => <Road x={x} y={y} s={0.9} /> },
  { label: "SCHOOLS", phrase: "Your school", icon: (x, y) => <School x={x} y={y} s={0.85} /> },
  { label: "FIREFIGHTERS", phrase: "Firefighters", icon: (x, y) => <FireTruck x={x} y={y} s={0.85} /> },
  { label: "HOSPITALS", phrase: "hospitals", icon: (x, y) => <Hospital x={x} y={y} s={0.75} /> },
  { label: "PARKS", phrase: "parks", icon: (x, y) => <Tree x={x} y={y} s={0.8} /> },
  { label: "CLEAN WATER", phrase: "clean water", icon: (x, y, f) => <Faucet x={x} y={y} s={0.85} t={f} /> },
];
function Services({ f }: { f: number }) {
  return (
    <g>
      <Write id="w-goes" f={f} at={L("services").from} x={920} y={190} w={880} h={100}>
        <T x={BX} y={262} size={60}>WHERE IT GOES</T>
      </Write>
      {SERVICES.map((s, i) => {
        const at = cue("services", s.phrase);
        if (f < at) return null;
        const x = 1080 + (i % 3) * 280, y = 390 + Math.floor(i / 3) * 210;
        const sc = pop(f, at);
        return (
          <g key={s.label} transform={`translate(${x},${y}) scale(${sc}) translate(${-x},${-y})`}>
            {s.icon(x, y, f)}
            <T x={x} y={y + 105} size={34} font="Bricolage Grotesque" weight={800}>{s.label}</T>
          </g>
        );
      })}
    </g>
  );
}

function Pool({ f }: { f: number }) {
  const l = L("pool");
  const alone = cue("pool", "alone");
  const crowd = cue("pool", "millions of people");
  const adds = cue("pool", "adds up");
  const crowdT = appear(f, crowd, 10);
  const v = ip(f, [adds, adds + 40], [0, 4.9], Easing.out(Easing.quad));
  const people = [];
  const coins = [];
  if (f >= crowd) {
    for (let i = 0; i < 9; i++) {
      const x = 960 + i * 100;
      const toss = Math.sin((f + i * 11) / 7);
      people.push(<Mini key={i} x={x} y={690} s={0.85} arm={0.6 + Math.max(0, toss) * 1.6} body={["#8C7A62", "#6E7A45", "#7A5232", "#4A4440"][i % 4]} hat={["#5C4A3A", "#3A3633", "#8E3B2E"][i % 3]} />);
      const p = ((f - crowd + i * 7) % 34) / 34;
      const cx = x + 14 + (BX - x - 14) * p;
      const cy = 610 - Math.sin(p * Math.PI) * 170 - p * 30;
      coins.push(<circle key={`c${i}`} cx={cx} cy={cy} r={11} fill={GOLD} stroke={INKP} strokeWidth={3} opacity={p < 0.92 ? 1 : 0} />);
    }
  }
  return (
    <g>
      {f < crowd + 6 ? (
        <g opacity={1 - crowdT}>
          <FireTruck x={1140} y={400} s={1.3} />
          <Highway x={1580} y={390} s={1.3} />
          {f >= alone ? <T x={BX} y={620} size={110} font="Anton" color={RED} weight={400} scale={pop(f, alone)}>ALONE? NO WAY.</T> : null}
          <T x={BX} y={262} size={52} opacity={appear(f, l.from)}>ONE PERSON</T>
        </g>
      ) : null}
      {f >= crowd ? (
        <g opacity={crowdT}>
          <T x={BX} y={258} size={44} font="Bricolage Grotesque" weight={800}>U.S. FEDERAL TAXES, PER YEAR</T>
          {/* the jar */}
          <path d={`M ${BX - 90} 420 L ${BX - 100} 560 Q ${BX} 600 ${BX + 100} 560 L ${BX + 90} 420 Z`} fill="#3D4A42" stroke={CHALK} strokeWidth={6} />
          <rect x={BX - 100} y={404} width={200} height={20} rx={6} fill="none" stroke={CHALK} strokeWidth={6} />
          <rect x={BX - 92} y={560 - ip(f, [crowd, adds + 40], [0, 110])} width={184} height={ip(f, [crowd, adds + 40], [0, 110])} fill={GOLD} opacity={0.8} />
          {coins}
          {people}
          {f >= adds ? (
            <T x={BX} y={380} size={96} font="Anton" color={GREEN} weight={400} scale={f > adds + 40 ? pop(f, adds + 40) * 0.08 + 0.92 : 1}>${v.toFixed(1)} TRILLION</T>
          ) : null}
          <T x={1800} y={725} size={22} anchor="end" font="Bricolage Grotesque" weight={500} opacity={0.8}>FY2024, U.S. Treasury</T>
        </g>
      ) : null}
    </g>
  );
}

function Group({ f }: { f: number }) {
  const l = L("group");
  const works = cue("group", "actually works");
  const n = 5;
  const blocks = ["#8E3B2E", "#6E7A45", "#C9A13B", "#5B7FA6", "#B9A276"];
  const labels = ["ROADS", "SCHOOLS", "SAFETY", "HEALTH", "PARKS"];
  return (
    <g>
      <Write id="w-group" f={f} at={l.from} x={920} y={190} w={880} h={100}>
        <T x={BX} y={262} size={66}>ONE BIG GROUP PROJECT</T>
      </Write>
      {Array.from({ length: n }).map((_, i) => {
        const at = l.from + 14 + i * Math.round((works - l.from - 18) / n);
        const x = 1010 + i * 150;
        const lift = ip(f, [at - 8, at], [0, 1]);
        const placed = f >= at;
        return (
          <g key={i}>
            <Mini x={x} y={690} s={0.85} arm={placed ? 0.4 : 2.6 * lift} body={["#8C7A62", "#6E7A45", "#7A5232", "#4A4440", "#8E3B2E"][i]} />
            {placed ? (
              <g transform={`translate(${x},${470}) scale(${pop(f, at)})`}>
                <rect x={-66} y={-70} width={132} height={140} rx={6} fill={blocks[i]} stroke={INKP} strokeWidth={4} />
                <T x={0} y={14} size={28} font="Bricolage Grotesque" color="#FFFDF6" weight={800}>{labels[i]}</T>
              </g>
            ) : null}
          </g>
        );
      })}
      {f >= works ? <Check x={1760} y={470} s={1.6 * pop(f, works)} /> : null}
    </g>
  );
}

function Lifetime({ f }: { f: number }) {
  const l = L("lifetime");
  const a = cue("lifetime", "forty-year");
  const b = cue("lifetime", "three hundred seventy-eight", 18);
  const p = ip(f, [a, b], [0, 1], Easing.in(Easing.quad));
  const year = Math.max(1, Math.ceil(p * 40));
  return (
    <g>
      <T x={BX} y={262} size={56}>TAXES OVER YOUR CAREER</T>
      <T x={1000} y={350} size={52} anchor="start" font="Anton" weight={400} color={GOLD}>YEAR {f >= a ? year : 1}</T>
      <T x={1740} y={350} size={52} anchor="end" font="Anton" weight={400} opacity={0.5}>YEAR 40</T>
      <rect x={1000} y={380} width={740} height={28} rx={14} fill="none" stroke={CHALK} strokeWidth={4} />
      <rect x={1004} y={384} width={732 * p} height={20} rx={10} fill={GOLD} />
      <T x={BX} y={580} size={170} font="Anton" weight={400} color={f >= b ? RED : CHALK} scale={f >= b ? pop(f, b) * 0.1 + 0.9 : 1}>{money(378240 * p)}</T>
      <T x={BX} y={680} size={30} font="Bricolage Grotesque" weight={600} opacity={0.85}>$788 a month × 12 months × 40 years (no raises)</T>
    </g>
  );
}

function Twist({ f }: { f: number }) {
  const what = cue("twist", "What happens");
  const dont = cue("twist", "don't pay");
  return (
    <g>
      {f >= what ? <T x={BX} y={360} size={88} opacity={appear(f, what)}>WHAT IF YOU</T> : null}
      {f >= dont ? <T x={BX} y={560} size={150} font="Anton" color={RED} weight={400} scale={interpolate(f, [dont, dont + 5, dont + 10], [2.2, 0.95, 1], clamp)}>DON'T PAY?</T> : null}
    </g>
  );
}

function Bill({ f }: { f: number }) {
  // runs across "penalty" and "cliff"
  const p0 = L("penalty");
  const start = cue("penalty", "one-thousand-dollar");
  const pen = cue("penalty", "Penalties");
  const stack = cue("penalty", "stacking");
  const intr = cue("penalty", "Interest");
  const end = p0.to + 10;
  const months = ip(f, [pen, end], [0, 12], Easing.linear);
  // estimate for a $1,000 bill not filed or paid: FTF 4.5%/mo (5 months max 22.5%) + FTP 0.5%/mo + ~7%/yr interest
  const m = months;
  const ftf = Math.min(m, 5) * 45;
  const ftp = m * 5;
  const interest = 1000 * (Math.pow(1 + 0.07 / 12, m) - 1);
  const due = f < start ? 0 : 1000 + ftf + ftp + interest;
  const overdue = cue("cliff", "scariest");
  return (
    <g>
      <Paper x={990} y={185} w={740} h={540} rotate={-1.5}>
        <T x={1360} y={252} size={50} color={INKP}>TAX BILL</T>
        <line x1={1020} y1={276} x2={1700} y2={276} stroke={INKP} strokeWidth={3} />
        <T x={1030} y={335} size={34} anchor="start" color={INKP} font="Bricolage Grotesque" weight={700}>AMOUNT DUE</T>
        <T x={1690} y={335} size={34} anchor="end" color={INKP} font="Bricolage Grotesque" weight={700}>MONTHS LATE: {Math.floor(months)}</T>
        {f >= start ? <T x={1360} y={470} size={140} font="Anton" color={f > pen ? STAMP : INKP} weight={400} scale={pop(f, start)}>{money(due)}</T> : null}
        {[
          { at: pen, t: "+ late-filing penalty" },
          { at: stack, t: "+ late-payment penalty" },
          { at: intr, t: "+ interest" },
        ].map((r, i) => (f >= r.at ? (
          <T key={i} x={1040 + i * 40} y={560 + i * 52} size={36} anchor="start" color={STAMP} font="Bricolage Grotesque" weight={800} opacity={appear(f, r.at)}>{r.t}</T>
        ) : null))}
        {f >= pen ? <path d={`M 1630 640 L 1630 ${640 - ip(f, [pen, end], [0, 150])}`} stroke={STAMP} strokeWidth={10} strokeLinecap="round" /> : null}
        {f >= pen ? <path d={`M 1608 ${520 - ip(f, [pen, end], [0, 30])} l 22 -30 l 22 30`} fill="none" stroke={STAMP} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={ip(f, [pen, pen + 20], [0, 1])} /> : null}
        <T x={1360} y={705} size={24} color={INKP} font="Bricolage Grotesque" weight={500}>Estimate: 12 months unfiled and unpaid (IRS rules)</T>
      </Paper>
      {f >= overdue ? (
        <g transform={`translate(1530,615) rotate(-12) scale(${0.7 * interpolate(f, [overdue, overdue + 4, overdue + 8], [2.4, 0.94, 1], clamp)})`} opacity={0.92}>
          <rect x={-250} y={-70} width={500} height={130} rx={10} fill="none" stroke={STAMP} strokeWidth={12} />
          <T x={0} y={34} size={110} font="Anton" color={STAMP} weight={400}>OVERDUE</T>
        </g>
      ) : null}
    </g>
  );
}

function TaxMeter({ f }: { f: number }) {
  const d0 = cue("deductions", "Federal income tax");
  if (f < d0 - 10) return null;
  const steps: [number, number][] = [
    [cue("deductions", "Federal income tax"), 330],
    [cue("deductions", "Social Security"), 588],
    [cue("deductions", "Medicare"), 648],
    [cue("deductions", "your state"), 788],
    [cue("salestax", "twenty-one sixty"), 789.6],
    [cue("lifetime", "forty-year"), 789.6],
  ];
  let v = 0;
  let prev = 0;
  for (const [at, val] of steps) {
    v = prev + (val - prev) * ip(f, [at + 4, at + 16], [0, 1]);
    if (f < at + 16) break;
    prev = val;
  }
  const la = cue("lifetime", "forty-year"), lb = cue("lifetime", "three hundred seventy-eight", 18);
  if (f >= la) v = 789.6 + (378240 - 789.6) * ip(f, [la, lb], [0, 1], Easing.in(Easing.quad));
  const twist = cue("twist", "don't pay");
  const unknown = f >= twist;
  const o = ip(f, [d0 - 10, d0], [0, 1]);
  return (
    <g opacity={o} transform="translate(1440,30)">
      <rect x={6} y={8} width={400} height={104} rx={12} fill="#000" opacity={0.25} />
      <rect x={0} y={0} width={400} height={104} rx={12} fill="#2F3B33" stroke={GOLD} strokeWidth={5} />
      <T x={20} y={36} size={24} anchor="start" font="Bricolage Grotesque" weight={800} color={GOLD}>TAX METER</T>
      <T x={384} y={36} size={22} anchor="end" font="Bricolage Grotesque" weight={600} color={CHALK}>{f >= la ? "lifetime" : "this month"}</T>
      {unknown ? (
        <T x={200} y={92} size={52} font="Anton" weight={400} color={RED} opacity={0.7 + 0.3 * Math.sin(f / 4)}>{`${money(378240)} + ???`}</T>
      ) : (
        <T x={200} y={92} size={54} font="Anton" weight={400} color={CHALK}>{money(v, v < 1000 && v % 1 ? 2 : 0)}</T>
      )}
    </g>
  );
}

function EndCard({ f }: { f: number }) {
  const a = L("cliff").to + 14;
  if (f < a) return null;
  const o = ip(f, [a, a + 12], [0, 1]);
  return (
    <g opacity={o}>
      <rect x={0} y={0} width={1920} height={1080} fill="#14100B" opacity={0.92} />
      <T x={960} y={470} size={200} font="Anton" weight={400} color={RED} scale={pop(f, a + 4) * 0.08 + 0.92}>PART 2</T>
      <T x={960} y={590} size={60} color={CHALK}>What really happens if you don't pay</T>
      <T x={960} y={680} size={40} font="Bricolage Grotesque" weight={600} color={GOLD}>Fine Print Money</T>
    </g>
  );
}

// ------------------------------------------------------------------ Sam's blocking
type Key = { at: number; x?: number; expr?: Expr; pose?: Pose; look?: number };
function keys(): Key[] {
  const k: Key[] = [
    { at: 0, x: -260, expr: "smug", pose: "rest", look: 0 },
    { at: 2, x: 470 },
    { at: cue("hook", "almost eight hundred"), pose: "point", look: 0.6, expr: "smug" },
    { at: cue("hook", "School taught"), pose: "open", expr: "happy", look: 0 },
    { at: cue("hook", "but never this"), pose: "shrug", expr: "skeptical" },
    { at: cue("hook", "little bro"), pose: "wave", expr: "happy" },
    { at: cue("hook", "where that money"), pose: "point", look: 0.6 },

    { at: L("define").from, pose: "present", expr: "happy", look: 0.4 },
    { at: cue("define", "what you earn"), pose: "point", look: 0.6 },
    { at: cue("define", "what you buy"), pose: "pointUp" },
    { at: cue("define", "Quick note"), pose: "count", expr: "serious", look: 0 },

    { at: L("salary").from - 4, x: 420, pose: "rest", expr: "happy", look: 0 },
    { at: L("salary").from + 30, pose: "count" },
    { at: cue("salary", "about four thousand"), pose: "point", look: 0.6 },
    { at: cue("salary", "Now watch"), pose: "pointUp", expr: "smug" },

    { at: L("deductions").from, pose: "point", expr: "serious", look: 0.6 },
    { at: cue("deductions", "Social Security"), pose: "pointUp" },
    { at: cue("deductions", "Medicare"), pose: "point" },
    { at: cue("deductions", "your state grabs"), pose: "shrug", expr: "skeptical", look: 0 },

    { at: L("takehome").from, pose: "open", expr: "serious", look: 0 },
    { at: cue("takehome", "take home"), pose: "point", look: 0.6 },
    { at: cue("takehome", "gone"), pose: "cheeks", expr: "shocked", look: 0 },
    { at: cue("takehome", "Every single"), pose: "count", expr: "worried" },

    { at: L("salestax").from - 4, x: 500, pose: "rest", expr: "smug" },
    { at: cue("salestax", "Buy a"), pose: "present", look: 0.5 },
    { at: cue("salestax", "twenty-one sixty"), pose: "point", look: 0.6, expr: "smug" },

    { at: L("why").from - 10, x: 640, pose: "rest", expr: "skeptical", look: 0 },
    { at: L("why").from + 12, pose: "shrug" },

    { at: L("services").from - 4, x: 430, pose: "rest", expr: "happy" },
    { at: cue("services", "roads"), pose: "point", look: 0.6 },
    { at: cue("services", "Your school"), pose: "pointUp" },
    { at: cue("services", "Firefighters"), pose: "point" },
    { at: cue("services", "hospitals"), pose: "open", look: 0 },
    { at: cue("services", "clean water"), pose: "point", look: 0.6 },

    { at: L("pool").from, pose: "think", expr: "serious", look: 0.2 },
    { at: cue("pool", "alone"), pose: "shrug", expr: "skeptical", look: 0 },
    { at: cue("pool", "millions of people"), pose: "open", expr: "happy" },
    { at: cue("pool", "nearly five trillion"), pose: "point", expr: "shocked", look: 0.6 },

    { at: L("group").from, pose: "present", expr: "happy", look: 0.4 },
    { at: cue("group", "actually works"), pose: "thumbs", look: 0 },

    { at: L("lifetime").from - 4, x: 440, pose: "count", expr: "serious", look: 0 },
    { at: cue("lifetime", "At this pace"), pose: "point", look: 0.6 },
    { at: cue("lifetime", "three hundred seventy-eight"), pose: "cheeks", expr: "shocked", look: 0 },

    { at: L("twist").from - 6, x: 700, pose: "rest", expr: "serious", look: 0 },
    { at: cue("twist", "What happens"), pose: "count" },
    { at: cue("twist", "don't pay"), pose: "point", look: 0.7, expr: "serious" },

    { at: L("penalty").from, x: 470, pose: "rest", expr: "worried", look: 0 },
    { at: cue("penalty", "Penalties"), pose: "point", look: 0.6 },
    { at: cue("penalty", "Interest"), pose: "pointUp" },
    { at: cue("penalty", "keeps climbing"), pose: "cheeks", expr: "worried", look: 0 },

    { at: L("cliff").from, pose: "open", expr: "serious", look: 0 },
    { at: cue("cliff", "scariest"), pose: "count", expr: "worried" },
    { at: cue("cliff", "part two"), pose: "point", expr: "smug", look: 0.5 },
  ];
  return k.sort((a, b) => a.at - b.at);
}
const KEYS = keys();
const SPEED = 8; // px a frame while walking

function samAt(f: number) {
  let x = -260, expr: Expr = "smug", exprPrev: Expr = "smug", exprAt = -99;
  let pose: Pose = "rest", posePrev: Pose = "rest", poseAt = -99, look = 0, lookPrev = 0, lookAt = -99;
  let walkFrom = 0, walkTo = -260, walkAt = 0, walkDur = 0;
  let dist = 0;
  for (const k of KEYS) {
    if (k.at > f) break;
    if (k.x !== undefined) {
      // finish any walk in progress (position at k.at)
      const curX = walkDur ? walkFrom + (walkTo - walkFrom) * Math.min(1, (k.at - walkAt) / walkDur) : walkTo;
      dist += Math.abs(curX - walkFrom);
      walkFrom = curX; walkTo = k.x; walkAt = k.at; walkDur = Math.max(1, Math.abs(k.x - curX) / SPEED);
    }
    if (k.expr && k.expr !== expr) { exprPrev = expr; expr = k.expr; exprAt = k.at; }
    if (k.pose && k.pose !== pose) { posePrev = pose; pose = k.pose; poseAt = k.at; }
    if (k.look !== undefined && k.look !== look) { lookPrev = look; look = k.look; lookAt = k.at; }
  }
  const wt = walkDur ? Math.min(1, (f - walkAt) / walkDur) : 1;
  const xNow = walkFrom + (walkTo - walkFrom) * wt;
  const walking = walkDur > 1 && wt < 1 ? Math.min(1, (f - walkAt) / 4, (1 - wt) * walkDur / 4) : 0;
  const dir = walkTo >= walkFrom ? 1 : -1;
  const lookNow = lookPrev + (look - lookPrev) * Math.min(1, (f - lookAt) / 8);
  return {
    x: xNow,
    walking,
    walkPhase: (Math.abs(xNow - walkFrom) + dist) / 34,
    dir,
    expr, exprPrev, exprT: Math.min(1, (f - exprAt) / 6),
    pose, posePrev, poseT: Math.min(1, (f - poseAt) / 9),
    look: walking > 0.5 ? dir * 0.5 : lookNow,
  };
}

// ------------------------------------------------------------------ sound design
type Sfx = { at: number; name: string; gain: number };
function sfxList(): Sfx[] {
  const s: Sfx[] = [];
  const add = (at: number, name: string, gain = -8) => s.push({ at, name, gain });
  const ticks = (a: number, b: number, every: number, gain = -20) => { for (let t = a; t < b; t += every) add(t, "tick", gain); };
  // hook
  add(4, "whoosh", -10);
  add(cue("hook", "almost eight hundred"), "thud", -6);
  ticks(cue("hook", "almost eight hundred") + 4, cue("hook", "almost eight hundred") + 34, 3);
  add(cue("hook", "School taught") - 4, "whoosh", -12);
  add(cue("hook", "photosynthesis"), "pop", -10);
  add(cue("hook", "never this"), "pop", -10);
  add(L("hook").to - 50, "riser", -14);
  // define
  add(L("define").from - 6, "whoosh", -10);
  add(cue("define", "what you earn"), "pop", -10);
  add(cue("define", "what you buy"), "pop", -10);
  add(cue("define", "government"), "pop", -10);
  add(cue("define", "Quick note"), "click", -12);
  // salary
  add(L("salary").from - 6, "whoosh", -10);
  ticks(L("salary").from + 4, cue("salary", "fifty thousand") + 22, 3);
  add(cue("salary", "fifty thousand") + 22, "click", -8);
  add(cue("salary", "about four thousand"), "whoosh", -14);
  ticks(cue("salary", "about four thousand") + 6, cue("salary", "about four thousand") + 34, 3);
  add(cue("salary", "about four thousand") + 34, "ding", -10);
  // deductions
  add(L("deductions").from - 6, "whoosh", -10);
  for (const d of DEDUCTIONS) { add(cue("deductions", d.phrase), "click", -7); ticks(cue("deductions", d.phrase) + 4, cue("deductions", d.phrase) + 16, 3, -22); }
  // take home
  add(cue("takehome", "take home"), "click", -9);
  ticks(cue("takehome", "take home"), cue("takehome", "take home") + 26, 3);
  add(cue("takehome", "gone"), "thud", -4);
  // sales tax
  add(L("salestax").from - 6, "whoosh", -10);
  add(cue("salestax", "twenty-dollar hoodie"), "pop", -10);
  add(cue("salestax", "eight percent"), "click", -9);
  add(cue("salestax", "twenty-one sixty"), "ding", -7);
  // why
  add(L("why").from - 6, "whoosh", -8);
  add(cue("why", "why would"), "pop", -6);
  // services
  add(L("services").from - 6, "whoosh", -10);
  for (const sv of SERVICES) add(cue("services", sv.phrase), "pop", -9);
  // pool
  add(L("pool").from - 6, "whoosh", -10);
  add(cue("pool", "alone"), "thud", -10);
  for (let i = 0; i < 6; i++) add(cue("pool", "millions of people") + 8 + i * 9, "coin", -16);
  ticks(cue("pool", "adds up"), cue("pool", "adds up") + 40, 3);
  add(cue("pool", "adds up") + 40, "ding", -9);
  // group
  add(L("group").from - 6, "whoosh", -10);
  const gl = L("group"), works = cue("group", "actually works");
  for (let i = 0; i < 5; i++) add(gl.from + 14 + i * Math.round((works - gl.from - 18) / 5), "pop", -11);
  add(works, "ding", -9);
  // lifetime
  add(L("lifetime").from - 6, "whoosh", -10);
  const la = cue("lifetime", "forty-year"), lb = cue("lifetime", "three hundred seventy-eight", 18);
  add(lb - 66, "riser", -12);
  let t = la; let gap = 6;
  while (t < lb) { add(Math.round(t), "tick", -19); t += gap; gap = Math.max(2, gap * 0.94); }
  add(lb, "thud", -3);
  // twist
  add(cue("twist", "don't pay") - 66, "riser", -11);
  add(cue("twist", "don't pay"), "thud", -2);
  // penalty
  add(L("penalty").from - 6, "whoosh", -10);
  add(cue("penalty", "one-thousand-dollar"), "click", -8);
  add(cue("penalty", "Penalties"), "pop", -9);
  add(cue("penalty", "stacking"), "pop", -9);
  add(cue("penalty", "Interest"), "pop", -9);
  ticks(cue("penalty", "Penalties"), L("penalty").to + 10, 5, -20);
  // cliff
  add(cue("cliff", "scariest"), "stamp", -3);
  add(L("cliff").to + 10, "riser", -12);
  add(L("cliff").to + 14 + 4, "thud", -3);
  return s.sort((a, b) => a.at - b.at);
}
const SFX = sfxList();

// ------------------------------------------------------------------ the film
function Film() {
  const f = useCurrentFrame();
  const s = samAt(f);
  const twistA = L("twist").from - 6, twistB = L("penalty").from;
  const dim = ip(f, [twistA, twistA + 14], [0, 0.5]) * (1 - ip(f, [twistB - 6, twistB + 10], [0, 1])) + ip(f, [L("cliff").from, L("cliff").to], [0, 0.25]);

  // camera: a slow push per section, alternating; a hard push onto Sam's face for the twist
  const cur = TIMELINE.lines.findIndex((l, i) => f < (TIMELINE.lines[i + 1]?.from ?? 1e9) - 8);
  const sec = section(TIMELINE.lines[Math.max(0, cur)].id as LineId);
  const prog = ip(f, [sec.a, sec.b], [0, 1], Easing.linear);
  let zoom = cur % 2 ? 1.05 - 0.05 * prog : 1 + 0.05 * prog;
  let fx = 960, fy = 540;
  const tw = ip(f, [twistA, twistA + 20], [0, 1], Easing.inOut(Easing.cubic)) * (1 - ip(f, [twistB - 4, twistB + 8], [0, 1], Easing.inOut(Easing.cubic)));
  zoom = zoom * (1 - tw) + 1.18 * tw;
  fx = fx * (1 - tw) + 1100 * tw;
  fy = fy * (1 - tw) + 470 * tw;
  const shake = SFX.filter((e) => e.name === "thud" && f >= e.at && f < e.at + 8).length ? Math.sin(f * 2.3) * 6 * (1 - ((f % 8) / 8)) : 0;

  return (
    <AbsoluteFill style={{ background: "#1A1209" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <g transform={`translate(${fx + shake},${fy}) scale(${zoom}) translate(${-fx},${-fy})`}>
          <Room dim={dim} lampPulse={Math.sin(f / 30)} />
          {/* twist spotlight on Sam */}
          {dim > 0.05 ? <ellipse cx={s.x} cy={640} rx={300} ry={460} fill="#FFD58A" opacity={dim * 0.22} /> : null}
          <Section id="hook" f={f}>{(ff) => <Hook f={ff} />}</Section>
          <Section id="define" f={f}>{(ff) => <Define f={ff} />}</Section>
          <Section id="salary" f={f}>{(ff) => <Salary f={ff} />}</Section>
          <Section id="deductions" f={f}>{(ff) => <Deductions f={ff} />}</Section>
          <Section id="takehome" f={f}>{(ff) => <TakeHome f={ff} />}</Section>
          <Section id="salestax" f={f}>{(ff) => <SalesTax f={ff} />}</Section>
          <Section id="why" f={f}>{(ff) => <Why f={ff} />}</Section>
          <Section id="services" f={f}>{(ff) => <Services f={ff} />}</Section>
          <Section id="pool" f={f}>{(ff) => <Pool f={ff} />}</Section>
          <Section id="group" f={f}>{(ff) => <Group f={ff} />}</Section>
          <Section id="lifetime" f={f}>{(ff) => <Lifetime f={ff} />}</Section>
          <Section id="twist" f={f}>{(ff) => <Twist f={ff} />}</Section>
          {f >= section("penalty").a - 2 ? <g opacity={ip(f, [section("penalty").a, section("penalty").a + 10], [0, 1])}><Bill f={f} /></g> : null}
          <Disclaimer f={f} />
          <Sam
            x={s.x} y={990} scale={0.9}
            expr={s.expr} exprPrev={s.exprPrev} exprT={s.exprT}
            pose={s.pose} posePrev={s.posePrev} poseT={s.poseT}
            mouth={MOUTH[f] ?? 0}
            walkPhase={s.walkPhase} walking={s.walking} dir={s.dir} look={s.look}
            blink={f % 97 < 4 || (f + 43) % 151 < 3}
            frame={f}
          />
        </g>
        <TaxMeter f={f} />
        <EndCard f={f} />
      </svg>

      {/* sound: voice, music (warm lo-fi bed, then a tension pulse for the twist), effects */}
      <Sequence from={0} layout="none"><Audio src={staticFile("audio/voice.wav")} gainDb={0} /></Sequence>
      <Sequence from={0} durationInFrames={twistA + 10} layout="none"><Audio src={staticFile("audio/music_main.wav")} gainDb={-24} fadeIn={0.6} fadeOut={0.5} /></Sequence>
      <Sequence from={twistA - 4} durationInFrames={TOTAL - twistA + 4} layout="none"><Audio src={staticFile("audio/music_tension.wav")} gainDb={-17} fadeIn={0.4} fadeOut={1.2} /></Sequence>
      {SFX.map((e, i) => (
        <Sequence key={i} from={e.at} layout="none"><Audio src={staticFile(`audio/sfx_${e.name}.wav`)} gainDb={e.gain} /></Sequence>
      ))}
      <Mix lufs={-14} />
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <Composition id="ep01-taxes" width={1920} height={1080} fps={FPS} durationInFrames={TOTAL} component={Film} />
));
