---
name: goat-cinema-strip
description: Cinema Strip · Өргөн дэлгэц. Edits the user's phone clips into a wide movie strip across a black 9:16 screen, with a teal-orange film grade, a slow push-in on every shot, dips through black at the cuts, fades from and to black, and wide-spaced Mongolian titles in the black above and below the strip. Built on HyperFrames. Renders a 1080x1920 MP4 for Reels/TikTok. Best for car reveals, property tours, barber transformations (noir), boutique and jewellery launches, salon atmosphere. Use whenever the user wants a cinematic, movie-like, letterbox or "кино шиг" edit, or types /goat-cinema-strip, /кино, or says "кино шиг болгоод өг", "өргөн дэлгэцтэй видео хий", "make it cinematic", even if they don't name the skill.
---

# Cinema Strip · Өргөн дэлгэц

A thin, wide movie strip (2.39:1) across the middle of a black phone screen, in teal-and-orange movie colours with a soft vignette and fine grain. Every shot pushes in slowly; cuts are hard or dip through black. A widely spaced title sits in the black above the strip and a short line (date, place, phone) below it. The strip fades up at the start and the whole screen fades to black at the end. It is the only GOAT look shaped like a cinema screen.

**Good for:** car reveals and road shots, property views and exteriors, barber before/after reveals (noir grade), boutique and jewellery launch teasers, salon atmosphere.
**Not for:** price lists and menus, talking-head advice, nail and makeup close-ups, faces in close-up. The strip uses about a quarter of the screen height, so small details get lost. If the user's footage is one of these, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`. `goat` below means `node SKILL_DIR/scripts/goat.mjs`.

## 1. Setup check (first time on a machine)

Run `node --version` (needs 22 or newer) and `ffmpeg -version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install node ffmpeg`
- Windows: `winget install OpenJS.NodeJS.LTS` and `winget install Gyan.FFmpeg`, then close and reopen the terminal.

This look has no captions, so it needs no speech model. The first render downloads, once, a private copy of Chrome that draws the frames. Tell the user the first run takes a while; after that it starts at once. Nothing is uploaded: everything runs on their computer, with no account.

**Long steps:** the first `render` (the Chrome download) can run longer than a normal command timeout. Run it in the background, or with a 600000 ms timeout, and wait for it to end. Never stop it and start it again.

**Windows has not been tested yet.** If a step fails there, show the error to the user in plain words.

## 2. Collect the clips and words

Make `raw/` and `output/` in the current folder. Ask for:
1. **The clips.** Drag them into the chat or copy them into `raw/`. Slow, steady, wide shots work best, 2–3 s each. **Filmed sideways (landscape) is best:** the whole picture fits the strip. An upright phone clip shows only a band about a quarter of its height (you choose which band, see `cy` below). Photos work too (they hold still while the push moves in).
2. **The words:** a short title (2–3 words, e.g. "ШИНЭ ҮЙЛЧИЛГЭЭ") and one line (date, place, phone or price, e.g. "ЭНЭ НАМАР · 9911-2233"). Never invent a price, phone number or date. Ask.

Then run `goat probe raw/*`. It prints each file's size, length, whether it has sound, whether it is HDR, and `speech` spans (when someone is talking). Use these to pick shots.

## 3. Prepare

Write `plan.json` in the project folder (paths are relative to it):

```json
{
  "output": "output/cinema-strip.mp4",
  "clips": [
    {"src": "raw/IMG_0412.MOV", "in": 1.2, "out": 3.8},
    {"src": "raw/IMG_0415.MOV", "in": 0.0, "out": 2.6, "cy": 0.4},
    {"src": "raw/car.jpg", "dur": 2.5}
  ],
  "texts": [
    {"role": "title", "text": "ШИНЭ ҮЙЛЧИЛГЭЭ", "start": 0, "end": 4.2},
    {"role": "line", "text": "ЭНЭ НАМАР · 9911-2233", "start": 0.8}
  ],
  "music": {"src": "raw/song.mp3", "volume": 0.25},
  "look": {"grade": "teal-orange", "ratio": "2.39", "cuts": "dip", "title_font": "sans"}
}
```

**clips** play in order. `in`/`out` trim a video (seconds); `dur` sets how long a photo shows. `cx`/`cy` (0–1, default 0.5) choose which part of the frame the strip keeps: for an upright clip, `cy` is roughly how far down the frame the band sits (`cy: 0.3` keeps the upper part, `cy: 0.7` the lower part); for a landscape clip only a thin top and bottom are cut, so it barely matters. Add `"sound": false` to mute one clip.

Then run these in order. Each one says what to run first if a step is missing.
1. `goat prep plan.json`: crops every clip to the strip (6% bigger, for the push), grades it (the `grade` below, a vignette and fine grain) and joins them into `.work-cinema-strip/main.mp4`. **Run it again whenever `clips`, `grade` or `ratio` change** (render refuses footage prepared for another grade or ratio).
2. `goat cut plan.json`: this look never cuts pauses; the step only readies the video (`.work-cinema-strip/cut.mp4`) and takes a second.

**Check the framing** before writing the words, above all on upright clips. For each shot, pull one frame from inside it, 0.4 s after it starts (never at a cut: that frame may already be the next shot). A shot starts where the shots before it end; for the second shot above (2.6 to 5.2 s):
`ffmpeg -y -loglevel error -ss 3.0 -i .work-cinema-strip/cut.mp4 -frames:v 1 output/frame-3.0.jpg`
Read it. The strip shows all of it as the shot starts; by its end the push has moved in to the middle 94%. If a face or the subject is cut off, move `cy` toward it (a head cut at the top: lower `cy`) and run `prep` again.

## 4. Write the words

**texts** (only one title and one line show at a time: a later one ends the one before):
- `title`: wide-spaced capitals in the black above the strip, Montserrat Light, warm white, up to 64 px (or Cormorant SC up to 80 px, see `title_font`). **One row, at most 16 characters** (spaces count): 2 or 3 words. A longer title, or one with `\n`, is refused with a message: shorten it. A long row shrinks to fit the 840 px safe width: "ШИНЭ ЗАГВАР" stays at 64 px, "ШИНЭ ҮЙЛЧИЛГЭЭ" comes out at about 56 px, a full 16-character row at about 49 px (down to 34 px for a row of the widest letters, Щ Ш Ю).
- `line`: smaller bold spaced capitals below the strip, Montserrat SemiBold, warm grey, up to 40 px. For the date, place, phone or price. **At most 22 characters a row** (spaces count); split a longer one into 2 rows with `\n` (2 at most). "ЭНЭ НАМАР · 9911-2233" fits at the full 40 px; a row of the widest letters goes down to 26 px.

Both are drawn in capitals whatever case you write (a `serif` title keeps your case: lower-case letters come out as small capitals). Each fades in over 0.8 s from its `start` and out over 0.5 s before its `end` (default: the next one's start, or the end of the video). One that ends in the last 0.8 s stays up and fades out with the screen. **Each needs 2 s on screen at least**; a shorter one is refused with a message.

**The first frame is the Reels thumbnail.** Give the first title `"start": 0`: it is then already there on frame 0, sharp, over the strip (which starts half-dark and fades up over 0.8 s). Start on a shot worth seeing.

**look** options:
- `grade`: `teal-orange` (default), `noir` (black-and-white, for barber reveals), `bleach` (muted, gritty), `estate` (warm and neutral, for property: whites stay white).
- `ratio`: `2.39` (default, thinnest), `2`, `1.85` (taller strip, more of the picture).
- `cuts`: `cut` (default, hard cuts) or `dip` (a quick dip through black between shots: 0.25 s down, 0.25 s back).
- `title_font`: `sans` (Montserrat Light, default) or `serif` (Cormorant SC, classic).

**Timing:** hold each shot 2–3 s. Slow is the point: "slowness is not indulgence; it is confidence". Every shot pushes in 6% from its cut to the next (a shot under 2 s pushes less, at the same slow speed). The strip fades up from half-dark over the first 0.8 s and everything fades to black over the last 0.8 s, so end the last shot on something worth holding.

**Dips (with `"cuts": "dip"`):** a cut gets a dip only where the footage around it is clean: not in the first or last 1.4 s, at least 0.85 s after the last dip, and not while a title or line fades in or out (a word changing during a dip stutters). Those cuts stay hard. To keep a dip, start each title or line at least 0.6 s after that cut (or 1.4 s before it) and end it at least 0.6 s before the cut (or 1.1 s after it). The example above dips at both cuts. Dips never come faster than 2 a second, well under the 3-flashes-a-second limit.

**Auto sound effects** (soft, about a third of the old version's levels; raise them with `"sfx": {"volume": 1.5}`): a low boom as each title lands (one on frame 0 if the first title is up from the start) and, with `"cuts": "dip"`, a whoosh into each dip. Never two within 0.5 s.

Before rendering, tell the user the plan in plain words (shot list + the words + the grade) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio-node.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `node SKILL_DIR/scripts/goat.mjs probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 5. Render and check

`goat render plan.json`

It draws the strip, pushes, dips, fades and words over the graded footage, mixes the sound and writes the MP4 plus a contact sheet (one frame per second) at `.work-cinema-strip/sheet.jpg`. On our test Mac a 12.4 s video of 5 shots with 4 dips took 19–30 s to render (prep 8 s); an 8.2 s video of 4 shots took 16 s, a 6 s one 12 s. Longer videos take longer. Run the next render only after the last one ends.

Read the contact sheet, the first frame and two full-size frames inside each shot of 0.5 s or more: 0.4 s after it starts, and 0.1 s before it ends (0.35 s before, if that cut dips: never on a dip, where the strip is black). For the example plan:
`ffmpeg -y -loglevel error -i output/cinema-strip.mp4 -frames:v 1 output/check-0.jpg`
`ffmpeg -y -loglevel error -ss 2.25 -i output/cinema-strip.mp4 -frames:v 1 output/check-2.25.jpg` (the first shot, title and line up)
`ffmpeg -y -loglevel error -ss 3.0 -i output/cinema-strip.mp4 -frames:v 1 output/check-3.0.jpg` (and the same for each later shot).
Check that:
- the first frame (the thumbnail) shows the footage and the title;
- every word is spelled right (Ө ө Ү ү!) and whole, the title above the strip, the line below;
- faces and the subject are inside the strip (fix with `cy`), and nothing important is too dark.

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 6. Hand over

Tell the user where the file is (`output/cinema-strip.mp4`) and that it is ready to post. Captions and music can be added in the Instagram/TikTok app.

## Rules

- Anything the viewer must read (price, phone, offer) goes in `line`, which sits inside the area no app buttons cover. Never put it anywhere else.
- Use only the fonts bundled in `SKILL_DIR/fonts` (Montserrat and Cormorant SC have Ө ө Ү ү and ₮). Don't swap in other fonts. Emoji and symbols such as ★ can't be drawn.
- Keep titles short. Two or three words read better than a sentence.
- Never invent a price, phone number or date; ask.
- The output is 1080x1920, 30 fps, H.264. The clips' own sound, the voice-over and the music are brought to -14 LUFS together (Instagram/TikTok level) and the effects play on top. With nothing to bring up (silent clips, no music or voice-over) the effects play alone, so such a reel is much quieter than that (our silent test: -31 LUFS); add music in the app.
