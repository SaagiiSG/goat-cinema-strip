---
name: goat-cinema-strip
description: Cinema Strip · Өргөн дэлгэц. Edits the user's phone clips into a wide movie strip across a black 9:16 screen, with a teal-orange film grade, slow push-ins, fades from and to black, and wide-spaced Mongolian titles above and below the strip. Renders a 1080x1920 MP4 for Reels/TikTok. Best for car reveals, property tours, barber transformations (noir), boutique and jewellery launches, salon atmosphere. Use whenever the user wants a cinematic, movie-like, letterbox or "кино шиг" edit, or types /goat-cinema-strip, /кино, or says "кино шиг болгоод өг", "өргөн дэлгэцтэй видео хий", "make it cinematic", even if they don't name the skill.
---

# Cinema Strip · Өргөн дэлгэц

A thin, wide movie strip (2.39:1) across the middle of a black phone screen, in teal-and-orange movie colours, with a slow push-in on every shot and widely spaced titles in the black space above and below. It is the only GOAT look shaped like a cinema screen.

**Good for:** car reveals and road shots, property views and exteriors, barber before/after reveals (noir grade), boutique and jewellery launch teasers, salon atmosphere.
**Not for:** price lists and menus, talking-head advice, nail and makeup close-ups, faces in close-up. The strip uses about a quarter of the screen height, so small details get lost. If the user's footage is one of these, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`.

## 1. Setup check (first time on a machine)

Run `ffmpeg -version` and `uv --version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install ffmpeg uv`
- Windows: `winget install Gyan.FFmpeg` and `winget install astral-sh.uv`, then close and reopen the terminal.

The first render downloads a small Python package (Pillow) once. After that it is instant.

## 2. Collect the clips and words

Make `raw/` and `output/` in the current folder. Ask for:
1. **The clips.** Drag them into the chat or copy them into `raw/`. Photos work too (they are held still, then pushed in).
2. **The words:** a short title (2–3 words, e.g. "ШИНЭ ҮЙЛЧИЛГЭЭ") and one line (date, place, phone or price, e.g. "ЭНЭ НАМАР · 9911-2233"). Never invent a price, phone number or date. Ask.

If this folder was already edited with `goat-video-editor`, use `output/cut.mp4` as the clip and `transcript/cut_words.json` for word times.

Then run: `uv run SKILL_DIR/scripts/goatcut.py probe raw/*`
It prints each file's size, length, whether it has sound, whether it is HDR, and `speech` spans (when someone is talking). Use these to pick shots and time the words.

## 3. Write plan.json

Write `plan.json` in the project folder. Paths are relative to it.

```json
{
  "output": "output/cinema-strip.mp4",
  "clips": [
    {"src": "raw/IMG_0412.MOV", "in": 1.2, "out": 3.8},
    {"src": "raw/IMG_0415.MOV", "in": 0.0, "out": 2.6, "cy": 0.35},
    {"src": "raw/car.jpg", "dur": 2.5}
  ],
  "texts": [
    {"role": "title", "text": "ШИНЭ ҮЙЛЧИЛГЭЭ", "start": 0.6, "end": 4.5},
    {"role": "line",  "text": "ЭНЭ НАМАР · 9911-2233", "start": 1.2, "end": 7.5}
  ],
  "music": {"src": "raw/song.mp3", "volume": 0.25},
  "look": {"grade": "teal-orange", "ratio": "2.39", "cuts": "cut", "title_font": "sans"}
}
```

**clips** play in order. `in`/`out` trim a video (seconds); `dur` sets how long a photo shows. `cx`/`cy` (0–1, default 0.5) choose which part of the frame the strip keeps: `cy: 0.3` keeps the upper part (faces), `cy: 0.7` the lower part. Add `"sound": false` to mute one clip.
**texts:** `title` sits in the black above the strip in wide-spaced capitals; `line` sits below it in smaller bold capitals. Only one of each shows at a time. Long Mongolian words shrink to fit automatically.
**Auto sound effects:** a soft low boom as each title lands; with `"cuts": "dip"`, a whoosh through each dip.
**look** options:
- `grade`: `teal-orange` (default), `noir` (black-and-white, for barber reveals), `bleach` (muted, gritty), `estate` (warm and neutral, for property: whites stay white).
- `ratio`: `2.39` (default, thinnest), `2`, `1.85` (taller strip, more of the picture).
- `cuts`: `cut` (hard cuts) or `dip` (a quick dip through black between shots).
- `title_font`: `sans` (Montserrat Light, default) or `serif` (Cormorant SC, classic).

**Timing:** hold each shot 2–3 s. Slow is the point: "slowness is not indulgence; it is confidence". The video fades in from black over the first 0.8 s and out over the last 0.8 s, so start the title at about 0.6 s and end the last shot on something worth holding.

Before rendering, tell the user the plan in plain words (shot list + the words + the grade) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `goatcut.py probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 4. Render and check

`uv run SKILL_DIR/scripts/render.py plan.json`

A 30 s video takes about 30–60 s. Then look at three frames before saying it is done:
`ffmpeg -y -loglevel error -ss 2 -i output/cinema-strip.mp4 -frames:v 1 output/check-1.jpg` (and two more times). Read them. Check that words are not cut off, faces are inside the strip (fix with `cy`), and nothing important is too dark.

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 5. Hand over

Tell the user where the file is (`output/cinema-strip.mp4`) and that it is ready to post. Captions and music can be added in the Instagram/TikTok app.

## Rules

- Anything the viewer must read (price, phone, offer) goes in `line`, which sits inside the area no app buttons cover. Never put it anywhere else.
- Use only the fonts bundled in `SKILL_DIR/fonts` (they have Ө ө Ү ү). Don't swap in other fonts.
- Keep titles short. Two or three words read better than a sentence.
- The output is 1080x1920, 30 fps, H.264, sound normalised to -14 LUFS (Instagram/TikTok level).
