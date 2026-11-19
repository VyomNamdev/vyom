"""Sam v2 — the Paycheck to Plenty mascot, drawn in code (House Style A).

Sam is 22-23, the funny older brother who explains money to his younger siblings.
Tall, fit, dirty-blonde textured hair, sunglasses as his signature.

He is built as a RIG: every limb is split into segments that rotate around real
joints (shoulder, elbow, wrist, hip, knee, ankle), so arms and legs bend naturally
when he moves in the videos. Overlapping segments are drawn with a two-pass
outline so joints never show seams.

  python3 tools/sam.py        -> channel-bible/characters/sam_*_v2.svg
  node tools/render.js <svg>  -> PNG
"""
from math import sin, cos, radians
from pathlib import Path

# ---------------- locked palette ----------------
OUT, SW = "#1E2433", 4.5
SKIN, SKIN_SH, SKIN_DP, SKIN_HI = "#E9B795", "#CF9774", "#B47A5A", "#F6D3B8"
LIP = "#C07A68"
HAIR, HAIR_SH, HAIR_HI = "#B88A52", "#8C6537", "#E0BC84"
BROW = "#7E5A33"
TEE, TEE_SH, TEE_HI = "#2B4170", "#1F3157", "#3A5590"
PANTS, PANTS_SH = "#C7AE86", "#A98F66"
SHOE, SOLE, MINT = "#F7F4EC", "#D8D2C4", "#5FCB9F"
IRIS, IRIS_HI = "#5B7F9E", "#8FB3CF"          # blue-grey eyes
SHADES, SHADES_HI = "#16202E", "#6E86A6"
MOUTH, TONGUE, TEETH = "#5E2328", "#D8706A", "#FFFFFF"
TEAR, RED, BLUSH = "#8FD0F0", "#E5534B", "#EE9C86"
WATCH = "#2E2E2E"
BG, MINT_BG = "#FBF8F1", "#DDF3E8"

_n = [0]


def uid(p):
    _n[0] += 1
    return f"{p}{_n[0]}"


def P(d, fill="none", stroke=OUT, sw=SW, extra=""):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return (f'<path d="{d}" fill="{fill}"{st} stroke-linecap="round" '
            f'stroke-linejoin="round" {extra}/>')


def E(cx, cy, rx, ry, fill, stroke=OUT, sw=SW, extra=""):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{st} {extra}/>'


def clipped(shape_d, inner, tf=""):
    c = uid("k")
    return (f'<g {tf}><clipPath id="{c}"><path d="{shape_d}"/></clipPath>'
            f'<g clip-path="url(#{c})">{inner}</g></g>')


def lerp(a, b, t):
    return a + (b - a) * t


# ============ RIG: limb segments ============
def limb(L, wt, wb, bo=0.0, bi=0.0):
    """Tapered capsule from (0,0) down to (0,L). bo/bi = outer/inner bulge."""
    a, b = wt / 2, wb / 2
    return (f"M {-a},0 A {a},{a} 0 0 1 {a},0 "
            f"C {a+bo},{L*0.35} {b+bo*0.5},{L*0.7} {b},{L} "
            f"A {b},{b} 0 0 1 {-b},{L} "
            f"C {-b-bi*0.5},{L*0.7} {-a-bi},{L*0.35} {-a},0 Z")


HANDS = {
    "relaxed": (["M -15,0 C -18,20 -19,40 -16,56 C -14,70 -6,80 2,80 C 10,80 16,70 17,56 "
                 "C 18,40 17,20 15,0 Z",
                 "M 13,12 C 26,18 28,38 21,50 C 17,55 12,51 13,44 Z"],
                [("M -6,48 L -6,72", 2), ("M 3,50 L 4,77", 2), ("M 11,48 L 11,68", 2)]),
    "open": (["M -18,0 C -20,18 -21,34 -18,46 L 18,46 C 21,34 20,18 18,0 Z",
              limb(40, 11, 10), limb(44, 11, 10), limb(42, 11, 10), limb(34, 10, 9),
              limb(30, 12, 11)],
             []),
    "point": (["M -16,0 C -18,14 -19,30 -15,42 C -9,49 9,49 15,42 C 19,30 18,14 16,0 Z",
               limb(46, 11, 10), "M 14,10 C 24,16 24,30 16,36 Z"],
              [("M -12,34 Q -2,38 8,34", 2)]),
}
HAND_TF = {
    "open": ["", "translate(-14,40) rotate(14)", "translate(-4,44) rotate(4)",
             "translate(6,44) rotate(-6)", "translate(15,40) rotate(-16)",
             "translate(17,12) rotate(-60)"],
    "point": ["", "translate(-9,40) rotate(2)", ""],
    "relaxed": ["", ""],
}


def hand_shapes(kind, s):
    ds, details = HANDS[kind]
    out = [(f"scale({s},1) {t}", d) for d, t in zip(ds, HAND_TF[kind])]
    det = "".join(P(d, stroke=SKIN_DP, sw=w) for d, w in details)
    k = abs(s)
    out = [(f"scale({s},{k}) {t}", d) for d, t in zip(ds, HAND_TF[kind])]
    return out, f'<g transform="scale({s},{k})">{det}</g>'


def fk(x, y, angles, lengths):
    """Forward kinematics. Angles are ABSOLUTE degrees (0 = straight down,
    + = clockwise on screen = swings toward viewer-left)."""
    pts = [(x, y)]
    for a, L in zip(angles, lengths):
        x, y = x - L * sin(radians(a)), y + L * cos(radians(a))
        pts.append((x, y))
    return pts


def union_group(parts, fill, shade=None):
    """parts: list of (transform, d). Two-pass outline so overlapping joints merge seamlessly."""
    p1 = "".join(f'<path d="{d}" transform="{t}" fill="{OUT}" stroke="{OUT}" '
                 f'stroke-width="{SW*2}" stroke-linejoin="round"/>' for t, d in parts)
    p2 = "".join(f'<path d="{d}" transform="{t}" fill="{fill}"/>' for t, d in parts)
    sh = ""
    if shade:
        for t, d in parts:
            sh += clipped(d, f'<rect x="6" y="-60" width="194" height="400" fill="{shade}" opacity="0.9"/>',
                          f'transform="{t}"')
    return p1 + p2 + sh


# ---- arm ----
ARM = dict(upper=168, fore=152)


def arm(sx, sy, a_up, a_fore, a_hand, s, hand="relaxed", watch=False, sleeve=True, skin=SKIN):
    """s = -1 for the arm on viewer-left (Sam's right), +1 for viewer-right."""
    (x0, y0), (x1, y1), (x2, y2) = fk(sx, sy, [a_up, a_fore], [ARM["upper"], ARM["fore"]])
    tf_u = f"translate({x0},{y0}) rotate({a_up})"
    tf_f = f"translate({x1},{y1}) rotate({a_fore})"
    tf_h = f"translate({x2},{y2}) rotate({a_hand})"
    parts = [(tf_u, limb(ARM["upper"], 60, 46, bo=10, bi=5)),
             (tf_f, limb(ARM["fore"], 50, 36, bo=7, bi=2))]
    hs, hdet = hand_shapes(hand, (-s if hand != "relaxed" else s) * 1.15)
    parts += [(f"{tf_h} {t}", d) for t, d in hs]
    o = [union_group(parts, skin, SKIN_SH)]
    o.append(f'<g transform="{tf_u}">' + P(f"M {-8*s},40 Q {-18*s},88 {-10*s},140", stroke=SKIN_DP, sw=2.2) + "</g>")
    o.append(f'<g transform="{tf_f}">' + P(f"M {9*s},20 Q {14*s},60 {6*s},110", stroke=SKIN_DP, sw=2.2) + "</g>")
    o.append(f'<g transform="{tf_h}">{hdet}</g>')
    if watch:
        o.append(f'<g transform="{tf_f}"><rect x="-20" y="{ARM["fore"]-26}" width="40" height="13" rx="4" '
                 f'fill="{WATCH}" stroke="{OUT}" stroke-width="2.5"/>'
                 f'<rect x="-8" y="{ARM["fore"]-28}" width="16" height="17" rx="4" fill="#C9D3DF" '
                 f'stroke="{OUT}" stroke-width="2.5"/></g>')
    if sleeve:  # snug t-shirt sleeve
        sl = ("M -38,-6 C -42,20 -42,46 -38,68 C -14,76 14,76 38,68 C 42,46 42,20 38,-6 "
              "C 28,-34 -28,-34 -38,-6 Z")
        o.append(f'<g transform="{tf_u}">' + P(sl, TEE, stroke=None)
                 + clipped(sl, f'<rect x="10" y="-40" width="40" height="140" fill="{TEE_SH}"/>')
                 + P("M -38,60 C -14,68 14,68 38,60", stroke=TEE_SH, sw=3)
                 + P(sl, "none") + "</g>")
    return "".join(o)


# ---- legs / shoes ----
LEG = dict(thigh=226, shin=214)


def shoe(x, y, ang, view="front"):
    if view == "front":
        d = "M -27,-8 C -31,12 -33,30 -29,42 C -20,50 20,50 29,42 C 33,30 31,12 27,-8 Z"
        det = P("M -29,36 C -14,42 14,42 29,36", sw=3) + P("M -18,14 Q 0,22 18,14", stroke=MINT, sw=5)
    else:
        d = ("M -14,-10 L 18,-10 C 26,8 28,28 24,42 L -58,42 C -66,34 -62,20 -46,14 "
             "C -32,10 -20,4 -14,-10 Z")
        det = P("M -60,34 L 24,34", sw=3) + P("M -40,20 Q -14,28 14,18", stroke=MINT, sw=5)
    return f'<g transform="translate({x},{y}) rotate({ang}) scale(1.3)">' + P(d, SHOE) + det + "</g>"


def leg_parts(hips, angles):
    parts, ankles = [], []
    for (hx, hy), (at, ash, af) in zip(hips, angles):
        (x0, y0), (x1, y1), (x2, y2) = fk(hx, hy, [at, ash], [LEG["thigh"], LEG["shin"]])
        parts.append([(f"translate({x0},{y0}) rotate({at})", limb(LEG["thigh"], 88, 62, bo=8, bi=5)),
                      (f"translate({x1},{y1}) rotate({ash})", limb(LEG["shin"], 62, 46, bo=7, bi=2))])
        ankles.append((x2, y2, af))
    return parts, ankles


def pants_and_legs(hips, angles, pelvis, view="front", dark_first=False):
    parts, ankles = leg_parts(hips, angles)
    o = []
    if dark_first:  # far leg behind, darker
        o.append(union_group(parts[0], PANTS_SH))
        o.append(shoe(*ankles[0], view=view))
        parts, ankles = parts[1:], ankles[1:]
    flat = [p for leg in parts for p in leg] + [("", pelvis)]
    o.append(union_group(flat, PANTS, PANTS_SH))
    for leg in parts:  # knee crease
        o.append(f'<g transform="{leg[1][0]}">' + P("M -14,-6 Q 0,2 14,-8", stroke=PANTS_SH, sw=3) + "</g>")
    for a in ankles:
        o.append(shoe(*a, view=view))
    if view == "front":
        o.append(P("M 0,512 L 0,590", stroke=PANTS_SH, sw=3))
    return "".join(o)


# ============ HEADS ============
HEAD_F = ("M 0,0 C 34,0 56,22 57,56 C 58,78 56,98 52,112 C 49,124 40,136 26,146 "
          "C 18,151 8,153 0,153 C -8,153 -18,151 -26,146 C -40,136 -49,124 -52,112 "
          "C -56,98 -58,78 -57,56 C -56,22 -34,0 0,0 Z")
HAIR_F = ("M -57,66 C -63,40 -61,16 -50,2 C -44,-16 -26,-32 -2,-36 C 24,-40 50,-28 57,-6 "
          "C 63,10 62,34 58,64 C 56,50 53,42 48,38 C 42,30 32,28 22,32 C 14,24 2,22 -8,28 "
          "C -18,24 -32,28 -38,36 C -46,38 -52,46 -55,56 Z")


def brow_shape(s, yi, yp, yo):
    xi, xp, xo = 9 * s, 25 * s, 41 * s
    return P(f"M {xi},{yi-4} Q {xp},{yp-5} {xo},{yo-1} Q {xp},{yp+1} {xi},{yi+3} Z",
             BROW, stroke=BROW, sw=1.5)


def eye(cx, cy, s, ex):
    xi, xo = cx - 13 * s, cx + 13 * s
    kind = ex.get("eye", "open")
    if kind == "happy":
        return (P(f"M {xi},{cy+2} Q {cx},{cy-9} {xo},{cy+1}", sw=4.5)
                + P(f"M {lerp(xi,xo,.2)},{cy+9} Q {cx},{cy+5} {lerp(xi,xo,.85)},{cy+8}", stroke=SKIN_DP, sw=2))
    if kind == "closed":
        return (P(f"M {xi},{cy} Q {cx},{cy+7} {xo},{cy-1}", sw=4.5)
                + P(f"M {lerp(xi,xo,.2)},{cy-9} Q {cx},{cy-13} {lerp(xi,xo,.85)},{cy-9}", stroke=SKIN_DP, sw=2))
    ru, rl = (12, 9) if kind == "wide" else (9, 7)
    d = (f"M {xi},{cy+1} C {lerp(xi,xo,.3)},{cy-ru} {lerp(xi,xo,.75)},{cy-ru} {xo},{cy-1} "
         f"C {lerp(xi,xo,.7)},{cy+rl} {lerp(xi,xo,.3)},{cy+rl} {xi},{cy+1} Z")
    lx, ly = ex.get("look_r" if s > 0 and "look_r" in ex else "look", (0, 0))
    pr = ex.get("pupil", 1.0)
    inner = [E(cx + lx, cy + ly, 6.8, 6.8, IRIS, stroke=OUT, sw=1.5),
             E(cx + lx - 1.5, cy + ly + 2, 4, 3, IRIS_HI, stroke=None, extra='opacity="0.6"'),
             E(cx + lx, cy + ly, 3.1 * pr, 3.1 * pr, "#111", stroke=None),
             E(cx + lx - 2.4, cy + ly - 2.4, 1.9, 1.9, "#FFF", stroke=None)]
    lid = ex.get("lid_r" if s > 0 and "lid_r" in ex else "lid", 0.15)
    yl = cy - ru + (ru + rl) * lid
    inner.append(f'<rect x="{min(xi,xo)-3}" y="{cy-ru-4}" width="32" height="{yl-(cy-ru-4)}" fill="{SKIN_SH}"/>')
    o = [P(d, "#FBFAF7", stroke=None), clipped(d, "".join(inner))]
    top = max(cy - ru, yl - 2)
    o.append(P(f"M {xi},{cy+1} C {lerp(xi,xo,.3)},{top} {lerp(xi,xo,.75)},{top} {xo},{cy-1} "
               f"L {xo+3*s},{cy-3}", sw=4))
    o.append(P(f"M {lerp(xi,xo,.15)},{cy+4} C {lerp(xi,xo,.35)},{cy+rl} {lerp(xi,xo,.7)},{cy+rl} {xo},{cy}",
               stroke=SKIN_DP, sw=1.8))
    o.append(P(f"M {lerp(xi,xo,.25)},{cy-ru-4} Q {cx},{cy-ru-8} {lerp(xi,xo,.9)},{cy-ru-3}",
               stroke=SKIN_DP, sw=1.8))
    return "".join(o)


def sunglasses(on_face):
    y, w, h = (72, 46, 26) if on_face else (-10, 40, 20)
    o = []
    if on_face:
        o.append(P(f"M -50,{y+4} L -57,{y+8} M 50,{y+4} L 57,{y+8}", stroke=SHADES, sw=4))
    for s in (-1, 1):
        x0 = 4 if s > 0 else -4 - w
        lens = (f"M {x0},{y} L {x0+w},{y} C {x0+w+1},{y+h*0.6} {x0+w-6},{y+h} {x0+w/2},{y+h} "
                f"C {x0+6},{y+h} {x0-1},{y+h*0.6} {x0},{y} Z")
        o.append(P(lens, SHADES, sw=4))
        o.append(P(f"M {x0+8},{y+5} L {x0+18},{y+h-6}", stroke=SHADES_HI, sw=3))
        o.append(P(f"M {x0+16},{y+4} L {x0+21},{y+11}", stroke=SHADES_HI, sw=2))
    o.append(P(f"M -4,{y+3} Q 0,{y-1} 4,{y+3}", stroke=SHADES, sw=4))
    return "".join(o)


EXPR = {
    "neutral":  dict(brow=(64, 57, 61), mouth="soft"),
    "happy":    dict(brow=(61, 53, 58), eye="happy", mouth="grin", blush=True),
    "laughing": dict(brow=(60, 51, 57), eye="happy", mouth="laugh", blush=True, lines=True),
    "worried":  dict(brow=(57, 60, 66), mouth="worried", look=(-2, 1), lid=0.1, sweat=True),
    "sad":      dict(brow=(56, 61, 68), mouth="sad", look=(0, 3), lid=0.35, tear=True),
    "angry":    dict(brow=(70, 62, 57), mouth="teeth", lid=0.35, vein=True, pupil=0.85),
    "grumpy":   dict(brow=(68, 66, 64), mouth="grumpy", lid=0.5, look=(3, 1)),
    "shocked":  dict(brow=(54, 44, 50), eye="wide", pupil=0.75, lid=0.0, mouth="o", lines=True),
    "smug":     dict(brow=(65, 61, 63), brow_r=(60, 49, 54), lid=0.45, look=(4, 0), mouth="smirk"),
    "confused": dict(brow=(64, 60, 63), brow_r=(56, 48, 54), look=(-4, -3), mouth="squiggle",
                     question=True),
    "relieved": dict(brow=(62, 56, 60), eye="closed", mouth="relief", puff=True),
    "cool":     dict(brow=(63, 56, 58), mouth="smirk", shades_on=True),
}


def mouth(kind):
    lower = P("M -9,138 Q 0,141 9,138", stroke=LIP, sw=2.5)
    if kind == "soft":
        return (P("M -17,129 Q -8,130 0,130 Q 8,130 17,128", sw=3.5)
                + P("M 17,128 Q 20,126 21,123", sw=2.5) + P("M -17,129 Q -20,127 -21,124", sw=2.5) + lower)
    if kind == "worried":
        return P("M -16,132 Q -8,126 0,130 Q 8,134 16,129", sw=3.5) + lower
    if kind == "sad":
        return P("M -15,134 Q 0,126 15,134", sw=3.5) + P("M -8,140 Q 0,142 8,140", stroke=LIP, sw=2.5)
    if kind == "grumpy":
        return (P("M -15,132 Q 0,130 15,133", sw=3.5)
                + P("M 15,133 L 18,136 M -15,132 L -18,135", sw=2.5) + lower)
    if kind == "smirk":
        return (P("M -14,131 Q 4,134 19,124", sw=3.5) + P("M 19,124 L 22,121", sw=2.5)
                + P("M -4,139 Q 4,141 11,137", stroke=LIP, sw=2.5))
    if kind == "squiggle":
        return P("M -12,132 Q -6,127 0,132 Q 6,137 12,131", sw=3.5) + lower
    if kind == "relief":
        return P("M -15,128 Q 0,137 15,128", sw=3.5) + lower
    if kind == "o":
        return E(0, 133, 10, 13, MOUTH, sw=3.5) + E(0, 140, 6, 4, TONGUE, stroke=None)
    if kind in ("grin", "laugh"):
        h = 22 if kind == "grin" else 30
        shape = f"M -24,124 Q 0,128 24,124 Q 20,{124+h} 0,{126+h} Q -20,{124+h} -24,124 Z"
        inner = (f'<rect x="-30" y="118" width="60" height="12" fill="{TEETH}"/>'
                 + E(0, 126 + h, 14, 9, TONGUE, stroke=None))
        return P(shape, MOUTH, stroke=None) + clipped(shape, inner) + P(shape, "none", sw=3.5)
    if kind == "teeth":
        shape = "M -21,126 Q 0,122 21,126 L 19,139 Q 0,142 -19,139 Z"
        inner = "".join(P(f"M {x},118 L {x},146", sw=1.6) for x in (-11, -4, 4, 11)) + P("M -24,132 L 24,132", sw=2)
        return P(shape, TEETH, stroke=None) + clipped(shape, inner) + P(shape, "none", sw=3.5)
    return ""


def head_front(name="neutral"):
    ex = EXPR[name]
    o = []
    for s in (-1, 1):   # ears
        o.append(P(f"M {55*s},70 C {67*s},62 {74*s},74 {71*s},88 C {69*s},100 {63*s},110 {54*s},106 Z", SKIN))
        o.append(P(f"M {58*s},76 C {65*s},74 {67*s},84 {62*s},96", stroke=SKIN_DP, sw=2.5))
    shade = (P("M 34,-10 C 60,40 58,110 18,170 L 120,170 L 120,-10 Z", SKIN_SH, stroke=None)
             + P("M -60,46 C -30,60 20,58 60,44 L 60,20 L -60,20 Z", SKIN_SH, stroke=None, extra='opacity="0.6"')
             + P("M -44,96 C -40,110 -34,118 -26,124", stroke=SKIN_SH, sw=4, extra='opacity="0.8"')
             + E(-28, 104, 12, 8, SKIN_HI, stroke=None, extra='opacity="0.5"'))
    o.append(P(HEAD_F, SKIN, stroke=None) + clipped(HEAD_F, shade) + P(HEAD_F, "none"))
    o.append(P(HAIR_F, HAIR))
    o.append(clipped(HAIR_F, P("M 20,-50 C 50,-20 64,20 60,70 L 100,70 L 100,-50 Z", HAIR_SH, stroke=None)))
    for d in ("M -40,-6 C -30,-22 -12,-30 8,-30", "M -28,10 C -18,-8 4,-18 26,-18",
              "M -8,22 C 2,8 20,0 40,2", "M -48,26 C -44,10 -36,0 -26,-6"):
        o.append(P(d, stroke=HAIR_SH, sw=2.5))
    for d in ("M -34,-16 C -22,-26 -6,-30 6,-30", "M -18,4 C -6,-6 8,-12 20,-12"):
        o.append(P(d, stroke=HAIR_HI, sw=4))
    o.append(P("M -2,-36 C 8,-48 24,-48 30,-38 C 22,-40 14,-38 10,-30 Z", HAIR))
    o.append(brow_shape(-1, *ex["brow"]))
    o.append(brow_shape(1, *ex.get("brow_r", ex["brow"])))
    if ex.get("shades_on"):
        o.append(sunglasses(True))
    else:
        o.append(eye(-23, 82, -1, ex))
        o.append(eye(23, 82, 1, ex))
    o.append(P("M 7,76 C 9,90 11,100 12,108", stroke=SKIN_SH, sw=3))
    o.append(P("M -11,111 C -13,118 -7,120 -3,117 Q 0,119 3,117 C 7,120 13,118 11,111", sw=3))
    o.append(P("M -3,104 C 0,108 4,108 6,105", stroke=SKIN_DP, sw=2))
    if ex.get("blush"):
        o.append(E(-34, 112, 10, 5, BLUSH, stroke=None, extra='opacity="0.6"'))
        o.append(E(34, 112, 10, 5, BLUSH, stroke=None, extra='opacity="0.6"'))
    o.append(mouth(ex["mouth"]))
    o.append(P("M -10,148 Q 0,151 10,148", stroke=SKIN_SH, sw=2.5))
    if not ex.get("shades_on"):
        o.append(sunglasses(False))
    if ex.get("sweat"):
        o.append(P("M 66,30 C 58,44 58,54 66,56 C 74,54 74,44 66,30 Z", TEAR, sw=2.5))
    if ex.get("tear"):
        o.append(P("M -26,92 C -32,106 -32,114 -26,116 C -20,114 -20,106 -26,92 Z", TEAR, sw=2.5))
    if ex.get("vein"):
        for d in ("M 32,26 Q 40,32 38,40", "M 46,24 Q 44,32 52,36", "M 32,48 Q 40,42 38,36", "M 52,48 Q 46,42 50,36"):
            o.append(P(d, stroke=RED, sw=4.5))
    if ex.get("lines"):
        for d in ("M -80,20 L -94,6", "M -86,48 L -104,44", "M 80,20 L 94,6", "M 86,48 L 104,44"):
            o.append(P(d, sw=4.5))
    if ex.get("question"):
        o.append(f'<text x="72" y="14" font-family="Inter" font-weight="900" font-size="60" '
                 f'fill="{TEE}" stroke="{OUT}" stroke-width="2">?</text>')
    if ex.get("puff"):
        for cx, cy, r in ((30, 140, 4), (41, 134, 6), (55, 126, 8)):
            o.append(E(cx, cy, r, r, "#DCEBF7", stroke="#9BB7D4", sw=2.5))
    return "".join(o)


def head_34():
    head = ("M 2,0 C 38,0 60,24 60,60 C 60,90 56,108 46,122 C 38,134 20,148 -4,152 "
            "C -22,154 -36,148 -44,138 C -50,128 -54,112 -56,96 C -58,82 -56,74 -54,64 "
            "C -54,26 -34,0 2,0 Z")
    shade = (P("M 18,-10 C 44,40 46,110 4,170 L 120,170 L 120,-10 Z", SKIN_SH, stroke=None)
             + P("M -60,46 C -30,58 20,56 60,44 L 60,20 L -60,20 Z", SKIN_SH, stroke=None, extra='opacity="0.6"'))
    o = [P(head, SKIN, stroke=None) + clipped(head, shade) + P(head, "none")]
    hair = ("M -56,66 C -62,40 -58,14 -46,0 C -38,-18 -18,-32 6,-36 C 32,-38 56,-24 62,-2 "
            "C 68,18 66,44 60,74 C 56,62 52,52 46,48 C 40,42 30,38 22,40 C 14,30 0,26 -12,30 "
            "C -24,28 -36,32 -42,40 C -48,44 -52,52 -54,60 Z")
    o.append(P(hair, HAIR))
    o.append(clipped(hair, P("M 26,-50 C 56,-20 68,20 64,80 L 100,80 L 100,-50 Z", HAIR_SH, stroke=None)))
    for d in ("M -34,-10 C -22,-24 -2,-30 18,-28", "M -20,8 C -8,-6 12,-14 34,-12", "M -42,26 C -38,10 -28,0 -18,-6"):
        o.append(P(d, stroke=HAIR_SH, sw=2.5))
    o.append(P("M -28,-18 C -16,-28 0,-32 12,-30", stroke=HAIR_HI, sw=4))
    o.append(P("M 4,-36 C 14,-48 30,-48 36,-38 C 28,-40 20,-38 16,-30 Z", HAIR))
    o.append(P("M 40,72 C 52,62 62,72 60,88 C 58,102 50,110 42,104 Z", SKIN))
    o.append(P("M 45,78 C 52,78 54,88 49,98", stroke=SKIN_DP, sw=2.5))
    o.append(P("M 38,56 L 42,96", stroke=HAIR, sw=7))
    o.append(P("M -48,62 Q -40,54 -26,58 Q -38,58 -48,64 Z", BROW, stroke=BROW, sw=2))
    o.append(P("M -12,60 Q 6,52 24,58 Q 6,58 -12,64 Z", BROW, stroke=BROW, sw=2))
    o.append(eye(-38, 82, -1, dict(look=(-3, 0))))
    o.append(eye(6, 82, 1, dict(look=(-3, 0))))
    o.append(P("M -12,78 C -16,92 -22,102 -26,108 C -24,114 -18,116 -12,113", sw=3))
    o.append(P("M -2,80 C 0,92 2,100 -2,108", stroke=SKIN_SH, sw=3))
    o.append(P("M -34,128 Q -24,130 -14,130 Q -4,130 4,127", sw=3.5))
    o.append(P("M -24,138 Q -16,141 -8,138", stroke=LIP, sw=2.5))
    o.append(f'<g transform="translate(-10,0) scale(0.9,1)">{sunglasses(False)}</g>')
    return "".join(o)


def head_profile():
    head = ("M 6,0 C 42,0 64,26 62,64 C 61,90 54,110 42,124 C 34,128 26,130 20,130 "
            "C 10,142 -12,154 -34,154 C -44,154 -50,150 -50,144 C -51,140 -50,138 -52,134 "
            "C -56,132 -57,129 -54,126 C -57,123 -58,120 -56,117 C -57,114 -57,112 -56,110 "
            "C -62,109 -68,107 -69,103 C -70,98 -64,90 -57,80 C -55,74 -56,68 -57,62 "
            "C -58,26 -32,0 6,0 Z")
    shade = (P("M -40,124 C -10,146 20,140 40,120 L 60,170 L -60,170 Z", SKIN_SH, stroke=None)
             + P("M -60,40 C -40,50 -20,50 0,40 L 0,20 L -60,20 Z", SKIN_SH, stroke=None, extra='opacity="0.6"'))
    o = [P(head, SKIN, stroke=None) + clipped(head, shade) + P(head, "none")]
    hair = ("M -54,60 C -66,22 -40,-24 4,-30 C 40,-34 74,-6 76,40 C 78,80 66,112 48,126 "
            "C 44,112 42,100 40,88 C 38,76 32,64 22,58 C 10,50 -2,44 -12,46 "
            "C -24,44 -38,48 -46,54 Z")
    o.append(P(hair, HAIR))
    o.append(clipped(hair, P("M 30,-40 C 70,-10 84,40 70,130 L 120,130 L 120,-40 Z", HAIR_SH, stroke=None)))
    for d in ("M -40,10 C -28,-12 0,-24 30,-22", "M -24,30 C -10,10 16,0 44,2", "M 30,30 C 46,40 56,60 58,90"):
        o.append(P(d, stroke=HAIR_SH, sw=2.5))
    o.append(P("M -34,-6 C -18,-22 4,-28 22,-26", stroke=HAIR_HI, sw=4))
    o.append(P("M -30,-26 C -26,-46 -6,-52 4,-42 C -6,-42 -14,-36 -16,-26 Z", HAIR))
    o.append(P("M 8,70 C 22,60 34,72 32,88 C 30,102 20,110 10,104 Z", SKIN))
    o.append(P("M 13,76 C 22,76 24,88 18,98", stroke=SKIN_DP, sw=2.5))
    o.append(P("M -52,60 Q -44,52 -30,56 Q -42,57 -52,62 Z", BROW, stroke=BROW, sw=2))
    ey = "M -52,78 Q -44,72 -34,77 Q -40,88 -50,86 Z"
    o.append(P(ey, "#FBFAF7", stroke=None)
             + clipped(ey, E(-46, 80, 5.5, 6.5, IRIS, stroke=OUT, sw=1.5) + E(-47, 80, 2.6, 2.6, "#111", stroke=None)))
    o.append(P("M -54,78 Q -44,70 -33,76", sw=4))
    o.append(P("M -54,126 L -46,127", sw=3))
    o.append(P("M -46,-14 L -20,-16 C -18,-4 -24,4 -34,4 C -44,4 -48,-4 -46,-14 Z", SHADES, sw=4))
    o.append(P("M -20,-14 L 34,-8", stroke=SHADES, sw=4))
    o.append(P("M -40,-10 L -32,0", stroke=SHADES_HI, sw=2.5))
    return "".join(o)


# ============ BODIES ============
TORSO_F = ("M -34,186 C -62,194 -92,200 -112,208 C -128,216 -132,240 -128,262 "
           "C -124,276 -118,284 -112,288 C -106,350 -92,420 -90,470 C -90,490 -92,506 -94,524 "
           "C -40,534 40,534 94,524 C 92,506 90,490 90,470 C 92,420 106,350 112,288 "
           "C 118,284 124,276 128,262 C 132,240 128,216 112,208 C 92,200 62,194 34,186 "
           "C 22,198 -22,198 -34,186 Z")
PELVIS_F = "M -94,500 C -96,530 -98,556 -92,592 L 0,604 L 92,592 C 98,556 96,530 94,500 Z"
NECK_F = "M -27,124 L -31,198 L 31,198 L 27,124 Z"


def torso_front():
    shade = (P("M 60,170 C 84,300 70,450 84,560 L 160,560 L 160,170 Z", TEE_SH, stroke=None)
             + P("M -100,214 C -70,206 -40,204 -20,208", stroke=TEE_HI, sw=6))
    o = [P(TORSO_F, TEE, stroke=None), clipped(TORSO_F, shade), P(TORSO_F, "none")]
    o.append(P("M -72,300 Q -40,318 -8,304 M 72,300 Q 40,318 8,304", stroke=TEE_SH, sw=3))
    o.append(P("M -86,470 Q -60,480 -40,474 M 86,462 Q 66,474 46,470", stroke=TEE_SH, sw=2.5))
    o.append(P("M -34,186 C -22,206 22,206 34,186", sw=SW))
    o.append(P("M -28,194 C -16,208 16,208 28,194", stroke=TEE_SH, sw=3))
    return "".join(o)


def neck(d, shade_d):
    return P(d, SKIN) + clipped(d, P(shade_d, SKIN_SH, stroke=None)) + P(d, "none")


DEFAULT_POSE = dict(lu=8, lf=3, lh=3, lhand="relaxed", ru=-8, rf=-3, rh=-3, rhand="relaxed",
                    legs=[(3, 1, 0), (-3, -1, 0)])


def sam_front(expr="neutral", pose=None):
    p = dict(DEFAULT_POSE, **(pose or {}))
    o = [pants_and_legs([(-48, 566), (48, 566)], p["legs"], PELVIS_F)]
    o.append(neck(NECK_F, "M -40,130 Q 0,170 40,130 L 40,200 L -40,200 Z"))
    o.append(P("M -16,160 L -8,196 M 16,160 L 8,196", stroke=SKIN_DP, sw=2))
    o.append(torso_front())
    o.append(arm(-110, 238, p["lu"], p["lf"], p["lh"], -1, p["lhand"]))
    o.append(arm(110, 238, p["ru"], p["rf"], p["rh"], 1, p["rhand"], watch=True))
    o.append(head_front(expr))
    return "".join(o)


def sam_34():
    o = [arm(-98, 238, 6, 2, 2, -1, "relaxed", skin=SKIN_SH)]  # far arm behind
    o.append(pants_and_legs([(-40, 566), (40, 566)], [(4, 2, 0), (-2, -1, 0)],
                            "M -84,500 C -86,530 -88,556 -82,592 L 0,604 L 88,592 C 94,556 92,530 90,500 Z"))
    o.append(neck("M -26,124 L -28,198 L 32,198 L 30,124 Z", "M -40,130 Q 0,170 40,130 L 40,200 L -40,200 Z"))
    o.append(f'<g transform="translate(6,0) scale(0.88,1)">{torso_front()}</g>')
    o.append(arm(110, 236, -8, -3, -3, 1, "relaxed", watch=True))
    o.append(head_34())
    return "".join(o)


def sam_profile(pose=None):
    p = dict(au=0, af=6, ah=6, far=(0, 6, 6), legs=[(0, 0, 0), (0, 0, 0)])
    p.update(pose or {})
    torso = ("M -30,186 C -62,196 -80,230 -82,270 C -84,300 -74,330 -66,360 C -60,420 -62,470 -64,524 "
             "C -20,534 30,534 52,524 C 54,470 56,420 60,360 C 66,320 70,270 62,236 "
             "C 54,206 42,192 30,186 Z")
    pelvis = "M -66,500 C -68,540 -60,570 -44,596 L 40,596 C 52,570 54,540 52,500 Z"
    o = [arm(6, 236, *p["far"], 1, "relaxed", skin=SKIN_SH)]
    o.append(pants_and_legs([(4, 566), (-6, 566)], p["legs"], pelvis, view="side", dark_first=True))
    o.append(neck("M -28,140 L -30,198 L 34,198 L 34,126 Z", "M -40,140 Q 0,160 40,130 L 40,200 L -40,200 Z"))
    o.append(P(torso, TEE, stroke=None)
             + clipped(torso, P("M 20,170 C 40,300 30,450 40,560 L 120,560 L 120,170 Z", TEE_SH, stroke=None))
             + P(torso, "none"))
    o.append(P("M -30,186 C -20,196 -10,198 0,196", stroke=TEE_SH, sw=3))
    o.append(P("M -70,290 Q -56,316 -30,316", stroke=TEE_SH, sw=3))
    o.append(arm(-4, 236, p["au"], p["af"], p["ah"], -1, "relaxed", watch=True))
    o.append(head_profile())
    return "".join(o)


# ============ SHEETS ============
FONT = 'font-family="Inter"'
SUB = "Paycheck to Plenty · House Style A · reference v2"


def sheet(content, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'
            f'<rect width="1920" height="1080" fill="{BG}"/><rect width="1920" height="120" fill="{MINT_BG}"/>'
            f'<text x="70" y="78" {FONT} font-weight="900" font-size="50" fill="{OUT}">{title}</text>'
            f'<text x="1850" y="76" {FONT} font-weight="600" font-size="25" fill="{TEE}" '
            f'text-anchor="end">{SUB}</text>{content}</svg>')


def label(x, y, t, size=28):
    return (f'<text x="{x}" y="{y}" {FONT} font-weight="800" font-size="{size}" fill="{OUT}" '
            f'text-anchor="middle" letter-spacing="3">{t}</text>')


def turnaround():
    sc = 0.8
    b = [f'<line x1="120" x2="1800" y1="{170 + i*153*sc}" y2="{170 + i*153*sc}" stroke="#ECE6D9" '
         f'stroke-width="2" stroke-dasharray="8 10"/>' for i in range(8)]
    for lab, svg, x in (("FRONT", sam_front(), 400), ("3/4 VIEW", sam_34(), 960),
                        ("PROFILE", sam_profile(), 1520)):
        b.append(E(x, 1018, 130, 14, "#E6E0D2", stroke=None))
        b.append(f'<g transform="translate({x},170) scale({sc})">{svg}</g>')
        b.append(label(x, 1066, lab))
    return sheet("".join(b), "SAM — CHARACTER TURNAROUND")


def expressions():
    t = []
    for i, n in enumerate(EXPR):
        col, row = i % 6, i // 6
        x0, y0 = 40 + col * 310, 150 + row * 460
        c = uid("tile")
        t.append(f'<clipPath id="{c}"><rect x="{x0}" y="{y0}" width="290" height="400" rx="26"/></clipPath>')
        t.append(f'<rect x="{x0}" y="{y0}" width="290" height="400" rx="26" fill="#FFF" stroke="#E3DCCB" stroke-width="3"/>')
        t.append(f'<g clip-path="url(#{c})"><g transform="translate({x0+145},{y0+82}) scale(1.22)">'
                 f'{sam_front(n)}</g></g>')
        t.append(label(x0 + 145, y0 + 442, "COOL (SHADES ON)" if n == "cool" else n.upper(), 24))
    return sheet("".join(t), "SAM — EXPRESSION SHEET")


POSES = [
    ("WAVING", "happy", dict(ru=-125, rf=-168, rh=-176, rhand="open")),
    ("EXPLAINING", "neutral", dict(lu=22, lf=158, lh=172, lhand="point")),
    ("HANDS ON HIPS", "smug", dict(lu=38, lf=-48, lh=-60, ru=-38, rf=48, rh=60)),
    ("SHRUG", "confused", dict(lu=12, lf=118, lh=135, lhand="open", ru=-12, rf=-118, rh=-135, rhand="open")),
]


def poses():
    b = []
    for i, (lab, ex, pose) in enumerate(POSES):
        x = 210 + i * 380
        b.append(E(x, 1004, 120, 13, "#E6E0D2", stroke=None))
        b.append(f'<g transform="translate({x},214) scale(0.72)">{sam_front(ex, pose)}</g>')
        b.append(label(x, 1062, lab, 24))
    walk = dict(au=-24, af=-8, ah=-8, far=(22, 40, 40), legs=[(-22, -40, -20), (24, 4, 0)])
    b.append(E(1720, 1004, 120, 13, "#E6E0D2", stroke=None))
    b.append(f'<g transform="translate(1720,214) scale(0.72)">{sam_profile(walk)}</g>')
    b.append(label(1720, 1062, "WALKING", 24))
    return sheet("".join(b), "SAM — RIG TEST (JOINTS BEND)")


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "channel-bible" / "characters"
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in (("sam_turnaround_v2", turnaround), ("sam_expressions_v2", expressions),
                     ("sam_rig_poses_v2", poses)):
        (out / f"{name}.svg").write_text(fn())
    print("ok")
