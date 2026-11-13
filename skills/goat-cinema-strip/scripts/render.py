# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["pillow>=10.4", "numpy>=1.26"]
# ///
"""Cinema Strip · Өргөн дэлгэц.

A wide movie strip across a black phone screen: teal-orange grade, a slow push-in on every shot,
fades from and to black, wide-spaced titles in the black above and a short line below.
Usage: uv run render.py plan.json
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import goatcut as g  # noqa: E402
from PIL import Image  # noqa: E402

NAME = "cinema-strip"
STRIP_H = {"2.39": 452, "2": 540, "1.85": 584}  # strip height on a 1080-wide screen
CENTER_Y = 734                                  # strip centre; titles sit in the black above and below
PUSH = 1.06                                     # each shot drifts from 1.00 to 1.06 zoom
GRADES = {
    "teal-orange": "colorbalance=rs=-0.10:gs=0.02:bs=0.12:rm=0.03:bm=-0.03:rh=0.10:gh=0.03:bh=-0.10,"
                   "eq=contrast=1.08:saturation=1.10",
    "noir": "colorchannelmixer=.5:.4:.1:0:.5:.4:.1:0:.5:.4:.1,curves=preset=increase_contrast",
    "bleach": "eq=contrast=1.12:saturation=0.55",
    "estate": "colortemperature=temperature=5800,eq=contrast=1.02:saturation=1.05:gamma=1.04",
}
SANS, SERIF = "Montserrat[wght].ttf", "CormorantSC-Medium.ttf"


def strip_h(ctx):
    r = str(ctx.opt("ratio", "2.39"))
    if r not in STRIP_H:
        g.die(f'look.ratio must be one of {", ".join(STRIP_H)}')
    return STRIP_H[r]


def FIT_SIZE(ctx):
    # clips come in 6% bigger than the strip so the push-in never upscales
    return 1146, round(strip_h(ctx) * PUSH / 2) * 2


def GRADE(ctx):
    name = ctx.opt("grade", "teal-orange")
    if name not in GRADES:
        g.die(f'look.grade must be one of {", ".join(GRADES)}')
    return GRADES[name] + ",vignette=PI/5,noise=alls=8:allf=t"


def setup(ctx):
    ctx.h = strip_h(ctx)
    ctx.top = CENTER_Y - ctx.h // 2
    ctx.black = Image.new("RGB", (1080, ctx.h), (0, 0, 0))


def SFX(ctx):
    # a soft low boom as each title lands; a whoosh through each dip between shots
    ev = [{"sound": "boom", "at": x["start"], "volume": 0.7} for x in ctx.texts("title")]
    if ctx.opt("cuts", "cut") == "dip":
        ev += [{"sound": "whoosh", "at": max(0, c - 0.35), "volume": 0.6} for c in ctx.cuts[1:]]
    return ev


def title_sprite(ctx, text):
    if ctx.opt("title_font", "sans") == "serif":
        f = ctx.fit(text, SERIF, 840, 84, tracking=0.12)
        return g.text_sprite(text, f, tracking=0.12)
    f = ctx.fit(text, SANS, 840, 64, axes={"wght": 300}, tracking=0.3)
    return g.text_sprite(text, f, tracking=0.3)


def line_sprite(ctx, text):
    f = ctx.fit(text, SANS, 840, 38, axes={"wght": 600}, tracking=0.18)
    return g.text_sprite(text, f, fill=(236, 230, 220, 255), tracking=0.18)


def frame(img, t, ctx):
    i, lt = ctx.clip_at(t)
    z = 1 + (PUSH - 1) * g.clamp(lt / ctx.clips[i]["dur"])
    fw, fh = img.size
    cw, ch = fw / PUSH * (PUSH / z), fh / PUSH * (PUSH / z)
    box = ((fw - cw) / 2, (fh - ch) / 2, (fw + cw) / 2, (fh + ch) / 2)
    strip = img.resize((1080, ctx.h), Image.BICUBIC, box=box)
    if ctx.opt("cuts", "cut") == "dip":  # quick dip through black at each cut
        d = min([abs(t - c) for c in ctx.cuts[1:]] or [1])
        if d < 0.25:
            strip = Image.blend(ctx.black, strip, d / 0.25)

    canvas = Image.new("RGBA", (1080, 1920), (0, 0, 0, 255))
    canvas.paste(strip, (0, ctx.top))
    for item in ctx.active(t, "title")[-1:]:
        s = ctx.cache(("title", item["text"]), lambda: title_sprite(ctx, item["text"]))
        g.paste(canvas, s, 540, ctx.top - 64, g.fade(t, item, 0.6, 0.4), anchor="mb")
    for item in ctx.active(t, "line")[-1:]:
        s = ctx.cache(("line", item["text"]), lambda: line_sprite(ctx, item["text"]))
        g.paste(canvas, s, 540, ctx.top + ctx.h + 60, g.fade(t, item, 0.5, 0.4), anchor="mt")

    a = g.clamp(min(t / 0.8, (ctx.dur - t) / 0.8))  # 0.8 s fade from and to black
    if a < 1:
        canvas = Image.blend(Image.new("RGBA", canvas.size, (0, 0, 0, 255)), canvas, a)
    return canvas


if __name__ == "__main__":
    g.run(sys.modules[__name__])
