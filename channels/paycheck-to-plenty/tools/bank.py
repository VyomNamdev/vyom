"""Bank interior for the deposit test video (world = 3840 x 1080, drawn in code).

Layers (rendered separately so characters can sit between them):
  bank_back.svg   wall, windows, doors, floor, back furniture
  bank_counter.svg teller counter front + glass partitions (drawn over the tellers)
  bank_desk.svg   deposit-slip desk (drawn over Sam's legs)
"""
from pathlib import Path

W, H = 3840, 1080
INK = "#3B2C25"
FLOOR_Y = 700


def svg(body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'<defs>{DEFS}{defs}</defs>{body}</svg>')


DEFS = """
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3EBDD"/><stop offset="1" stop-color="#E6D9C4"/></linearGradient>
<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E5E3E"/><stop offset="1" stop-color="#6E4429"/></linearGradient>
<linearGradient id="woodlt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9744E"/><stop offset="1" stop-color="#8A5A39"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9CFBF"/><stop offset="1" stop-color="#C9BCA8"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9CBE6"/><stop offset="1" stop-color="#E4EEF4"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8F3F8" stop-opacity="0.32"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.12"/><stop offset="1" stop-color="#D6E8F1" stop-opacity="0.28"/></linearGradient>
<linearGradient id="marble" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EFEBE4"/><stop offset="1" stop-color="#DCD5CA"/></linearGradient>
<linearGradient id="shadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<radialGradient id="lamp" cx="0.5" cy="0.2" r="0.8"><stop offset="0" stop-color="#FFF4D6" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></radialGradient>
<filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0.07 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
"""


def L(x1, y1, x2, y2, c=INK, w=2.5, extra=""):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}" {extra}/>'


def rect(x, y, w, h, fill, stroke=INK, sw=2.5, rx=0, extra=""):
    st = f'stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" {st} {extra}/>'


def text(x, y, s, size, fill, weight=700, anchor="middle", font="DejaVu Serif", extra=""):
    return (f'<text x="{x}" y="{y}" font-family="{font}" font-weight="{weight}" font-size="{size}" '
            f'fill="{fill}" text-anchor="{anchor}" {extra}>{s}</text>')


def back():
    o = []
    o.append(rect(0, 0, W, FLOOR_Y, "url(#wall)", stroke=None))
    # ceiling band + crown moulding
    o.append(rect(0, 0, W, 70, "#E9DFCF", stroke=None) + L(0, 70, W, 70, "#C9B89E", 4) + L(0, 78, W, 78, "#D8C9B2", 2))
    for x in range(700, W, 640):
        o.append(f'<ellipse cx="{x}" cy="300" rx="320" ry="300" fill="url(#lamp)"/>')
    # pilasters
    for x in range(380, W, 640):
        o.append(rect(x - 34, 70, 68, FLOOR_Y - 70, "#EFE5D4", sw=2) + rect(x - 44, 70, 88, 26, "#E2D4BE", sw=2)
                 + rect(x - 44, FLOOR_Y - 190, 88, 190, "url(#wood)", sw=2) + L(x - 22, 110, x - 22, FLOOR_Y - 200, "#D9CBB4", 2))
    # wood wainscot
    o.append(rect(0, FLOOR_Y - 190, W, 190, "url(#wood)", stroke=None) + L(0, FLOOR_Y - 190, W, FLOOR_Y - 190, INK, 3))
    for x in range(40, W, 160):
        o.append(rect(x, FLOOR_Y - 165, 120, 140, "none", stroke="#5A3722", sw=2, rx=3))
    o.append(L(0, FLOOR_Y - 176, W, FLOOR_Y - 176, "#B58660", 3))
    # entrance: glass doors with daylight street
    o.append(rect(70, 130, 440, FLOOR_Y - 130, "#5E4A3C", sw=3))
    o.append(rect(90, 150, 400, FLOOR_Y - 150, "url(#sky)", stroke=INK, sw=2))
    o.append('<path d="M 90 520 L 490 520 L 490 680 L 90 680 Z" fill="#B9B3A6"/>')     # sidewalk
    o.append('<path d="M 90 450 L 160 400 L 230 450 L 300 380 L 390 450 L 490 420 L 490 520 L 90 520 Z" fill="#9FB7A0" opacity="0.8"/>')  # trees
    o.append(rect(110, 330, 120, 120, "#C9B79A", stroke=INK, sw=2) + rect(260, 300, 160, 150, "#D7C3A4", stroke=INK, sw=2))
    for x in (125, 155, 185, 275, 315, 355, 395):
        o.append(rect(x, 345 if x < 240 else 320, 18, 24, "#8FA7BC", stroke=None))
    o.append(L(290, 150, 290, FLOOR_Y, INK, 4) + rect(90, 150, 400, FLOOR_Y - 150, "url(#glass)", stroke=None))
    o.append(rect(250, 400, 16, 90, "#C8A55A", rx=6, sw=2) + rect(314, 400, 16, 90, "#C8A55A", rx=6, sw=2))
    o.append(text(290, 210, "OPEN 9–5", 26, "#3B2C25", 700, font="Inter"))
    # windows with blinds
    for x in (640, 1270):
        o.append(rect(x, 150, 300, 300, "#6B4F3B", sw=3) + rect(x + 14, 164, 272, 272, "url(#sky)", stroke=None))
        for y in range(170, 440, 22):
            o.append(L(x + 14, y, x + 286, y, "#F2EADD", 7, 'opacity="0.85"'))
        o.append(rect(x + 14, 164, 272, 272, "url(#glass)", stroke=INK, sw=2))
    # bank name sign + logo (fictional bank)
    o.append(rect(2050, 104, 1260, 92, "#203047", sw=3, rx=6))
    o.append('<path d="M 2120 178 L 2150 122 L 2180 178 Z" fill="#D9B25A" stroke="#3B2C25" stroke-width="2"/>')
    o.append('<path d="M 2140 178 L 2150 150 L 2160 178 Z" fill="#7FB58F"/>')
    o.append(text(2700, 168, "MAPLE CITY BANK", 54, "#F3E7CF", 700))
    # clock
    o.append('<circle cx="1640" cy="240" r="58" fill="#FBF7EF" stroke="#3B2C25" stroke-width="5"/>'
             + "".join(f'<line x1="1640" y1="190" x2="1640" y2="200" stroke="#3B2C25" stroke-width="3" transform="rotate({a} 1640 240)"/>' for a in range(0, 360, 30))
             + L(1640, 240, 1640, 202, INK, 4) + L(1640, 240, 1668, 252, INK, 4))
    # poster frames
    for x, t1, t2, col in ((1010, "OPEN AN", "ACCOUNT", "#D9B25A"),):
        o.append(rect(x, 330, 170, 220, "#F9F4EA", sw=3) + rect(x + 14, 344, 142, 110, col, stroke=None)
                 + text(x + 85, 488, t1, 22, "#3B2C25", 700, font="Inter") + text(x + 85, 518, t2, 22, "#3B2C25", 700, font="Inter"))
    # back wall behind tellers: shelves / filing
    o.append(rect(1780, 330, 1960, 200, "#E2D6C3", stroke=None))
    for x in range(1800, 3740, 140):
        o.append(rect(x, 350, 120, 160, "#C9B79E", sw=2, rx=3) + L(x + 10, 430, x + 110, 430, "#A8957A", 2)
                 + rect(x + 50, 380, 20, 6, "#8E7B60", stroke=None) + rect(x + 50, 460, 20, 6, "#8E7B60", stroke=None))
    # plant + waiting bench (left lobby)
    o.append('<path d="M 1580 700 L 1600 620 L 1680 620 L 1700 700 Z" fill="#B7764F" stroke="#3B2C25" stroke-width="2.5"/>')
    for a in (-50, -25, 0, 25, 50, -70, 70):
        o.append(f'<path d="M 1640 625 Q {1640 + a*1.6} {520 - abs(a)} {1640 + a*2.4} {470 + abs(a)*1.2}" stroke="#4F7D57" stroke-width="18" fill="none" stroke-linecap="round"/>')
        o.append(f'<path d="M 1640 625 Q {1640 + a*1.6} {520 - abs(a)} {1640 + a*2.4} {470 + abs(a)*1.2}" stroke="#6E9E73" stroke-width="7" fill="none" stroke-linecap="round"/>')
    o.append(rect(1180, 610, 300, 26, "url(#woodlt)", sw=2.5, rx=5) + rect(1180, 560, 300, 50, "#3E5B7A", sw=2.5, rx=8)
             + rect(1195, 636, 14, 64, "#5A3722", sw=2) + rect(1451, 636, 14, 64, "#5A3722", sw=2))
    # floor
    o.append(rect(0, FLOOR_Y, W, H - FLOOR_Y, "url(#floor)", stroke=None) + L(0, FLOOR_Y, W, FLOOR_Y, INK, 3))
    for i, y in enumerate((722, 752, 792, 846, 916, 1004)):
        o.append(L(0, y, W, y, "#BFB09A", 2))
    for x in range(-2000, W + 2000, 220):
        o.append(L(1920 + (x - 1920) * 0.55, FLOOR_Y, 1920 + (x - 1920) * 1.6, H, "#C4B6A1", 2))
    # soft reflections under furniture + ceiling lamp glows
    for x in range(380, W, 640):
        o.append(f'<ellipse cx="{x}" cy="760" rx="60" ry="10" fill="#000" opacity="0.06"/>')
    # rope stanchions in front of the teller line
    for x in (1760, 1900):
        o.append(rect(x - 6, 610, 12, 100, "#C8A55A", sw=2, rx=4) + f'<ellipse cx="{x}" cy="712" rx="24" ry="7" fill="#C8A55A" stroke="{INK}" stroke-width="2"/>')
    o.append(f'<path d="M 1766 626 Q 1830 668 1894 626" stroke="#8E2F38" stroke-width="10" fill="none"/>')
    for x in range(700, W, 640):
        o.append(f'<path d="M {x} 0 L {x} 46" stroke="{INK}" stroke-width="3"/>'
                 f'<path d="M {x-46} 70 Q {x} 26 {x+46} 70 Z" fill="#D9B25A" stroke="{INK}" stroke-width="2.5"/>')
    o.append(f'<rect width="{W}" height="{H}" filter="url(#grain)" fill="#fff"/>')
    return svg("".join(o))


COUNTER_TOP = 600
STATIONS = (2060, 2660, 3260)


def counter():
    o = []
    x0, x1 = 1960, W
    # glass partitions with speaking slot
    for i, cx in enumerate(STATIONS):
        o.append(rect(cx - 280, 290, 560, COUNTER_TOP - 290 - 50, "url(#glass)", stroke="#6E5A48", sw=4))
        o.append(L(cx - 230, 310, cx - 160, 380, "#FFFFFF", 5, 'opacity="0.5"') + L(cx - 200, 310, cx - 150, 360, "#FFFFFF", 3, 'opacity="0.4"'))
        o.append(rect(cx - 70, COUNTER_TOP - 50, 140, 50, "none", stroke="#6E5A48", sw=3))    # pass-through slot
        o.append(rect(cx - 40, 238, 80, 50, "#203047", sw=2.5, rx=6) + text(cx, 276, str(i + 1), 36, "#F3E7CF", 700, font="Inter"))
    for x in (STATIONS[0] - 280, STATIONS[0] + 280, STATIONS[1] + 280, STATIONS[2] + 280):
        o.append(rect(x - 8, 280, 16, COUNTER_TOP - 280, "#8E5E3E", sw=2.5))
    # "closed" sign at station 3
    o.append(rect(STATIONS[0] - 90, 420, 180, 60, "#F9F4EA", sw=2.5, rx=6) + text(STATIONS[0], 461, "CLOSED", 30, "#8E2F38", 800, font="Inter"))
    # counter top (marble) + front panel (wood)
    o.append(rect(x0 - 30, COUNTER_TOP - 22, x1 - x0 + 60, 30, "url(#marble)", sw=3, rx=4))
    o.append(rect(x0, COUNTER_TOP + 8, x1 - x0, H - COUNTER_TOP, "url(#woodlt)", sw=3))
    o.append(rect(x0, COUNTER_TOP + 8, x1 - x0, 26, "url(#shadeDown)", stroke=None))
    for x in range(x0 + 40, x1, 300):
        o.append(rect(x, COUNTER_TOP + 70, 240, 330, "none", stroke="#6E4429", sw=3, rx=4)
                 + rect(x + 16, COUNTER_TOP + 86, 208, 298, "none", stroke="#C08D66", sw=2, rx=3))
    o.append(rect(x0, H - 46, x1 - x0, 46, "#5A3722", sw=3))
    return svg("".join(o))


DESK_X, DESK_TOP = 960, 640


def desk():
    o = []
    x0, x1 = DESK_X - 230, DESK_X + 230
    o.append(rect(x0 - 20, DESK_TOP - 18, x1 - x0 + 40, 26, "url(#marble)", sw=3, rx=4))
    o.append(rect(x0, DESK_TOP + 8, x1 - x0, H - DESK_TOP, "url(#woodlt)", sw=3))
    o.append(rect(x0, DESK_TOP + 8, x1 - x0, 24, "url(#shadeDown)", stroke=None))
    o.append(rect(x0 + 30, DESK_TOP + 60, x1 - x0 - 60, 330, "none", stroke="#6E4429", sw=3, rx=4))
    # slip holder + pen on chain
    o.append(rect(x1 - 130, DESK_TOP - 52, 100, 36, "#C9B79E", sw=2.5, rx=3)
             + "".join(rect(x1 - 122 + i * 8, DESK_TOP - 64 + i * 2, 70, 30, "#FFFFFF", sw=1.5) for i in range(3)))
    o.append(rect(x0 + 40, DESK_TOP - 40, 120, 22, "#7FB58F", sw=2, rx=4) + text(x0 + 100, DESK_TOP - 24, "DEPOSIT SLIPS", 12, "#203047", 800, font="Inter"))
    return svg("".join(o))


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "episodes/00-test-bank-deposit/layers"
    out.mkdir(parents=True, exist_ok=True)
    (out / "bank_back.svg").write_text(back())
    (out / "bank_counter.svg").write_text(counter())
    (out / "bank_desk.svg").write_text(desk())
    print(out)
