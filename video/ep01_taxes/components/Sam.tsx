// Sam, adult (late 20s): the Fine Print Money stick-limb style — big cream head, bold ink outline,
// newsboy cap, olive vest over a white collar, brown trousers, satchel. Clear face: white eyes with pupils,
// thick acting eyebrows, a small nose, and a mouth that opens with the voice (lip sync).

export const INK = "#1A1612";
const CREAM = "#F7F3EA";
const CAP = "#4A4440";
const CAP_DARK = "#3A3532";
const HAIR = "#6B4428";
const VEST = "#6E7A45";
const VEST_DARK = "#5C6738";
const TROUSER = "#6B5136";
const SATCHEL = "#C9B48C";
const SHOE = "#2B2826";

export type Expr = "neutral" | "happy" | "smug" | "shocked" | "skeptical" | "worried" | "serious";
export type Pose =
  | "rest" | "point" | "pointUp" | "open" | "shrug" | "wave" | "count" | "cheeks" | "think" | "present" | "thumbs";

type Face = {
  browY: number; // brow height (negative = up)
  browInL: number; browOutL: number; // per-brow inner/outer extra drop (+ = lower)
  browInR: number; browOutR: number;
  eyeH: number; // sclera height scale
  lidL: number; lidR: number; // upper lid cover 0..1
  pupil: number; // pupil radius
  smile: number; // -1 frown .. 1 smile
  smirk: number; // one-sided corner lift
  mouthW: number;
  minOpen: number;
  teeth: number;
};

export const FACES: Record<Expr, Face> = {
  neutral:   { browY: -64, browInL: 0, browOutL: 0, browInR: 0, browOutR: 0, eyeH: 1, lidL: 0.12, lidR: 0.12, pupil: 10, smile: 0.35, smirk: 0, mouthW: 30, minOpen: 0, teeth: 0 },
  happy:     { browY: -72, browInL: -2, browOutL: 6, browInR: -2, browOutR: 6, eyeH: 0.95, lidL: 0.05, lidR: 0.05, pupil: 10, smile: 1, smirk: 0, mouthW: 38, minOpen: 0.15, teeth: 1 },
  smug:      { browY: -60, browInL: 10, browOutL: -6, browInR: 10, browOutR: -6, eyeH: 0.9, lidL: 0.42, lidR: 0.42, pupil: 9, smile: 0.45, smirk: 1, mouthW: 32, minOpen: 0, teeth: 0.6 },
  shocked:   { browY: -76, browInL: -6, browOutL: 4, browInR: -6, browOutR: 4, eyeH: 1.28, lidL: 0, lidR: 0, pupil: 7, smile: -0.1, smirk: 0, mouthW: 24, minOpen: 0.55, teeth: 0 },
  skeptical: { browY: -64, browInL: -14, browOutL: -18, browInR: 8, browOutR: 2, eyeH: 0.95, lidL: 0.1, lidR: 0.45, pupil: 9, smile: -0.15, smirk: -0.8, mouthW: 26, minOpen: 0, teeth: 0 },
  worried:   { browY: -66, browInL: -14, browOutL: 8, browInR: -14, browOutR: 8, eyeH: 1.05, lidL: 0.05, lidR: 0.05, pupil: 9, smile: -0.55, smirk: 0, mouthW: 28, minOpen: 0, teeth: 0 },
  serious:   { browY: -56, browInL: 8, browOutL: 0, browInR: 8, browOutR: 0, eyeH: 0.92, lidL: 0.3, lidR: 0.3, pupil: 9, smile: -0.05, smirk: 0, mouthW: 28, minOpen: 0, teeth: 0 },
};

// arm angles in degrees: [shoulder, elbow]; 0 = hanging down, 90 = straight out to the side, 180 = straight up,
// past 180 = up and across the body. L = screen-left arm, R = screen-right arm. hand: "mitt" | "point" | "palm" | "thumb"
type ArmPose = { L: [number, number]; R: [number, number]; handL?: string; handR?: string; lift?: number };
export const POSES: Record<Pose, ArmPose> = {
  rest:    { L: [10, 6], R: [10, 6] },
  point:   { L: [14, 10], R: [96, -6], handR: "point" },
  pointUp: { L: [14, 10], R: [140, 4], handR: "point" },
  open:    { L: [36, 118], R: [36, 118], handL: "palm", handR: "palm" },
  shrug:   { L: [62, 112], R: [62, 112], handL: "palm", handR: "palm", lift: 10 },
  wave:    { L: [14, 10], R: [128, 34], handR: "palm" },
  count:   { L: [14, 10], R: [44, 128], handR: "point" },
  cheeks:  { L: [118, 92], R: [118, 92], handL: "palm", handR: "palm", lift: 6 },
  think:   { L: [24, 150], R: [40, 192] },
  present: { L: [22, 18], R: [70, 36], handR: "palm" },
  thumbs:  { L: [14, 10], R: [38, 132], handR: "thumb" },
};

export type SamState = {
  x: number; y: number; scale: number;
  expr: Expr; exprPrev: Expr; exprT: number; // 0..1 blend from prev to expr
  pose: Pose; posePrev: Pose; poseT: number;
  mouth: number; // 0..1 openness from the voice
  walkPhase: number; walking: number; // walking 0..1 blend
  dir: number; // -1 walking left, 1 walking right
  look: number; // -1..1 pupils/face turn
  blink: boolean;
  frame: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (d: number) => (d * Math.PI) / 180;

function blendFace(a: Face, b: Face, t: number): Face {
  const o: any = {};
  for (const k of Object.keys(a) as (keyof Face)[]) o[k] = lerp(a[k], b[k], t);
  return o as Face;
}

function armPoints(side: -1 | 1, sx: number, sy: number, a1: number, a2: number) {
  const L1 = 112, L2 = 104;
  const t1 = rad(a1), t2 = rad(a1 + a2);
  const ex = sx + side * Math.sin(t1) * L1, ey = sy + Math.cos(t1) * L1;
  const hx = ex + side * Math.sin(t2) * L2, hy = ey + Math.cos(t2) * L2;
  return { ex, ey, hx, hy, dirx: side * Math.sin(t2), diry: Math.cos(t2) };
}

function Hand({ x, y, kind, dirx, diry, side }: { x: number; y: number; kind?: string; dirx: number; diry: number; side: number }) {
  const ang = (Math.atan2(diry, dirx) * 180) / Math.PI;
  if (kind === "point") {
    return (
      <g transform={`translate(${x},${y}) rotate(${ang})`}>
        <rect x={6} y={-8} width={40} height={16} rx={8} fill={CREAM} stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={0} r={21} fill={CREAM} stroke={INK} strokeWidth={6} />
        <path d={`M -4 ${side * -2} q 6 ${-14 * side} 16 ${-10 * side}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "thumb") {
    return (
      <g transform={`translate(${x},${y})`}>
        <rect x={-8} y={-50} width={17} height={36} rx={8.5} fill={CREAM} stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={0} r={22} fill={CREAM} stroke={INK} strokeWidth={6} />
        <path d="M -12 -4 h 22 M -12 6 h 22" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  }
  // mitt / palm: rounded mitten with a separate thumb
  const r = kind === "palm" ? 23 : 21;
  return (
    <g transform={`translate(${x},${y}) rotate(${ang - 90})`}>
      <ellipse cx={side * -16} cy={-2} rx={9} ry={13} transform={`rotate(${side * 35} ${side * -16} -2)`} fill={CREAM} stroke={INK} strokeWidth={5} />
      <circle cx={0} cy={4} r={r} fill={CREAM} stroke={INK} strokeWidth={6} />
      {kind === "palm" ? <path d="M -8 18 v 8 M 2 20 v 8 M 11 16 v 8" stroke={INK} strokeWidth={3} strokeLinecap="round" /> : null}
    </g>
  );
}

export function Sam(s: SamState) {
  const face = blendFace(FACES[s.exprPrev], FACES[s.expr], s.exprT);
  const pa = POSES[s.posePrev], pb = POSES[s.pose];
  const t = s.poseT;
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const f = s.frame;
  const w = s.walking;

  // walk cycle
  const ph = s.walkPhase;
  const bob = -Math.abs(Math.cos(ph)) * 10 * w;
  const breath = Math.sin(f / 22) * 2.2 * (1 - w);
  const lift = lerp(pa.lift ?? 0, pb.lift ?? 0, ease);
  const sway = Math.sin(f / 41) * 1.2 * (1 - w) + s.dir * 3 * w;

  // arms: pose blend, plus a swing while walking
  const swing = Math.sin(ph) * 22 * w;
  let aL: [number, number] = [lerp(pa.L[0], pb.L[0], ease), lerp(pa.L[1], pb.L[1], ease)];
  let aR: [number, number] = [lerp(pa.R[0], pb.R[0], ease), lerp(pa.R[1], pb.R[1], ease)];
  const restish = (p: Pose) => p === "rest";
  if (restish(s.pose)) {
    aL = [aL[0] + swing * 0.6, aL[1] + Math.max(0, swing) * 0.6];
    aR = [aR[0] - swing * 0.6, aR[1] + Math.max(0, -swing) * 0.6];
  }
  // talking hands: a little life in the arms while the voice is going
  const talk = s.mouth * (1 - w);
  aL = [aL[0] + Math.sin(f / 7) * 3 * talk, aL[1] + Math.sin(f / 9) * 6 * talk];
  aR = [aR[0] + Math.sin(f / 8 + 1) * 3 * talk, aR[1] + Math.sin(f / 10 + 2) * 6 * talk];
  const handL = ease < 0.5 ? pa.handL : pb.handL;
  const handR = ease < 0.5 ? pa.handR : pb.handR;

  // legs
  const hipY = -262;
  const legs = [-1, 1].map((side) => {
    const phase = ph + (side === 1 ? Math.PI : 0);
    const thigh = Math.sin(phase) * 20 * w;
    const knee = Math.max(0, -Math.cos(phase)) * 22 * w;
    const hx = side * 26, hy = hipY;
    const T = 132, S = 128;
    const kx = hx + s.dir * Math.sin(rad(thigh)) * T, ky = hy + Math.cos(rad(thigh)) * T;
    const sa = thigh - knee * (s.dir >= 0 ? 1 : 1);
    const fx = kx + s.dir * Math.sin(rad(sa)) * S, fy = ky + Math.cos(rad(sa)) * S;
    return { hx, hy, kx, ky, fx, fy: Math.min(fy, 6), side };
  });

  const shoulderY = -520 - lift;
  const headY = -642 + breath * 0.6 - lift * 0.8 - s.mouth * 3;
  const tilt = Math.sin(f / 23) * 2 * s.mouth + s.look * 3;
  const look = s.look;

  // face geometry
  const blink = s.blink && s.expr !== "shocked";
  const eyeRy = 24 * face.eyeH;
  const eyeRx = 20 * (face.eyeH > 1.1 ? 1.12 : 1);
  const fx = look * 14; // face shift for turning

  const eye = (cx: number, lid: number) => {
    if (blink) return <path d={`M ${cx - 20} 0 q 20 10 40 0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    const px = cx + look * 8, py = 3 + (s.expr === "worried" ? -3 : 0);
    const lidY = -eyeRy + lid * eyeRy * 2;
    return (
      <g>
        <ellipse cx={cx} cy={0} rx={eyeRx} ry={eyeRy} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
        <circle cx={px} cy={py} r={face.pupil} fill={INK} />
        <circle cx={px + 3.5} cy={py - 4} r={2.8} fill="#FFFFFF" />
        {lid > 0.04 ? (
          <path d={`M ${cx - eyeRx - 2} ${lidY} L ${cx + eyeRx + 2} ${lidY} L ${cx + eyeRx + 2} ${-eyeRy - 4} L ${cx - eyeRx - 2} ${-eyeRy - 4} Z`} fill={CREAM} />
        ) : null}
        {lid > 0.04 ? <path d={`M ${cx - eyeRx} ${lidY} L ${cx + eyeRx} ${lidY}`} stroke={INK} strokeWidth={5} strokeLinecap="round" /> : null}
      </g>
    );
  };

  const brow = (cx: number, side: -1 | 1, din: number, dout: number) => {
    const inner = cx - side * 22, outer = cx + side * 24;
    return <path d={`M ${inner} ${face.browY + din} Q ${cx} ${face.browY - 6 + (din + dout) / 2} ${outer} ${face.browY + dout}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />;
  };

  // mouth
  const open = Math.max(face.minOpen, s.mouth) ;
  const mw = face.mouthW + open * 4;
  const sm = face.smile;
  const lc = -face.smirk * 6 - sm * 6; // left corner y
  const rc = face.smirk * -14 - sm * 6; // right corner y (smirk lifts right)
  const mouth = (() => {
    if (open < 0.07) {
      const mid = sm * 14;
      if (sm < -0.4) // worried: slightly wavy
        return <path d={`M ${-mw} ${4 - lc * 0} q ${mw / 2} ${-8} ${mw} 0 q ${mw / 2} 8 ${mw} 0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
      return <path d={`M ${-mw} ${lc + 6} Q 0 ${mid + 8} ${mw} ${rc + 6}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    }
    const h = 6 + open * 36;
    const top = sm * 6;
    const d = `M ${-mw} ${lc + 4} Q 0 ${top - 2} ${mw} ${rc + 4} Q ${mw * 0.7} ${h + 6} 0 ${h + 8 + sm * 6} Q ${-mw * 0.7} ${h + 6} ${-mw} ${lc + 4} Z`;
    return (
      <g>
        <clipPath id="mouthclip"><path d={d} /></clipPath>
        <path d={d} fill="#4A1C18" />
        <g clipPath="url(#mouthclip)">
          {face.teeth > 0.3 ? <rect x={-mw} y={top - 6} width={mw * 2} height={9 + open * 4} fill="#FFFFFF" /> : null}
          <ellipse cx={0} cy={h + 8} rx={mw * 0.55} ry={8 + open * 8} fill="#D46A66" />
        </g>
        <path d={d} fill="none" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      </g>
    );
  })();

  const shL = { x: -74, y: shoulderY + 14 }, shR = { x: 74, y: shoulderY + 14 };
  const armL = armPoints(-1, shL.x, shL.y, aL[0], aL[1]);
  const armR = armPoints(1, shR.x, shR.y, aR[0], aR[1]);

  return (
    <g transform={`translate(${s.x},${s.y}) scale(${s.scale})`}>
      {/* ground shadow */}
      <ellipse cx={0} cy={10} rx={130 - w * 10} ry={18} fill="#000" opacity={0.18} />
      <g transform={`translate(0,${bob}) rotate(${sway} 0 -300)`}>
        {/* legs: trouser thigh + stick shin */}
        {legs.map((l) => (
          <g key={l.side}>
            <line x1={l.kx} y1={l.ky} x2={l.fx} y2={l.fy - 8} stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <ellipse cx={l.fx + s.dir * 12 + (w < 0.5 ? l.side * 10 : 0)} cy={l.fy} rx={30} ry={15} fill={SHOE} stroke={INK} strokeWidth={4} />
            <line x1={l.hx} y1={l.hy} x2={l.kx} y2={l.ky} stroke={INK} strokeWidth={42} strokeLinecap="round" />
            <line x1={l.hx} y1={l.hy} x2={l.kx} y2={l.ky} stroke={TROUSER} strokeWidth={31} strokeLinecap="round" />
          </g>
        ))}
        {/* pelvis / trousers */}
        <path d={`M -64 ${hipY - 70} L 64 ${hipY - 70} L 60 ${hipY + 14} Q 0 ${hipY + 24} -60 ${hipY + 14} Z`} fill={TROUSER} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M -62 ${hipY - 60} L 62 ${hipY - 60}`} stroke="#3E2C1C" strokeWidth={9} />
        <rect x={-10} y={hipY - 66} width={20} height={13} rx={3} fill="#C9A13B" stroke={INK} strokeWidth={3} />

        {/* torso: white shirt + olive V-neck vest */}
        <g transform={`translate(0,${breath - lift})`}>
          <path d={`M -80 ${shoulderY + 20 + lift} Q -84 -420 -66 ${hipY - 58} L 66 ${hipY - 58} Q 84 -420 80 ${shoulderY + 20 + lift} Q 0 ${shoulderY - 6 + lift} -80 ${shoulderY + 20 + lift} Z`} fill={VEST} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          {/* knit ribs */}
          {[-48, -24, 0, 24, 48].map((x) => (
            <line key={x} x1={x} y1={hipY - 70} x2={x} y2={hipY - 60} stroke={VEST_DARK} strokeWidth={3} />
          ))}
          {/* V neck showing shirt */}
          <path d={`M -34 ${shoulderY + 8 + lift} L 0 ${shoulderY + 72 + lift} L 34 ${shoulderY + 8 + lift} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {/* collar points */}
          <path d={`M -2 ${shoulderY + 10 + lift} L -30 ${shoulderY + 4 + lift} L -14 ${shoulderY + 34 + lift} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          <path d={`M 2 ${shoulderY + 10 + lift} L 30 ${shoulderY + 4 + lift} L 14 ${shoulderY + 34 + lift} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          {/* satchel strap: Sam's right shoulder (screen-left) to the bag on his left hip (screen-right) */}
          <path d={`M -60 ${shoulderY + 18 + lift} L 70 ${hipY - 40}`} stroke={INK} strokeWidth={17} strokeLinecap="round" />
          <path d={`M -60 ${shoulderY + 18 + lift} L 70 ${hipY - 40}`} stroke={SATCHEL} strokeWidth={10} strokeLinecap="round" />
        </g>
        {/* satchel bag */}
        <g transform={`translate(78,${hipY - 30})`}>
          <rect x={-34} y={-6} width={70} height={58} rx={9} fill={SATCHEL} stroke={INK} strokeWidth={5.5} />
          <path d="M -34 6 Q 1 30 36 6 L 36 -6 L -34 -6 Z" fill="#B9A276" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          <rect x={-4} y={14} width={10} height={9} rx={2} fill="#7A5232" stroke={INK} strokeWidth={2.5} />
        </g>

        {/* head */}
        <g transform={`translate(0,${headY}) rotate(${tilt})`}>
          {/* neck */}
          <rect x={-16} y={84} width={32} height={40} fill={CREAM} stroke={INK} strokeWidth={5} />
          {/* ears */}
          <ellipse cx={-118 + fx * 0.3} cy={8} rx={15} ry={22} fill={CREAM} stroke={INK} strokeWidth={5} />
          <ellipse cx={118 + fx * 0.3} cy={8} rx={15} ry={22} fill={CREAM} stroke={INK} strokeWidth={5} />
          {/* head shape */}
          <ellipse cx={0} cy={0} rx={122} ry={112} fill={CREAM} stroke={INK} strokeWidth={7} />
          {/* side hair under the cap */}
          <path d={`M -120 -40 q 4 34 14 46 l 8 -26 l 6 18 l 4 -40 Z`} fill={HAIR} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M 120 -40 q -4 34 -14 46 l -8 -26 l -6 18 l -4 -40 Z`} fill={HAIR} stroke={INK} strokeWidth={4} strokeLinejoin="round" />

          {/* face */}
          <g transform={`translate(${fx},16)`}>
            <g transform="translate(0,-14)">
              {eye(-44, face.lidL)}
              {eye(44, face.lidR)}
            </g>
            {/* nose: small, clean */}
            <path d={`M ${4 + look * 6} 12 q 14 18 -2 26`} fill="none" stroke={INK} strokeWidth={5.5} strokeLinecap="round" />
            <g transform="translate(0,58)">{mouth}</g>
            {s.expr === "worried" && s.exprT > 0.8 ? (
              <path d="M 132 -46 q 12 18 0 26 q -12 -8 0 -26 Z" fill="#8FC7E8" stroke={INK} strokeWidth={3.5} />
            ) : null}
          </g>

          {/* newsboy cap */}
          <g transform="translate(0,-30)">
            <path d={`M -128 -40 Q -140 -128 -20 -138 Q 118 -146 132 -50 Q 70 -62 0 -60 Q -70 -60 -128 -40 Z`} fill={CAP} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
            <path d="M -60 -118 Q -10 -96 0 -60 M 54 -124 Q 20 -96 6 -60" fill="none" stroke={CAP_DARK} strokeWidth={4} />
            <path d={`M -96 -50 Q 0 -78 104 -52 Q 112 -30 96 -26 Q 0 -44 -90 -28 Q -106 -32 -96 -50 Z`} fill={CAP_DARK} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <circle cx={4} cy={-140} r={10} fill={CAP} stroke={INK} strokeWidth={5} />
            {/* fringe peeking under the brim */}
            <path d="M -70 -27 l 10 18 l 8 -16 l 10 16 l 8 -17 Z" fill={HAIR} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          </g>
          {/* eyebrows last, so they always read over the brim */}
          <g transform={`translate(${fx},16)`}>
            {brow(-44, -1, face.browInL, face.browOutL)}
            {brow(44, 1, face.browInR, face.browOutR)}
          </g>
        </g>
        {/* arms (over the head, so hands can reach the face) */}
        {[{ a: armL, sh: shL, hand: handL, side: -1 }, { a: armR, sh: shR, hand: handR, side: 1 }].map(({ a, sh, hand, side }) => (
          <g key={side}>
            <path d={`M ${sh.x} ${sh.y + breath - lift} L ${a.ex} ${a.ey} L ${a.hx} ${a.hy}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <Hand x={a.hx} y={a.hy} kind={hand} dirx={a.dirx} diry={a.diry} side={side} />
          </g>
        ))}

      </g>
    </g>
  );
}