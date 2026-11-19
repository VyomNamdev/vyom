// Paycheck to Plenty — 30 s test: Sam shows his little brother how to deposit cash at a bank.
// Sam is the owner's own artwork, cut into a jointed puppet (tools/puppet.py); every pose below is
// computed from the frame, raea composites the bank, the cast and the text, and renders with the voice.
import { AbsoluteFill, Audio, Composition, Img, registerRoot, staticFile, useCurrentFrame } from "raea";
import { HEADS, LAYOUT, MOUTH, RIG } from "./data";

const FPS = 30;
const N = 900;

// ---------------- timeline (seconds) ----------------
const S2 = 4.3, S3 = 12.7, S4 = 17.4, S5 = 25.4;
const SAM_SCALE = 0.553;
const DESK_NECK: Pt = [960, 290];
const COUNTER_X = 2440;
const NECK_TO_HIP = 349;           // world px between the front-view neck and the side-view hip line
const WALK_T0 = 13.0, WALK_T1 = 16.6;
const WRITE: [number, number] = [6.0, 11.9];
const NAME_T = 7.8, ACCT_T = 8.9, AMT_T = 11.1;
const GIVE: [number, number, number] = [18.3, 19.1, 19.4];
const COUNT: [number, number] = [20.0, 22.4];
const PLUS_T = 22.4;
const RECEIPT: [number, number, number] = [23.4, 24.3, 24.6];

type Pt = [number, number];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const ramp = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---------------- puppet maths (same as tools/sam_puppet.py) ----------------
function gpt(n: string, k: string): Pt { const r = RIG[n]; return [r.origin[0] + r[k][0], r.origin[1] + r[k][1]]; }
function vec(n: string): Pt { const a = gpt(n, "pivot"), b = gpt(n, "child"); return [b[0] - a[0], b[1] - a[1]]; }
function rot(v: Pt, deg: number): Pt {
  const c = Math.cos((deg * Math.PI) / 180), s = Math.sin((deg * Math.PI) / 180);
  return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c];
}
function chain(start: Pt, angle: number, v: Pt, scale: number, flip: boolean): Pt {
  const r = rot([v[0] * scale * (flip ? -1 : 1), v[1] * scale], flip ? -angle : angle);
  return [start[0] + r[0], start[1] + r[1]];
}

type Draw = { src: string; at: Pt; piv: Pt; w: number; h: number; s: number; a: number; flip?: boolean; dim?: number };
function part(name: string, at: Pt, angle: number, s: number, flip = false, dim?: number): Draw {
  const r = RIG[name];
  const file = dim ? `${name}_dark` : name;   // far leg: a pre-darkened copy (a CSS filter costs an atlas image)
  return { src: `sam/${file}.png`, at, piv: [r.pivot[0], r.pivot[1]], w: r.size[0], h: r.size[1], s, a: angle, flip };
}
function prop(name: string, at: Pt, angle: number, s: number, flip: boolean): Draw {
  // prop sprites: 400 x 400 px, the grip point at (200, 200)
  return { src: `sprites/prop_${name}.png`, at, piv: [200, 230], w: 400, h: 400, s: s * 0.9, a: angle, flip };
}

function arm(names: [string, string, string], root: Pt, up: number, fore: number, hand: number, s: number,
  flip: boolean, held?: string): Draw[] {
  const elbow = chain(root, up, vec(names[0]), s, flip);
  const a2 = up + fore;
  const wrist = chain(elbow, a2, vec(names[1]), s, flip);
  const a3 = a2 + hand;
  const out = [part(names[0], root, up, s, flip), part(names[2], wrist, a3, s, flip)];
  if (held) out.push(prop(held, wrist, a3, s, flip));
  out.push(part(names[1], elbow, a2, s, flip));
  return out;
}

type FrontPose = { lu: number; lf: number; lh: number; ru: number; rf: number; rh: number; head: string; heldL?: string; heldR?: string };
function samFront(neck: Pt, s: number, p: FrontPose): Draw[] {
  const ng = gpt("f_body", "neck");
  const g2c = (g: Pt): Pt => [neck[0] + (g[0] - ng[0]) * s, neck[1] + (g[1] - ng[1]) * s];
  const out: Draw[] = [part("f_body", g2c(gpt("f_body", "pivot")), 0, s)];
  const h = HEADS[p.head];
  out.push({ src: `sam/head_${p.head}.png`, at: [neck[0] + h.dx * s, neck[1] + h.dy * s], piv: [0, 0], w: h.w, h: h.h, s, a: 0 });
  out.push(...arm(["f_upper_l", "f_fore_l", "f_hand_l"], g2c(gpt("f_upper_l", "pivot")), p.lu, p.lf, p.lh, s, false, p.heldL));
  out.push(...arm(["f_upper_r", "f_fore_r", "f_hand_r"], g2c(gpt("f_upper_r", "pivot")), p.ru, p.rf, p.rh, s, false, p.heldR));
  if (Math.abs(p.lu) > 8) out.push(part("f_cap_l", g2c(gpt("f_cap_l", "pivot")), 0, s));
  if (Math.abs(p.ru) > 8) out.push(part("f_cap_r", g2c(gpt("f_cap_r", "pivot")), 0, s));
  return out;
}

type SidePose = { au: number; af: number; ah: number; legs: [Pt, Pt]; bob: number; held?: string };
function samSide(hip: Pt, s: number, p: SidePose): Draw[] {
  const flip = true; // the art faces left; Sam walks right
  const hg = gpt("s_body", "hip");
  const g2c = (g: Pt): Pt => [hip[0] - (g[0] - hg[0]) * s, hip[1] + (g[1] - hg[1]) * s + p.bob];
  const H = g2c(hg);
  const out: Draw[] = [];
  p.legs.forEach(([th, sh], i) => {
    const far = i === 0;
    const hp: Pt = [H[0] - (far ? 6 * s : 0), H[1]];
    const knee = chain(hp, th, vec("s_thigh"), s, flip);
    out.push(part("s_shin", knee, th + sh, s, flip, far ? 0.72 : undefined));
    out.push(part("s_thigh", hp, th, s, flip, far ? 0.72 : undefined));
  });
  out.push(part("s_body", g2c(gpt("s_body", "pivot")), 0, s, flip));
  out.push(part("s_head", g2c(gpt("s_head", "pivot")), 0, s, flip));
  out.push(...arm(["s_upper", "s_fore", "s_hand"], g2c(gpt("s_upper", "pivot")), p.au, p.af, p.ah, s, flip, p.held));
  if (Math.abs(p.au) > 8) out.push(part("s_cap", g2c(gpt("s_cap", "pivot")), 0, s, flip));
  return out;
}

function talkHead(frame: number, base = "talk"): string {
  const m = Math.max(MOUTH[frame] ?? 0, 0.6 * (MOUTH[frame - 1] ?? 0));
  if (base !== "talk") return base;
  return m < 0.16 ? "talk_0" : m < 0.45 ? "talk_1" : "talk_2";
}

// ---------------- Sam, every frame ----------------
function samAt(t: number, frame: number): Draw[] {
  const s = SAM_SCALE;
  if (t < S3) {
    const wave = ramp(t, 0.6, 1.1) * (1 - ramp(t, 3.5, 4.1));
    const write = ramp(t, 4.9, 5.8) * (1 - ramp(t, 12.0, 12.6));
    const scribble = t > WRITE[0] && t < WRITE[1] ? 1 : 0;
    return samFront(DESK_NECK, s, {
      lu: -14 * write, lf: (58 + 4 * Math.sin(t * 2 * Math.PI * 3) * scribble) * write,
      lh: (10 + 8 * Math.sin(t * 2 * Math.PI * 5) * scribble) * write, heldL: write > 0.5 ? "pen" : undefined,
      ru: 128 * wave, rf: (28 + 18 * Math.sin(t * 2 * Math.PI * 2.2)) * wave, rh: 10 * wave,
      head: talkHead(frame),
    });
  }
  if (t < S5) {
    const hipY = DESK_NECK[1] + NECK_TO_HIP;
    // walk: position eased, steps follow the distance travelled
    const u = ramp(t, WALK_T0, WALK_T1);
    const x = lerp(DESK_NECK[0], COUNTER_X, u);
    const stride = 260;
    const phi = ((x - DESK_NECK[0]) / stride) * Math.PI;
    const moving = ramp(t, WALK_T0, WALK_T0 + 0.35) * (1 - ramp(t, WALK_T1 - 0.35, WALK_T1));
    const leg = (ph: number): Pt => [-20 * Math.sin(ph) * moving, 34 * Math.max(0, Math.cos(ph)) * moving];
    let au = 18 * Math.sin(phi) * moving, af = -15;
    let held: string | undefined = "slipcash";
    const give = ramp(t, GIVE[0], GIVE[1]) * (1 - ramp(t, GIVE[2], GIVE[2] + 0.6));
    const take = ramp(t, RECEIPT[0] + 0.4, RECEIPT[1]) * (1 - ramp(t, RECEIPT[2], RECEIPT[2] + 0.6));
    const reach = Math.max(give, take);
    au = lerp(au, -45, reach);
    af = lerp(af, -15, reach);
    if (t >= GIVE[1]) held = t >= RECEIPT[1] ? "receipt" : undefined;
    return samSide([x, hipY], s, { au, af, ah: 0, legs: [leg(phi + Math.PI), leg(phi)], bob: -5 * Math.abs(Math.cos(phi)) * moving, held });
  }
  const up = ramp(t, 25.5, 26.1);
  const gesture = ramp(t, 28.0, 28.5);
  const end = t > 29.55 ? "happy" : "talk";
  return samFront([COUNTER_X, DESK_NECK[1]], s, {
    lu: -35 * gesture, lf: -35 * gesture, lh: 0, ru: 35 * up, rf: 110 * up, rh: 0,
    heldR: up > 0.3 ? "receipt" : undefined, head: talkHead(frame, end === "happy" ? "happy" : "talk"),
  });
}

// ---------------- camera ----------------
function cameraAt(t: number): { cx: number; cy: number; z: number } {
  if (t < S2) return { cx: 1150, cy: 520, z: lerp(1.0, 1.07, ramp(t, 0, S2)) };
  if (t < S3) return { cx: 1010, cy: 470, z: lerp(1.42, 1.5, ramp(t, S2, S3)) };
  if (t < S4) {
    const x = lerp(DESK_NECK[0], COUNTER_X, ramp(t, WALK_T0, WALK_T1));
    return { cx: Math.max(1100, Math.min(2600, x + 120)), cy: 560, z: 1.15 };
  }
  if (t < S5) return { cx: 2640, cy: 455, z: lerp(1.42, 1.5, ramp(t, S4, S5)) };
  return { cx: 2470, cy: 455, z: lerp(1.45, 1.55, ramp(t, S5, 30)) };
}

// ---------------- the cast (sprites rendered from tools/rig.py) ----------------
type Sprite = { name: string; at: Pt; ws: number };
function sprite(sp: Sprite) {
  const k = sp.ws / 2; // sprites are 2 px per rig unit, origin (skull top) at (700, 160), cropped to their box
  const [bx0, by0, bx1, by1] = LAYOUT.sprites[sp.name.split("_")[0]];
  return (
    <Img key={sp.name} src={staticFile(`sprites/${sp.name}.png`)} style={{
      position: "absolute", left: sp.at[0] + (bx0 - 700) * k, top: sp.at[1] + (by0 - 160) * k,
      width: (bx1 - bx0) * k, height: (by1 - by0) * k,
    }} />
  );
}
function tile(name: string) {
  const [x, y, w, h] = LAYOUT.tiles[name];
  return <Img src={staticFile(`layers/tile_${name}.png`)} style={{ position: "absolute", left: x, top: y, width: w, height: h }} />;
}

function drawPart(d: Draw, i: number) {
  return (
    <Img key={`p${i}`} src={staticFile(d.src)} style={{
      position: "absolute", left: d.at[0] - d.piv[0], top: d.at[1] - d.piv[1], width: d.w, height: d.h,
      transformOrigin: `${d.piv[0]}px ${d.piv[1]}px`,
      transform: `scale(${d.flip ? -d.s : d.s}, ${d.s}) rotate(${-d.a}deg)`,
    }} />
  );
}

// ---------------- on-screen text ----------------
const NAVY = "#203047", GOLD = "#E8B53E", GREEN = "#3FAE7E", PAPER = "#FFFDF8", INK = "#2A2320";
const font = "Inter";

function StepPill({ t, from, to, n, label }: { t: number; from: number; to: number; n: number; label: string }) {
  if (t < from || t > to) return null;
  const a = ramp(t, from, from + 0.35) * (1 - ramp(t, to - 0.3, to));
  return (
    <div style={{ position: "absolute", left: 64, top: 56, opacity: a, transform: `translateX(${(1 - a) * -40}px)`,
      display: "flex", alignItems: "center", gap: 18, background: NAVY, borderRadius: 40, padding: "16px 30px 16px 18px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
      <div style={{ background: GOLD, color: NAVY, fontFamily: font, fontWeight: 900, fontSize: 30, borderRadius: 28,
        padding: "6px 18px" }}>STEP {n}</div>
      <div style={{ color: "#FFFFFF", fontFamily: font, fontWeight: 800, fontSize: 38 }}>{label}</div>
    </div>
  );
}

function typed(text: string, t: number, at: number, cps = 18) {
  if (t < at) return "";
  return text.slice(0, Math.floor((t - at) * cps) + 1);
}

function SlipCard({ t }: { t: number }) {
  const from = 5.3, to = 12.6;
  if (t < from || t > to) return null;
  const a = ramp(t, from, from + 0.45) * (1 - ramp(t, to - 0.35, to));
  const row = (label: string, value: string, hi = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "3px solid #C9C2B4",
      padding: "10px 4px 6px", marginTop: 8 }}>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 22, color: "#8A8172", letterSpacing: 2 }}>{label}</div>
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 34, color: hi ? "#B07F12" : "#1F3A6B",
        background: hi ? "rgba(232,181,62,0.25)" : "transparent", borderRadius: 8, padding: "0 8px" }}>{value}</div>
    </div>
  );
  const amt = typed("$200.00", t, AMT_T, 14);
  return (
    <div style={{ position: "absolute", left: 1270, top: 170, width: 560, opacity: a,
      transform: `translateX(${(1 - a) * 120}px) rotate(${1.5 * (1 - a) + 1}deg)`, background: PAPER, borderRadius: 14,
      padding: "26px 34px 30px", boxShadow: "0 18px 40px rgba(0,0,0,0.3)", border: "3px solid #3B2C25" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: font, fontWeight: 900, fontSize: 40, color: INK }}>DEPOSIT SLIP</div>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 20, color: "#6E6658" }}>MAPLE CITY BANK</div>
      </div>
      {row("DATE", "11/19/2026")}
      {row("NAME", typed("Sam", t, NAME_T, 10))}
      {row("ACCOUNT NO.", typed("•••• 4821", t, ACCT_T, 16))}
      {row("CASH", amt)}
      {row("TOTAL", amt, t > AMT_T + 0.6)}
    </div>
  );
}

function Pop({ t, at, until, text, color, x, y, size }: { t: number; at: number; until: number; text: string; color: string; x: number; y: number; size: number }) {
  if (t < at || t > until) return null;
  const k = t - at;
  const sc = k < 0.25 ? lerp(0.4, 1.12, k / 0.25) : k < 0.4 ? lerp(1.12, 1, (k - 0.25) / 0.15) : 1;
  const a = 1 - ramp(t, until - 0.3, until);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${sc})`, opacity: a,
      fontFamily: font, fontWeight: 900, fontSize: size, color, textShadow: "0 4px 0 #3B2C25, 0 10px 24px rgba(0,0,0,0.35)" }}>{text}</div>
  );
}

function Badge({ t, at, until, text, bg, x, y }: { t: number; at: number; until: number; text: string; bg: string; x: number; y: number }) {
  if (t < at || t > until) return null;
  const a = ramp(t, at, at + 0.3) * (1 - ramp(t, until - 0.3, until));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: a, transform: `translateY(${(1 - a) * 24}px)`,
      background: bg, color: "#FFFFFF", fontFamily: font, fontWeight: 900, fontSize: 40, borderRadius: 18,
      padding: "16px 30px", border: "4px solid #3B2C25", boxShadow: "0 12px 30px rgba(0,0,0,0.3)" }}>{text}</div>
  );
}

// ---------------- the frame ----------------
function Film() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = cameraAt(t);
  const x0 = cam.cx - 960 / cam.z, y0 = cam.cy - 540 / cam.z;
  const loop = frame % 90;
  const pad = (n: number, w: number) => String(n).padStart(w, "0");
  const sam = samAt(t, frame);
  const onScreen = (x: number, r = 400) => x + r > x0 && x - r < x0 + 1920 / cam.z;
  const fade = Math.min(ramp(t, 0, 0.25), 1 - ramp(t, 29.7, 30));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 3840, height: 1080, transformOrigin: "0 0",
        transform: `scale(${cam.z}) translate(${-x0}px, ${-y0}px)`, opacity: fade }}>
        {x0 < 1920 && <Img src={staticFile("layers/tile_back_L.png")} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }} />}
        {x0 + 1920 / cam.z > 1920 && <Img src={staticFile("layers/tile_back_R.png")} style={{ position: "absolute", left: 1920, top: 0, width: 1920, height: 1080 }} />}
        {onScreen(560) && sprite({ name: `guard_${pad(loop, 3)}`, at: [560, 322], ws: 0.41 })}
        {onScreen(1530) && sprite({ name: `wait_${pad((loop + 30) % 90, 3)}`, at: [1530, 326], ws: 0.41 })}
        {onScreen(2911, 500) && sprite({ name: `maya_${pad(frame, 4)}`, at: [2911, 290], ws: 0.85 })}
        {onScreen(3470) && sprite({ name: `raj_${pad((loop + 45) % 90, 3)}`, at: [3470, 300], ws: 0.85 })}
        {x0 + 1920 / cam.z > 1770 && tile("counter")}
        {onScreen(3110) && sprite({ name: `cust_${pad((loop + 60) % 90, 3)}`, at: [3110, 300], ws: 0.8 })}
        {sam.map(drawPart)}
        {x0 < 1212 && tile("desk")}
      </div>
      <StepPill t={t} from={4.6} to={12.6} n={1} label="FILL IN A DEPOSIT SLIP" />
      <StepPill t={t} from={12.9} to={25.3} n={2} label="GIVE IT TO THE TELLER" />
      <StepPill t={t} from={25.7} to={29.9} n={3} label="KEEP YOUR RECEIPT" />
      <SlipCard t={t} />
      <Pop t={t} at={AMT_T} until={12.5} text="$200" color={GOLD} x={700} y={300} size={150} />
      <Badge t={t} at={PLUS_T} until={25.2} text="+$200 IN YOUR ACCOUNT" bg={GREEN} x={1180} y={150} />
      <Badge t={t} at={27.0} until={29.9} text="RECEIPT = PROOF" bg={NAVY} x={1240} y={170} />
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="bank-deposit-test" component={Film} width={1920} height={1080} fps={FPS} durationInFrames={N} />);
