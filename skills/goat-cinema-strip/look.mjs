// 09 Cinema Strip: a thin wide movie strip (2.39:1, or 2:1, 1.85:1) across the middle of a black screen, graded
// teal-and-orange (or noir, bleach, estate) with a vignette and fine grain baked in by ffmpeg. Every shot pushes
// in 6%, cuts are hard or dip through black, the strip fades up at the start and everything fades to black at
// the end. A wide-spaced Montserrat Light (or Cormorant SC) title sits in the black above, a line below.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { missing } from "./scripts/fonts.mjs";
import { probe } from "./scripts/media.mjs";
await import("./scripts/goat-lib.js"); // GOAT.spaced, the same one the template uses

export const NAME = "cinema-strip";
export const TALKS = false;

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const RATIOS = ["2.39", "2", "1.85"], STRIP_H = [452, 540, 584]; // strip height on the 1080-wide screen (v1)
const CENTRE = 734, WIDE = 1146, PUSH = 0.06; // clips come in 6% bigger than the strip (v1)
const GRADES = { // v1's, verbatim
  "teal-orange": "colorbalance=rs=-0.10:gs=0.02:bs=0.12:rm=0.03:bm=-0.03:rh=0.10:gh=0.03:bh=-0.10," +
    "eq=contrast=1.08:saturation=1.10",
  noir: "colorchannelmixer=.5:.4:.1:0:.5:.4:.1:0:.5:.4:.1,curves=preset=increase_contrast",
  bleach: "eq=contrast=1.12:saturation=0.55",
  estate: "colortemperature=temperature=5800,eq=contrast=1.02:saturation=1.05:gamma=1.04",
};
const FONTS = { sans: ["Montserrat[wght].ttf", "Montserrat"], serif: ["CormorantSC-Medium.ttf", "Cormorant SC"] };
// Row limits, from HarfBuzz advances of the bundled fonts at the floor sizes look.js fits down to, so a row of
// the widest Mongolian capital (Щ) still fits the 840 px safe width: title 16 x (1.114 + 0.32 tracking) em at
// 34 px = 791 px (Montserrat 300; even 16 № make 836), serif 16 x (1.047 + 0.12) em at 42 px = 789 px (Cormorant
// SC), line 22 x (1.125 + 0.28) em at 26 px = 811 px (Montserrat 600). Real capitals run near 0.73 em a letter,
// so a 16-letter title comes out about 49 px, "ЭНЭ НАМАР · 9911-2233" at the line's full 40 px.
const ROW = { title: 16, line: 22 }, ROWS = { title: 1, line: 2 };
// seconds: the strip's fade up from 50% black (Ruling C: frame 0 is the thumbnail), the fade to black at the end,
// a dip each way, a text's fade in and out, a text's least time on screen, clean footage between strip events
const T = { open: 0.8, close: 0.8, dip: 0.25, in: 0.8, out: 0.5 };
const MIN = 2, CLEAR = 1 / 3;
const FIRST = 1 / 30, EPS = 1e-9;

const isNum = (n) => typeof n === "number" && Number.isFinite(n);
const r3 = (n) => Math.round(n * 1000) / 1000;
const frame = (t) => (t === Infinity ? t : Math.round(t * 30) / 30); // the frame look.js shows it on
const quote = (t) => `"${String(t.text ?? "").trim().replace(/\s*\n\s*/g, " / ")}"`;
const seconds = (dur) => {
  if (!(dur === Infinity || (isNum(dur) && dur > 0))) throw new Error("the video's length must be seconds");
};

function option(look, key, values, def) {
  const v = look?.[key] ?? def;
  if (!values.includes(v)) throw new Error(`look ${key} must be ${values.length > 2 ? "one of " + values.join(", ")
    : values.map((x) => `"${x}"`).join(" or ")}`);
  return v;
}
const grade = (look) => option(look, "grade", Object.keys(GRADES), "teal-orange");

// The strip: its height and top on screen, the clips' size (6% bigger, even) and the scale that makes them just
// cover the strip. Each shot pushes from there to 6% more, about 1:1 (ratio 2 ends 0.07% over), so the push
// never visibly upscales (v1).
export function strip(look = {}) {
  const i = RATIOS.indexOf(String(look?.ratio ?? "2.39")); // 2.39 or "2.39"
  if (i < 0) throw new Error(`look ratio must be one of ${RATIOS.join(", ")}`);
  const h = STRIP_H[i], fh = Math.round((h * (1 + PUSH)) / 2) * 2;
  return { h, top: CENTRE - h / 2, fit: [WIDE, fh], s0: Math.max(1080 / WIDE, h / fh) };
}
export const FIT = (plan) => strip(plan.look).fit;

// Per clip, after the crop to FIT: the grade, a vignette and fine moving grain (v1). It runs in prep, which bakes
// the grade into the footage, so it records the grade in the work folder (goat.mjs's .work-<NAME>) for prepare to check.
export async function clipFilter(clip, ctx) {
  const g = grade(ctx.plan.look), work = join(ctx.planDir, `.work-${NAME}`);
  mkdirSync(work, { recursive: true });
  writeFileSync(join(work, "grade.txt"), g);
  return `${GRADES[g]},vignette=PI/5,noise=alls=8:allf=t`;
}

export function validate(plan) {
  const look = plan.look ?? {};
  grade(look);
  strip(look);
  option(look, "cuts", ["cut", "dip"], "cut");
  const font = option(look, "title_font", ["sans", "serif"], "sans");
  const list = plan.texts ?? [];
  for (const t of list) {
    if (t.role !== "title" && t.role !== "line") throw new Error(`text role "${t.role}" is not used by this look. Use "title" or "line".`);
    const text = String(t.text ?? "");
    if (!text.trim()) throw new Error(`a "${t.role}" text is empty`);
    if (t.start !== undefined && !(isNum(t.start) && t.start >= 0)) throw new Error(`${quote(t)}: "start" must be seconds, 0 or more`);
    if (t.end !== undefined && !(isNum(t.end) && t.end > (t.start ?? 0))) throw new Error(`${quote(t)} must end after it starts`);
    const face = t.role === "title" ? font : "sans";
    const drawn = (x) => (face === "sans" ? x.toUpperCase() : x); // Montserrat is drawn in capitals, Cormorant SC as written
    const rows = text.split("\n").map((r) => r.trim());
    if (rows.some((r) => !r)) throw new Error(`${quote(t)} has an empty row: remove the extra \\n`);
    if (t.role === "title" && rows.length > 1) throw new Error(`${quote(t)}: a title is one row: remove the \\n and shorten it`);
    if (rows.length > ROWS[t.role]) throw new Error(`${quote(t)} has ${rows.length} rows: a ${t.role} takes ${ROWS[t.role]} rows at most`);
    for (const row of rows)
      if ([...drawn(row)].length > ROW[t.role])
        throw new Error(t.role === "title"
          ? `"${row}" is too long for a title (${ROW.title} characters at most): shorten it to 2 or 3 words`
          : `"${row}" is too long for one line row (${ROW.line} characters at most): shorten it, or split it into 2 rows with \\n`);
    const [file, name] = FONTS[face];
    const bad = missing(drawn(text), join(SKILL_DIR, "fonts", file));
    if (bad.length) throw new Error(`${quote(t)} uses ${bad.join(" ")}, which ${name} can't draw`);
  }
  texts(list, Infinity);
}

// Each shot pushes in 6% from its cut to the next (the last to the end), no faster than over 2 s.
export function pushes(cuts, dur) {
  seconds(dur);
  if (!cuts.every(isNum)) throw new Error("the cut times must be seconds");
  return cuts.map((at, i) => {
    const len = r3((cuts[i + 1] ?? dur) - at);
    return { at, len, to: Math.round((1 + (PUSH * Math.min(len, 2)) / 2) * 1e5) / 1e5 };
  }).filter((p) => p.len > EPS);
}

// The titles and lines in order, one of each role at a time (a later one ends the one before), their times on the
// frame grid look.js shows them on. One that ends inside the closing fade stays up and fades with the screen.
// Each needs 2 s: 0.8 s to fade in, 0.5 s to fade out, and time to read. dur is Infinity before prep (validate).
export function texts(list, dur) {
  seconds(dur);
  const out = [];
  for (const role of ["title", "line"]) {
    const mine = list.filter((t) => t.role === role);
    for (const t of mine) {
      if (!(isNum(t.start ?? 0) && (t.start ?? 0) >= 0)) throw new Error(`${quote(t)}: "start" must be seconds, 0 or more`);
      if (t.end !== undefined && !isNum(t.end)) throw new Error(`${quote(t)}: "end" must be seconds`);
    }
    const order = [...mine].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    order.forEach((t, i) => {
      const start = frame(t.start ?? 0);
      if (start >= dur) throw new Error(`${quote(t)} starts at ${(t.start ?? 0).toFixed(2)} s, after the video ends (${dur.toFixed(2)} s)`);
      let end = frame(Math.min(t.end ?? dur, order[i + 1]?.start ?? dur, dur));
      const stays = end > dur - T.close + EPS;
      if (stays) end = dur;
      if (end - start < MIN - EPS)
        throw new Error(`${quote(t)} shows for ${(end - start).toFixed(2)} s: a ${role} ` +
          `needs ${MIN} s (${T.in} s to fade in, ${T.out} s to fade out, and time to read). Move its start or end` +
          `${order[i + 1] ? `, or the next ${role}'s start` : ""}.`);
      out.push({ role, text: String(t.text), start, end, stays });
    });
  }
  return out;
}

// A dip through black at a cut: 0.25 s down, 0.25 s back (cuts "dip"). Only where it is clear, by 1/3 s of clean
// footage, of the strip's opening and closing fades, of the last dip, and of every title or line fading in or out
// (a text changing during a dip stutters). The other cuts are hard. Spaced so two never overlap, at most 2 a second.
export function dipTimes(cuts, dur, items = []) {
  seconds(dur);
  if (!cuts.every(isNum)) throw new Error("the cut times must be seconds");
  const busy = [[-Infinity, T.open], [dur - T.close, Infinity]];
  for (const t of items) {
    if (t.start >= FIRST) busy.push([t.start, t.start + T.in]);
    if (!t.stays) busy.push([t.end - T.out, t.end]);
  }
  const clear = (c) => busy.every(([a, b]) => c + T.dip + CLEAR <= a + EPS || c - T.dip - CLEAR >= b - EPS);
  return GOAT.spaced(cuts.filter((c) => c > EPS && clear(c)), 2 * T.dip + CLEAR);
}

const schedule = (plan, dur, cuts) => {
  const items = texts(plan.texts ?? [], dur);
  return { items, dips: plan.look?.cuts === "dip" ? dipTimes(cuts ?? [], dur, items) : [] };
};

export async function prepare(ctx) {
  const s = strip(ctx.plan.look), { w, h } = await probe(join(ctx.work, "cut.mp4"));
  if (w !== s.fit[0] || h !== s.fit[1]) // the template would stretch it into the new strip
    throw new Error(`the clips were prepared for another strip (${w}x${h}; ratio ${ctx.plan.look?.ratio ?? "2.39"} needs ` +
      `${s.fit.join("x")}): run "prep" again`);
  const stamp = join(ctx.work, "grade.txt"), was = existsSync(stamp) ? readFileSync(stamp, "utf8") : null;
  if (was !== grade(ctx.plan.look)) // the grade is baked in at prep
    throw new Error(was ? `the footage was graded "${was}" but the plan now says "${grade(ctx.plan.look)}": run "prep" again`
      : `the footage's grade wasn't recorded (prepared by an older version): run "prep" again`);
  const { items, dips } = schedule(ctx.plan, ctx.dur, ctx.cuts);
  return { strip: s, pushes: pushes(ctx.cuts.length ? ctx.cuts : [0], ctx.dur), dips, items,
    serif: ctx.plan.look?.title_font === "serif", T };
}

// v1's events at about 30% of its levels (Saagii, 15 Nov: half was still "a bit too much" on 08); members raise
// them with "sfx": {"volume": …}. A low boom as each title lands, a whoosh into each dip. The dips' clearance
// keeps every effect at least 0.5 s from the next (titles are 2 s apart, dips 0.83 s, a whoosh 1 s from a boom).
export function sfx(plan, ctx) {
  const { items, dips } = schedule(plan, ctx.dur, ctx.cuts);
  return [...items.filter((t) => t.role === "title").map((t) => ({ sound: "boom", at: r3(t.start), volume: 0.2 })),
    ...dips.map((c) => ({ sound: "whoosh", at: r3(c - 0.35), volume: 0.18 }))].sort((a, b) => a.at - b.at);
}
