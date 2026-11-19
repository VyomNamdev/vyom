"""Make talking-mouth states from the owner's 'happy' head (closed smile / half / open)."""
from pathlib import Path
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter

D = Path(__file__).resolve().parent.parent / "channel-bible/characters/sam_puppet"


def mouth_poly():
    upper = [(98, 262), (115, 268), (135, 272), (165, 274), (195, 271), (218, 266), (238, 258)]
    lower = [(228, 270), (210, 288), (188, 300), (165, 304), (140, 300), (118, 288), (104, 272)]
    return upper, lower


def main():
    im = Image.open(D / "head_happy.png").convert("RGBA")
    a = np.array(im)
    upper, lower = mouth_poly()
    poly = upper + lower
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    mask = mask.filter(ImageFilter.MaxFilter(5))
    # fill the opening with the stubble/skin texture from just below the mouth (inpaint + texture)
    m = np.array(mask)
    rgb = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2BGR)
    filled = cv2.inpaint(rgb, m, 6, cv2.INPAINT_NS)
    rng = np.random.default_rng(4)
    grain = rng.normal(0, 5, filled.shape[:2])[..., None]
    dots = (rng.random(filled.shape[:2]) < 0.05)[..., None] * -18   # stubble specks like the art
    blend = np.clip(filled.astype(float) + 6 + grain + dots, 0, 255).astype(np.uint8)
    closed = rgb.copy()
    closed[m > 0] = blend[m > 0]
    closed = cv2.cvtColor(closed, cv2.COLOR_BGR2RGB)
    c = Image.fromarray(np.dstack([closed, a[..., 3]]))
    c = Image.composite(c.filter(ImageFilter.GaussianBlur(0.6)), c, mask.filter(ImageFilter.GaussianBlur(3)))
    d = ImageDraw.Draw(c)
    smile = [(98, 262), (115, 270), (135, 276), (165, 279), (195, 276), (218, 269), (238, 258)]
    d.line(smile, fill=(72, 50, 40, 255), width=5, joint="curve")
    d.line([(150, 294), (165, 296), (182, 294)], fill=(150, 95, 80, 200), width=4, joint="curve")
    c.save(D / "head_talk_0.png")
    # half-open: original teeth/opening only in its upper part
    half_mask = Image.new("L", im.size, 0)
    hp = upper + [(226, 268), (205, 280), (165, 286), (125, 280), (104, 270)]
    ImageDraw.Draw(half_mask).polygon(hp, fill=255)
    half_mask = half_mask.filter(ImageFilter.GaussianBlur(1.5))
    h = Image.composite(im, c, half_mask)
    ImageDraw.Draw(h).line([(110, 274), (135, 282), (165, 286), (195, 282), (222, 270)], fill=(59, 42, 34, 255), width=5, joint="curve")
    h.save(D / "head_talk_1.png")
    im.save(D / "head_talk_2.png")
    strip = Image.new("RGBA", (im.width * 3 + 40, im.height), (200, 230, 210, 255))
    for i in range(3):
        strip.alpha_composite(Image.open(D / f"head_talk_{i}.png"), (i * (im.width + 20), 0))
    strip.crop((0, 180, strip.width, 360)).resize((strip.width * 2, 360)).save(
        "/tmp/claude-0/-home-user-vyom/cdf396e7-096a-50d3-9ca3-232af1f8c299/scratchpad/mouths.png")


if __name__ == "__main__":
    main()
