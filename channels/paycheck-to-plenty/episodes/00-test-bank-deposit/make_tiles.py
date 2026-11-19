"""Cut the bank layers into tiles and crop the cast sprites so raea's 8192 px image atlas fits a frame.
Also writes the pre-darkened far-leg parts and raea/layout.json."""
import glob, json
import numpy as np
from PIL import Image

L, P = "layers", "../../channel-bible/characters/sam_puppet"
back = Image.open(f"{L}/bank_back.png").convert("RGBA")
back.crop((0, 0, 3840, 2160)).save(f"{L}/tile_back_L.png")
back.crop((3840, 0, 7680, 2160)).save(f"{L}/tile_back_R.png")
tiles = {}
for name in ("counter", "desk"):
    im = Image.open(f"{L}/bank_{name}.png").convert("RGBA")
    b = im.getbbox()
    im.crop(b).save(f"{L}/tile_{name}.png")
    tiles[name] = [b[0] / 2, b[1] / 2, (b[2] - b[0]) / 2, (b[3] - b[1]) / 2]
for n in ("s_thigh", "s_shin"):
    a = np.array(Image.open(f"{P}/{n}.png").convert("RGBA"))
    a[..., :3] = (a[..., :3] * 0.72).astype(np.uint8)
    Image.fromarray(a).save(f"{P}/{n}_dark.png")
boxes = {}
for ch in ("maya", "raj", "cust", "guard", "wait"):
    files = sorted(glob.glob(f"sprites/{ch}_*.png"))
    ub = None
    for f in files:
        b = Image.open(f).getbbox()
        if b:
            ub = b if ub is None else (min(ub[0], b[0]), min(ub[1], b[1]), max(ub[2], b[2]), max(ub[3], b[3]))
    for f in files:
        im = Image.open(f)
        if im.size != (ub[2] - ub[0], ub[3] - ub[1]):
            im.crop(ub).save(f)
    boxes[ch] = list(ub)
json.dump({"tiles": tiles, "sprites": boxes}, open("raea/layout.json", "w"))
print(tiles, boxes)
