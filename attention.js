/* =====================================================================
   aschcapital.com - Attention
   ---------------------------------------------------------------------
   One screen, sitting to the right of everything else in the strip. It
   answers a single question with a single picture: where does human
   attention actually go, and which way is each block of it moving.

   The picture is a hierarchical value-colour treemap. Area is the
   quantity - billions of hours of attention a day, worldwide, computed
   as reach x time. Colour is a second, independent metric: by default
   momentum, which is a live signal, not a figure from the report.

   Two data paths, deliberately separate:

     attention.json   the baseline. Audience and time per medium,
                           every tile carrying the arithmetic that
                           produced it. Static, versioned, auditable.

     GET /api/attention    the live layer. Wikipedia pageview momentum
                           per medium, refreshed by the Worker. Drives
                           colour and the watchlist. If it never answers,
                           the chart still draws and says so.

   The separation is the point. A number that claims to be measured
   attention has to come from a source that measured attention. A
   pageview trend is an interest signal and is labelled as one wherever
   it appears.

   Contact points with the rest of the site: LABS.register for the
   route, SCREENS for the chip. Nothing else is touched, and DATA - the
   Form ADV index - is never read.
   ===================================================================== */
(function () {
"use strict";

if (!window.LABS || typeof LABS.register !== "function") return;

const app = document.getElementById("app");

/* ---------------------------------------------------------------- utils */
function h(tag, attrs, kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "text") e.textContent = v;
    else if (k === "style") e.style.cssText = v;
    else if (k.slice(0, 2) === "on") e[k.toLowerCase()] = v;
    else e.setAttribute(k, v);
  }
  if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
    if (c == null || c === false) return;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
const n2 = function (v) { return (Math.round(v * 100) / 100).toFixed(2); };
const n1 = function (v) { return (Math.round(v * 10) / 10).toFixed(1); };
function signed(v) { return (v > 0 ? "+" : "") + n1(v) + "%"; }
function views(v) {
  return (v >= 10000 ? Math.round(v / 1000) + "k" : String(Math.round(v))) + " views/day";
}

/* ---------------------------------------------------------------- colour
   Every value below was validated against the paper surface before it
   was written down: each arm of the diverging scale and the sequential
   ramp are single-hue, monotone in lightness, and the lightest step of
   each clears the surface. Green, grey and red are deliberately absent.
   On this site those three mean net flows and nothing else, and this
   chart is not about flows.
   ------------------------------------------------------------------- */
const DIVERGING = [
  { max: -15,       fill: "#8A6412", label: "Losing ground fast (-15% or worse)" },
  { max: -7,        fill: "#A87F1E", label: "Losing ground (-7 to -15%)" },
  { max: -2,        fill: "#C6A23F", label: "Drifting down (-2 to -7%)" },
  { max:  2,        fill: "#A9B2AC", label: "Moving with the field (+/-2%)" },
  { max:  7,        fill: "#6FA0AE", label: "Drifting up (+2 to +7%)" },
  { max:  15,       fill: "#45808F", label: "Gaining ground (+7 to +15%)" },
  { max:  Infinity, fill: "#2F5D6B", label: "Gaining fast (+15% or better)" }
];
const SEQUENTIAL = [
  { max: 20,        fill: "#7FADB9", label: "Under 20 min" },
  { max: 40,        fill: "#55909F", label: "20 to 40 min" },
  { max: 60,        fill: "#3A7383", label: "40 to 60 min" },
  { max: Infinity,  fill: "#2F5D6B", label: "Over an hour" }
];
const NOSIGNAL = "#FBFAF6";      /* card, dashed edge: no signal is not zero */

function bucket(scale, v) {
  for (let i = 0; i < scale.length; i++) if (v <= scale[i].max) return scale[i];
  return scale[scale.length - 1];
}

/* Text on a tile is whichever of ink or paper actually reads on it,
   computed rather than guessed, because the fill changes with the data. */
function lum(hex) {
  const c = [1, 3, 5].map(function (i) {
    const v = parseInt(hex.substr(i, 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function inkOn(fill) {
  return contrast("#F2F1EC", fill) > contrast("#12191F", fill) ? "#F2F1EC" : "#12191F";
}

/* ------------------------------------------------------------ squarify
   Bruls, Huizing and van Wijk. Rectangles are laid out in rows chosen to
   keep aspect ratios near 1, because a tile the reader cannot compare is
   a tile that is not doing its job. Values arrive sorted descending.
   ------------------------------------------------------------------- */
function squarify(items, x, y, w, hgt) {
  const out = [];
  const total = items.reduce(function (s, it) { return s + it.value; }, 0);
  if (!(total > 0) || w <= 0 || hgt <= 0) return out;
  let rest = items.slice(), rx = x, ry = y, rw = w, rh = hgt;
  let scale = (rw * rh) / total;

  function worst(row, side) {
    const sum = row.reduce(function (s, it) { return s + it.value * scale; }, 0);
    const max = Math.max.apply(null, row.map(function (it) { return it.value * scale; }));
    const min = Math.min.apply(null, row.map(function (it) { return it.value * scale; }));
    if (!sum || !side) return Infinity;
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
  }
  function place(row, side, horizontal) {
    const sum = row.reduce(function (s, it) { return s + it.value * scale; }, 0);
    const thick = sum / side;
    let off = 0;
    row.forEach(function (it) {
      const len = (it.value * scale) / thick;
      out.push(horizontal
        ? { item: it, x: rx + off, y: ry, w: len, h: thick }
        : { item: it, x: rx, y: ry + off, w: thick, h: len });
      off += len;
    });
    if (horizontal) { ry += thick; rh -= thick; } else { rx += thick; rw -= thick; }
  }

  while (rest.length) {
    const horizontal = rw >= rh;
    const side = horizontal ? rw : rh;
    let row = [rest[0]], i = 1;
    while (i < rest.length && worst(row.concat(rest[i]), side) <= worst(row, side)) {
      row.push(rest[i]); i++;
    }
    place(row, side, horizontal);
    rest = rest.slice(i);
    if (rw <= 0.5 || rh <= 0.5) {                 /* rounding floor */
      rest.forEach(function (it) { out.push({ item: it, x: rx, y: ry, w: 0, h: 0 }); });
      break;
    }
  }
  return out;
}

/* ------------------------------------------------------------ the data */
let BASE = null, LIVE = null, LIVE_ERR = null, LOADING = false;
let MODE = "momentum";          /* momentum | intensity */
let TABLE = false;              /* the always-available non-visual view */
let poll = null, RO = null;

function loadBase() {
  if (BASE) return Promise.resolve(BASE);
  return fetch("attention.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (j) { BASE = j; return j; });
}
function loadLive() {
  return fetch("/api/attention", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (j) { LIVE = j; LIVE_ERR = null; return j; })
    .catch(function (e) { LIVE_ERR = e; return null; });
}

/* A tile's momentum: the live signal when the Worker answered for it,
   the report's own year-on-year figure when it did not, and nothing at
   all when neither exists. The three cases are never blended and are
   never drawn the same. */
function momentumOf(node) {
  const live = LIVE && LIVE.items && LIVE.items[node.wiki];
  if (live && typeof live.momentum === "number") {
    return { v: live.momentum, src: "live", views: live.views30, raw: live.raw };
  }
  if (typeof node.yoy === "number") return { v: node.yoy, src: "report" };
  return { v: null, src: "none" };
}
function fillFor(node) {
  if (MODE === "intensity") {
    if (node.minutes == null) return { fill: NOSIGNAL, dashed: true, label: "No per-user time" };
    const b = bucket(SEQUENTIAL, node.minutes);
    return { fill: b.fill, label: b.label };
  }
  const m = momentumOf(node);
  if (m.v == null) return { fill: NOSIGNAL, dashed: true, label: "No momentum signal" };
  const b = bucket(DIVERGING, m.v);
  return { fill: b.fill, label: b.label, dotted: m.src === "report" };
}

/* ---------------------------------------------------------------- view */
function leaves(d) {
  const out = [];
  d.groups.forEach(function (g) {
    g.children.forEach(function (c) { out.push(Object.assign({ group: g.label, groupId: g.id }, c)); });
  });
  return out;
}

function render() {
  app.innerHTML = "";
  const root = h("div", { class: "att" });
  app.appendChild(root);

  root.appendChild(h("div", { html:
    '<p class="eyebrow q">ATTENTION</p><h1>Where the eyeballs are.</h1>' +
    '<p class="lede">Every rectangle is a medium. Its area is how many hours of human attention it ' +
    'takes each day, worldwide. Its colour is a second thing entirely: which way that attention is ' +
    'moving right now.</p>' }));

  if (!BASE) {
    root.appendChild(h("div", { class: "att-wait", text: LOADING ? "Loading the baseline." : "" }));
    return;
  }

  const d = BASE;
  const all = leaves(d);
  const total = all.reduce(function (s, c) { return s + c.value; }, 0);

  /* ---- headline. One number, stated before any chart asks for work. */
  root.appendChild(h("div", { class: "att-hero", html:
    '<div class="att-hero-n">' + n1(total) + '<span>B</span></div>' +
    '<div class="att-hero-k">hours of attention a day, across the measured mediums</div>' +
    '<div class="att-hero-s">' + esc(d.unit.size) + '. Reach x time, ' + all.length +
    ' mediums, ' + d.groups.length + ' groups. Baseline compiled ' + esc(d.source.compiled) + '.</div>' }));

  /* ---- the controls row, above the chart, one line. */
  const controls = h("div", { class: "att-controls" });
  const seg = h("div", { class: "att-seg", role: "group", "aria-label": "Colour metric" });
  [["momentum", "Momentum"], ["intensity", "Minutes per user"]].forEach(function (o) {
    seg.appendChild(h("button", {
      class: "att-segb" + (MODE === o[0] ? " on" : ""), type: "button",
      "aria-pressed": MODE === o[0] ? "true" : "false", text: o[1],
      onclick: function () { MODE = o[0]; render(); }
    }));
  });
  controls.appendChild(h("div", { class: "att-ctl" }, [
    h("span", { class: "att-ctl-k", text: "Colour" }), seg ]));
  controls.appendChild(h("button", {
    class: "att-tbl-t", type: "button", "aria-pressed": TABLE ? "true" : "false",
    text: TABLE ? "Hide the table" : "Show the table",
    onclick: function () { TABLE = !TABLE; render(); } }));
  root.appendChild(controls);

  /* ---- live status. Says what it is every time, including when it is
     the report's own year-on-year rather than anything live. */
  root.appendChild(liveLine());

  /* ---- the chart */
  const mapwrap = h("div", { class: "att-mapwrap" });
  /* group, not img: every tile in here is focusable, and a picture with
     tab stops inside it is a picture a screen reader cannot describe.
     The table view carries the same numbers in reading order. */
  const chart = h("div", { class: "att-map", role: "group",
    "aria-label": "Treemap of daily attention hours by medium, coloured by " +
      (MODE === "momentum" ? "momentum" : "minutes per user per day") });
  const tip = h("div", { class: "att-tip", hidden: "hidden" });
  mapwrap.appendChild(chart); mapwrap.appendChild(tip);
  root.appendChild(mapwrap);
  draw(chart, tip, d, total);

  /* One observer, re-pointed at the current chart. Re-rendering the
     screen throws the old node away and the old observation with it. */
  if (window.ResizeObserver) {
    if (RO) RO.disconnect();
    RO = new ResizeObserver(function () { draw(chart, tip, d, total); });
    RO.observe(chart);
  }

  root.appendChild(legend());

  root.appendChild(h("p", { class: "att-read", html:
    'Read it this way. The area is settled: it is audience multiplied by time, and it barely moves ' +
    'month to month. The colour is the argument: it is the only thing on this chart that can change ' +
    'between two visits, and it is the reason the page is worth reloading.' }));

  if (TABLE) root.appendChild(table(d, all, total));

  root.appendChild(watchlist());
  root.appendChild(unsized(d));
  root.appendChild(method(d, total));
}

function liveLine() {
  const el = h("p", { class: "srcline" });
  if (LIVE && LIVE.generated) {
    const age = Math.max(0, Math.round((Date.now() - Date.parse(LIVE.generated)) / 60000));
    el.textContent = "LIVE · " + (LIVE.count || 0) + " MEDIUMS SIGNALLED · " +
      esc(LIVE.source || "WIKIMEDIA PAGEVIEWS") + " · REFRESHED " +
      (age < 1 ? "JUST NOW" : age + " MIN AGO");
  } else if (LIVE_ERR) {
    el.className = "srcline warn";
    el.textContent = "LIVE FEED UNREACHABLE · COLOUR IS FALLING BACK TO THE REPORT'S OWN YEAR ON YEAR, " +
      "AND EVERY TILE WITHOUT ONE IS DRAWN AS NO SIGNAL";
  } else {
    el.className = "srcline";
    el.textContent = "CONNECTING TO THE LIVE FEED…";
  }
  return el;
}

/* Layout: groups first, then children inside each group's rectangle,
   under a header band that keeps the group readable at small sizes. */
function draw(chart, tip, d, total) {
  const W = chart.clientWidth || 900;
  /* Portrait on a phone, landscape on a desktop. A treemap squeezed into
     a wide short box on a narrow screen gives every tile a sliver and no
     room for its label. */
  const H = W < 560
    ? Math.round(Math.min(620, Math.max(440, W * 1.45)))
    : Math.max(360, Math.min(560, Math.round(W * 0.58)));
  chart.style.height = H + "px";
  chart.innerHTML = "";

  const groups = d.groups.map(function (g) {
    return { g: g, value: g.children.reduce(function (s, c) { return s + c.value; }, 0) };
  }).sort(function (a, b) { return b.value - a.value; });

  squarify(groups, 0, 0, W, H).forEach(function (cell) {
    const g = cell.item.g, gv = cell.item.value;
    if (cell.w < 2 || cell.h < 2) return;
    const box = h("div", { class: "att-g", style:
      "left:" + cell.x + "px;top:" + cell.y + "px;width:" + cell.w + "px;height:" + cell.h + "px" });
    /* The header degrades rather than clipping: a narrow group keeps its
       name and drops the share, then drops the total too. */
    const stat = cell.w > 275 ? n1(gv) + "B · " + Math.round((gv / total) * 100) + "%"
               : cell.w > 165 ? n1(gv) + "B"
               : "";
    const head = h("div", { class: "att-gh", html:
      '<b>' + esc(g.label) + '</b>' + (stat ? '<span>' + stat + '</span>' : '') });
    box.appendChild(head);
    chart.appendChild(box);

    const inner = h("div", { class: "att-gi" });
    box.appendChild(inner);
    const iw = cell.w - 2, ih = cell.h - 24;
    if (iw < 4 || ih < 4) return;

    const kids = g.children.slice().sort(function (a, b) { return b.value - a.value; });
    squarify(kids, 0, 0, iw, ih).forEach(function (c) {
      const node = c.item;
      const f = fillFor(node);
      const t = h("div", {
        class: "att-t" + (f.dashed ? " nosig" : "") + (f.dotted ? " report" : ""),
        tabindex: "0", role: "button",
        style: "left:" + c.x + "px;top:" + c.y + "px;width:" + Math.max(0, c.w - 2) +
          "px;height:" + Math.max(0, c.h - 2) + "px;background:" + f.fill +
          ";color:" + (f.dashed ? "#12191F" : inkOn(f.fill))
      });
      /* A label only goes in when it fits. Everything a clipped tile
         would have said is in the tooltip and in the table. */
      if (c.w > 74 && c.h > 34) {
        t.appendChild(h("div", { class: "att-tn", text: node.label }));
        if (c.h > 52) t.appendChild(h("div", { class: "att-tv", text: n2(node.value) + "B h/day" }));
      }
      const show = function (ev) { showTip(tip, chart, node, total, ev); };
      t.onmouseenter = show; t.onmousemove = show; t.onfocus = show;
      t.onmouseleave = function () { tip.hidden = true; };
      t.onblur = function () { tip.hidden = true; };
      inner.appendChild(t);
    });
  });
}

function showTip(tip, chart, node, total, ev) {
  const m = momentumOf(node);
  const fm = LIVE && typeof LIVE.field_median === "number" ? LIVE.field_median : null;
  const mline = m.v == null
    ? '<span class="att-x">No momentum signal for this one yet.</span>'
    : '<b>' + signed(m.v) + '</b> ' + (m.src === "live"
        ? 'interest against the field, last 30 days'
        : 'year on year, from the report') +
      (m.src === "live" && m.raw != null && fm != null
        ? '<span class="att-x"><br>' + signed(m.raw) + ' on its own, against a field median of ' +
          signed(fm) + '.</span>'
        : '');
  tip.innerHTML =
    '<div class="att-tt">' + esc(node.label) + '</div>' +
    '<div class="att-tr"><span>Attention</span><b>' + n2(node.value) + 'B h/day</b></div>' +
    '<div class="att-tr"><span>Share</span><b>' + n1((node.value / total) * 100) + '%</b></div>' +
    (node.minutes != null
      ? '<div class="att-tr"><span>Per user</span><b>' + n1(node.minutes) + ' min/day</b></div>' : '') +
    (node.reach != null
      ? '<div class="att-tr"><span>Audience</span><b>' + n2(node.reach) + 'B</b></div>' : '') +
    '<div class="att-tm">' + mline + '</div>' +
    '<div class="att-tb"><span class="att-basis ' + esc(node.basis) + '">' + esc(node.basis) + '</span>' +
      esc(node.chain) + '</div>';
  tip.hidden = false;
  const r = chart.getBoundingClientRect();
  const x = (ev && ev.clientX != null ? ev.clientX - r.left : 20);
  const y = (ev && ev.clientY != null ? ev.clientY - r.top : 20);
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.max(4, Math.min(r.width - tw - 4, x + 14)) + "px";
  tip.style.top  = Math.max(4, Math.min(r.height - th - 4, y + 14)) + "px";
}

function legend() {
  const scale = MODE === "momentum" ? DIVERGING : SEQUENTIAL;
  const wrap = h("div", { class: "att-legend" });
  wrap.appendChild(h("div", { class: "att-lk", text:
    MODE === "momentum" ? "Colour: momentum" : "Colour: minutes per user per day" }));
  const row = h("div", { class: "att-lrow" });
  scale.forEach(function (b) {
    row.appendChild(h("div", { class: "att-li" }, [
      h("i", { style: "background:" + b.fill }), h("span", { text: b.label }) ]));
  });
  row.appendChild(h("div", { class: "att-li" }, [
    h("i", { class: "nosig" }), h("span", { text: "No signal" }) ]));
  wrap.appendChild(row);
  wrap.appendChild(h("p", { class: "att-ln", text: MODE === "momentum"
    ? "Momentum is the last 30 days of encyclopedia interest in a medium against its own trailing year, then centred on the median of every medium tracked. Encyclopedia traffic as a whole is drifting down, so the uncentred figure mostly reports that drift; centred, it reports the only interesting part, which is which mediums are moving against the rest. It is an interest signal, not an hours measurement, and it never changes the size of a tile. A dotted edge means that tile fell back to the report's year-on-year figure because the live feed had nothing for it."
    : "Minutes per user per day is the time side of the area calculation on its own, which is why a small tile can be dark: a medium can be intense without being large." }));
  return wrap;
}

function table(d, all, total) {
  const t = h("div", { class: "tblwrap" });
  const rows = all.slice().sort(function (a, b) { return b.value - a.value; }).map(function (c) {
    const m = momentumOf(c);
    return '<tr><td class="nm" style="cursor:default">' + esc(c.label) + '</td>' +
      '<td>' + esc(c.group) + '</td>' +
      '<td class="num">' + n2(c.value) + '</td>' +
      '<td class="num">' + n1((c.value / total) * 100) + '%</td>' +
      '<td class="num">' + (c.minutes == null ? "&mdash;" : n1(c.minutes)) + '</td>' +
      '<td class="num">' + (c.reach == null ? "&mdash;" : n2(c.reach)) + '</td>' +
      '<td class="num">' + (m.v == null ? "&mdash;" : signed(m.v)) + '</td>' +
      '<td><span class="att-basis ' + esc(c.basis) + '">' + esc(c.basis) + '</span></td></tr>';
  }).join("");
  t.innerHTML = '<table><thead><tr><th>Medium</th><th>Group</th>' +
    '<th style="text-align:right">B h/day</th><th style="text-align:right">Share</th>' +
    '<th style="text-align:right">Min/user</th><th style="text-align:right">Audience B</th>' +
    '<th style="text-align:right">Momentum</th><th>Basis</th></tr></thead><tbody>' + rows +
    '</tbody></table>';
  return t;
}

/* The watchlist is where a new medium shows up before it has an hours
   figure anywhere. It is ranked by the same interest signal that colours
   the chart, and it is kept out of the treemap on purpose: pageviews and
   hours are not the same unit and mixing them would be a lie told with
   a rectangle. */
function watchlist() {
  const wrap = h("div", { class: "att-watch" });
  wrap.appendChild(h("h2", { text: "The watchlist" }));
  wrap.appendChild(h("p", { text:
    "Mediums with no published hours figure, ranked by how fast interest in them is moving against " +
    "the rest of the field. A medium marked series break has had its encyclopedia page renamed or " +
    "merged inside the measurement window, which makes its own history incomparable to itself, so no " +
    "number is shown for it rather than a wrong one. " +
    "Nothing here is sized, because nothing here has been measured in hours. This is the queue " +
    "the treemap draws from: when one of these gets a real audience and time figure, it becomes a tile." }));

  const items = (BASE.watch || []).map(function (w) {
    const live = LIVE && LIVE.items && LIVE.items[w.wiki];
    return { label: w.label, wiki: w.wiki,
      m: live && typeof live.momentum === "number" ? live.momentum : null,
      flag: live && live.flag ? live.flag : null,
      v: live ? live.views30 : null };
  }).sort(function (a, b) {
    if (a.m == null && b.m == null) return a.label.localeCompare(b.label);
    if (a.m == null) return 1; if (b.m == null) return -1;
    return b.m - a.m;
  });

  const list = h("div", { class: "att-wl" });
  /* Scaled on the 90th percentile rather than the maximum, so one
     medium having a week in the news does not flatten every other bar
     on the list to a stub. */
  const mags = items.map(function (i) { return Math.abs(i.m || 0); })
    .sort(function (a, b) { return a - b; });
  const peak = Math.max(10, mags[Math.floor(mags.length * 0.9)] || 10);
  items.forEach(function (i) {
    const f = i.m == null ? { fill: NOSIGNAL } : bucket(DIVERGING, i.m);
    const w = i.m == null ? 0 : Math.max(3, Math.min(100, Math.round((Math.abs(i.m) / peak) * 100)));
    list.appendChild(h("div", { class: "att-wr" }, [
      h("div", { class: "att-wn", text: i.label }),
      h("div", { class: "att-wb" }, [
        h("i", { style: "width:" + w + "%;background:" + f.fill + (i.m == null ? ";border:1px dashed var(--rule)" : "") }) ]),
      h("div", { class: "att-wv", text: i.m == null ? (i.flag || "no signal") : signed(i.m) }),
      h("div", { class: "att-wd", text: i.v == null ? "" : views(i.v) })
    ]));
  });
  wrap.appendChild(list);
  return wrap;
}

function unsized(d) {
  const wrap = h("div", { class: "att-unsized" });
  wrap.appendChild(h("h2", { text: "Big, and not on the chart" }));
  wrap.appendChild(h("p", { text:
    "These are not missing. They are mediums with an audience the source states and a time budget it " +
    "does not, and putting them on the treemap would have meant inventing the number that decides how " +
    "big they look. The honest place for them is a list." }));
  const g = h("div", { class: "att-ug" });
  (d.unsized || []).forEach(function (u) {
    g.appendChild(h("div", { class: "att-uc", html:
      '<div class="att-un">' + esc(u.label) + '</div>' +
      '<div class="att-ur">' + esc(u.reach) + '</div>' +
      '<div class="att-uw">' + esc(u.why) + '</div>' }));
  });
  wrap.appendChild(g);
  return wrap;
}

function method(d, total) {
  const wrap = h("div", { class: "att-method" });
  wrap.appendChild(h("h2", { text: "How every rectangle got its size" }));
  wrap.appendChild(h("div", { class: "formula", text: d.method.formula }));
  const keys = ["stated", "derived", "estimated"];
  const dl = h("div", { class: "att-bases" });
  keys.forEach(function (k) {
    dl.appendChild(h("div", { class: "att-bk", html:
      '<span class="att-basis ' + k + '">' + k + '</span>' + esc(d.method.bases[k]) }));
  });
  wrap.appendChild(dl);
  wrap.appendChild(h("p", { html: '<b>What is deliberately not counted twice.</b> ' + esc(d.method.exclusions) }));
  wrap.appendChild(h("p", { html: '<b>What the live layer is.</b> The colour comes from Wikimedia\'s public ' +
    'pageview API, read by this site\'s Worker, cached, and served as one number per medium. It measures ' +
    'people looking a medium up, which correlates with attention shifting and is not the same as attention. ' +
    'It is on this page because it is public, checkable and current, and every other live attention feed ' +
    'is either a paid panel or a platform marking its own homework.' }));

  const f = h("div", { class: "lesson" });
  f.innerHTML = '<div class="k">THE FOUR NUMBERS WORTH TAKING AWAY</div>' +
    '<p>' + (d.facts || []).map(esc).join('</p><p>') + '</p>';
  wrap.appendChild(f);

  wrap.appendChild(h("p", { class: "mutednote", html:
    'Baseline figures are global aggregates compiled ' + esc(d.source.compiled) + ' from ' +
    esc(d.source.name) + '. ' + esc(d.source.note) + ' The total on this page, ' + n1(total) +
    'B hours a day, is the sum of the mediums that could be sized, not a measurement of all human ' +
    'attention. It is not investment advice, not a recommendation, and not a forecast.' }));
  return wrap;
}

/* ---------------------------------------------------------------- boot */
function open() {
  render();
  if (!BASE && !LOADING) {
    LOADING = true;
    loadBase().then(function () { LOADING = false; if (live()) render(); })
              .catch(function () { LOADING = false; if (live()) fail(); });
  }
  loadLive().then(function () { if (live()) render(); });
  startPoll();
}

/* Still on screen? The poll and every late-arriving fetch check this
   rather than trusting that nobody navigated away mid-flight. */
function live() { return app.dataset.labs === "attention"; }

function fail() {
  app.innerHTML = '<div class="failed"><h3>Could not load the baseline</h3>' +
    '<p><code>attention.json</code> did not load. This page reads its data over HTTP, so it ' +
    'needs to be served rather than opened from the filesystem.</p></div>';
}

/* Keeping it running: the colour layer re-reads itself every fifteen
   minutes while the screen is open, and stops the moment it is not. The
   Worker caches for longer than that, so this costs one conditional
   request, not a scrape. */
function startPoll() {
  if (poll) return;
  poll = setInterval(function () {
    if (!live()) { clearInterval(poll); poll = null; return; }
    loadLive().then(function () { if (live()) render(); });
  }, 15 * 60 * 1000);
}

LABS.register({
  id: "attention",
  chip: "attention",
  title: "Where the eyeballs are",
  /* No skin. This screen is an index screen in spirit and wears the
     site's own paper, ink and Plex rather than a look of its own. */
  skin: false,
  theme: "#F2F1EC",
  render: open
});

/* Appended last, so the chip sits to the right of every existing one. */
if (typeof SCREENS !== "undefined" && !SCREENS.some(function (s) { return s.id === "attention"; })) {
  SCREENS.push({ id: "attention", label: "Attention" });
  if (typeof buildStrip === "function") {
    const strip = document.getElementById("strip");
    if (strip && strip.children.length) {
      buildStrip();
      const cur = location.hash.slice(2) || "index";
      const chip = LABS.chipFor(cur);
      [].forEach.call(strip.children, function (c) { c.classList.toggle("on", c.dataset.id === chip); });
    }
  }
}

/* Someone can land straight on #/attention, which must not wait behind
   the 1.7 MB Form ADV index this screen never reads. */
const landing = location.hash.slice(2);
if (landing === "attention" && typeof route === "function") route("attention");

})();
