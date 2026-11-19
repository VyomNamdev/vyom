"""Assemble and pose the Sam puppet (owner's artwork) with PIL.

Angles are degrees, relative to the reference pose, positive = counter-clockwise on screen.
"""
import json
from functools import lru_cache
from math import cos, sin, radians
from pathlib import Path

import numpy as np
from PIL import Image

D = Path(__file__).resolve().parent.parent / "channel-bible/characters/sam_puppet"
RIG = json.loads((D / "rig.json").read_text())


@lru_cache(None)
def part(name):
    return Image.open(D / f"{name}.png").convert("RGBA")


def gpt(name, key):
    """Global (sheet) coordinates of a named point of a part."""
    r = RIG[name]
    return (r["origin"][0] + r[key][0], r["origin"][1] + r[key][1])


def rot(v, a):
    c, s = cos(radians(a)), sin(radians(a))
    return (v[0] * c + v[1] * s, -v[0] * s + v[1] * c)


def place(canvas, name, at, angle, scale, flip=False, alpha=1.0):
    """Draw part so its pivot lands on canvas point `at`, rotated by angle (ccw)."""
    im = part(name)
    px, py = RIG[name]["pivot"]
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
        px = im.width - px
        angle = -angle
    if scale != 1:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BICUBIC)
        px, py = px * scale, py * scale
    if angle:
        # rotate around the pivot: expand canvas so the pivot is the centre
        w, h = im.size
        pad = int(max(w, h) * 1.5)
        big = Image.new("RGBA", (pad * 2, pad * 2), (0, 0, 0, 0))
        big.paste(im, (int(pad - px), int(pad - py)))
        big = big.rotate(angle, resample=Image.BICUBIC)
        bbox = big.getbbox()
        if not bbox:
            return
        big = big.crop(bbox)
        ox, oy = at[0] - pad + bbox[0], at[1] - pad + bbox[1]
        im = big
    else:
        ox, oy = at[0] - px, at[1] - py
    if alpha < 1:
        a = np.array(im)
        a[..., 3] = (a[..., 3] * alpha).astype(np.uint8)
        im = Image.fromarray(a)
    canvas.alpha_composite(im, (int(round(ox)), int(round(oy))))


def chain_point(start, angle, vec, scale, flip):
    v = (vec[0] * scale * (-1 if flip else 1), vec[1] * scale)
    a = -angle if flip else angle
    r = rot(v, a)
    return (start[0] + r[0], start[1] + r[1])


def arm_chain(canvas, prefix, root, a_up, a_fore, a_hand, scale, flip, held=None, held_fn=None):
    up, fo, ha = f"{prefix[0]}", f"{prefix[1]}", f"{prefix[2]}"
    place(canvas, up, root, a_up, scale, flip)
    e_vec = (gpt(up, "child")[0] - gpt(up, "pivot")[0], gpt(up, "child")[1] - gpt(up, "pivot")[1])
    elbow = chain_point(root, a_up, e_vec, scale, flip)
    a2 = a_up + a_fore
    w_vec = (gpt(fo, "child")[0] - gpt(fo, "pivot")[0], gpt(fo, "child")[1] - gpt(fo, "pivot")[1])
    wrist = chain_point(elbow, a2, w_vec, scale, flip)
    a3 = a2 + a_hand
    place(canvas, ha, wrist, a3, scale, flip)
    if held_fn:
        held_fn(canvas, wrist, a3, scale, flip)
    place(canvas, fo, elbow, a2, scale, flip)
    return wrist, a3


def glasses_centre(name):
    """Find the eye line from the dark glasses frame (works on every head and the body ref)."""
    a = np.array(part(name))
    rgb, al = a[..., :3].astype(int), a[..., 3]
    h = a.shape[0]
    dark = (rgb.sum(axis=2) < 200) & (al > 200)
    dark[: int(h * 0.25)] = False
    dark[int(h * 0.62):] = False
    rows = dark.sum(axis=1)
    y = int(np.argmax(rows))
    xs = np.nonzero(dark[y])[0]
    return ((xs.min() + xs.max()) / 2, y)


@lru_cache(None)
def head_offset(name):
    """Offset that puts head `name`'s glasses where the body reference head's glasses are."""
    gx, gy = glasses_centre("f_head_ref")
    rx, ry = RIG["f_head_ref"]["origin"]
    hx, hy = glasses_centre(name)
    return (rx + gx, ry + gy), (hx, hy)


FRONT_REST = dict(lu=0, lf=0, lh=0, ru=0, rf=0, rh=0, head="talk_0", tilt=0, bob=0)


def sam_front(canvas, x, y, scale, pose=None, held_l=None, held_r=None):
    """(x, y) = where the neck point goes on the canvas."""
    p = dict(FRONT_REST, **(pose or {}))
    neck_g = gpt("f_body", "neck")

    def g2c(pt):
        return (x + (pt[0] - neck_g[0]) * scale, y + (pt[1] - neck_g[1]) * scale)

    place(canvas, "f_body", g2c(gpt("f_body", "pivot")), 0, scale)
    # head (expression / talking head aligned on the glasses)
    hname = "head_" + p["head"]
    (gx, gy), (hx, hy) = head_offset(hname if not hname.startswith("head_talk") else "head_happy")
    im = part(hname)
    sc = scale
    tl = g2c((gx - hx, gy - hy + p["bob"]))
    # rotate head about the neck for tilts
    neck_local = (gx - hx + 0, 0)
    if p["tilt"]:
        piv = (neck_g[0] - (gx - hx), neck_g[1] - (gy - hy))
        RIG.setdefault(hname, {})["pivot"] = [piv[0], piv[1]]
        place(canvas, hname, g2c(neck_g), p["tilt"], sc)
    else:
        im2 = im.resize((int(im.width * sc), int(im.height * sc)), Image.BICUBIC)
        canvas.alpha_composite(im2, (int(tl[0]), int(tl[1])))
    arm_chain(canvas, ("f_upper_l", "f_fore_l", "f_hand_l"), g2c(gpt("f_upper_l", "pivot")),
              p["lu"], p["lf"], p["lh"], scale, False, held_fn=held_l)
    arm_chain(canvas, ("f_upper_r", "f_fore_r", "f_hand_r"), g2c(gpt("f_upper_r", "pivot")),
              p["ru"], p["rf"], p["rh"], scale, False, held_fn=held_r)
    for s_ in ("l", "r"):
        if abs(p["lu" if s_ == "l" else "ru"]) > 8:
            place(canvas, f"f_cap_{s_}", g2c(gpt(f"f_cap_{s_}", "pivot")), 0, scale)


SIDE_REST = dict(au=0, af=0, ah=0, legs=((0, 0), (0, 0)), bob=0, lean=0)


def sam_side(canvas, x, y, scale, pose=None, facing=1, held=None):
    """Side view. Art faces left; facing=+1 mirrors to face right. (x, y) = hip point."""
    p = dict(SIDE_REST, **(pose or {}))
    flip = facing == 1
    hip_g = gpt("s_body", "hip")

    def g2c(pt):
        dx = (pt[0] - hip_g[0]) * scale
        return (x + (-dx if flip else dx), y + (pt[1] - hip_g[1]) * scale + p["bob"])

    hip = g2c(hip_g)
    # far leg (darker), body, near leg
    for i, (a_th, a_sh) in enumerate(p["legs"]):
        far = i == 0
        knee_vec = (gpt("s_thigh", "child")[0] - gpt("s_thigh", "pivot")[0],
                    gpt("s_thigh", "child")[1] - gpt("s_thigh", "pivot")[1])
        if far:
            tmp = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
            tgt = tmp
        else:
            tgt = canvas
        hp = (hip[0] + (6 * scale if far else 0) * (-1 if flip else 1), hip[1])
        knee = chain_point(hp, a_th, knee_vec, scale, flip)
        place(tgt, "s_shin", knee, a_th + a_sh, scale, flip)
        place(tgt, "s_thigh", hp, a_th, scale, flip)
        if far:
            arr = np.array(tmp)
            arr[..., :3] = (arr[..., :3] * 0.72).astype(np.uint8)
            canvas.alpha_composite(Image.fromarray(arr))
    place(canvas, "s_body", g2c(gpt("s_body", "pivot")), p["lean"], scale, flip)
    place(canvas, "s_head", g2c(gpt("s_head", "pivot")), 0, scale, flip)
    arm_chain(canvas, ("s_upper", "s_fore", "s_hand"), g2c(gpt("s_upper", "pivot")),
              p["au"], p["af"], p["ah"], scale, flip, held_fn=held)
    if abs(p["au"]) > 8:
        place(canvas, "s_cap", g2c(gpt("s_cap", "pivot")), 0, scale, flip)
