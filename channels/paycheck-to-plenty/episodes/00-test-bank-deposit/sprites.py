"""Render background cast + props as transparent sprite PNGs (via Chromium).

Each sprite SVG puts the character's local origin (top of skull, rig units) at (OX, OY).
Rendered at 2 px per unit.
"""
import math
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TOOLS = HERE.parent.parent / "tools"
sys.path.insert(0, str(TOOLS))
import rig  # noqa: E402
from timeline import FPS, N, GIVE, COUNT, RECEIPT, ramp, lerp  # noqa: E402

OUT = HERE / "sprites"
SW_, SH_, OX, OY = 700, 1300, 350, 80


def wrap(inner, w=SW_, h=SH_):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}">{inner}</svg>'


def blink(t, period, phase):
    x = (t + phase) % period
    return 1.0 if x < 0.12 else 0.0


def teller_a_pose(t):
    """Maya (profile, facing left toward Sam). Angles in rig convention (+ = forward)."""
    rest = dict(au=4, af=10, ah=10, hand="relaxed", held=None, far=(2, 12, 12))
    reach = dict(au=62, af=84, ah=84)
    count = dict(au=24, af=118, ah=150)
    p = dict(rest)
    if GIVE[0] <= t < COUNT[0]:
        u_out = ramp(t, GIVE[0] + 0.2, GIVE[1])
        u_back = ramp(t, GIVE[2], COUNT[0])
        for k in ("au", "af", "ah"):
            p[k] = lerp(lerp(rest[k], reach[k], u_out), count[k], u_back)
        p["hand"] = "open" if t < GIVE[1] else "fist"
        p["held"] = "slipcash" if t >= GIVE[1] else None
    elif COUNT[0] <= t < COUNT[1] + 0.6:
        p.update(count)
        p["ah"] = count["ah"] + 12 * math.sin((t - COUNT[0]) * 2 * math.pi * 2.6)
        p["hand"], p["held"] = "fist", "cash"
        p["far"] = (22, 100, 120)
        if t >= COUNT[1]:
            u = ramp(t, COUNT[1], COUNT[1] + 0.6)
            for k in ("au", "af", "ah"):
                p[k] = lerp(p[k], rest[k] + (10 if k == "au" else 30), u)
            p["held"] = None if u > 0.5 else "cash"
    elif COUNT[1] + 0.6 <= t < RECEIPT[0]:
        p.update(au=14, af=40, ah=40)                      # typing at the till
        p["af"] += 4 * math.sin(t * 2 * math.pi * 5)
    elif RECEIPT[0] <= t < RECEIPT[2] + 0.8:
        u_out = ramp(t, RECEIPT[0], RECEIPT[1])
        u_back = ramp(t, RECEIPT[2], RECEIPT[2] + 0.8)
        for k in ("au", "af", "ah"):
            p[k] = lerp(lerp(rest[k], reach[k], u_out), rest[k], u_back)
        p["hand"] = "fist" if t < RECEIPT[1] else "open"
        p["held"] = "receipt" if t < RECEIPT[1] else None
    p["bob"] = 1.5 * math.sin(t * 2 * math.pi * 0.25)
    return p


def main():
    OUT.mkdir(exist_ok=True)
    files = []

    def put(name, inner, w=SW_, h=SH_):
        f = OUT / f"{name}.svg"
        f.write_text(wrap(inner, w, h))
        files.append(str(f))

    # Maya (teller, station 2): every frame
    for i in range(N):
        t = i / FPS
        p = teller_a_pose(t)
        pose = dict(au=p["au"], af=p["af"], ah=p["ah"], hand=p["hand"], held=p["held"], far=p["far"], bob=p["bob"])
        rig.reset_ids()
        put(f"maya_{i:04d}", rig.character_profile(rig.TELLER_A, pose, "neutral", blink=blink(t, 3.4, 0.7),
                                                   x=OX, y=OY, scale=1, facing=-1))
    # idle loops (3 s)
    for i in range(90):
        t = i / FPS
        rig.reset_ids()
        put(f"raj_{i:03d}", rig.character_profile(
            rig.TELLER_B, dict(au=20 + 3 * math.sin(t * 2 * math.pi), af=60 + 6 * math.sin(t * 2 * math.pi * 2),
                               ah=60, far=(15, 50, 50), bob=1.2 * math.sin(t * 2 * math.pi / 3)),
            "neutral", blink=blink(t, 3.0, 1.1), x=OX, y=OY, scale=1, facing=-1))
        rig.reset_ids()
        put(f"cust_{i:03d}", rig.character_profile(
            rig.CUSTOMER_C, dict(au=8 + 2 * math.sin(t * 2 * math.pi / 3), af=30, ah=30, far=(5, 20, 20),
                                 bob=1.5 * math.sin(t * 2 * math.pi / 3)),
            "neutral", blink=blink(t, 3.0, 2.0), x=OX, y=OY, scale=1, facing=1))
        rig.reset_ids()
        put(f"guard_{i:03d}", rig.character_front(
            rig.GUARD, dict(lu=10, lf=-40, lh=-40, ru=-10, rf=40, rh=40, bob=1.2 * math.sin(t * 2 * math.pi / 3)),
            "serious", blink=blink(t, 3.0, 0.3), x=OX, y=OY, scale=1))
        rig.reset_ids()
        put(f"wait_{i:03d}", rig.character_front(
            rig.CUSTOMER_E, dict(ru=-25, rf=-150, rh=-175, rhand="fist", rheld="phone", lu=6, lf=3,
                                 bob=1.2 * math.sin(t * 2 * math.pi / 3), tilt=4),
            "neutral", blink=blink(t, 3.0, 1.7), x=OX, y=OY, scale=1))
    # props for Sam's hands (drawn at 3x so they match the puppet parts' pixel scale)
    for name in ("slipcash", "cash", "receipt", "pen"):
        put(f"prop_{name}", f'<g transform="translate(100,100) scale(1.4)">{rig.prop(name)}</g>', 200, 200)
    lst = OUT / "_list.txt"
    lst.write_text("\n".join(files))
    subprocess.run(["node", str(TOOLS / "render_batch.js"), "2", str(lst)], check=True)
    for f in files:
        Path(f).unlink()
    print(len(files), "sprites")


if __name__ == "__main__":
    main()
