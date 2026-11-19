"""Cut the owner's Sam reference art into a jointed puppet (cut-out animation).

Input : channel-bible/characters/reference/sam_turnaround_owner.webp
        channel-bible/characters/reference/sam_expressions_owner.webp
Output: channel-bible/characters/sam_puppet/<part>.png  (+ rig.json with pivots)

Everything is the owner's own artwork; this script only separates it into parts:
front view  = body, head (expression heads), upper arms, forearms, hands
side view   = body, head, upper arm, forearm, hand, thigh, shin+boot
Coordinates in rig.json are in the 3x-upscaled pixel space of each part's sheet.
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "channel-bible/characters/reference"
OUT = ROOT / "channel-bible/characters/sam_puppet"
K = 3  # upscale factor


def load(name):
    im = Image.open(REF / name).convert("RGB")
    im = im.resize((im.width * K, im.height * K), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return np.array(im)


def figure_mask(rgb, box):
    """Flood-fill the light background (incl. the sheet's grey grid lines) from the crop border."""
    x0, y0, x1, y1 = [v * K for v in box]
    sub = rgb[y0:y1, x0:x1]
    hsv = cv2.cvtColor(sub, cv2.COLOR_RGB2HSV)
    light = ((sub.min(axis=2) > 165) & (hsv[..., 1] < 40)).astype(np.uint8)
    n, lab = cv2.connectedComponents(light, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    fig = (~bg).astype(np.uint8)
    fig = cv2.morphologyEx(fig, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    full = np.zeros(rgb.shape[:2], np.uint8)
    full[y0:y1, x0:x1] = fig
    return full


def poly_mask(shape, pts, feather=0):
    m = np.zeros(shape, np.uint8)
    cv2.fillPoly(m, [np.array([(x * K, y * K) for x, y in pts], np.int32)], 1)
    return m


def skin_mask(rgb):
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    sk = (r > 140) & (r - b > 35) & (r > g) & (g > 80)
    sk = sk.astype(np.uint8)
    sk = cv2.morphologyEx(sk, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    return cv2.dilate(sk, np.ones((7, 7), np.uint8))   # include the dark outline around skin


def save_part(name, rgb, mask, rig, pivot, extra=None, inpaint=None, edge=None):
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    pad = 4
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(rgb.shape[1], x1 + pad), min(rgb.shape[0], y1 + pad)
    src = rgb.copy()
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    white = (rgb.min(axis=2) > 222) & (hsv[..., 1] < 25)
    mask = (mask & (1 - white.astype(np.uint8))).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask)
    if n > 2:
        big = stats[1:, cv2.CC_STAT_AREA].max()
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] < big * 0.08:
                mask[lab == i] = 0
    if edge is not None:          # ink a clean outline along cut edges
        e = edge.astype(bool) & mask.astype(bool)
        src[e] = (42, 36, 40)
    if inpaint is not None:
        src = cv2.inpaint(src, inpaint.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
    alpha = (mask * 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    rgba = np.dstack([src, alpha])[y0:y1, x0:x1]
    Image.fromarray(rgba).save(OUT / f"{name}.png", optimize=True)
    entry = {"origin": [int(x0), int(y0)], "size": [int(x1 - x0), int(y1 - y0)],
             "pivot": [pivot[0] * K - int(x0), pivot[1] * K - int(y0)]}
    if extra:
        entry.update({k: [v[0] * K - int(x0), v[1] * K - int(y0)] for k, v in extra.items()})
    rig[name] = entry


def build_front(rig):
    rgb = load("sam_turnaround_owner.webp")
    fig = figure_mask(rgb, (575, 125, 805, 700))
    sh = fig.shape
    yy, xx = np.indices(sh)

    def round_end(m, cx, cy, r, keep_above):
        disk = ((xx - cx * K) ** 2 + (yy - cy * K) ** 2) < (r * K) ** 2
        side = (yy < cy * K) if keep_above else (yy > cy * K)
        return (m & (side | disk)).astype(np.uint8)
    L_up = round_end(poly_mask(sh, [(597, 252), (616, 247), (628, 260), (632, 336), (630, 362), (594, 362), (596, 300)]), 612, 340, 19, True)
    L_fo = round_end(poly_mask(sh, [(594, 318), (630, 318), (628, 340), (627, 421), (622, 425), (593, 425)]), 611, 340, 19, False)
    R_up = round_end(poly_mask(sh, [(758, 247), (773, 255), (781, 300), (784, 362), (745, 362), (744, 336), (750, 262)]), 765, 340, 20, True)
    R_fo = round_end(poly_mask(sh, [(745, 318), (785, 318), (785, 418), (783, 425), (748, 425)]), 765, 340, 20, False)
    skin = skin_mask(rgb)
    L_hand = poly_mask(sh, [(588, 421), (636, 421), (636, 492), (588, 492)]) & skin
    R_hand = (poly_mask(sh, [(745, 416), (790, 416), (790, 492), (745, 492)]) & skin) | poly_mask(sh, [(752, 416), (784, 416), (784, 434), (752, 434)])
    L_hand = cv2.morphologyEx(L_hand, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    R_hand = cv2.morphologyEx(R_hand, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    head = poly_mask(sh, [(630, 120), (750, 120), (750, 230), (705, 233), (700, 246), (680, 246), (675, 233), (630, 230)])
    parts = {"f_upper_l": L_up, "f_fore_l": L_fo, "f_upper_r": R_up, "f_fore_r": R_fo,
             "f_hand_l": L_hand, "f_hand_r": R_hand}
    arms = np.zeros(sh, np.uint8)
    for m in parts.values():
        arms |= m
    body = fig & (1 - arms) & (1 - (head & (np.indices(sh)[0] < 234 * K)))
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    pale = (rgb.min(axis=2) > 175) & (hsv[..., 1] < 30) & ((xx < 655 * K) | (xx > 725 * K))
    body = (body & (1 - pale.astype(np.uint8))).astype(np.uint8)
    edge = cv2.dilate(arms, np.ones((7, 7), np.uint8)) & (1 - arms) & body
    save_part("f_body", rgb, body, rig, (690, 240), extra={"neck": (690, 238), "sh_l": (614, 262), "sh_r": (765, 262)},
              edge=edge)
    for side, (cx, cy) in (("l", (614, 262)), ("r", (765, 262))):
        cap = (((xx - cx * K) ** 2 + (yy - cy * K) ** 2) < (17 * K) ** 2) & (yy < (cy + 6) * K)
        save_part(f"f_cap_{side}", rgb, fig & cap.astype(np.uint8), rig, (cx, cy))
    save_part("f_head_ref", rgb, fig & head, rig, (690, 238))
    piv = {"f_upper_l": (613, 262), "f_fore_l": (614, 340), "f_hand_l": (610, 424),
           "f_upper_r": (765, 262), "f_fore_r": (766, 340), "f_hand_r": (767, 424)}
    child = {"f_upper_l": (614, 340), "f_fore_l": (610, 424), "f_upper_r": (766, 340), "f_fore_r": (767, 424)}
    for n, m in parts.items():   # pieces overlap the body by a few px so no seam shows at rest
        m2 = cv2.dilate(m, np.ones((5, 5), np.uint8)) if not n.startswith("f_hand") else m
        save_part(n, rgb, fig & m2, rig, piv[n], extra={"child": child[n]} if n in child else None)


def build_side(rig):
    rgb = load("sam_turnaround_owner.webp")
    fig = figure_mask(rgb, (340, 125, 480, 700))
    sh = fig.shape
    up = poly_mask(sh, [(410, 252), (428, 246), (447, 253), (454, 300), (456, 356), (407, 356), (407, 300)])
    fo = poly_mask(sh, [(408, 338), (457, 338), (453, 412), (442, 430), (410, 432)])
    hand = poly_mask(sh, [(388, 424), (433, 424), (433, 497), (388, 497)]) & skin_mask(rgb)
    hand = cv2.morphologyEx(hand, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    watch = poly_mask(sh, [(403, 416), (432, 416), (432, 436), (403, 436)])
    hand = (hand | watch) & fig
    head = poly_mask(sh, [(345, 120), (480, 120), (480, 238), (430, 238), (420, 250), (392, 250), (385, 236), (345, 236)])
    thigh = poly_mask(sh, [(370, 428), (448, 428), (446, 470), (444, 556), (380, 556), (372, 470)])
    shin = poly_mask(sh, [(380, 540), (446, 540), (446, 640), (452, 700), (358, 700), (372, 640)])
    yy, xx = np.indices(sh)
    head_m = fig & head & (yy < 246 * K)
    arm = up | fo

    def fill(img, region, colour, seed):
        rng = np.random.default_rng(seed)
        out = img.copy()
        r = region.astype(bool)
        noise = rng.normal(0, 3, (r.sum(), 1))
        out[r] = np.clip(np.array(colour)[None, :] + noise, 0, 255).astype(np.uint8)
        return out

    def median(region):
        return tuple(int(v) for v in np.median(rgb[region.astype(bool)], axis=0))
    navy = median(fig & poly_mask(sh, [(380, 300), (405, 300), (405, 400), (380, 400)]))
    pants = median(fig & poly_mask(sh, [(400, 500), (430, 500), (430, 530), (400, 530)]))
    # body: jacket colour where the arm and hand used to be, so the arm can swing freely
    body_rgb = fill(rgb, (arm | hand) & (yy < 440 * K), navy, 1)
    body = (fig | ((arm | hand) & (yy < 440 * K))) & (yy < 440 * K)
    save_part("s_body", body_rgb, body.astype(np.uint8), rig, (420, 440),
              extra={"neck": (398, 240), "shoulder": (430, 262), "hip": (408, 448)})
    save_part("s_head", rgb, head_m, rig, (398, 240))
    cap = ((((xx - 430 * K) ** 2 + (yy - 262 * K) ** 2) < (18 * K) ** 2) & (yy < 268 * K)).astype(np.uint8)
    save_part("s_cap", rgb, fig & cap, rig, (430, 262))

    def round_end(m, cx, cy, r, keep_above):
        disk = ((xx - cx * K) ** 2 + (yy - cy * K) ** 2) < (r * K) ** 2
        side = (yy < cy * K) if keep_above else (yy > cy * K)
        return (m & (side | disk)).astype(np.uint8)
    up_r = round_end(up, 432, 345, 23, True)
    up_r = round_end(up_r | poly_mask(sh, [(412, 240), (450, 240), (450, 262), (412, 262)]), 430, 262, 21, False)
    fo_r = round_end(poly_mask(sh, [(408, 322), (457, 322), (453, 412), (442, 430), (410, 432)]), 432, 345, 23, False)
    save_part("s_upper", rgb, fig & up_r, rig, (430, 262), extra={"child": (434, 345)})
    save_part("s_fore", rgb, fig & fo_r, rig, (434, 345), extra={"child": (420, 428)})
    save_part("s_hand", rgb, hand, rig, (420, 428))
    thigh_r = round_end(poly_mask(sh, [(370, 428), (448, 428), (446, 470), (446, 570), (376, 570), (372, 470)]), 410, 548, 33, True)
    shin_r = round_end(shin | poly_mask(sh, [(380, 524), (444, 524), (444, 548), (380, 548)]), 412, 548, 29, False)
    hand_big = cv2.dilate(hand, np.ones((13, 13), np.uint8)) & thigh & (yy > 436 * K)
    leg_rgb = fill(rgb, hand_big, pants, 2)
    save_part("s_thigh", leg_rgb, (fig & thigh_r) | hand_big, rig, (408, 448), extra={"child": (412, 548)})
    save_part("s_shin", rgb, fig & shin_r, rig, (412, 548))


EXPR_CELLS = {  # (cell box in sheet px, face centre x)
    "happy": ((282, 122, 492, 278), 385),
    "sad": ((585, 122, 795, 278), 688),
    "grumpy": ((890, 122, 1100, 278), 992),
    "serious": ((585, 522, 795, 698), 688),
    "smirk": ((890, 522, 1100, 698), 992),
}


def build_heads(rig):
    rgb = load("sam_expressions_owner.webp")
    for name, (box, cx) in EXPR_CELLS.items():
        fig = figure_mask(rgb, box)
        x0, y0, x1, y1 = [v * K for v in box]
        sub = rgb[y0:y1, x0:x1].astype(int)
        r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]
        navy = (b > r + 8) & (sub.max(axis=2) < 120)
        tee = (abs(r - g) < 12) & (abs(g - b) < 14) & (sub.min(axis=2) > 140) & (sub.max(axis=2) < 225)
        cloth = (navy | tee).astype(np.uint8)
        cloth[: (y1 - y0) // 2] = 0          # only below the face
        n_c, lab_c = cv2.connectedComponents(cloth)
        touching = set(np.unique(lab_c[int(lab_c.shape[0] * 0.85):])) - {0}   # clothing near the bottom of the cell
        cloth = np.isin(lab_c, list(touching)).astype(np.uint8)
        cut = np.zeros_like(cloth)
        for col in range(cloth.shape[1]):     # everything below the first clothing pixel goes
            idx = np.nonzero(cloth[:, col])[0]
            if len(idx):
                cut[idx[0] - 2:, col] = 1
        keep = fig.copy()
        keep[y0:y1, x0:x1] &= (1 - cut)
        n, lab, stats, _ = cv2.connectedComponentsWithStats(keep[y0:y1, x0:x1])
        big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        m = np.zeros_like(keep)
        m[y0:y1, x0:x1] = (lab == big)
        ys, xs = np.nonzero(m)
        save_part(f"head_{name}", rgb, m, rig, (cx, ys.max() / K - 4),
                  extra={"top": (cx, ys.min() / K)})


def preview(rig):
    canvas = Image.new("RGBA", (1800, 1100), (245, 241, 234, 255))
    x = 20
    for n in sorted(rig):
        im = Image.open(OUT / f"{n}.png")
        s = min(1.0, 300 / im.height)
        im = im.resize((int(im.width * s), int(im.height * s)))
        if x + im.width > 1780:
            x = 20
        y = 20 if canvas.getpixel((x, 20))[0] == 245 else 420
        canvas.alpha_composite(im, (x, y if y + im.height < 1100 else 700))
        x += im.width + 15
    canvas.save(OUT / "_parts_preview.png")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    rig = {}
    build_front(rig)
    build_side(rig)
    build_heads(rig)
    (OUT / "rig.json").write_text(json.dumps(rig, indent=1))
    print(len(rig), "parts")
