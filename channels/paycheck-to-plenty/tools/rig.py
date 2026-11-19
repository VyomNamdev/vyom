"""Character rig + drawing kit for Paycheck to Plenty (all art is code).

Every character (Sam and the background cast) is a jointed rig: shoulder, elbow,
wrist, hip, knee, ankle. Segments are drawn with a two-pass outline so joints never
show seams. Faces support expressions, blinking and lip-sync (mouth openness 0..1).

Coordinates: y down, origin = top of the skull, centre of the body. Sam is ~1100 units
tall (about 6 ft). Profile views are drawn facing LEFT; use facing=+1 to mirror.
"""
from math import sin, cos, radians
import random

OUT, SW = "#3B2C25", 3.6

_n = [0]


def uid(p="k"):
    _n[0] += 1
    return f"{p}{_n[0]}"


def reset_ids():
    _n[0] = 0


def P(d, fill="none", stroke=OUT, sw=SW, extra=""):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return (f'<path d="{d}" fill="{fill}"{st} stroke-linecap="round" '
            f'stroke-linejoin="round" {extra}/>')


def E(cx, cy, rx, ry, fill, stroke=OUT, sw=SW, extra=""):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx}" ry="{ry}" fill="{fill}"{st} {extra}/>'


def R(x, y, w, h, fill, rx=0, stroke=OUT, sw=SW, extra=""):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{st} {extra}/>'


def T(x, y, s, size, fill, weight=800, anchor="middle", font="Inter", extra=""):
    return (f'<text x="{x}" y="{y}" font-family="{font}" font-weight="{weight}" font-size="{size}" '
            f'fill="{fill}" text-anchor="{anchor}" {extra}>{s}</text>')


def clipped(shape_d, inner, tf=""):
    c = uid()
    return (f'<g {tf}><clipPath id="{c}"><path d="{shape_d}"/></clipPath>'
            f'<g clip-path="url(#{c})">{inner}</g></g>')


def lerp(a, b, t):
    return a + (b - a) * t


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


# ---------------- limbs ----------------
def limb(L, wt, wb, bo=0.0, bi=0.0):
    a, b = wt / 2, wb / 2
    return (f"M {-a},0 A {a},{a} 0 0 1 {a},0 "
            f"C {a+bo},{L*0.35:.1f} {b+bo*0.5},{L*0.7:.1f} {b},{L} "
            f"A {b},{b} 0 0 1 {-b},{L} "
            f"C {-b-bi*0.5},{L*0.7:.1f} {-a-bi},{L*0.35:.1f} {-a},0 Z")


def fk(x, y, angles, lengths):
    """Absolute angles in degrees: 0 = straight down, + = clockwise (swings toward viewer-left)."""
    pts = [(x, y)]
    for a, L in zip(angles, lengths):
        x, y = x - L * sin(radians(a)), y + L * cos(radians(a))
        pts.append((x, y))
    return pts


def union_group(parts, fill, shade=None, shade_x=6):
    p1 = "".join(f'<path d="{d}" transform="{t}" fill="{OUT}" stroke="{OUT}" '
                 f'stroke-width="{SW*2}" stroke-linejoin="round"/>' for t, d in parts)
    p2 = "".join(f'<path d="{d}" transform="{t}" fill="{fill}"/>' for t, d in parts)
    sh = ""
    if shade:
        for t, d in parts:
            sh += clipped(d, f'<rect x="{shade_x}" y="-80" width="200" height="420" fill="{shade}"/>',
                          f'transform="{t}"')
    return p1 + p2 + sh


HANDS = {
    "relaxed": ["M -14,0 C -17,20 -18,40 -15,54 C -13,68 -6,76 2,76 C 10,76 15,68 16,54 "
                "C 17,40 16,20 14,0 Z",
                "M 12,10 C 24,16 26,36 20,48 C 16,52 11,49 12,42 Z"],
    "open": ["M -17,0 C -19,18 -20,32 -17,44 L 17,44 C 20,32 19,18 17,0 Z",
             limb(38, 10, 9), limb(42, 10, 9), limb(40, 10, 9), limb(32, 9, 8), limb(28, 11, 10)],
    "point": ["M -15,0 C -17,14 -18,28 -14,40 C -8,46 8,46 14,40 C 18,28 17,14 15,0 Z",
              limb(44, 10, 9), "M 13,9 C 23,15 23,28 15,34 Z"],
    "fist": ["M -15,0 C -18,14 -19,30 -15,42 C -8,48 8,48 15,42 C 19,30 18,14 15,0 Z",
             "M 13,9 C 23,15 23,28 15,34 Z"],
}
HAND_TF = {
    "open": ["", "translate(-13,38) rotate(14)", "translate(-4,42) rotate(4)",
             "translate(5,42) rotate(-6)", "translate(14,38) rotate(-16)", "translate(16,11) rotate(-60)"],
    "point": ["", "translate(-8,38) rotate(2)", ""],
    "relaxed": ["", ""],
    "fist": ["", ""],
}
HAND_DET = {
    "relaxed": ["M -5,46 L -5,70", "M 3,48 L 4,74", "M 10,46 L 10,66"],
    "fist": ["M -10,26 Q -2,30 8,26", "M -10,36 Q -2,40 8,36"],
    "point": ["M -11,32 Q -2,36 7,32"],
    "open": [],
}


def hand(kind, s, k, skin, skin_dp, tf):
    parts = [(f"{tf} scale({s*k},{k}) {t}", d) for d, t in zip(HANDS[kind], HAND_TF[kind])]
    det = "".join(P(d, stroke=skin_dp, sw=1.8) for d in HAND_DET[kind])
    return parts, f'<g transform="{tf} scale({s*k},{k})">{det}</g>'


# ---------------- held props (hand-local coords) ----------------
def prop(kind):
    if kind == "pen":
        return (R(-3, -40, 6, 70, "#2D3A5C", rx=3, sw=2) + R(-3, 26, 6, 10, "#C9CED6", rx=2, sw=2))
    if kind == "cash":
        g = ""
        for i, a in enumerate((-8, -2, 4)):
            g += (f'<g transform="translate({-4+i*2},30) rotate({a})">'
                  + R(-34, -16, 68, 32, "#BFD8B0", rx=3, sw=2.2) + R(-26, -10, 52, 20, "none", rx=2, stroke="#7FA56E", sw=1.6)
                  + E(0, 0, 7, 7, "#9EC48C", stroke="#7FA56E", sw=1.5) + "</g>")
        return g
    if kind == "slipcash":
        return prop("cash") + (f'<g transform="translate(6,22) rotate(6)">' + R(-30, -20, 60, 40, "#FFFFFF", rx=2, sw=2.2)
                               + "".join(f'<line x1="-22" x2="20" y1="{y}" y2="{y}" stroke="#B9C2CC" stroke-width="2"/>'
                                         for y in (-8, 0, 8)) + "</g>")
    if kind == "receipt":
        return (f'<g transform="translate(2,24) rotate(-4)">' + R(-20, -34, 40, 64, "#FFFFFF", rx=1, sw=2.2)
                + "".join(f'<line x1="-13" x2="{13 if i % 2 else 6}" y1="{y}" y2="{y}" stroke="#AAB3BE" stroke-width="2"/>'
                          for i, y in enumerate((-24, -16, -8, 0, 8)))
                + R(-13, 14, 26, 8, "#3FAE7E", rx=1, stroke=None) + "</g>")
    if kind == "phone":
        return R(-12, 4, 24, 42, "#1D2230", rx=4, sw=2) + R(-9, 8, 18, 32, "#8FB7DA", rx=2, stroke=None)
    return ""


# ---------------- looks ----------------
SAM = dict(
    name="Sam", skin="#EDC2A0", skin_sh="#D9A27F", skin_dp="#B9805F", skin_hi="#F8DCC6",
    hair="#C9A063", hair_sh="#9C7440", hair_hi="#E8CC92", hair_ln="#86602F", brow="#8A6535",
    iris="#5E412E", lip="#C27C69", hair_style="sam", glasses=True, stubble=True, face="m",
    outfit="blazer", top="#2D3B58", top_sh="#212C44", top_hi="#3D4E72", inner="#C3C8CD", inner_sh="#A7ADB4",
    pants="#2B3753", pants_sh="#1F2940", shoe="#7B4B2B", shoe_sh="#5E3720", sole="#3A2A20",
    watch=True, k=1.0, arm=(170, 150), leg=(232, 216), shoulder=110, hip=46,
)
TELLER_A = dict(SAM, name="Maya", skin="#B98563", skin_sh="#9E6C4E", skin_dp="#83563C", skin_hi="#D3A383",
                hair="#2C1E18", hair_sh="#1C130F", hair_hi="#4A362C", hair_ln="#140D0A", brow="#2C1E18",
                iris="#3D2A20", lip="#A55A55", hair_style="bun", glasses=False, stubble=False, face="f",
                outfit="vest", top="#2D3B58", top_sh="#212C44", top_hi="#3D4E72", inner="#F4F2EE", inner_sh="#DCD8D0",
                pants="#2B2F3A", pants_sh="#1D2028", watch=False, k=0.93, shoulder=96, badge=True)
TELLER_B = dict(SAM, name="Raj", skin="#C99872", skin_sh="#AE7E5B", skin_dp="#8F6345", skin_hi="#E0B696",
                hair="#1F1B19", hair_sh="#120F0E", hair_hi="#3B3431", hair_ln="#0B0909", brow="#1F1B19",
                iris="#3A2A20", lip="#A86B5C", hair_style="short", glasses=False, stubble=False, face="m",
                outfit="tie", top="#BFD6EA", top_sh="#A2BDD6", top_hi="#D6E6F3", inner="#2D3B58", inner_sh="#212C44",
                watch=False, k=0.97, badge=True)
GUARD = dict(SAM, name="Guard", skin="#8D5B3E", skin_sh="#74482F", skin_dp="#5E3824", skin_hi="#A87457",
             hair="#1A1513", hair_sh="#0E0B0A", hair_hi="#33291F", hair_ln="#0A0807", brow="#1A1513",
             iris="#2E2018", lip="#6F3E35", hair_style="cap", glasses=False, stubble=False, face="m",
             outfit="guard", top="#5C6670", top_sh="#48515A", top_hi="#717C87", inner="#5C6670", inner_sh="#48515A",
             pants="#2A2E36", pants_sh="#1C1F25", shoe="#1E1E22", shoe_sh="#121215", watch=False, k=1.02, shoulder=116)
CUSTOMER_C = dict(SAM, name="Customer", skin="#F0C9AE", skin_sh="#DBA98A", skin_dp="#BF8A6A", skin_hi="#FADFCC",
                  hair="#8E4A2C", hair_sh="#6B3420", hair_hi="#B26B47", hair_ln="#5A2B1A", brow="#6B3420",
                  iris="#4E6B4A", lip="#B8645C", hair_style="long", glasses=False, stubble=False, face="f",
                  outfit="coat", top="#C79B62", top_sh="#A87F4C", top_hi="#DDB57F", inner="#E9E4DC", inner_sh="#D2CBC0",
                  pants="#3E4F6E", pants_sh="#2E3C55", shoe="#2B2522", shoe_sh="#1A1614", watch=False, k=0.92, shoulder=96)
CUSTOMER_E = dict(SAM, name="Waiting", skin="#7C5038", skin_sh="#653F2B", skin_dp="#50301F", skin_hi="#97664B",
                  hair="#16110F", hair_sh="#0C0908", hair_hi="#2E2420", hair_ln="#080605", brow="#16110F",
                  iris="#2A1C14", lip="#5E352C", hair_style="curly", glasses=False, stubble=True, face="m",
                  outfit="sweater", top="#4F7A5E", top_sh="#3E624B", top_hi="#64927A", inner="#4F7A5E", inner_sh="#3E624B",
                  pants="#5E5A55", pants_sh="#4A4743", shoe="#E9E6E0", shoe_sh="#C9C4BB", watch=False, k=0.98, shoulder=106)


# ============================ FACES ============================
HEAD_M = ("M 0,0 C 33,0 53,22 54,56 C 55,80 53,100 49,114 C 45,128 36,140 24,150 "
          "C 16,156 8,158 0,158 C -8,158 -16,156 -24,150 C -36,140 -45,128 -49,114 "
          "C -53,100 -55,80 -54,56 C -53,22 -33,0 0,0 Z")
HEAD_F = ("M 0,0 C 33,0 54,22 55,56 C 56,80 52,102 46,118 C 40,132 26,146 12,151 "
          "C 6,153 -6,153 -12,151 C -26,146 -40,132 -46,118 C -52,102 -56,80 -55,56 C -54,22 -33,0 0,0 Z")

EXPR = {
    "neutral":   dict(brow=(64, 57, 61), mouth="smile"),
    "happy":     dict(brow=(61, 53, 58), mouth="grin", eye_squint=0.25),
    "excited":   dict(brow=(56, 46, 52), mouth="laugh", blush=True, eye="wide"),
    "sad":       dict(brow=(56, 61, 68), mouth="sad", look=(0, 3), lid=0.35),
    "grumpy":    dict(brow=(70, 66, 62), mouth="flat_down", lid=0.4),
    "surprised": dict(brow=(54, 44, 50), eye="wide", pupil=0.75, lid=0.0, mouth="o"),
    "thoughtful": dict(brow=(60, 54, 60), brow_r=(56, 49, 56), look=(4, -6), mouth="flat_side"),
    "confused":  dict(brow=(64, 60, 63), brow_r=(55, 47, 54), look=(-4, -3), mouth="squiggle"),
    "serious":   dict(brow=(66, 62, 63), mouth="flat", lid=0.25),
    "smirk":     dict(brow=(65, 61, 63), brow_r=(60, 50, 55), lid=0.35, look=(3, 0), mouth="smirk"),
    "wink":      dict(brow=(62, 54, 58), lid_r=1.0, mouth="smirk_open"),
}


def brow_shape(s, yi, yp, yo, col, thick=1.0):
    xi, xp, xo = 9 * s, 25 * s, 41 * s
    return P(f"M {xi},{yi-4*thick} Q {xp},{yp-5*thick} {xo},{yo-1} Q {xp},{yp+1} {xi},{yi+3} Z",
             col, stroke=col, sw=1.5)


def eye(cx, cy, s, ex, L, blink):
    xi, xo = cx - 13 * s, cx + 13 * s
    ru, rl = (12, 9) if ex.get("eye") == "wide" else (9, 7)
    d = (f"M {xi},{cy+1} C {lerp(xi,xo,.3)},{cy-ru} {lerp(xi,xo,.75)},{cy-ru} {xo},{cy-1} "
         f"C {lerp(xi,xo,.7)},{cy+rl} {lerp(xi,xo,.3)},{cy+rl} {xi},{cy+1} Z")
    lx, ly = ex.get("look_r" if s > 0 and "look_r" in ex else "look", (0, 0))
    lid = ex.get("lid_r" if s > 0 and "lid_r" in ex else "lid", 0.12)
    lid = max(lid, blink)
    if lid >= 0.97:
        return (P(f"M {xi},{cy+1} Q {cx},{cy+5} {xo},{cy-1}", sw=3.5)
                + P(f"M {lerp(xi,xo,.2)},{cy-ru-3} Q {cx},{cy-ru-6} {lerp(xi,xo,.9)},{cy-ru-2}", stroke=L["skin_dp"], sw=1.6))
    pr = ex.get("pupil", 1.0)
    inner = [E(cx + lx, cy + ly, 6.6, 6.6, L["iris"], stroke=OUT, sw=1.3),
             E(cx + lx, cy + ly, 3.0 * pr, 3.0 * pr, "#120C09", stroke=None),
             E(cx + lx - 2.3, cy + ly - 2.3, 1.8, 1.8, "#FFF", stroke=None)]
    yl = cy - ru + (ru + rl) * lid
    inner.append(R(min(xi, xo) - 3, cy - ru - 4, 32, yl - (cy - ru - 4), L["skin_sh"], stroke=None))
    sq = ex.get("eye_squint", 0)
    if sq:
        yb = cy + rl - (ru + rl) * sq
        inner.append(R(min(xi, xo) - 3, yb, 32, 30, L["skin"], stroke=None))
    o = [P(d, "#FBFAF7", stroke=None), clipped(d, "".join(inner))]
    top = max(cy - ru, yl - 2)
    o.append(P(f"M {xi},{cy+1} C {lerp(xi,xo,.3)},{top} {lerp(xi,xo,.75)},{top} {xo},{cy-1} L {xo+3*s},{cy-3}", sw=3.4))
    o.append(P(f"M {lerp(xi,xo,.15)},{cy+4} C {lerp(xi,xo,.35)},{cy+rl} {lerp(xi,xo,.7)},{cy+rl} {xo},{cy}",
               stroke=L["skin_dp"], sw=1.5))
    o.append(P(f"M {lerp(xi,xo,.25)},{cy-ru-4} Q {cx},{cy-ru-8} {lerp(xi,xo,.9)},{cy-ru-3}", stroke=L["skin_dp"], sw=1.5))
    return "".join(o)


def mouth(kind, L, m=0.0):
    lip = L["lip"]
    lower = P("M -9,139 Q 0,142 9,139", stroke=lip, sw=2.4)
    if m > 0.06:   # talking: open mouth sized by m, keeps a friendly smile
        h = 4 + 15 * m
        w = 16 + 4 * m
        shape = (f"M {-w},128 Q 0,{131-2*m} {w},128 Q {w*0.8},{128+h} 0,{130+h} Q {-w*0.8},{128+h} {-w},128 Z")
        inner = (R(-30, 122, 60, 5 + 3 * m, "#FFFFFF", stroke=None) + E(0, 131 + h, 10, 5 + 3 * m, "#C9605C", stroke=None))
        return P(shape, "#4E1E22", stroke=None) + clipped(shape, inner) + P(shape, "none", sw=3) \
            + P(f"M -8,{136+h} Q 0,{139+h} 8,{136+h}", stroke=lip, sw=2.2)
    if kind == "smile":
        return (P("M -18,127 Q 0,136 18,127", sw=3.2) + P("M 18,127 Q 21,125 22,122", sw=2.2)
                + P("M -18,127 Q -21,125 -22,122", sw=2.2) + lower)
    if kind in ("grin", "laugh"):
        h = 18 if kind == "grin" else 26
        shape = f"M -24,124 Q 0,128 24,124 Q 20,{124+h} 0,{126+h} Q -20,{124+h} -24,124 Z"
        inner = R(-30, 118, 60, 11, "#FFFFFF", stroke=None) + E(0, 126 + h, 13, 8, "#C9605C", stroke=None)
        return P(shape, "#4E1E22", stroke=None) + clipped(shape, inner) + P(shape, "none", sw=3.2)
    if kind == "sad":
        return P("M -15,134 Q 0,126 15,134", sw=3.2) + P("M -8,140 Q 0,142 8,140", stroke=lip, sw=2.4)
    if kind == "flat_down":
        return P("M -15,131 Q 0,129 15,132", sw=3.2) + P("M 15,132 L 18,135 M -15,131 L -18,134", sw=2.2) + lower
    if kind == "flat":
        return P("M -15,130 Q 0,131 15,130", sw=3.2) + lower
    if kind == "flat_side":
        return P("M -12,131 Q 2,129 16,127", sw=3.2) + lower
    if kind in ("smirk", "smirk_open"):
        return (P("M -14,130 Q 4,134 19,123", sw=3.2) + P("M 19,123 L 22,120", sw=2.2)
                + P("M -4,138 Q 4,140 11,136", stroke=lip, sw=2.4))
    if kind == "squiggle":
        return P("M -12,131 Q -6,126 0,131 Q 6,136 12,130", sw=3.2) + lower
    if kind == "o":
        return E(0, 133, 9, 12, "#4E1E22", sw=3) + E(0, 139, 5, 4, "#C9605C", stroke=None)
    return ""


def stubble(L, seed=7):
    rnd = random.Random(seed)
    zone = ("M -51,100 C -49,124 -30,149 0,153 C 30,149 49,124 51,100 C 42,114 30,120 18,121 "
            "C 12,114 -12,114 -18,121 C -30,120 -42,114 -51,100 Z")
    must = "M -19,123 Q 0,114 19,123 Q 10,121 0,122 Q -10,121 -19,123 Z"
    dots = "".join(E(round(rnd.uniform(-46, 46), 1), round(rnd.uniform(106, 156), 1), 0.55, 0.55, L["hair_ln"], stroke=None)
                   for _ in range(170))
    return (P(zone, L["hair_sh"], stroke=None, extra='opacity="0.30"') + P(must, L["hair_sh"], stroke=None, extra='opacity="0.45"')
            + clipped(zone, f'<g opacity="0.55">{dots}</g>'))


def glasses_front():
    o = [P("M -46,80 L -58,78 M 46,80 L 58,78", stroke="#241B17", sw=4)]
    for s in (-1, 1):
        x0 = 6 if s > 0 else -44
        o.append(R(x0, 70, 38, 27, "#DDEAF2", rx=6, stroke="#241B17", sw=4.5, extra='fill-opacity="0.18"'))
        o.append(P(f"M {x0+6},{75} L {x0+14},{75}", stroke="#FFFFFF", sw=2, extra='opacity="0.7"'))
    o.append(P("M -6,78 Q 0,74 6,78", stroke="#241B17", sw=4))
    return "".join(o)


def hair_front_back(L):
    st = L["hair_style"]
    if st == "sam":
        return P("M -64,30 C -76,-16 -40,-40 4,-40 C 50,-40 82,-12 74,32 C 84,60 86,96 80,120 "
                 "C 88,136 90,150 96,160 C 80,162 66,156 58,146 C 50,134 50,118 46,100 L -46,100 "
                 "C -48,122 -48,140 -56,152 C -66,162 -82,162 -94,156 C -84,148 -82,136 -82,124 "
                 "C -88,100 -80,62 -64,30 Z", L["hair_sh"])
    if st == "bun":
        return E(0, -30, 30, 26, L["hair"]) + P("M -20,-26 Q 0,-40 20,-26", stroke=L["hair_ln"], sw=2)
    if st == "long":
        return P("M -66,30 C -80,-20 -40,-46 0,-46 C 40,-46 80,-20 66,30 C 74,90 80,160 70,220 "
                 "L -70,220 C -80,160 -74,90 -66,30 Z", L["hair_sh"])
    return ""


def hair_front(L):
    st, H, S, HI, LN = L["hair_style"], L["hair"], L["hair_sh"], L["hair_hi"], L["hair_ln"]
    o = []
    if st == "sam":
        d = ("M -50,72 C -52,98 -50,120 -56,136 C -62,146 -74,146 -82,138 C -72,136 -68,128 -68,118 "
             "C -76,108 -78,92 -70,80 C -78,64 -76,40 -66,22 C -70,4 -58,-14 -40,-24 C -36,-36 -20,-40 -10,-34 "
             "C 0,-46 22,-46 30,-36 C 46,-40 62,-28 66,-10 C 76,4 78,24 72,40 C 80,56 80,76 72,90 "
             "C 78,104 78,122 72,132 C 80,140 82,146 88,150 C 74,154 62,148 56,138 C 54,116 52,92 48,72 "
             "C 46,54 40,40 30,30 C 22,20 14,14 8,8 C 0,14 -14,20 -26,26 C -38,34 -46,50 -50,72 Z")
        o.append(P(d, H))
        o.append(clipped(d, P("M 24,-60 C 60,-20 76,30 70,140 L 120,140 L 120,-60 Z", S, stroke=None)
                         + P("M -70,60 C -60,80 -56,110 -60,150 L -100,150 L -100,60 Z", S, stroke=None, extra='opacity="0.7"')))
        for dd in ("M 8,8 C -4,-6 -20,-16 -40,-12", "M 8,8 C 20,-2 38,-6 54,4", "M -14,0 C -30,-8 -46,4 -54,30",
                   "M -54,40 C -62,62 -62,90 -64,116", "M 56,60 C 64,84 66,108 64,134", "M -60,100 C -66,120 -70,132 -76,140", "M 62,110 C 68,126 74,138 80,146", "M -2,-26 C 20,-28 42,-18 56,6"):
            o.append(P(dd, stroke=LN, sw=2))
        for dd in ("M -6,-4 C -18,-14 -32,-16 -44,-8", "M 18,-2 C 30,-8 42,-6 50,4", "M 52,20 C 58,34 60,50 60,66"):
            o.append(P(dd, stroke=HI, sw=3.5))
    elif st == "bun":
        d = ("M -56,74 C -62,22 -34,-6 0,-6 C 34,-6 62,22 56,74 C 52,58 48,46 40,40 "
             "C 26,30 10,30 2,36 C -8,30 -26,30 -40,40 C -48,46 -52,58 -56,74 Z")
        o.append(P(d, H))
        o.append(clipped(d, P("M 10,-20 C 40,0 60,30 60,80 L 100,80 L 100,-20 Z", S, stroke=None)))
        o.append(P("M 2,36 C 0,20 0,6 0,-4", stroke=LN, sw=2))
        o.append(P("M -30,10 C -20,0 -8,-4 0,-4 M 30,10 C 20,0 8,-4 0,-4", stroke=HI, sw=3))
    elif st == "short":
        d = ("M -58,72 C -66,30 -50,-10 -10,-18 C 30,-26 64,-4 60,72 C 56,56 52,44 44,38 "
             "C 30,30 14,28 0,32 C -14,28 -32,30 -44,38 C -52,44 -56,56 -58,72 Z")
        o.append(P(d, H))
        o.append(P("M -30,6 C -18,-6 4,-12 26,-8", stroke=HI, sw=3))
    elif st == "cap":
        o.append(P("M -58,74 C -60,52 -58,40 -54,34 L 54,34 C 58,40 60,52 58,74 C 54,60 50,50 44,44 L -44,44 "
                   "C -50,50 -54,60 -58,74 Z", H))
        o.append(P("M -60,40 C -62,-4 -30,-20 0,-20 C 30,-20 62,-4 60,40 Z", "#2B3A55"))
        o.append(P("M -64,40 C -30,30 30,30 64,40 C 56,52 -56,52 -64,40 Z", "#1F2B41"))
        o.append(E(0, 10, 12, 10, "#D9B25A", sw=2.5))
    elif st == "curly":
        bumps = " ".join(f"A 12,12 0 0 1 {x},{y}" for x, y in ((-50, 30), (-44, 8), (-30, -8), (-10, -16), (12, -16),
                                                               (32, -8), (46, 8), (54, 30), (58, 60)))
        d = f"M -58,62 {bumps} C 50,46 40,38 28,36 C 10,30 -10,30 -28,36 C -40,40 -50,48 -58,62 Z"
        o.append(P(d, H))
    elif st == "long":
        d = ("M -58,80 C -66,20 -40,-12 0,-12 C 40,-12 66,20 58,80 C 52,60 44,44 30,36 "
             "C 16,30 -6,30 -20,36 C -36,44 -50,60 -58,80 Z")
        o.append(P(d, H))
    return "".join(o)


def head_front(L, ex_name="neutral", m=0.0, blink=0.0, tilt=0.0):
    ex = EXPR[ex_name]
    face = HEAD_M if L["face"] == "m" else HEAD_F
    o = [hair_front_back(L)]
    for s in (-1, 1):
        o.append(P(f"M {55*s},70 C {67*s},62 {74*s},74 {71*s},88 C {69*s},100 {63*s},110 {54*s},106 Z", L["skin"]))
        o.append(P(f"M {58*s},76 C {65*s},74 {67*s},84 {62*s},96", stroke=L["skin_dp"], sw=2))
    shade = (P("M 32,-10 C 60,40 58,110 18,170 L 120,170 L 120,-10 Z", L["skin_sh"], stroke=None)
             + P("M -60,46 C -30,60 20,58 60,44 L 60,20 L -60,20 Z", L["skin_sh"], stroke=None, extra='opacity="0.55"')
             + E(-28, 104, 12, 8, L["skin_hi"], stroke=None, extra='opacity="0.5"'))
    o.append(P(face, L["skin"], stroke=None) + clipped(face, shade) + P(face, "none"))
    if L.get("stubble"):
        o.append(stubble(L))
    if L["face"] == "f" and L.get("earring", True):
        o.append(E(-58, 104, 3, 3, "#E2C46B", sw=1.5) + E(58, 104, 3, 3, "#E2C46B", sw=1.5))
    o.append(hair_front(L))
    thick = 1.25 if L["face"] == "m" else 0.85
    o.append(brow_shape(-1, *ex["brow"], L["brow"], thick))
    o.append(brow_shape(1, *ex.get("brow_r", ex["brow"]), L["brow"], thick))
    o.append(eye(-23, 84, -1, ex, L, blink))
    o.append(eye(23, 84, 1, ex, L, blink))
    if L["face"] == "f":
        for s in (-1, 1):
            o.append(P(f"M {(23+13)*s},{82} L {(23+17)*s},{78}", sw=2.4))
    o.append(P("M 7,78 C 9,92 11,100 12,108", stroke=L["skin_sh"], sw=2.6))
    o.append(P("M -11,111 C -13,118 -7,120 -3,117 Q 0,119 3,117 C 7,120 13,118 11,111", sw=2.8))
    if ex.get("blush"):
        o.append(E(-34, 112, 10, 5, "#EE9C86", stroke=None, extra='opacity="0.55"')
                 + E(34, 112, 10, 5, "#EE9C86", stroke=None, extra='opacity="0.55"'))
    o.append(mouth(ex["mouth"], L, m))
    if L.get("glasses"):
        o.append(glasses_front())
    g = "".join(o)
    if tilt:
        g = f'<g transform="rotate({tilt} 0 150)">{g}</g>'
    return g


def head_profile(L, ex_name="neutral", m=0.0, blink=0.0):
    """Facing left."""
    head = ("M 6,0 C 42,0 64,26 62,64 C 61,90 54,110 42,124 C 34,128 26,130 20,130 "
            "C 10,142 -12,154 -34,154 C -44,154 -50,150 -50,144 C -51,140 -50,138 -52,134 "
            "C -56,132 -57,129 -54,126 C -57,123 -58,120 -56,117 C -57,114 -57,112 -56,110 "
            "C -62,109 -68,107 -69,103 C -70,98 -64,90 -57,80 C -55,74 -56,68 -57,62 "
            "C -58,26 -32,0 6,0 Z")
    o = []
    st = L["hair_style"]
    if st == "sam":
        o.append(P("M -40,-20 C 0,-50 70,-40 80,20 C 90,70 86,120 70,150 C 60,160 46,156 40,146 "
                   "C 30,120 20,90 0,70 Z", L["hair_sh"]))
    if st == "long":
        o.append(P("M -40,-20 C 0,-50 70,-40 80,20 C 90,80 88,140 80,180 L 24,180 C 22,140 12,100 0,70 Z", L["hair_sh"]))
    shade = (P("M -40,124 C -10,146 20,140 40,120 L 60,170 L -60,170 Z", L["skin_sh"], stroke=None)
             + P("M 20,0 C 60,40 60,100 30,140 L 80,140 L 80,0 Z", L["skin_sh"], stroke=None))
    o.append(P(head, L["skin"], stroke=None) + clipped(head, shade) + P(head, "none"))
    if L.get("stubble"):
        rnd = random.Random(3)
        z = "M -52,118 C -50,140 -40,152 -30,154 C -10,152 8,144 20,130 C 10,128 0,120 -8,112 C -20,116 -40,118 -52,118 Z"
        o.append(P(z, L["hair_sh"], stroke=None, extra='opacity="0.25"')
                 + clipped(z, "".join(E(rnd.uniform(-50, 20), rnd.uniform(114, 152), 0.9, 0.9, L["hair_sh"], stroke=None)
                                      for _ in range(40))))
    o.append(P("M 8,72 C 22,62 34,74 32,90 C 30,104 20,112 10,106 Z", L["skin"]))
    o.append(P("M 13,78 C 22,78 24,90 18,100", stroke=L["skin_dp"], sw=2))
    if st == "sam":
        d = ("M -52,34 C -56,0 -30,-34 12,-36 C 54,-38 80,-8 78,40 C 78,74 76,104 68,132 "
             "C 62,148 48,150 42,140 C 46,120 44,96 36,80 C 32,70 24,62 16,58 "
             "C 8,40 -6,26 -22,22 C -34,20 -46,26 -52,34 Z")
        o.append(P(d, L["hair"]))
        o.append(clipped(d, P("M 30,-60 C 80,-20 96,60 80,160 L 120,160 L 120,-60 Z", L["hair_sh"], stroke=None)))
        for dd in ("M -40,10 C -26,-14 2,-26 34,-24", "M -20,34 C -6,14 22,4 50,8", "M 40,30 C 56,50 62,80 60,120",
                   "M 20,56 C 34,70 40,90 40,116"):
            o.append(P(dd, stroke=L["hair_ln"], sw=2))
        o.append(P("M -30,-4 C -14,-22 10,-28 30,-26", stroke=L["hair_hi"], sw=3.5))
    elif st == "long":
        d = ("M -54,58 C -62,14 -30,-30 14,-32 C 56,-34 80,-4 78,40 C 78,90 76,140 70,176 "
             "C 60,184 48,180 44,170 C 46,130 40,100 30,74 C 20,60 4,50 -10,48 C -30,46 -44,52 -54,58 Z")
        o.append(P(d, L["hair"]))
        o.append(clipped(d, P("M 30,-60 C 80,-20 96,60 80,230 L 120,230 L 120,-60 Z", L["hair_sh"], stroke=None)))
    o.append(P("M -52,62 Q -44,54 -30,58 Q -42,59 -52,64 Z", L["brow"], stroke=L["brow"], sw=2))
    ey = "M -52,80 Q -44,74 -34,79 Q -40,90 -50,88 Z"
    if blink >= 0.9:
        o.append(P("M -52,82 Q -44,86 -34,81", sw=3))
    else:
        o.append(P(ey, "#FBFAF7", stroke=None) + clipped(ey, E(-46, 82, 5.5, 6.5, L["iris"], stroke=OUT, sw=1.2)
                                                            + E(-47, 82, 2.6, 2.6, "#120C09", stroke=None)))
        o.append(P("M -54,80 Q -44,72 -33,78", sw=3.4))
    if m > 0.06:
        h = 3 + 9 * m
        o.append(P(f"M -56,124 Q -50,{124+h} -42,{125+h*0.6} L -44,124 Z", "#4E1E22", sw=2.4))
    else:
        o.append(P("M -55,126 Q -50,128 -44,126", sw=2.6))
    if L.get("glasses"):
        o.append(R(-60, 70, 22, 25, "#DDEAF2", rx=5, stroke="#241B17", sw=4.5, extra='fill-opacity="0.18"'))
        o.append(P("M -38,78 L 14,78", stroke="#241B17", sw=4))
    if L["face"] == "f":
        o.append(E(16, 110, 3, 3, "#E2C46B", sw=1.5))
    return "".join(o)


# ============================ BODIES ============================
def boot(x, y, ang, L, view):
    if view == "front":
        d = "M -27,-14 C -31,10 -33,30 -30,44 C -20,52 20,52 30,44 C 33,30 31,10 27,-14 Z"
        det = (P("M -30,40 C -14,46 14,46 30,40", stroke=L["sole"], sw=5)
               + P("M 14,-10 L 18,22", stroke=L["shoe_sh"], sw=3))
    else:
        d = ("M -16,-16 L 20,-16 C 24,4 26,26 24,42 L -56,42 C -64,32 -60,18 -44,12 "
             "C -32,8 -22,0 -16,-16 Z")
        det = P("M -58,38 L 24,38", stroke=L["sole"], sw=6) + P("M 2,-12 L 6,20", stroke=L["shoe_sh"], sw=3)
    return f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang})">' + P(d, L["shoe"]) + det + "</g>"


def legs(L, hips, angles, pelvis, view="front", far_dark=False):
    th, sh = L["leg"]
    parts, ankles = [], []
    for (hx, hy), (at, ash, af) in zip(hips, angles):
        (x0, y0), (x1, y1), (x2, y2) = fk(hx, hy, [at, ash], [th, sh])
        parts.append([(f"translate({x0:.1f},{y0:.1f}) rotate({at})", limb(th, 80, 60, bo=6, bi=4)),
                      (f"translate({x1:.1f},{y1:.1f}) rotate({ash})", limb(sh, 58, 46, bo=5, bi=2))])
        ankles.append((x2, y2, af))
    o = []
    if far_dark:
        o.append(union_group(parts[0], L["pants_sh"]))
        o.append(boot(*ankles[0], L, view))
        parts, ankles = parts[1:], ankles[1:]
    flat = [p for leg in parts for p in leg] + ([("", pelvis)] if pelvis else [])
    o.append(union_group(flat, L["pants"], L["pants_sh"]))
    for leg in parts:
        o.append(f'<g transform="{leg[1][0]}">' + P("M -14,-4 Q 0,4 14,-6", stroke=L["pants_sh"], sw=2.4) + "</g>")
    for a in ankles:
        o.append(boot(*a, L, view))
    return "".join(o)


def arm(L, sx, sy, a_up, a_fore, a_hand, s, hand_kind="relaxed", held=None, dark=False):
    """s=-1 arm on viewer-left, +1 on viewer-right. Sleeved (long sleeves) unless outfit says otherwise."""
    up, fo = L["arm"]
    (x0, y0), (x1, y1), (x2, y2) = fk(sx, sy, [a_up, a_fore], [up, fo])
    tf_u = f"translate({x0:.1f},{y0:.1f}) rotate({a_up})"
    tf_f = f"translate({x1:.1f},{y1:.1f}) rotate({a_fore})"
    tf_h = f"translate({x2:.1f},{y2:.1f}) rotate({a_hand})"
    hs = -s if hand_kind != "relaxed" else s
    hparts, hdet = hand(hand_kind, hs, 1.1, L["skin"], L["skin_dp"], tf_h)
    sleeve_col = L["top_sh"] if dark else L["top"]
    skin = L["skin_sh"] if dark else L["skin"]
    o = []
    short = L["outfit"] in ("vest",) and False
    o.append(union_group(hparts, skin, None))
    o.append(hdet)
    if held:
        o.append(f'<g transform="{tf_h}">{prop(held)}</g>')
    if L.get("watch") and s > 0:
        o.append(f'<g transform="{tf_f}">' + R(-19, fo - 8, 38, 12, "#7B4B2B", rx=4, sw=2)
                 + E(0, fo - 2, 9, 8, "#ECE6D8", sw=2) + "</g>")
    sparts = [(tf_u, limb(up, 58, 48, bo=8, bi=4)), (tf_f, limb(fo, 48, 42, bo=4, bi=1))]
    o.append(union_group(sparts, sleeve_col, None if dark else L["top_sh"], shade_x=10))
    o.append(f'<g transform="{tf_f}">' + P(f"M -20,{fo-10} Q 0,{fo-4} 20,{fo-10}", stroke=L["top_sh"], sw=2.4)
             + P(f"M {-10*s},20 Q {-16*s},60 {-12*s},{fo-30}", stroke=L["top_sh"], sw=2) + "</g>")
    o.append(f'<g transform="{tf_u}">' + P(f"M {12*s},30 Q {18*s},80 {14*s},{up-20}", stroke=L["top_sh"], sw=2) + "</g>")
    return "".join(o)


TORSO_INNER = ("M -34,190 C -60,198 -100,204 -112,214 L -98,600 L 98,600 L 112,214 "
               "C 100,204 60,198 34,190 C 22,204 -22,204 -34,190 Z")


def torso_front(L, breathe=0.0):
    o = []
    oc = L["outfit"]
    inner, inner_sh, top, top_sh, top_hi = L["inner"], L["inner_sh"], L["top"], L["top_sh"], L["top_hi"]
    if oc == "blazer":
        o.append(P(TORSO_INNER, inner) + clipped(TORSO_INNER, P("M 40,180 L 120,180 L 120,620 L 50,620 Z", inner_sh, stroke=None)))
        o.append(P("M -34,190 C -22,206 22,206 34,190", sw=SW))
        o.append(P("M -60,410 Q 0,426 60,410", stroke=inner_sh, sw=2))
        for s in (-1, 1):
            panel = (f"M {-38*s},194 C {-70*s},198 {-104*s},206 {-118*s},218 C {-128*s},232 {-130*s},252 {-126*s},272 "
                     f"L {-120*s},420 C {-118*s},500 {-116*s},560 {-114*s},616 C {-84*s},626 {-54*s},626 {-26*s},620 "
                     f"C {-28*s},560 {-30*s},500 {-30*s},446 C {-34*s},380 {-40*s},300 {-44*s},246 Z")
            o.append(P(panel, top))
            if s > 0:
                o.append(clipped(panel, P("M 60,180 C 90,300 84,450 96,640 L 160,640 L 160,180 Z", top_sh, stroke=None)))
            else:
                o.append(clipped(panel, P("M -110,220 C -100,212 -80,206 -60,204", stroke=top_hi, sw=6)))
            o.append(P(panel, "none"))
            lapel = (f"M {-30*s},444 L {-80*s},266 L {-62*s},254 L {-68*s},238 L {-44*s},204 "
                     f"C {-42*s},262 {-36*s},352 {-30*s},444 Z")
            o.append(P(lapel, top_sh if s > 0 else top))
            o.append(P(f"M {-104*s},528 L {-58*s},530 L {-58*s},544 L {-104*s},542 Z", "none", stroke=top_sh, sw=2.4))
            o.append(E(-26 * s, 470, 4, 4, "#1A2236", stroke=None) if s < 0 else "")
        o.append(P("M 66,316 L 100,312", stroke=L["top_sh"], sw=2.4))
    elif oc in ("vest", "tie", "guard", "sweater"):
        shirt = ("M -34,190 C -60,198 -100,204 -112,214 C -122,230 -124,250 -120,272 L -106,420 "
                 "C -104,480 -100,540 -100,600 L 100,600 C 100,540 104,480 106,420 L 120,272 "
                 "C 124,250 122,230 112,214 C 100,204 60,198 34,190 C 22,204 -22,204 -34,190 Z")
        base = top if oc in ("tie", "guard", "sweater") else inner
        base_sh = top_sh if oc in ("tie", "guard", "sweater") else inner_sh
        o.append(P(shirt, base) + clipped(shirt, P("M 50,180 C 80,300 74,450 86,620 L 160,620 L 160,180 Z", base_sh, stroke=None))
                 + P(shirt, "none"))
        if oc in ("vest", "tie", "guard"):
            o.append(P("M -34,190 L -12,226 L 0,212 L 12,226 L 34,190", base, sw=2.6))
        else:
            o.append(P("M -34,190 C -22,206 22,206 34,190", sw=SW))
            o.append(P("M -100,580 L 100,580", stroke=base_sh, sw=4))
        if oc == "tie":
            o.append(P("M -8,214 L 8,214 L 12,226 L 16,420 L 0,444 L -16,420 L -12,226 Z", inner))
        if oc == "vest":
            v = ("M -100,236 C -96,320 -94,420 -96,560 L -10,580 L -6,560 L -40,280 L -64,214 Z "
                 "M 100,236 C 96,320 94,420 96,560 L 10,580 L 6,560 L 40,280 L 64,214 Z")
            o.append(P(v, top))
            o.append(P("M 40,280 L 6,560 L 10,580 L 96,560 C 94,420 96,320 100,236 L 64,214 Z", top_sh, stroke=None, extra='opacity="0.5"'))
            for y in (440, 490, 540):
                o.append(E(-4, y, 3.5, 3.5, "#C9B27A", sw=1.4))
        if oc == "guard":
            o.append(R(48, 280, 40, 46, "#D9B25A", rx=6, sw=2.4) + R(-90, 300, 44, 8, "#2A2E36", stroke=None))
            o.append(R(-100, 560, 200, 24, "#1F1F22", sw=2.4) + R(-12, 562, 24, 20, "#B9A15B", rx=2, sw=2))
        if L.get("badge"):
            o.append(R(-90, 300, 50, 22, "#FFFFFF", rx=3, sw=2) + R(-86, 304, 18, 14, L["top"], stroke=None))
    elif oc == "coat":
        o.append(P(TORSO_INNER, inner))
    return "".join(o)


NECK = "M -26,126 L -30,200 L 30,200 L 26,126 Z"
PELVIS = "M -96,540 C -98,570 -98,590 -92,620 L 0,630 L 92,620 C 98,590 98,570 96,540 Z"

DEFAULT_FRONT = dict(lu=8, lf=4, lh=4, lhand="relaxed", lheld=None,
                     ru=-8, rf=-4, rh=-4, rhand="relaxed", rheld=None,
                     legs=[(3, 1, 0), (-3, -1, 0)], tilt=0.0, bob=0.0)


def character_front(L, pose=None, ex="neutral", m=0.0, blink=0.0, x=0, y=0, scale=1.0, upper_only=False):
    p = dict(DEFAULT_FRONT, **(pose or {}))
    k = L["k"] * scale
    sh = L["shoulder"]
    o = []
    if not upper_only:
        o.append(legs(L, [(-L["hip"], 576), (L["hip"], 576)], p["legs"], PELVIS))
    o.append(P(NECK, L["skin"]) + clipped(NECK, P("M -40,130 Q 0,172 40,130 L 40,200 L -40,200 Z", L["skin_sh"], stroke=None))
             + P(NECK, "none"))
    o.append(torso_front(L))
    o.append(arm(L, -sh, 238, p["lu"], p["lf"], p["lh"], -1, p["lhand"], p["lheld"]))
    o.append(arm(L, sh, 238, p["ru"], p["rf"], p["rh"], 1, p["rhand"], p["rheld"]))
    o.append(f'<g transform="translate(0,{p["bob"]})">{head_front(L, ex, m, blink, p["tilt"])}</g>')
    return f'<g transform="translate({x:.1f},{y:.1f}) scale({k:.4f})">' + "".join(o) + "</g>"


DEFAULT_PROFILE = dict(au=0, af=6, ah=6, hand="relaxed", held=None, far=(0, 6, 6), legs=[(0, 0, 0), (0, 0, 0)], bob=0.0)


def torso_profile(L):
    t = ("M -30,190 C -62,198 -80,230 -82,270 C -84,300 -74,330 -66,360 C -60,420 -62,470 -64,530 "
         "C -20,540 30,540 52,530 C 54,470 56,420 60,360 C 66,320 70,270 62,236 C 54,206 42,194 30,190 Z")
    o = [P(t, L["inner"])]
    if L["outfit"] in ("blazer", "coat"):
        jacket = ("M -26,196 C -50,210 -66,236 -76,270 C -82,300 -76,330 -70,360 C -66,440 -70,540 -74,620 "
                  "C -30,630 30,630 60,620 C 58,540 58,450 62,360 C 68,320 72,270 64,236 C 56,208 44,196 30,192 Z")
        o.append(P(jacket, L["top"]) + clipped(jacket, P("M 20,180 C 40,300 30,450 40,640 L 120,640 L 120,180 Z", L["top_sh"], stroke=None))
                 + P(jacket, "none"))
        o.append(P("M -26,196 C -36,250 -46,320 -60,446", stroke=L["top_sh"], sw=3))
        o.append(P("M -62,446 L -66,620", stroke=L["top_sh"], sw=2.4))
        o.append(P("M -50,530 L -10,532", stroke=L["top_sh"], sw=2.4))
    return "".join(o)


def character_profile(L, pose=None, ex="neutral", m=0.0, blink=0.0, x=0, y=0, scale=1.0, facing=-1):
    """facing=-1 looks left, +1 looks right (mirrored)."""
    p = dict(DEFAULT_PROFILE, **(pose or {}))
    k = L["k"] * scale
    o = [arm(L, 6, 240, *p["far"], 1, "relaxed", None, dark=True)]
    o.append(legs(L, [(6, 576), (-4, 576)], p["legs"],
                  "M -66,520 C -68,560 -62,590 -46,620 L 42,620 C 54,590 56,560 52,520 Z", view="side", far_dark=True))
    o.append(P("M -28,140 L -30,200 L 34,200 L 34,128 Z", L["skin"]) )
    o.append(torso_profile(L))
    o.append(arm(L, -4, 240, p["au"], p["af"], p["ah"], -1, p["hand"], p["held"]))
    o.append(f'<g transform="translate(0,{p["bob"]})">{head_profile(L, ex, m, blink)}</g>')
    sx = k * (-facing if facing == 1 else 1)
    sx = -k if facing == 1 else k
    return f'<g transform="translate({x:.1f},{y:.1f}) scale({sx:.4f},{k:.4f})">' + "".join(o) + "</g>"
