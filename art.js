/* =====================================================================
   Artwork for the four sections.
   ---------------------------------------------------------------------
   Everything here is generated SVG. Nothing is a stock photograph and
   nothing is fetched from anywhere, which means: no licensing to track,
   no third-party host in the critical path, no layout shift, sharp at
   any size, and the art inherits each skin's palette automatically
   because it paints with the same CSS custom properties the rest of the
   page uses.

   Most of these are not decoration. The two radars, the impact plot and
   the hold-asymmetry bars are drawn from real values, so the picture
   moves when the numbers move.
   ===================================================================== */

const ART = (function () {
"use strict";

const TAU = Math.PI * 2;
const r2 = n => Math.round(n * 100) / 100;

/* polar helper: 0 is straight up, angles run clockwise */
function pt(cx, cy, radius, i, n) {
  const a = -Math.PI / 2 + (i / n) * TAU;
  return [r2(cx + radius * Math.cos(a)), r2(cy + radius * Math.sin(a))];
}
function poly(cx, cy, R, values, n) {
  return values.map((v, i) => pt(cx, cy, R * Math.max(0, Math.min(1, v)), i, n).join(",")).join(" ");
}
/* where a label should sit relative to its axis, so text never overlaps the ring */
function anchorFor(i, n) {
  const a = -Math.PI / 2 + (i / n) * TAU, c = Math.cos(a);
  return c > 0.25 ? "start" : c < -0.25 ? "end" : "middle";
}

const svg = (vb, inner, cls) =>
  '<svg class="art ' + (cls || "") + '" viewBox="' + vb + '" role="img" ' +
  'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' + inner + "</svg>";

const frame = (title, body, note) =>
  '<figure class="artbox">' + body +
  (title ? '<figcaption class="artcap"><b>' + title + "</b>" + (note ? " " + note : "") + "</figcaption>" : "") +
  "</figure>";

/* =====================================================================
   PROMETHEUS
   ===================================================================== */

/* Hub opener. Two instruments as two clusters of nodes, converging on a
   single point. Abstract on purpose: it is standing in for an idea, not
   charting anything. */
function dualConstellation() {
  const L = 15, R = 8, W = 900, H = 260, cx = W / 2, cy = H / 2;
  let s = "";

  /* the field behind */
  s += '<defs>' +
       '<radialGradient id="pgA" cx="50%" cy="50%"><stop offset="0%" stop-color="var(--sk-accent,#3FE0B0)" stop-opacity=".30"/>' +
       '<stop offset="100%" stop-color="var(--sk-accent,#3FE0B0)" stop-opacity="0"/></radialGradient>' +
       '<linearGradient id="pgL" x1="0" x2="1"><stop offset="0%" stop-color="var(--sk-accent,#3FE0B0)" stop-opacity=".05"/>' +
       '<stop offset="50%" stop-color="var(--sk-accent,#3FE0B0)" stop-opacity=".55"/>' +
       '<stop offset="100%" stop-color="var(--sk-violet,#A78BFA)" stop-opacity=".05"/></linearGradient>' +
       "</defs>";
  s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="210" ry="120" fill="url(#pgA)"/>';

  /* left cluster: the fifteen dimensions */
  const lx = 150, rx = W - 150;
  for (let i = 0; i < L; i++) {
    const t = i / (L - 1), y = 34 + t * (H - 68);
    const x = lx + Math.sin(t * Math.PI) * 46;
    s += '<line x1="' + x + '" y1="' + y + '" x2="' + cx + '" y2="' + cy +
         '" stroke="url(#pgL)" stroke-width="1"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="' + (2.6 + (i % 3)) +
         '" fill="var(--sk-accent,#3FE0B0)" opacity="' + (0.45 + (i % 4) * 0.14) + '"/>';
  }
  /* right cluster: the eight modes */
  for (let i = 0; i < R; i++) {
    const t = i / (R - 1), y = 46 + t * (H - 92);
    const x = rx - Math.sin(t * Math.PI) * 46;
    s += '<line x1="' + x + '" y1="' + y + '" x2="' + cx + '" y2="' + cy +
         '" stroke="url(#pgL)" stroke-width="1"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="' + (3 + (i % 3)) +
         '" fill="var(--sk-violet,#A78BFA)" opacity="' + (0.5 + (i % 3) * 0.16) + '"/>';
  }

  /* the point where they meet */
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="26" fill="none" stroke="var(--sk-accent,#3FE0B0)" stroke-opacity=".28"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="15" fill="none" stroke="var(--sk-accent,#3FE0B0)" stroke-opacity=".55"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="6.5" fill="var(--sk-accent,#3FE0B0)"/>';

  s += '<text x="' + lx + '" y="' + (H - 4) + '" class="artlbl" text-anchor="middle">15 DIMENSIONS</text>';
  s += '<text x="' + rx + '" y="' + (H - 4) + '" class="artlbl" text-anchor="middle">8 MODES</text>';
  s += '<text x="' + cx + '" y="' + (H - 4) + '" class="artlbl on" text-anchor="middle">ONE PROFILE</text>';
  return svg("0 0 " + W + " " + H, s, "art-constellation");
}

/* Ten-axis radar of the aspects. This is the picture a report like this
   is normally missing: fifteen numbers in a table are hard to hold, one
   shape is not. Aspects rather than factors, because the aspects are
   where two people with the same factor score stop being alike. */
function aspectRadar(aspects, order, labels) {
  const n = order.length, W = 560, H = 470, cx = W / 2, cy = 232, R = 152;
  const vals = order.map(k => aspects[k].pct / 100);
  let s = "";

  s += '<defs><linearGradient id="radA" x1="0" y1="0" x2="0" y2="1">' +
       '<stop offset="0%" stop-color="var(--sk-accent,#2F5D6B)" stop-opacity=".42"/>' +
       '<stop offset="100%" stop-color="var(--sk-accent,#2F5D6B)" stop-opacity=".12"/></linearGradient></defs>';

  /* rings at 25/50/75/100 */
  [0.25, 0.5, 0.75, 1].forEach(f => {
    s += '<polygon points="' + poly(cx, cy, R, new Array(n).fill(f), n) +
         '" fill="none" stroke="currentColor" stroke-opacity="' + (f === 0.5 ? ".38" : ".15") +
         '" stroke-width="1"' + (f === 0.5 ? ' stroke-dasharray="3 3"' : "") + "/>";
  });
  /* spokes */
  for (let i = 0; i < n; i++) {
    const p = pt(cx, cy, R, i, n);
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] +
         '" stroke="currentColor" stroke-opacity=".13"/>';
  }
  /* the shape */
  s += '<polygon points="' + poly(cx, cy, R, vals, n) + '" fill="url(#radA)" ' +
       'stroke="var(--sk-accent,#2F5D6B)" stroke-width="2" stroke-linejoin="round"/>';
  /* the points, coloured by band the same way the meters are */
  order.forEach((k, i) => {
    const a = aspects[k], p = pt(cx, cy, R * (a.pct / 100), i, n);
    const c = a.band.key === "high" ? "var(--gain,#1F6B4A)"
            : a.band.key === "low"  ? "var(--amber,#8A6412)" : "var(--sk-accent,#2F5D6B)";
    s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + c + '"/>';
  });
  /* labels */
  order.forEach((k, i) => {
    const p = pt(cx, cy, R + 20, i, n), an = anchorFor(i, n);
    const dy = p[1] < cy - R * 0.85 ? -2 : p[1] > cy + R * 0.85 ? 10 : 4;
    s += '<text x="' + p[0] + '" y="' + (p[1] + dy) + '" class="artlbl" text-anchor="' + an + '">' +
         labels[k].toUpperCase() + "</text>";
  });
  /* the 50th marker belongs on its ring, not at the centre, where a
     low-scoring aspect collapses on top of it */
  s += '<text x="' + (cx + 7) + '" y="' + r2(cy - R * 0.5 + 4) +
       '" class="artlbl dim" text-anchor="start">50TH</text>';
  return svg("0 0 " + W + " " + H, s, "art-radar");
}

/* Eight-axis radar, reported against target. The bar chart on the same
   screen answers "by how much"; this answers "what shape am I", which is
   the question the alignment number is actually summarising. */
/* Long mode names have to break, or they run off the side of the box.
   Split at the space nearest the middle rather than after two words,
   because "Collaborative Problem-Solver" is two words and far too wide. */
function wrapLabel(text, max) {
  if (text.length <= max || text.indexOf(" ") < 0) return [text];
  const words = text.split(" ");
  let best = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length, b = words.slice(i).join(" ").length;
    const diff = Math.abs(a - b);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

function modeRadar(actual, target, modes, order) {
  const n = order.length, W = 640, H = 480, cx = W / 2, cy = 236, R = 150;
  const mx = Math.max(30, Math.max.apply(null, order.map(m => Math.max(actual[m], target[m]))) * 1.12);
  let s = "";

  s += '<defs><linearGradient id="radB" x1="0" y1="0" x2="0" y2="1">' +
       '<stop offset="0%" stop-color="var(--sk-accent,#2F5D6B)" stop-opacity=".40"/>' +
       '<stop offset="100%" stop-color="var(--sk-accent,#2F5D6B)" stop-opacity=".10"/></linearGradient></defs>';

  [0.33, 0.66, 1].forEach(f => {
    s += '<polygon points="' + poly(cx, cy, R, new Array(n).fill(f), n) +
         '" fill="none" stroke="currentColor" stroke-opacity=".14"/>';
  });
  for (let i = 0; i < n; i++) {
    const p = pt(cx, cy, R, i, n);
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="currentColor" stroke-opacity=".12"/>';
  }
  /* target first, so the reported shape sits on top of it */
  s += '<polygon points="' + poly(cx, cy, R, order.map(m => target[m] / mx), n) +
       '" fill="none" stroke="currentColor" stroke-opacity=".62" stroke-width="1.6" stroke-dasharray="5 4"/>';
  s += '<polygon points="' + poly(cx, cy, R, order.map(m => actual[m] / mx), n) +
       '" fill="url(#radB)" stroke="var(--sk-accent,#2F5D6B)" stroke-width="2" stroke-linejoin="round"/>';
  order.forEach((m, i) => {
    const p = pt(cx, cy, R * (actual[m] / mx), i, n);
    const over = actual[m] > target[m] + 2;
    s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="' +
         (over ? "var(--amber,#8A6412)" : "var(--sk-accent,#2F5D6B)") + '"/>';
  });
  order.forEach((m, i) => {
    const p = pt(cx, cy, R + 19, i, n), an = anchorFor(i, n);
    const dy = p[1] < cy - R * 0.85 ? -2 : p[1] > cy + R * 0.85 ? 11 : 4;
    const lines = wrapLabel(modes[m].label, 13);
    s += '<text x="' + p[0] + '" y="' + (p[1] + dy) + '" class="artlbl" text-anchor="' + an + '">' +
         lines[0].toUpperCase() +
         (lines[1] ? '<tspan x="' + p[0] + '" dy="11">' + lines[1].toUpperCase() + "</tspan>" : "") + "</text>";
  });
  /* key */
  s += '<g transform="translate(' + (W / 2 - 78) + ',' + (H - 14) + ')">' +
       '<rect x="0" y="-7" width="22" height="9" rx="2" fill="var(--sk-accent,#2F5D6B)" opacity=".7"/>' +
       '<text x="28" y="1" class="artlbl">YOU</text>' +
       '<line x1="86" y1="-3" x2="112" y2="-3" stroke="currentColor" stroke-opacity=".62" stroke-width="1.6" stroke-dasharray="5 4"/>' +
       '<text x="118" y="1" class="artlbl">TARGET</text></g>';
  return svg("0 0 " + W + " " + H, s, "art-radar");
}

/* =====================================================================
   RECRUITING
   ===================================================================== */

/* The single most misunderstood line on the requirements list, drawn.
   A hundred positions is not a hundred bets if they all load the same
   factor, and that is the difference between a sample and a story. */
function betClusters() {
  const W = 900, H = 300;
  let s = "";
  const groups = [26, 21, 18, 15, 12, 8];        /* positions per factor */
  const cols = 10, gap = 17, x0 = 42, y0 = 66;

  /* left: 100 positions, coloured by the factor they load */
  let k = 0;
  groups.forEach((count, gi) => {
    const op = 0.86 - gi * 0.11;
    for (let j = 0; j < count; j++, k++) {
      const cxp = x0 + (k % cols) * gap, cyp = y0 + Math.floor(k / cols) * gap;
      s += '<circle cx="' + cxp + '" cy="' + cyp + '" r="5" fill="var(--sk-accent,#6E3B34)" opacity="' + r2(op) + '"/>';
    }
  });
  s += '<text x="' + x0 + '" y="42" class="artlbl">100 POSITIONS</text>';
  s += '<text x="' + x0 + '" y="' + (y0 + 10 * gap + 22) + '" class="artlbl dim">SHADED BY THE FACTOR EACH ONE LOADS</text>';

  /* the arrow */
  const ax = 268;
  s += '<line x1="' + ax + '" y1="150" x2="' + (ax + 78) + '" y2="150" stroke="currentColor" stroke-opacity=".4" stroke-width="1.4"/>';
  s += '<path d="M' + (ax + 78) + ' 150 l-9 -5 v10 z" fill="currentColor" fill-opacity=".4"/>';
  s += '<text x="' + (ax + 39) + '" y="138" class="artlbl dim" text-anchor="middle">COUNTS AS</text>';

  /* right: six bets, sized by how many positions collapsed into each */
  const bx = 430;
  groups.forEach((count, gi) => {
    const cxp = bx + (gi % 3) * 108, cyp = 108 + Math.floor(gi / 3) * 96;
    const rad = 15 + count * 0.62;
    s += '<circle cx="' + cxp + '" cy="' + cyp + '" r="' + r2(rad) + '" fill="var(--sk-accent,#6E3B34)" opacity="' + r2(0.86 - gi * 0.11) + '"/>';
    s += '<text x="' + cxp + '" y="' + (cyp + rad + 16) + '" class="artlbl dim" text-anchor="middle">' + count + " NAMES</text>";
  });
  s += '<text x="' + bx + '" y="42" class="artlbl on">6 BETS</text>';
  return svg("0 0 " + W + " " + H, s, "art-bets");
}

/* What The Tape reads. Deliberately unlabelled on both axes and drawn
   from a fixed illustrative series: this is a diagram of the analysis,
   not a track record, and it must never be mistakable for one. */
function tapeSchematic() {
  const W = 900, H = 250, x0 = 40, x1 = W - 40, yb = H - 44, yt = 34;
  /* a fixed, made-up series. Same every load, by design. */
  const pts = [0,4,9,7,13,19,16,24,29,26,34,31,25,21,27,35,41,38,46,52,49,57,63,60,68,74,71,79,86,92,100];
  const n = pts.length;
  const X = i => r2(x0 + (i / (n - 1)) * (x1 - x0));
  const Y = v => r2(yb - (v / 100) * (yb - yt));
  let s = "";

  s += '<defs><linearGradient id="tapeG" x1="0" y1="0" x2="0" y2="1">' +
       '<stop offset="0%" stop-color="var(--sk-accent,#6E3B34)" stop-opacity=".18"/>' +
       '<stop offset="100%" stop-color="var(--sk-accent,#6E3B34)" stop-opacity="0"/></linearGradient></defs>';

  for (let g = 0; g <= 4; g++) {
    const y = r2(yb - (g / 4) * (yb - yt));
    s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="currentColor" stroke-opacity=".12"/>';
  }
  const line = pts.map((v, i) => (i ? "L" : "M") + X(i) + " " + Y(v)).join(" ");
  s += '<path d="' + line + " L" + X(n - 1) + " " + yb + " L" + X(0) + " " + yb + ' Z" fill="url(#tapeG)"/>';
  s += '<path d="' + line + '" fill="none" stroke="var(--sk-accent,#6E3B34)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';

  /* the drawdown, marked */
  const dTop = 11, dBot = 13;
  s += '<rect x="' + X(dTop) + '" y="' + Y(pts[dTop]) + '" width="' + r2(X(dBot) - X(dTop)) +
       '" height="' + r2(Y(pts[dBot]) - Y(pts[dTop])) + '" fill="var(--signal,#8C2F26)" opacity=".16"/>';
  s += '<line x1="' + X(dTop) + '" y1="' + Y(pts[dTop]) + '" x2="' + X(dBot) + '" y2="' + Y(pts[dTop]) +
       '" stroke="var(--signal,#8C2F26)" stroke-opacity=".5" stroke-dasharray="3 3"/>';
  s += '<text x="' + r2((X(dTop) + X(dBot)) / 2) + '" y="' + r2(Y(pts[dTop]) - 8) +
       '" class="artlbl sig" text-anchor="middle">DRAWDOWN SHAPE</text>';

  /* the few days that carried it */
  [17, 22, 28].forEach(i => {
    s += '<circle cx="' + X(i) + '" cy="' + Y(pts[i]) + '" r="5.5" fill="none" stroke="var(--amber,#8A6412)" stroke-width="1.6"/>';
  });
  s += '<text x="' + X(24) + '" y="' + r2(Y(pts[28]) - 18) + '" class="artlbl amb" text-anchor="middle">HOW FEW DAYS CARRIED IT</text>';
  s += '<text x="' + x0 + '" y="' + (H - 14) + '" class="artlbl dim">ILLUSTRATIVE. NOT A TRACK RECORD, NOT OURS, NOT ANYONE’S.</text>';
  return svg("0 0 " + W + " " + H, s, "art-tape");
}

/* =====================================================================
   AI OPERATIONS
   ===================================================================== */

/* The deliverable of the paid assessment, drawn: every opportunity
   placed on impact against effort, cheap wins first. */
function impactEffort() {
  const W = 760, H = 430, x0 = 66, x1 = W - 30, yb = H - 54, yt = 26;
  const items = [
    { l: "Inbox triage",        e: 14, i: 82 },
    { l: "Quote drafting",      e: 26, i: 90 },
    { l: "Onboarding SOP",      e: 38, i: 68 },
    { l: "Report assembly",     e: 30, i: 46 },
    { l: "Call notes",          e: 12, i: 40 },
    { l: "Scheduling",          e: 55, i: 58 },
    { l: "Custom integration",  e: 88, i: 74 },
    { l: "Data clean-up",       e: 72, i: 30 }
  ];
  const X = v => r2(x0 + (v / 100) * (x1 - x0));
  const Y = v => r2(yb - (v / 100) * (yb - yt));
  let s = "";

  /* the quadrant you start in */
  s += '<rect x="' + X(0) + '" y="' + Y(100) + '" width="' + r2(X(50) - X(0)) + '" height="' + r2(Y(50) - Y(100)) +
       '" fill="var(--sk-accent,#38E0FF)" opacity=".07"/>';
  s += '<text x="' + X(4) + '" y="' + r2(Y(96)) + '" class="artlbl on">START HERE</text>';

  for (let g = 0; g <= 4; g++) {
    s += '<line x1="' + X(g * 25) + '" y1="' + yt + '" x2="' + X(g * 25) + '" y2="' + yb + '" stroke="currentColor" stroke-opacity=".1"/>';
    s += '<line x1="' + x0 + '" y1="' + Y(g * 25) + '" x2="' + x1 + '" y2="' + Y(g * 25) + '" stroke="currentColor" stroke-opacity=".1"/>';
  }
  s += '<line x1="' + X(50) + '" y1="' + yt + '" x2="' + X(50) + '" y2="' + yb + '" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="4 4"/>';
  s += '<line x1="' + x0 + '" y1="' + Y(50) + '" x2="' + x1 + '" y2="' + Y(50) + '" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="4 4"/>';

  items.forEach((d, k) => {
    const first = d.e < 50 && d.i > 50;
    const c = first ? "var(--sk-accent,#38E0FF)" : "currentColor";
    s += '<circle cx="' + X(d.e) + '" cy="' + Y(d.i) + '" r="7" fill="' + c + '" opacity="' + (first ? ".95" : ".34") + '"/>';
    if (first) s += '<circle cx="' + X(d.e) + '" cy="' + Y(d.i) + '" r="13" fill="none" stroke="' + c + '" stroke-opacity=".35"/>';
    const an = d.e > 62 ? "end" : "start", off = d.e > 62 ? -13 : 13;
    s += '<text x="' + r2(X(d.e) + off) + '" y="' + r2(Y(d.i) + 4) + '" class="artlbl' + (first ? " on" : " dim") +
         '" text-anchor="' + an + '">' + d.l.toUpperCase() + "</text>";
  });

  s += '<text x="' + r2((x0 + x1) / 2) + '" y="' + (H - 16) + '" class="artlbl dim" text-anchor="middle">EFFORT TO BUILD AND MAINTAIN →</text>';
  s += '<text transform="translate(20,' + r2((yt + yb) / 2) + ') rotate(-90)" class="artlbl dim" text-anchor="middle">IMPACT →</text>';
  return svg("0 0 " + W + " " + H, s, "art-scatter");
}

/* Audit, optimise, automate. The middle panel is the argument: the step
   everyone skips is the one that makes the third panel small. */
function processLoop() {
  const W = 900, H = 236;
  const panels = [
    { t: "AUDIT",    sub: "14 STEPS, AS FOUND",  boxes: 14, cut: 0, note: "Watched, written down, nothing fixed yet" },
    { t: "OPTIMISE", sub: "3 REMOVED",           boxes: 14, cut: 3, note: "The steps that stopped being necessary" },
    { t: "AUTOMATE", sub: "1 SKILL",             boxes: 0,  cut: 0, note: "What is left, built with you on the call" }
  ];
  let s = "";
  const pw = 270, gapx = 30, y0 = 74;

  panels.forEach((p, pi) => {
    const px = 12 + pi * (pw + gapx);
    const accent = pi === 0 ? "currentColor" : pi === 1 ? "var(--amber,#FFB020)" : "var(--sk-accent,#38E0FF)";
    s += '<line x1="' + px + '" y1="40" x2="' + (px + pw) + '" y2="40" stroke="' + accent + '" stroke-opacity=".85" stroke-width="2"/>';
    s += '<text x="' + px + '" y="30" class="artlbl on" fill="' + accent + '">' + p.t + "</text>";
    s += '<text x="' + (px + pw) + '" y="30" class="artlbl dim" text-anchor="end">' + p.sub + "</text>";

    if (p.boxes) {
      for (let i = 0; i < p.boxes; i++) {
        const bx = px + (i % 7) * 38, by = y0 + Math.floor(i / 7) * 34;
        const dropped = p.cut && i >= p.boxes - p.cut;
        s += '<rect x="' + bx + '" y="' + by + '" width="30" height="24" rx="2" fill="' +
             (dropped ? "none" : "currentColor") + '" fill-opacity="' + (dropped ? "0" : ".16") +
             '" stroke="' + (dropped ? "var(--signal,#FF5C4D)" : "currentColor") +
             '" stroke-opacity="' + (dropped ? ".8" : ".28") + '"' + (dropped ? ' stroke-dasharray="3 2"' : "") + "/>";
        if (dropped) {
          s += '<line x1="' + (bx + 8) + '" y1="' + (by + 8) + '" x2="' + (bx + 22) + '" y2="' + (by + 16) +
               '" stroke="var(--signal,#FF5C4D)" stroke-opacity=".8"/>';
          s += '<line x1="' + (bx + 22) + '" y1="' + (by + 8) + '" x2="' + (bx + 8) + '" y2="' + (by + 16) +
               '" stroke="var(--signal,#FF5C4D)" stroke-opacity=".8"/>';
        }
      }
    } else {
      s += '<rect x="' + px + '" y="' + y0 + '" width="' + (pw - 30) + '" height="58" rx="3" ' +
           'fill="var(--sk-accent,#38E0FF)" fill-opacity=".14" stroke="var(--sk-accent,#38E0FF)" stroke-opacity=".9"/>';
      s += '<text x="' + (px + (pw - 30) / 2) + '" y="' + (y0 + 34) + '" class="artlbl on" text-anchor="middle">ONE REUSABLE SKILL</text>';
      /* corner ticks, the same detail the panels on this page carry */
      [[0,0,1,1],[pw-30,0,-1,1],[0,58,1,-1],[pw-30,58,-1,-1]].forEach(c=>{
        s += '<path d="M' + (px+c[0]) + ' ' + (y0+c[1]+8*c[3]) + ' V' + (y0+c[1]) + ' H' + (px+c[0]+8*c[2]) +
             '" fill="none" stroke="var(--sk-accent,#38E0FF)" stroke-width="2"/>';
      });
    }
    s += '<text x="' + px + '" y="' + (H - 16) + '" class="artlbl dim">' + p.note.toUpperCase() + "</text>";

    if (pi < 2) {
      const ax = px + pw + 6;
      s += '<path d="M' + ax + ' ' + (y0 + 42) + ' l14 0 m-5 -5 l5 5 l-5 5" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.6"/>';
    }
  });
  return svg("0 0 " + W + " " + H, s, "art-process");
}

/* =====================================================================
   TRADING DNA
   ===================================================================== */

/* The section opener. A helix whose rungs are the markers we read, which
   is as literal as the name gets and still reads as an object rather
   than a diagram. */
function helix() {
  const W = 900, H = 300, cx = W / 2, amp = 88, turns = 2.0, span = 640;
  const x0 = cx - span / 2, cy = H / 2;
  const N = 200;
  let s = "";

  const yAt = (t, ph) => r2(cy + Math.sin(t * turns * TAU + ph) * amp);
  const strand = ph => {
    let d = "";
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      d += (i ? "L" : "M") + r2(x0 + t * span) + " " + yAt(t, ph) + " ";
    }
    return d;
  };

  s += '<defs><linearGradient id="hxA" x1="0" x2="1">' +
       '<stop offset="0%" stop-color="var(--sk-accent,#0B72E7)" stop-opacity="0"/>' +
       '<stop offset="18%" stop-color="var(--sk-accent,#0B72E7)" stop-opacity="1"/>' +
       '<stop offset="82%" stop-color="var(--sk-accent,#0B72E7)" stop-opacity="1"/>' +
       '<stop offset="100%" stop-color="var(--sk-accent,#0B72E7)" stop-opacity="0"/></linearGradient>' +
       '<linearGradient id="hxB" x1="0" x2="1">' +
       '<stop offset="0%" stop-color="currentColor" stop-opacity="0"/>' +
       '<stop offset="18%" stop-color="currentColor" stop-opacity=".34"/>' +
       '<stop offset="82%" stop-color="currentColor" stop-opacity=".34"/>' +
       '<stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>';

  /* Back strand first, then the rungs, then the front strand over the
     top. Painting in that order is what makes a pair of sine curves
     read as one object with depth rather than as two waves. */
  s += '<path d="' + strand(Math.PI) + '" fill="none" stroke="url(#hxB)" stroke-width="2.6" stroke-linecap="round"/>';

  const rungs = 21;
  for (let i = 1; i < rungs; i++) {
    const t = i / rungs, x = r2(x0 + t * span);
    const y1 = yAt(t, 0), y2 = yAt(t, Math.PI);
    /* wide apart means side-on and nearest the viewer, so darkest */
    const open = Math.abs(y1 - y2) / (2 * amp);
    const fade = r2(0.05 + open * 0.30);
    if (fade < 0.07) continue;
    s += '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 +
         '" stroke="currentColor" stroke-opacity="' + fade +
         '" stroke-width="' + r2(1 + open * 0.9) + '" stroke-linecap="round"/>';
  }

  s += '<path d="' + strand(0) + '" fill="none" stroke="url(#hxA)" stroke-width="3.6" stroke-linecap="round"/>';

  /* Six markers riding the front strand. No labels on the drawing: the
     caption carries them, which keeps the object clean. */
  for (let i = 0; i < 6; i++) {
    const t = 0.10 + (i / 5) * 0.80, x = r2(x0 + t * span), y = yAt(t, 0);
    s += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="var(--paper,#FBFBFD)"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="none" stroke="var(--sk-accent,#0B72E7)" stroke-width="2.6"/>';
  }
  return svg("0 0 " + W + " " + H, s, "art-helix");
}

/* The one number this product leads on. Two bars, no axis, no clutter:
   the gap is the whole point. */
function holdAsymmetry() {
  const W = 760, H = 250, x0 = 30, bw = W - 60;
  let s = "";
  const rows = [
    { l: "AVERAGE HOLD ON A WINNER", v: 0.34, c: "var(--gain,#189B62)" },
    { l: "AVERAGE HOLD ON A LOSER",  v: 0.86, c: "var(--signal,#D93A2B)" }
  ];
  rows.forEach((r, i) => {
    const y = 62 + i * 82;
    s += '<text x="' + x0 + '" y="' + (y - 12) + '" class="artlbl dim">' + r.l + "</text>";
    s += '<rect x="' + x0 + '" y="' + y + '" width="' + bw + '" height="34" rx="17" fill="currentColor" opacity=".07"/>';
    s += '<rect x="' + x0 + '" y="' + y + '" width="' + r2(bw * r.v) + '" height="34" rx="17" fill="' + r.c + '"/>';
  });
  const yA = 62 + 34, yB = 62 + 82;
  s += '<line x1="' + r2(x0 + bw * 0.34) + '" y1="' + yA + '" x2="' + r2(x0 + bw * 0.34) + '" y2="' + (yB + 34) +
       '" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="3 3"/>';
  s += '<text x="' + r2(x0 + bw * 0.6) + '" y="' + (H - 44) + '" class="artlbl" text-anchor="middle">THIS GAP IS THE FINDING</text>';
  s += '<text x="' + x0 + '" y="' + (H - 14) + '" class="artlbl dim">ILLUSTRATIVE SHAPE. YOUR REPORT USES YOUR OWN FILLS.</text>';
  return svg("0 0 " + W + " " + H, s, "art-hold");
}

return {
  frame: frame,
  dualConstellation: dualConstellation,
  aspectRadar: aspectRadar,
  modeRadar: modeRadar,
  betClusters: betClusters,
  tapeSchematic: tapeSchematic,
  impactEffort: impactEffort,
  processLoop: processLoop,
  helix: helix,
  holdAsymmetry: holdAsymmetry
};
})();
