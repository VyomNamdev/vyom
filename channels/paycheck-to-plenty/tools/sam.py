"""Sam, the Paycheck to Plenty mascot, drawn as SVG (House Style A).

Builds the reference sheets used to keep Sam on-model in every scene:
  python3 tools/sam.py   -> channel-bible/characters/*.svg
Render to PNG with tools/render.js.
"""
from pathlib import Path

# ---------- locked palette (House Style A) ----------
OUT = "#1E2433"      # outline
SW = 5               # outline width
SKIN, SKIN_SH = "#EDB892", "#D79B74"
HAIR, HAIR_SH = "#4A3426", "#35251B"
HOOD, HOOD_SH, HOOD_LT = "#2B4170", "#1F3157", "#3A5590"
STRING = "#F6F3EA"
PANTS, PANTS_SH = "#C7AE86", "#AD9269"
SHOE, SOLE, MINT = "#F7F4EC", "#D8D2C4", "#5FCB9F"
IRIS = "#6B4226"
MOUTH, TONGUE, TEETH = "#6E2A2E", "#E07A72", "#FFFFFF"
BLUSH, TEAR, RED = "#F29B8A", "#8FD0F0", "#E5534B"
BG, MINT_BG, YELLOW = "#FBF8F1", "#DDF3E8", "#F7C948"

_uid = [0]


def uid(p="c"):
    _uid[0] += 1
    return f"{p}{_uid[0]}"


def P(d, fill="none", stroke=OUT, sw=SW, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return (f'<path d="{d}" fill="{fill}"{s} stroke-linecap="round" '
            f'stroke-linejoin="round" {extra}/>')


def E(cx, cy, rx, ry, fill, stroke=OUT, sw=SW, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{s} {extra}/>'


def mirror(svg):
    return f'<g transform="scale(-1,1)">{svg}</g>'


# ---------- FRONT HEAD ----------
HEAD_F = ("M 0,0 C 40,0 64,28 64,72 C 64,100 56,122 40,138 C 28,149 14,154 0,154 "
          "C -14,154 -28,149 -40,138 C -56,122 -64,100 -64,72 C -64,28 -40,0 0,0 Z")
HAIR_F = ("M -66,84 C -76,40 -60,2 -28,-12 C -8,-22 24,-24 46,-12 C 70,2 78,40 66,84 "
          "C 62,70 60,58 56,46 C 50,56 38,58 30,50 C 22,60 6,62 -4,52 "
          "C -14,62 -32,62 -40,50 C -48,58 -56,62 -60,70 C -62,74 -64,78 -66,84 Z")
COWLICK_F = "M 4,-18 C 8,-40 30,-46 38,-34 C 26,-34 18,-28 16,-14 Z"


def eye(cx, cy, s, ex):
    """One eye. s = +1 (viewer right) / -1 (viewer left). ex = expression dict."""
    kind = ex.get("eye", "open")
    out = []
    if kind == "happy":       # closed ^ arcs
        return P(f"M {cx-12*s},{cy+3} Q {cx},{cy-11} {cx+12*s},{cy+3}", sw=5)
    if kind == "closed":      # relieved / content
        return P(f"M {cx-12*s},{cy-1} Q {cx},{cy+8} {cx+12*s},{cy-1}", sw=5)
    rx, ry = ex.get("eye_r", (11, 12))
    clip = uid("eye")
    sclera = f"M {cx-rx},{cy} A {rx},{ry} 0 1,0 {cx+rx},{cy} A {rx},{ry} 0 1,0 {cx-rx},{cy} Z"
    out.append(f'<clipPath id="{clip}"><path d="{sclera}"/></clipPath>')
    out.append(P(sclera, "#FFFFFF", sw=3))
    lx, ly = ex.get("look", (0, 0))
    if s > 0 and "look_r" in ex:
        lx, ly = ex["look_r"]
    pr = ex.get("pupil", 1.0)
    g = [E(cx + lx, cy + 1 + ly, 7.5 * pr, 7.5 * pr, IRIS, stroke=None),
         E(cx + lx, cy + 1 + ly, 3.6 * pr, 3.6 * pr, "#1A1410", stroke=None),
         E(cx + lx - 2.4, cy - 2 + ly, 2.3, 2.3, "#FFFFFF", stroke=None)]
    lid = ex.get("lid", 0.0)          # 0 = open, 1 = shut (upper lid)
    if s > 0 and "lid_r" in ex:
        lid = ex["lid_r"]
    if lid:
        ytop = cy - ry - 2
        yl = cy - ry + 2 * ry * lid
        g.append(f'<rect x="{cx-rx-3}" y="{ytop}" width="{2*rx+6}" height="{yl-ytop}" fill="{SKIN}"/>')
    blid = ex.get("blid", 0.0)        # lower lid push-up (squint / sad)
    if blid:
        yb = cy + ry - 2 * ry * blid
        g.append(f'<rect x="{cx-rx-3}" y="{yb}" width="{2*rx+6}" height="{ry*2}" fill="{SKIN}"/>')
    out.append(f'<g clip-path="url(#{clip})">{"".join(g)}</g>')
    # outline again on top so the clipped lids keep a clean edge
    out.append(P(sclera, "none", sw=3))
    if lid:
        yl = cy - ry + 2 * ry * lid
        out.append(P(f"M {cx-rx-2},{yl+1} Q {cx},{yl-3} {cx+rx+2},{yl+1}", sw=4.5))
    else:
        out.append(P(f"M {cx-rx-1},{cy-2} Q {cx},{cy-ry-5} {cx+rx+1},{cy-2}", sw=4.5))
    if blid:
        yb = cy + ry - 2 * ry * blid
        out.append(P(f"M {cx-rx},{yb} Q {cx},{yb+3} {cx+rx},{yb}", sw=3))
    return "".join(out)


EXPRESSIONS = {
    # brows: (outer_y, mid_y, inner_y) for viewer-left brow; mirrored unless brow_r given
    "neutral":  dict(brow=(71, 63, 66), mouth="neutral"),
    "worried":  dict(brow=(74, 67, 58), mouth="worried", look=(-2, 1), pupil=0.9, sweat=True),
    "happy":    dict(brow=(66, 56, 62), eye="happy", mouth="grin", blush=True),
    "sad":      dict(brow=(76, 70, 60), mouth="sad", look=(0, 4), lid=0.35, tear=True),
    "angry":    dict(brow=(62, 68, 80), mouth="teeth", lid=0.38, vein=True, pupil=0.85),
    "grumpy":   dict(brow=(72, 74, 78), mouth="grumpy", lid=0.5, look=(3, 1)),
    "shocked":  dict(brow=(58, 46, 52), eye_r=(13, 15), pupil=0.7, mouth="o", lines=True),
    "smug":     dict(brow=(70, 68, 72), brow_r=(52, 56, 64), lid=0.45, look=(4, 0),
                     look_r=(4, 0), mouth="smirk", blush=True),
    "confused": dict(brow=(72, 66, 68), brow_r=(56, 52, 60), look=(-4, -4), mouth="squiggle",
                     question=True),
    "relieved": dict(brow=(70, 62, 64), eye="closed", mouth="relief", sigh=True),
}


def brow(vals, s):
    o, m, i = vals
    xo, xm, xi = 46 * s, 31 * s, 15 * s
    return P(f"M {xo},{o} Q {xm},{m - 4} {xi},{i}", stroke=HAIR, sw=8)


def mouth(kind):
    if kind == "neutral":
        return P("M -14,130 Q -5,126 3,129 Q 9,131 14,127", sw=4)
    if kind == "worried":
        return P("M -17,133 Q -9,125 -1,130 Q 7,135 17,128", sw=4)
    if kind == "sad":
        return P("M -16,136 Q 0,122 16,136", sw=4.5)
    if kind == "grumpy":
        return P("M -15,133 Q -2,128 15,135", sw=4.5) + P("M 15,135 L 19,138", sw=3.5)
    if kind == "smirk":
        return P("M -12,131 Q 6,136 19,121", sw=4.5) + P("M 19,121 L 22,124", sw=3)
    if kind == "squiggle":
        return P("M -12,131 Q -6,126 0,131 Q 6,136 12,130", sw=4)
    if kind == "relief":
        return P("M -13,128 Q 0,138 13,128", sw=4.5)
    if kind == "o":
        return (E(0, 132, 10, 13, MOUTH, sw=4) + E(0, 139, 6, 4, TONGUE, stroke=None))
    if kind == "grin":
        clip = uid("m")
        shape = "M -27,119 Q 0,121 27,119 Q 24,148 0,150 Q -24,148 -27,119 Z"
        return (f'<clipPath id="{clip}"><path d="{shape}"/></clipPath>'
                + P(shape, MOUTH, sw=0, stroke=None)
                + f'<g clip-path="url(#{clip})"><rect x="-30" y="115" width="60" height="11" fill="{TEETH}"/>'
                + E(0, 151, 15, 9, TONGUE, stroke=None) + "</g>" + P(shape, "none", sw=4.5))
    if kind == "teeth":
        clip = uid("m")
        shape = "M -22,124 Q 0,119 22,124 L 20,138 Q 0,142 -20,138 Z"
        return (f'<clipPath id="{clip}"><path d="{shape}"/></clipPath>'
                + P(shape, TEETH, sw=0, stroke=None)
                + f'<g clip-path="url(#{clip})">'
                + "".join(P(f"M {x},118 L {x},144", sw=2) for x in (-12, -4, 4, 12))
                + P("M -24,131 Q 0,129 24,131", sw=2.5) + "</g>" + P(shape, "none", sw=4.5))
    return ""


def head_front(exname="neutral"):
    ex = EXPRESSIONS[exname]
    clip = uid("head")
    o = [f'<clipPath id="{clip}"><path d="{HEAD_F}"/></clipPath>']
    # ears
    for s in (-1, 1):
        o.append(E(64 * s, 86, 11, 17, SKIN))
        o.append(P(f"M {64*s - 2*s},{76} Q {70*s},{86} {63*s},{96}", sw=3))
    o.append(P(HEAD_F, SKIN, stroke=None))
    # cel shade: right side of face + under the fringe
    o.append(f'<g clip-path="url(#{clip})">'
             + P("M 44,-10 C 72,40 70,112 26,170 L 120,170 L 120,-10 Z", SKIN_SH, stroke=None)
             + P("M -70,60 C -40,72 -10,74 10,64 C 30,72 50,70 70,58 L 70,40 L -70,40 Z",
                 SKIN_SH, stroke=None, extra='opacity="0.55"')
             + "</g>")
    o.append(P(HEAD_F, "none"))
    # hair
    o.append(P(HAIR_F, HAIR))
    o.append(P("M 20,-16 C 40,-10 58,8 62,38 C 54,24 40,10 20,-16 Z", HAIR_SH, stroke=None))
    o.append(P(COWLICK_F, HAIR))
    o.append(P("M -30,-4 C -20,8 -8,12 4,10", stroke=HAIR_SH, sw=3))
    # brows
    o.append(brow(ex["brow"], -1))
    o.append(brow(ex.get("brow_r", ex["brow"]), 1))
    # eyes
    o.append(eye(-28, 89, -1, ex))
    o.append(eye(28, 89, 1, ex))
    # nose
    o.append(P("M -2,97 Q -7,110 -1,115 Q 5,116 9,111", sw=3.5))
    if ex.get("blush"):
        o.append(E(-40, 114, 11, 6, BLUSH, stroke=None, extra='opacity="0.7"'))
        o.append(E(40, 114, 11, 6, BLUSH, stroke=None, extra='opacity="0.7"'))
    o.append(mouth(ex["mouth"]))
    # extras
    if ex.get("sweat"):
        o.append(P("M 72,40 C 64,54 64,64 72,66 C 80,64 80,54 72,40 Z", TEAR, sw=3))
    if ex.get("tear"):
        o.append(P("M -30,104 C -36,118 -36,126 -30,128 C -24,126 -24,118 -30,104 Z", TEAR, sw=3))
    if ex.get("vein"):
        for d in ("M 36,24 Q 44,30 42,38", "M 50,22 Q 48,30 56,34",
                  "M 36,46 Q 44,40 42,34", "M 56,46 Q 50,40 54,34"):
            o.append(P(d, stroke=RED, sw=5))
    if ex.get("lines"):
        for d in ("M -86,20 L -100,6", "M -92,48 L -110,44", "M 86,20 L 100,6", "M 92,48 L 110,44"):
            o.append(P(d, sw=5))
    if ex.get("question"):
        o.append(f'<text x="80" y="20" font-family="Inter" font-weight="900" font-size="64" '
                 f'fill="{HOOD}" stroke="{OUT}" stroke-width="2">?</text>')
    if ex.get("sigh"):
        for cx, cy, r in ((32, 140, 5), (44, 134, 7), (60, 126, 9)):
            o.append(E(cx, cy, r, r, "#DCEBF7", stroke="#9BB7D4", sw=3))
    return "".join(o)


# ---------- FRONT BODY ----------
def body_front():
    o = []
    # legs
    o.append(P("M -100,530 L -94,700 L -88,892 L -14,892 L -6,602 L 6,602 L 14,892 "
               "L 88,892 L 94,700 L 100,530 Z", PANTS))
    o.append(P("M 6,602 L 14,892 L 40,892 L 26,610 Z", PANTS_SH, stroke=None))
    o.append(P("M 0,540 L 0,600", sw=3))
    # shoes
    for s in (-1, 1):
        shoe = (f"M {-90*s},886 L {-92*s},928 C {-94*s},946 {-4*s},948 {-2*s},934 "
                f"C {-2*s},914 {-10*s},900 {-14*s},886 Z")
        o.append(P(shoe, SHOE))
        o.append(P(f"M {-92*s},930 C {-60*s},938 {-30*s},938 {-2*s},932", sw=3))
        o.append(P(f"M {-74*s},904 Q {-50*s},914 {-26*s},904", stroke=MINT, sw=6))
    # neck
    o.append(P("M -21,130 L -21,196 L 21,196 L 21,130 Z", SKIN))
    o.append(P("M -21,140 Q 0,166 21,140 L 21,170 L -21,170 Z", SKIN_SH, stroke=None))
    # sleeves (behind torso edge)
    for s in (-1, 1):
        o.append(P(f"M {-100*s},200 C {-134*s},208 {-150*s},240 {-152*s},290 L {-160*s},474 "
                   f"C {-146*s},484 {-124*s},484 {-114*s},476 L {-110*s},300 Z",
                   HOOD if s < 0 else HOOD_SH))
        o.append(P(f"M {-160*s},462 C {-146*s},470 {-126*s},470 {-114*s},464 L {-114*s},482 "
                   f"C {-124*s},492 {-146*s},492 {-160*s},484 Z", HOOD_SH, sw=4))
        # hand
        o.append(P(f"M {-156*s},486 C {-162*s},514 {-150*s},534 {-136*s},534 "
                   f"C {-122*s},534 {-114*s},516 {-118*s},486 Z", SKIN))
        o.append(P(f"M {-118*s},494 C {-108*s},500 {-108*s},512 {-118*s},516", SKIN, sw=4))
    # torso
    torso = ("M -45,182 C -85,186 -110,198 -118,226 L -112,400 C -110,450 -108,500 -112,540 "
             "C -60,552 60,552 112,540 C 108,500 110,450 112,400 L 118,226 C 110,198 85,186 45,182 Z")
    clip = uid("torso")
    o.append(f'<clipPath id="{clip}"><path d="{torso}"/></clipPath>')
    o.append(P(torso, HOOD, stroke=None))
    o.append(f'<g clip-path="url(#{clip})">'
             + P("M 70,170 C 90,300 84,450 96,560 L 140,560 L 140,170 Z", HOOD_SH, stroke=None)
             + "</g>")
    o.append(P(torso, "none"))
    # pocket + hem
    o.append(P("M -72,470 L -58,372 L 58,372 L 72,470", sw=4))
    o.append(P("M -58,372 L -64,470 M 58,372 L 64,470", stroke=HOOD_SH, sw=3))
    o.append(P("M -112,516 C -60,528 60,528 112,516", sw=4))
    # hood collar
    o.append(P("M -68,194 C -66,166 -38,166 -22,180 L 22,180 C 38,166 66,166 68,194 "
               "C 58,226 -58,226 -68,194 Z", HOOD_LT))
    o.append(P("M -22,180 C -10,198 10,198 22,180", sw=4))
    # drawstrings
    for s in (-1, 1):
        o.append(P(f"M {14*s},200 C {16*s},236 {18*s},266 {20*s},292", stroke=STRING, sw=6))
        o.append(f'<rect x="{20*s - 4}" y="290" width="8" height="14" rx="3" fill="{SOLE}" '
                 f'stroke="{OUT}" stroke-width="2.5"/>')
    return "".join(o)


def sam_front(exname="neutral"):
    return body_front() + head_front(exname)


# ---------- THREE-QUARTER (facing viewer-left) ----------
def sam_three_quarter():
    o = []
    # far leg (behind) and near leg
    o.append(P("M -88,530 L -86,700 L -84,888 L -18,888 L -4,600 L 40,530 Z", PANTS_SH))
    o.append(P("M -30,560 L -16,890 L 70,890 L 84,700 L 92,530 Z", PANTS))
    # shoes pointing left
    o.append(P("M -86,884 L -110,920 C -114,940 -30,944 -20,930 C -18,912 -22,898 -24,884 Z", SHOE))
    o.append(P("M -112,926 C -80,934 -46,934 -20,928", sw=3))
    o.append(P("M -16,886 L -38,924 C -42,944 60,948 70,932 C 72,912 68,898 66,886 Z", SHOE))
    o.append(P("M -40,928 C 0,938 40,938 70,930", sw=3))
    o.append(P("M -12,904 Q 16,914 46,904", stroke=MINT, sw=6))
    # far sleeve (peeks out left)
    o.append(P("M -70,204 C -100,214 -112,250 -114,300 L -118,470 C -106,480 -90,478 -84,470 "
               "L -80,300 Z", HOOD_SH))
    o.append(P("M -118,484 C -122,510 -112,528 -100,528 C -88,528 -82,510 -86,484 Z", SKIN_SH))
    # neck
    o.append(P("M -18,130 L -16,196 L 26,196 L 26,128 Z", SKIN))
    o.append(P("M -18,140 Q 4,166 26,140 L 26,172 L -18,172 Z", SKIN_SH, stroke=None))
    # torso (near side wider)
    torso = ("M -36,182 C -70,186 -90,200 -96,228 L -92,400 C -90,450 -88,500 -92,540 "
             "C -40,552 70,552 112,540 C 108,500 110,450 112,400 L 116,228 C 108,198 86,186 52,182 Z")
    clip = uid("torso")
    o.append(f'<clipPath id="{clip}"><path d="{torso}"/></clipPath>')
    o.append(P(torso, HOOD, stroke=None))
    o.append(f'<g clip-path="url(#{clip})">'
             + P("M 60,170 C 80,300 74,450 86,560 L 140,560 L 140,170 Z", HOOD_SH, stroke=None)
             + "</g>")
    o.append(P(torso, "none"))
    o.append(P("M -76,470 L -64,372 L 40,372 L 56,470", sw=4))
    o.append(P("M -92,516 C -40,528 60,528 112,516", sw=4))
    # near sleeve
    o.append(P("M 88,200 C 124,208 140,240 142,290 L 150,474 C 136,484 114,484 104,476 "
               "L 100,300 Z", HOOD_SH))
    o.append(P("M 150,462 C 136,470 116,470 104,464 L 104,482 C 114,492 136,492 150,484 Z",
               HOOD_SH, sw=4))
    o.append(P("M 146,486 C 152,514 140,534 126,534 C 112,534 104,516 108,486 Z", SKIN))
    # hood collar
    o.append(P("M -56,194 C -56,168 -30,166 -16,180 L 28,180 C 46,166 74,168 78,196 "
               "C 66,226 -44,226 -56,194 Z", HOOD_LT))
    o.append(P("M -16,180 C -4,198 16,198 28,180", sw=4))
    for x in (-20, 8):
        o.append(P(f"M {x},200 C {x+1},236 {x+2},266 {x+3},292", stroke=STRING, sw=6))
        o.append(f'<rect x="{x-1}" y="290" width="8" height="14" rx="3" fill="{SOLE}" '
                 f'stroke="{OUT}" stroke-width="2.5"/>')
    # head
    head = ("M 4,0 C 44,0 68,30 66,76 C 64,108 50,130 30,142 C 14,152 -10,156 -26,150 "
            "C -44,142 -58,118 -62,90 C -64,40 -36,0 4,0 Z")
    hclip = uid("head")
    o.append(f'<clipPath id="{hclip}"><path d="{head}"/></clipPath>')
    o.append(P(head, SKIN, stroke=None))
    o.append(f'<g clip-path="url(#{hclip})">'
             + P("M 24,-10 C 48,40 52,110 10,170 L 100,170 L 100,-10 Z", SKIN_SH, stroke=None)
             + "</g>")
    o.append(P(head, "none"))
    hair = ("M -64,86 C -72,38 -50,0 -14,-14 C 10,-24 46,-20 64,-2 C 82,18 82,62 72,100 "
            "C 68,86 62,74 56,66 C 46,60 36,56 28,50 C 18,58 4,60 -6,52 "
            "C -18,62 -34,60 -42,50 C -50,58 -58,66 -62,74 Z")
    o.append(P(hair, HAIR))
    o.append(P("M 26,50 L 32,96 L 38,96 L 42,62 Z", HAIR, sw=3))
    o.append(P("M 30,-16 C 50,-8 66,10 70,44 C 60,28 46,14 30,-16 Z", HAIR_SH, stroke=None))
    o.append(P("M -6,-18 C -4,-42 20,-50 28,-38 C 16,-36 8,-30 6,-14 Z", HAIR))
    o.append(E(48, 90, 10, 17, SKIN))
    o.append(P("M 46,80 Q 54,90 47,100", sw=3))
    ex = dict(look=(-3, 0))
    o.append(P("M -52,72 Q -46,62 -34,66", stroke=HAIR, sw=7))
    o.append(P("M -14,66 Q 2,58 18,70", stroke=HAIR, sw=8))
    o.append(eye(-40, 89, -1, dict(ex, eye_r=(7, 11))))
    o.append(eye(2, 89, 1, ex))
    o.append(P("M -20,96 C -30,108 -32,113 -26,116 C -22,118 -18,117 -13,114", sw=3.5))
    o.append(P("M -38,130 Q -28,126 -20,129 Q -12,131 -4,127", sw=4))
    return "".join(o)


# ---------- PROFILE (facing viewer-left) ----------
def sam_profile():
    o = []
    # legs (near leg in front)
    o.append(P("M -60,540 L -56,700 L -48,888 L 22,888 L 30,700 L 56,540 Z", PANTS))
    o.append(P("M 4,560 L 14,888 L 22,888 L 30,700 L 56,540 Z", PANTS_SH, stroke=None))
    o.append(P("M -60,540 L -56,700 L -48,888 L 22,888 L 30,700 L 56,540", sw=SW))
    o.append(P("M -50,884 L -96,914 C -108,934 -20,946 22,936 C 26,914 22,898 20,884 Z", SHOE))
    o.append(P("M -100,928 C -60,940 -10,942 24,934", sw=3))
    o.append(P("M -70,904 Q -40,914 -6,904", stroke=MINT, sw=6))
    # neck
    o.append(P("M -20,134 L -16,198 L 32,198 L 34,130 Z", SKIN))
    o.append(P("M -20,150 Q 6,160 34,140 L 34,180 L -18,180 Z", SKIN_SH, stroke=None))
    # torso (side): chest left, back right, hood bunched at back
    torso = ("M -30,184 C -56,192 -66,220 -66,260 L -64,400 C -64,450 -62,500 -66,544 "
             "C -20,554 40,554 64,544 C 62,500 64,450 64,400 L 66,250 C 66,214 52,190 26,184 Z")
    o.append(P(torso, HOOD))
    o.append(P("M -66,520 C -20,530 30,530 64,520", sw=4))
    o.append(P("M 8,176 C 40,166 76,180 80,210 C 82,236 60,246 40,236 C 30,222 20,206 8,196 Z",
               HOOD_LT))
    o.append(P("M -24,196 C -30,230 -30,262 -32,292", stroke=STRING, sw=6))
    o.append('<rect x="-37" y="290" width="8" height="14" rx="3" fill="%s" stroke="%s" '
             'stroke-width="2.5"/>' % (SOLE, OUT))
    # arm
    o.append(P("M -6,204 C 26,202 40,226 38,262 L 34,470 C 22,480 -4,480 -12,470 L -16,262 "
               "C -18,230 -20,208 -6,204 Z", HOOD_SH))
    o.append(P("M 34,458 C 22,466 -2,466 -12,460 L -12,480 C -2,490 22,490 34,480 Z", HOOD_SH, sw=4))
    o.append(P("M 30,484 C 36,512 26,532 12,532 C -2,532 -12,514 -8,484 Z", SKIN))
    # head
    head = ("M 8,-2 C 48,-2 72,32 70,76 C 68,104 58,122 42,136 L 30,150 C 0,154 -30,154 -46,148 "
            "C -54,144 -56,136 -52,130 C -58,127 -58,121 -54,119 C -58,116 -58,113 -56,111 "
            "C -62,110 -68,108 -71,104 C -72,98 -64,90 -58,82 C -55,76 -57,70 -58,62 "
            "C -58,30 -36,-2 8,-2 Z")
    hclip = uid("head")
    o.append(f'<clipPath id="{hclip}"><path d="{head}"/></clipPath>')
    o.append(P(head, SKIN, stroke=None))
    o.append(f'<g clip-path="url(#{hclip})">'
             + P("M 0,120 C 20,150 50,150 80,120 L 80,170 L 0,170 Z", SKIN_SH, stroke=None)
             + "</g>")
    o.append(P(head, "none"))
    hair = ("M -56,58 C -66,18 -36,-20 8,-16 C 54,-12 84,26 78,82 C 76,110 66,130 48,142 "
            "C 42,128 38,118 36,108 C 34,96 34,84 30,72 C 18,70 4,64 -4,54 "
            "C -18,62 -32,58 -40,52 C -46,58 -52,60 -56,58 Z")
    o.append(P(hair, HAIR))
    o.append(P("M 2,58 L 6,98 L 12,98 L 14,66 Z", HAIR, sw=3))
    o.append(P("M 40,-6 C 66,10 80,40 76,80 C 70,50 60,24 40,-6 Z", HAIR_SH, stroke=None))
    o.append(P("M -14,-14 C -14,-38 10,-48 20,-36 C 8,-34 0,-28 -2,-12 Z", HAIR))
    o.append(E(24, 92, 11, 17, SKIN))
    o.append(P("M 22,82 Q 32,92 24,102", sw=3))
    o.append(P("M -56,70 Q -48,62 -34,67", stroke=HAIR, sw=7))
    clip = uid("eye")
    eyep = "M -52,84 Q -44,78 -34,83 Q -40,96 -50,92 Z"
    o.append(f'<clipPath id="{clip}"><path d="{eyep}"/></clipPath>')
    o.append(P(eyep, "#FFFFFF", sw=3))
    o.append(f'<g clip-path="url(#{clip})">' + E(-47, 87, 6, 7, IRIS, stroke=None)
             + E(-48, 87, 3, 3, "#1A1410", stroke=None) + "</g>")
    o.append(P("M -54,84 Q -44,76 -33,82", sw=4.5))
    o.append(P("M -55,124 L -46,125", sw=3.5))
    return "".join(o)


# ---------- SHEETS ----------
FONT = "font-family=\"Inter\""


def sheet(content, title, subtitle):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">'
            f'<rect width="1920" height="1080" fill="{BG}"/>'
            f'<rect x="0" y="0" width="1920" height="120" fill="{MINT_BG}"/>'
            f'<text x="70" y="78" {FONT} font-weight="900" font-size="52" fill="{OUT}">{title}</text>'
            f'<text x="1850" y="76" {FONT} font-weight="600" font-size="26" fill="{HOOD}" '
            f'text-anchor="end">{subtitle}</text>'
            f'{content}</svg>')


def turnaround():
    figs = [("FRONT", sam_front("neutral"), 400), ("3/4 VIEW", sam_three_quarter(), 960),
            ("PROFILE", sam_profile(), 1520)]
    body = []
    for label, svg, x in figs:
        body.append(E(x, 1000, 150, 18, "#E6E0D2", stroke=None))
        body.append(f'<g transform="translate({x},190) scale(0.86)">{svg}</g>')
        body.append(f'<text x="{x}" y="1060" {FONT} font-weight="800" font-size="30" '
                    f'fill="{OUT}" text-anchor="middle" letter-spacing="3">{label}</text>')
    # height guide
    for i in range(7):
        y = 190 + i * 150 * 0.86
        body.append(f'<line x1="120" x2="1800" y1="{y}" y2="{y}" stroke="#E9E3D6" '
                    f'stroke-width="2" stroke-dasharray="8 10"/>')
    return sheet("".join(body[::-1][:0]) + "".join(
        b for b in body if b.startswith("<line")) + "".join(
        b for b in body if not b.startswith("<line")),
        "SAM — CHARACTER TURNAROUND", "Paycheck to Plenty · House Style A · reference v1")


def bust(exname):
    # head + shoulders, cropped by the tile
    return body_front() + head_front(exname)


def expressions():
    names = ["neutral", "worried", "happy", "sad", "angry",
             "grumpy", "shocked", "smug", "confused", "relieved"]
    tiles = []
    for i, n in enumerate(names):
        col, row = i % 5, i // 5
        x0, y0 = 60 + col * 364, 150 + row * 460
        clip = uid("tile")
        tiles.append(f'<clipPath id="{clip}"><rect x="{x0}" y="{y0}" width="344" height="400" rx="28"/></clipPath>')
        tiles.append(f'<rect x="{x0}" y="{y0}" width="344" height="400" rx="28" fill="#FFFFFF" '
                     f'stroke="#E3DCCB" stroke-width="3"/>')
        tiles.append(f'<g clip-path="url(#{clip})"><g transform="translate({x0+172},{y0+78}) scale(1.3)">'
                     f'{bust(n)}</g></g>')
        tiles.append(f'<text x="{x0+172}" y="{y0+444}" {FONT} font-weight="800" font-size="30" '
                     f'fill="{OUT}" text-anchor="middle" letter-spacing="3">{n.upper()}</text>')
    return sheet("".join(tiles), "SAM — EXPRESSION SHEET", "Paycheck to Plenty · House Style A · reference v1")


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "channel-bible" / "characters"
    out.mkdir(parents=True, exist_ok=True)
    (out / "sam_turnaround_v1.svg").write_text(turnaround())
    (out / "sam_expressions_v1.svg").write_text(expressions())
    print("wrote", out)
