// 09 Cinema Strip. Reads window.PLAN (goat.mjs writes it; look.mjs works out the strip, every push, dip and
// text time) and builds one paused GSAP timeline.
const P = window.PLAN, S = P.strip, T = P.T;
const $ = (s) => document.querySelector(s);
const tl = gsap.timeline({ paused: true });
const FIRST = 1 / 30;

// The strip, and the footage in it at its 6%-bigger size, centred.
Object.assign($("#strip").style, { top: `${S.top}px`, height: `${S.h}px` });
const [fw, fh] = S.fit;
Object.assign($("#push").style, { width: `${fw}px`, height: `${fh}px`, left: `${(1080 - fw) / 2}px`, top: `${(S.h - fh) / 2}px` });

// Each shot pushes in from just covering the strip to 6% more (about 1:1), steadily, cut to cut (v1).
gsap.set("#push", { scale: S.s0, force3D: false });
for (const p of P.pushes)
  tl.fromTo("#push", { scale: S.s0 }, { scale: S.s0 * p.to, duration: p.len, ease: "none", force3D: false, immediateRender: false }, p.at);

// A dip through black at each cut look.mjs kept: 0.25 s down, 0.25 s back. Two never overlap.
for (const c of P.dips) {
  tl.fromTo("#dip", { opacity: 0 }, { opacity: 1, duration: T.dip, ease: "sine.inOut", immediateRender: false }, c - T.dip);
  tl.fromTo("#dip", { opacity: 1 }, { opacity: 0, duration: T.dip, ease: "sine.inOut", immediateRender: false }, c);
}

// The strip fades up from 50% black over 0.8 s, so frame 0 (the thumbnail) shows the footage (Ruling C);
// the whole screen, words too, fades to black over the last 0.8 s.
gsap.set("#open", { opacity: 0.5 });
tl.fromTo("#open", { opacity: 0.5 }, { opacity: 0, duration: T.open, ease: "sine.out", immediateRender: false }, 0);
tl.fromTo("#close", { opacity: 0 }, { opacity: 1, duration: T.close, ease: "sine.in", immediateRender: false }, Math.max(FIRST, P.dur - T.close));

// Title above the strip, line below; one of each at a time. Each fades in over 0.8 s and out over 0.5 s; one up
// on frame 0 is already there, one that stays fades with the screen.
const els = P.items.map((t) => {
  const el = $("#texts").appendChild(document.createElement("div"));
  el.className = t.role === "title" && P.serif ? "title serif" : t.role;
  for (const row of t.text.split("\n")) el.appendChild(document.createElement("div")).textContent = row.trim();
  gsap.set(el, { xPercent: -50 });
  if (t.start < FIRST) gsap.set(el, { opacity: 1 });
  else tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: T.in, ease: "sine.out", immediateRender: false }, t.start);
  if (!t.stays) tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: T.out, ease: "sine.in", immediateRender: false }, t.end - T.out);
  return { el, role: t.role };
});

tl.set({}, {}, P.dur);
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;

// Sizes need the real fonts; the renderer waits for document.fonts.ready before the first frame. Each text fits
// the 840 px safe width, down to the floors look.mjs's row limits are measured at (title 34 px, serif 42, line 26).
// Title: line-height 1 puts the baseline 0.8585 em below the box's top in Montserrat
// (ascent 0.968, descent 0.251), 0.8185 em in Cormorant SC (0.924, 0.287); it sits 105 px above the strip, as in
// the preview, so the tallest letters (Й, 0.875 em) stay below y 270 even over the 1.85 strip. Line: at
// line-height 1.5 the cap top is 0.4085 em below the row's top; it sits 70 px under the strip, as in the preview.
function layout() {
  for (const { el, role } of els) {
    if (role === "title") {
      const s = P.serif ? GOAT.fit(el, 840, 80, 42) : GOAT.fit(el, 840, 64, 34);
      el.style.top = `${S.top - 105 - (P.serif ? 0.8185 : 0.8585) * s}px`;
    } else {
      const s = GOAT.fit(el, 840, 40, 26);
      el.style.top = `${S.top + S.h + 70 - 0.4085 * s}px`;
    }
  }
}
layout();
document.fonts.ready.then(layout);
