/* =====================================================================
   aschcapital.com - the four new sections
   ---------------------------------------------------------------------
     prometheus     Prometheus assessments (personality, AI engagement,
                    and the combined profile)
     recruiting     Track record submission for managers and teams
     ai-operations  The AI practice, with checkout
     trading-dna    Trading history intake, returns a Trading DNA report

   This file adds screens to the existing hash router. It does not touch
   the index, methodology, ceiling, cohorts, states, screener, firm or
   disclosure screens, and it does not read or modify DATA. The only
   contact points with index.html are:

     SCREENS        four entries pushed onto the end, so the new chips
                    appear to the right of everything already there
     route()        one added branch that defers to LABS.route(id)
     buildStrip()   called once here in case the strip was already built

   Loaded as a classic script after the inline script, so it shares the
   same global scope.
   ===================================================================== */
(function () {
"use strict";

const app = document.getElementById("app");
const LS  = "asch.prometheus.v1";

/* ---------------------------------------------------------------------
   DOM helpers. Deliberately small; the page already has sec() and
   node(), but this file keeps its own so it has no ordering dependency
   on them.
   --------------------------------------------------------------------- */
function h(tag, attrs, kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "text") e.textContent = v;
    else if (k.slice(0, 2) === "on") e[k.toLowerCase()] = v;
    else if (k === "dataset") for (const d in v) e.dataset[d] = v[d];
    else e.setAttribute(k, v);
  }
  if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
    if (c == null || c === false) return;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}
function frag(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  const f = document.createDocumentFragment();
  while (d.firstChild) f.appendChild(d.firstChild);
  return f;
}
function put() {
  for (let i = 0; i < arguments.length; i++) {
    const x = arguments[i];
    if (x == null) continue;
    app.appendChild(typeof x === "string" ? frag(x) : x);
  }
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
const pc  = function (n) { return Math.round(n) + "%"; };
const clamp = function (n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; };

/* ---------------------------------------------------------------------
   Local result store.

   Everything a person answers stays in their browser. Nothing is sent
   anywhere unless they press a button that says it will be. That is the
   honest reading of SEC-01 and SEC-02 in the PRD for a build with no
   accounts in it yet: the user can see their data, export it, and
   delete it, because it never left the machine.
   --------------------------------------------------------------------- */
const Store = {
  read: function () {
    try { return JSON.parse(localStorage.getItem(LS) || "{}"); }
    catch (e) { return {}; }
  },
  write: function (o) {
    try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {}
  },
  get: function (k) { return this.read()[k] || null; },
  set: function (k, v) { const o = this.read(); o[k] = v; this.write(o); },
  clear: function (k) {
    const o = this.read();
    if (k) delete o[k]; else { try { localStorage.removeItem(LS); } catch (e) {} return; }
    this.write(o);
  }
};

/* ---------------------------------------------------------------------
   Deterministic item order.

   Items are presented in a fixed shuffled order rather than grouped by
   dimension, so a run of ten Compassion items in a row does not cue the
   answer. The shuffle is seeded and constant, which means item 34 is
   the same item for everyone: results stay comparable across people and
   a stored answer array can still be scored after a reload.
   --------------------------------------------------------------------- */
function seededOrder(n, seed) {
  const idx = [];
  for (let i = 0; i < n; i++) idx.push(i);
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
  }
  return idx;
}

/* ---------------------------------------------------------------------
   Posting to the API.

   The Worker in worker/index.js serves these. If it is not deployed yet
   the fetch fails, and every form says so plainly and offers the email
   fallback rather than silently swallowing a submission.
   --------------------------------------------------------------------- */
const CONTACT = "dave@cravecookies.com";   /* substituted by ingest/build_site.py */

function postForm(url, fd) {
  return fetch(url, { method: "POST", body: fd })
    .then(function (r) {
      return r.text().then(function (t) {
        let j = null;
        try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok) {
          const err = new Error((j && j.error) || ("HTTP " + r.status));
          err.code = j && j.code;
          throw err;
        }
        return j || {};
      });
    });
}

/* If a submission cannot be stored, the answers someone just typed are
   still worth saving. This turns them into a pre-filled email rather
   than losing them to a red error message. Attachments cannot ride on a
   mailto, so the copy says to attach them by hand. */
function mailtoFallback(subject, fd, hasFiles) {
  const lines = [];
  fd.forEach(function (v, k) {
    if (typeof v === "string" && v.trim() && k.charAt(0) !== "_") {
      lines.push(k.replace(/^\w/, function (c) { return c.toUpperCase(); }) + ": " + v);
    }
  });
  if (hasFiles) lines.push("", "(Please attach your file to this email before sending.)");
  return "mailto:" + CONTACT +
         "?subject=" + encodeURIComponent(subject) +
         "&body=" + encodeURIComponent(lines.join("\n"));
}

/* ---------------------------------------------------------------------
   Reusable form pieces
   --------------------------------------------------------------------- */
function field(o) {
  const id = "f_" + o.name;
  let input;
  if (o.type === "textarea") {
    input = h("textarea", { id: id, name: o.name, rows: o.rows || 3, placeholder: o.ph || "" });
  } else if (o.type === "select") {
    input = h("select", { id: id, name: o.name });
    (o.options || []).forEach(function (op) {
      input.appendChild(h("option", { value: op.v, text: op.l }));
    });
  } else {
    input = h("input", { id: id, name: o.name, type: o.type || "text", placeholder: o.ph || "",
                         autocomplete: o.auto || "off" });
  }
  const wrap = h("div", { class: "fld" + (o.wide ? " wide" : "") }, [
    h("label", { for: id, text: o.label }),
    input,
    o.hint ? h("div", { class: "hint", text: o.hint }) : null
  ]);
  wrap._input = input;
  return wrap;
}

/* File picker with drag and drop. Accepts a list, enforces a size cap
   client side so a 200 MB drop fails here rather than after the upload. */
function filePicker(o) {
  const MAXB = (o.maxMB || 15) * 1024 * 1024;
  const files = [];
  const input = h("input", { type: "file", accept: o.accept || "", multiple: !!o.multiple });
  const list  = h("div", { class: "filelist" });
  const err   = h("div", { class: "err" });

  const drop = h("div", { class: "drop", role: "button", tabindex: "0" }, [
    h("div", { class: "dz", html:
      "<b>Drop a file here</b> or click to choose<br>" + esc(o.accepthint || "") }),
    input
  ]);

  function fmtSize(b) {
    return b < 1024 ? b + " B"
         : b < 1048576 ? (b / 1024).toFixed(0) + " KB"
         : (b / 1048576).toFixed(1) + " MB";
  }
  function paint() {
    list.innerHTML = "";
    files.forEach(function (f, i) {
      list.appendChild(h("div", { class: "filerow" }, [
        h("span", { text: f.name }),
        h("span", { class: "sz" }, [
          h("span", { text: fmtSize(f.size) }),
          h("button", { type: "button", title: "Remove", text: " ✕",
            onclick: function () { files.splice(i, 1); paint(); } })
        ])
      ]));
    });
  }
  function add(fl) {
    err.textContent = "";
    Array.prototype.forEach.call(fl, function (f) {
      if (f.size > MAXB) { err.textContent = f.name + " is over the " + (o.maxMB || 15) + " MB limit."; return; }
      if (!o.multiple) files.length = 0;
      files.push(f);
    });
    paint();
  }
  input.onchange = function () { add(input.files); input.value = ""; };
  drop.onclick = function (e) { if (e.target !== input) input.click(); };
  drop.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } };
  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", function (e) { if (e.dataTransfer) add(e.dataTransfer.files); });

  const wrap = h("div", { class: "fld" }, [
    h("label", { text: o.label }), drop, list, err,
    o.hint ? h("div", { class: "hint", text: o.hint }) : null
  ]);
  wrap._files = files;
  return wrap;
}

/* Wires up submit for a set of fields. Validates, disables, posts,
   reports. One place, so all four forms behave identically. */
function submitter(o) {
  const msg = h("div", { class: "formmsg", style: "display:none" });
  const btn = h("button", { class: "btn", type: "submit", text: o.label || "Submit" });

  function say(kind, text) {
    msg.className = "formmsg" + (kind === "ok" ? "" : " " + kind);
    msg.textContent = text;
    msg.style.display = "";
  }
  function run(e) {
    if (e) e.preventDefault();
    msg.style.display = "none";

    const fd = new FormData();
    let bad = null;
    o.fields.forEach(function (f) {
      f.classList.remove("bad");
      if (f._files) {
        if (f._required && !f._files.length) { f.classList.add("bad"); bad = bad || "Attach a file to continue."; return; }
        f._files.forEach(function (file) { fd.append(f._name || "file", file, file.name); });
        return;
      }
      const i = f._input, v = (i.value || "").trim();
      if (f._required && !v) { f.classList.add("bad"); bad = bad || "Fill in every required field."; return; }
      if (i.type === "email" && v && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v)) {
        f.classList.add("bad"); bad = bad || "That email address does not look right."; return;
      }
      fd.append(i.name, v);
    });
    if (o.extra) for (const k in o.extra) fd.append(k, typeof o.extra[k] === "function" ? o.extra[k]() : o.extra[k]);
    if (bad) { say("bad", bad); return; }

    btn.disabled = true;
    say("wait", "Sending...");
    /* fd is closed over by the handlers below */
    postForm(o.url, fd)
      .then(function (res) {
        say("ok", o.done || ("Received. Reference " + (res.ref || "logged") + ". We reply from " + CONTACT + "."));
        o.fields.forEach(function (f) {
          if (f._files) { f._files.length = 0; const l = f.querySelector(".filelist"); if (l) l.innerHTML = ""; }
          else f._input.value = "";
        });
      })
      .catch(function (e) {
        const files = o.fields.some(function (f) { return f._files && f._files.length; });
        msg.className = "formmsg bad";
        msg.innerHTML = "";
        msg.appendChild(document.createTextNode(
          "That did not go through (" + e.message + "). Nothing you typed is lost: "));
        msg.appendChild(h("a", {
          href: mailtoFallback(o.mailSubject || "Website submission", fd, files),
          style: "text-decoration:underline;color:inherit",
          text: "send it as an email instead"
        }));
        msg.appendChild(document.createTextNode(
          files ? ", and attach your file to that email." : "."));
        msg.style.display = "";
      })
      .finally(function () { btn.disabled = false; });
  }
  return { button: btn, message: msg, submit: run };
}

/* Builds a <form> from fields + submitter, so every form is identical
   in behaviour and only the field list changes. */
function buildForm(o) {
  const s = submitter(o);
  const form = h("form", { class: "lform", novalidate: "novalidate", onsubmit: s.submit });
  form.appendChild(h("div", { class: "fh", text: o.heading }));
  (o.rows || []).forEach(function (row) {
    const r = h("div", { class: "frow" });
    row.forEach(function (f) { r.appendChild(f); });
    form.appendChild(r);
  });
  form.appendChild(h("div", { class: "btnrow" }, [s.button]));
  if (o.note) form.appendChild(h("div", { class: "formnote", text: o.note }));
  form.appendChild(s.message);
  return form;
}

/* Marks a field required and names it for the payload. */
function req(f, name) { f._required = true; if (name) f._name = name; return f; }

/* --------------------------------------------------------------------- */
/*  Router registration                                                   */
/* --------------------------------------------------------------------- */
const ROUTES = {};          /* id -> render fn   */
const CHIPS  = {};          /* id -> chip id     */
const TITLES = {};          /* id -> page title  */

function screen(id, chip, title, fn) {
  ROUTES[id] = fn; CHIPS[id] = chip; TITLES[id] = title;
}

/* ---------------------------------------------------------------------
   Skins. Each section has its own visual identity, defined in
   app/skins.css and switched on by a data-skin attribute on <html>.
   Fonts are only fetched the first time a skin is actually opened, so
   the index screens never pay for any of them.
   --------------------------------------------------------------------- */
const SKIN_FONTS = {
  "prometheus":    "family=Plus+Jakarta+Sans:wght@400;500;600;800",
  "recruiting":    "family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Barlow+Condensed:wght@400;500;600",
  "ai-operations": "family=Archivo:wght@600;800&family=JetBrains+Mono:wght@400;700",
  "trading-dna":   "family=Inter:wght@400;500;600;700"
};
const SKIN_THEME = {
  "prometheus": "#0B0D17", "recruiting": "#F4F1EA",
  "ai-operations": "#080A0C", "trading-dna": "#FBFBFD"
};
const BASE_THEME = (document.querySelector('meta[name=theme-color]') || {}).content || "#12191F";
const fontsLoaded = {};

/* A registered section can opt out of skinning entirely. html[data-skin]
   carries a whole visual identity with it, and a section that wants to
   look like the index rather than like a brochure has to be able to say
   so rather than override forty rules. */
const NOSKIN = {};

function ensureFont(skin) {
  if (fontsLoaded[skin] || !SKIN_FONTS[skin]) return;
  fontsLoaded[skin] = true;
  document.head.appendChild(h("link", {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?" + SKIN_FONTS[skin] + "&display=swap"
  }));
}

const LABS = window.LABS = {
  /* Called by route() on every navigation, including away from a labs
     screen, where id is null and the skin comes back off. */
  applySkin: function (id) {
    const skin = id ? (CHIPS[id] || "") : "";
    const root = document.documentElement;
    if (skin && !NOSKIN[skin]) { ensureFont(skin); root.dataset.skin = skin; }
    else delete root.dataset.skin;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = SKIN_THEME[skin] || BASE_THEME;
  },
  skinFor: function (id) { return CHIPS[id] || ""; },
  route: function (id) {
    const fn = ROUTES[id];
    if (!fn) return false;
    fn();
    /* The opening paragraph of a screen is the one a skin may want to
       treat as a hero. Tagging it here saves every renderer having to. */
    const first = app.querySelector(".lede");
    if (first && first.parentNode === app) first.classList.add("leadin");
    return true;
  },
  chipFor: function (id) { return CHIPS[id] || id; },
  titleFor: function (id) { return TITLES[id] || null; },
  has: function (id) { return !!ROUTES[id]; },

  /* Later sections live in their own file rather than being bolted onto
     this one. They register through here so the router, the skin switch
     and the chip strip keep working exactly as they do for the four
     screens above. font and theme are optional; a section that wants
     neither simply inherits the base look. */
  register: function (spec) {
    const chip = spec.chip || spec.id;
    screen(spec.id, chip, spec.title || null, spec.render);
    if (spec.font)  SKIN_FONTS[chip] = spec.font;
    if (spec.theme) SKIN_THEME[chip] = spec.theme;
    if (spec.skin === false) NOSKIN[chip] = true;
    return chip;
  }
};

/* nav() goes through the page's own go() so history and the chip strip
   stay in one place. */
function nav(id) { return function () { window.go(id); }; }

/* =====================================================================
   1. PROMETHEUS
   ===================================================================== */

/* Factor-level provisional norm, derived from the aspect norm. Two
   aspects of the same factor correlate at roughly .5 in the published
   literature, so the sum of two aspect scores has sd = sd_aspect *
   sqrt(2 + 2*.5) = sd_aspect * sqrt(3). Provisional, like P_NORM. */
const P_NORM_F = { mean: P_NORM.mean * 2, sd: P_NORM.sd * Math.sqrt(3) };

const PCT = function (raw, norm) {
  return clamp(pNormCdf((raw - norm.mean) / norm.sd) * 100, 0.5, 99.5);
};

/* ---- scoring: personality ------------------------------------------ */
function scorePersonality(ans) {
  const aspects = {};
  Object.keys(P_ASPECTS).forEach(function (a) { aspects[a] = { raw: 0, n: 0 }; });

  P_ITEMS.forEach(function (item, i) {
    const v = ans[i];
    if (!v) return;
    aspects[item.a].raw += (item.k === 1 ? v : 6 - v);
    aspects[item.a].n++;
  });

  Object.keys(aspects).forEach(function (a) {
    const s = aspects[a];
    const pct = PCT(s.raw, P_NORM);
    s.pct = pct;
    s.band = pBand(pct);
    s.label = P_ASPECTS[a].label;
    s.factor = P_ASPECTS[a].f;
  });

  const factors = {};
  Object.keys(P_FACTORS).forEach(function (f) {
    const raw = P_FACTORS[f].aspects.reduce(function (t, a) { return t + aspects[a].raw; }, 0);
    const pct = PCT(raw, P_NORM_F);
    factors[f] = {
      raw: raw, pct: pct, band: pBand(pct), label: P_FACTORS[f].label,
      tone: pct < 35 ? "low" : pct > 65 ? "high" : "mid"
    };
  });

  /* FR-08 trait interactions: both conditions have to hold. */
  const fired = P_INTERACTIONS.filter(function (x) {
    return x.need.every(function (n) { return aspects[n[0]].band.key === n[1]; });
  });

  return { aspects: aspects, factors: factors, interactions: fired, at: Date.now(), n: ans.filter(Boolean).length };
}

/* ---- scoring: AI engagement ---------------------------------------- */
function targetFor(task, exp) {
  const base = A_TASKS[task].target, mult = A_EXPERTISE[exp].mult, out = {};
  let sum = 0;
  Object.keys(base).forEach(function (m) { out[m] = base[m] * mult[m]; sum += out[m]; });
  Object.keys(out).forEach(function (m) { out[m] = out[m] / sum * 100; });
  return out;
}

function scoreAI(ans, task, exp) {
  const raw = {}, actual = {};
  Object.keys(A_MODES).forEach(function (m) { raw[m] = 0; });
  A_ITEMS.forEach(function (it, i) { if (ans[i]) raw[it.m] += ans[i]; });

  let tot = 0;
  Object.keys(raw).forEach(function (m) { tot += raw[m]; });
  Object.keys(raw).forEach(function (m) { actual[m] = tot ? raw[m] / tot * 100 : 0; });

  const target = targetFor(task, exp);

  /* Alignment is total variation distance from target, not an
     accumulation of "good" modes. More agency is not automatically
     better; matching the task is better. FR-17. */
  let tvd = 0;
  Object.keys(actual).forEach(function (m) { tvd += Math.abs(actual[m] - target[m]); });
  const alignment = Math.round(clamp(100 - tvd / 2, 0, 100));

  const tiers = {};
  Object.keys(A_TIERS).forEach(function (t) {
    tiers[t] = A_TIERS[t].modes.reduce(function (s, m) { return s + actual[m]; }, 0);
  });

  const arche = A_ARCHETYPES[(A_ARCHETYPE_RULES.find(function (r) { return r.test(actual); }) || { id: "coauthor" }).id];

  /* Growth areas: the modes furthest below where this task wants them. */
  const gaps = Object.keys(actual)
    .map(function (m) { return { m: m, gap: target[m] - actual[m] }; })
    .filter(function (x) { return x.gap > 2.5; })
    .sort(function (a, b) { return b.gap - a.gap; })
    .slice(0, 3);

  /* Overuse: where the task does not want as much as you are doing. */
  const over = Object.keys(actual)
    .map(function (m) { return { m: m, gap: actual[m] - target[m] }; })
    .filter(function (x) { return x.gap > 4; })
    .sort(function (a, b) { return b.gap - a.gap; })
    .slice(0, 2);

  return { raw: raw, actual: actual, target: target, alignment: alignment, tiers: tiers,
           archetype: arche, gaps: gaps, over: over, task: task, expertise: exp,
           at: Date.now(), n: ans.filter(Boolean).length };
}

/* Radar axis orders. Aspects are laid out so the two halves of each
   factor sit next to each other, which makes a lopsided factor visible
   as a dent rather than something you have to go looking for. */
const RADAR_ORDER = ["compassion", "politeness", "industriousness", "orderliness",
                     "enthusiasm", "assertiveness", "withdrawal", "volatility",
                     "intellect", "aesthetics"];
const RADAR_LABELS = {
  compassion: "Compassion", politeness: "Politeness", industriousness: "Industrious",
  orderliness: "Orderliness", enthusiasm: "Enthusiasm", assertiveness: "Assertive",
  withdrawal: "Withdrawal", volatility: "Volatility", intellect: "Intellect",
  aesthetics: "Openness"
};
/* Modes in tier order: the two passivity modes, then partnership, then
   the four agency modes, so a passivity-heavy profile reads as a bulge
   on one side of the shape. */
const MODE_ORDER = ["oracle", "production", "tutor", "collab",
                    "verify", "expand", "challenge", "frame"];

/* ---- the assessment runner ----------------------------------------- */
/* One runner serves both instruments. Paged, because a hundred items on
   one screen is a wall and UX-03 asks for this to work on a phone. */
function runner(cfg) {
  const saved = Store.get(cfg.key + ".draft");
  const ans   = (saved && saved.ans && saved.ans.length === cfg.items.length) ? saved.ans
              : new Array(cfg.items.length).fill(0);
  const order = seededOrder(cfg.items.length, cfg.seed);
  const per   = cfg.perPage;
  const pages = Math.ceil(cfg.items.length / per);
  let page    = saved && saved.page ? clamp(saved.page, 0, pages - 1) : 0;
  let showGaps = false;

  function answered() { return ans.filter(Boolean).length; }
  function persist() { Store.set(cfg.key + ".draft", { ans: ans, page: page }); }

  function pageItems() {
    return order.slice(page * per, page * per + per);
  }
  function pageComplete() {
    return pageItems().every(function (i) { return !!ans[i]; });
  }

  function draw() {
    app.innerHTML = "";
    const done = answered(), total = cfg.items.length;

    /* progress */
    const bar = h("div", { class: "prog" }, [
      h("div", { class: "pr" }, [
        h("span", { text: cfg.title }),
        h("span", { text: done + " of " + total + " answered" })
      ]),
      h("div", { class: "track" }, [h("i", { style: "width:" + (done / total * 100) + "%" })])
    ]);
    put(bar);

    put('<p class="cap">' + esc(cfg.scaleNote) + "</p>");

    /* items */
    pageItems().forEach(function (idx) {
      const it = cfg.items[idx];
      const q = h("div", { class: "qitem" + (showGaps && !ans[idx] ? " unanswered" : ""),
                           dataset: { i: String(idx) } }, [
        h("p", { class: "qt" }, [
          h("span", { class: "qn", text: String(order.indexOf(idx) + 1).padStart(3, "0") }),
          document.createTextNode(cfg.textOf(it))
        ])
      ]);
      const lk = h("div", { class: "likert" });
      cfg.scale.forEach(function (lab, si) {
        const v = si + 1;
        lk.appendChild(h("button", {
          type: "button", class: ans[idx] === v ? "on" : "", text: lab,
          onclick: function () {
            ans[idx] = v; persist();
            [].forEach.call(lk.children, function (b, bi) { b.classList.toggle("on", bi === si); });
            q.classList.remove("unanswered");
            const fill = bar.querySelector(".track i");
            fill.style.width = (answered() / total * 100) + "%";
            bar.querySelector(".pr span:last-child").textContent = answered() + " of " + total + " answered";
            if (pageComplete()) foot.querySelector(".btn").disabled = false;
          }
        }));
      });
      q.appendChild(lk);
      put(q);
    });

    /* footer */
    const last = page === pages - 1;
    const next = h("button", {
      class: "btn", disabled: !pageComplete(),
      text: last ? "See my results" : "Next",
      onclick: function () {
        if (!pageComplete()) { showGaps = true; draw(); return; }
        if (!last) { page++; persist(); draw(); scrollTo({ top: 0, behavior: "instant" }); return; }
        const result = cfg.score(ans);
        Store.set(cfg.key, result);
        Store.set(cfg.key + ".ans", ans);
        Store.clear(cfg.key + ".draft");
        window.go(cfg.done);
      }
    });
    const foot = h("div", { class: "pager" }, [
      h("button", {
        class: "pg", disabled: page === 0, text: "← back",
        onclick: function () { page--; persist(); draw(); scrollTo({ top: 0, behavior: "instant" }); }
      }),
      next
    ]);
    put(foot);
    put('<p class="cap">Page ' + (page + 1) + " of " + pages +
        ". Your answers are saved in this browser as you go, so you can stop and come back. " +
        "Nothing is sent anywhere.</p>");
  }
  draw();
}

/* ---- hub ------------------------------------------------------------ */
screen("prometheus", "prometheus", "Prometheus", function () {
  const p = Store.get("personality"), a = Store.get("ai");

  put('<p class="eyebrow">Prometheus</p>');
  put('<h1>Two instruments,<br><span class="glow">one profile</span></h1>');
  put('<p class="lede">One measures who you are. The other measures how you work with a machine that ' +
      'thinks. Separately they are each worth having. The reason to take both is that the second one ' +
      'is partly explained by the first, and that connection is the thing nobody is currently ' +
      'measuring.</p>');

  put(ART.frame("", ART.dualConstellation()));

  const hubs = h("div", { class: "hubs" });

  hubs.appendChild(h("button", { class: "hub", onclick: nav(p ? "prometheus/personality/report" : "prometheus/personality") }, [
    h("div", { class: "hs", text: "Instrument one · 100 items · about 15 minutes" }),
    h("div", { class: "hn", text: "Personality" }),
    h("div", { class: "hd", text: "Five factors and the ten aspects underneath them, scored on the " +
      "Big Five Aspect Scales structure. You get a band and a written read on each of the fifteen " +
      "dimensions, plus the trait combinations that say something neither trait says alone." }),
    h("div", { class: "hstat" + (p ? "" : " todo"),
               text: p ? "Complete · open your report →" : "Not started · begin →" })
  ]));

  hubs.appendChild(h("button", { class: "hub", onclick: nav(a ? "prometheus/ai/report" : "prometheus/ai") }, [
    h("div", { class: "hs", text: "Instrument two · 40 items · about 6 minutes" }),
    h("div", { class: "hn", text: "How I use AI" }),
    h("div", { class: "hd", text: "Eight modes of working with a model, rolled into three tiers. " +
      "Scored against what your actual task needs rather than against a fixed idea of good, because " +
      "more challenge is not better when the job is routine production." }),
    h("div", { class: "hstat" + (a ? "" : " todo"),
               text: a ? "Complete · open your report →" : "Not started · begin →" })
  ]));

  hubs.appendChild(h("button", { class: "hub", onclick: nav("prometheus/profile") }, [
    h("div", { class: "hs", text: "The combined layer" }),
    h("div", { class: "hn", text: "Your profile" }),
    h("div", { class: "hd", text: "Where the two instruments meet. Which parts of how you use AI look " +
      "like they are coming from who you are, stated at the confidence the evidence actually supports " +
      "and no higher." }),
    h("div", { class: "hstat" + (p && a ? "" : " todo"),
               text: p && a ? "Both complete · open →"
                            : "Needs both instruments (" + ((p ? 1 : 0) + (a ? 1 : 0)) + " of 2 done)" })
  ]));
  put(hubs);

  put("<h2>What this is honest about</h2>");
  put('<div class="vcards">' +
    '<div class="vcard gap"><div class="vh">No normative sample yet</div>' +
    'Percentiles here are computed against a stated theoretical distribution, not against a population ' +
    'of real respondents, because Prometheus does not have one yet. That makes your band a reasonable ' +
    'reading of where you sit on the scale and not a claim about where you sit among people. When a ' +
    'real sample exists the norms get replaced and the bands move. This is said on every report screen ' +
    'rather than in a footnote.</div>' +
    '<div class="vcard gap"><div class="vh">Self report is self report</div>' +
    'Both instruments ask you how you behave. That measures your view of your behaviour, which is ' +
    'correlated with your behaviour and is not the same thing. The AI instrument has a stronger version ' +
    'coming, which reads an actual transcript instead of asking. It is not built yet and this page will ' +
    'not pretend otherwise.</div>' +
    '<div class="vcard gap"><div class="vh">The target numbers are ours and they are priors</div>' +
    'The AI instrument scores you against a target mix per task type. Those targets are reasoned from ' +
    'what each kind of work actually requires. They are not fitted to outcome data, because there is no ' +
    'outcome data yet. They will change once there is.</div>' +
    '<div class="vcard ok"><div class="vh">Your answers do not leave this browser</div>' +
    'Scoring is arithmetic and it runs on your machine. No account, no upload, no model call. Everything ' +
    'is in local storage and the button below empties it.</div>' +
    "</div>");

  if (p || a) {
    put(h("div", { class: "btnrow", style: "margin-top:18px" }, [
      h("button", { class: "btn ghost sm", text: "Export my results",
        onclick: function () {
          const blob = new Blob([JSON.stringify(Store.read(), null, 2)], { type: "application/json" });
          const u = URL.createObjectURL(blob);
          const a2 = h("a", { href: u, download: "prometheus-results.json" });
          document.body.appendChild(a2); a2.click(); a2.remove();
          setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
        } }),
      h("button", { class: "btn ghost sm", text: "Delete everything",
        onclick: function () {
          if (confirm("Delete all Prometheus results from this browser? This cannot be undone.")) {
            Store.clear(); window.go("prometheus");
          }
        } })
    ]));
  }
});

/* ---- personality assessment ---------------------------------------- */
screen("prometheus/personality", "prometheus", "Personality assessment", function () {
  const done = Store.get("personality");
  if (done) {
    put('<p class="eyebrow">Prometheus · instrument one</p>');
    put("<h1>You have already<br>taken this</h1>");
    put('<p class="lede">The instrument is meant to be taken once. Retaking it after you have read your ' +
        'own results changes what you answer, which is a measurement problem rather than a policy one. ' +
        'You can open the report you have, or discard it and start again from nothing.</p>');
    put(h("div", { class: "btnrow" }, [
      h("button", { class: "btn", text: "Open my report", onclick: nav("prometheus/personality/report") }),
      h("button", { class: "btn ghost", text: "Discard and retake", onclick: function () {
        if (confirm("Discard your personality results and start again?")) {
          Store.clear("personality"); Store.clear("personality.ans"); Store.clear("personality.draft");
          window.go("prometheus/personality");
        }
      } })
    ]));
    return;
  }
  runner({
    key: "personality",
    title: "Personality",
    items: P_ITEMS,
    scale: P_SCALE,
    seed: 20260824,
    perPage: 10,
    done: "prometheus/personality/report",
    textOf: function (it) { return it.t; },
    score: scorePersonality,
    scaleNote: "Answer for how you generally are, not how you were this week or how you would like to be. " +
               "There is no right answer and nothing here is scored as good or bad. Take it once."
  });
});

/* ---- AI assessment: setup then items -------------------------------- */
screen("prometheus/ai", "prometheus", "AI engagement assessment", function () {
  const done = Store.get("ai");
  if (done) {
    put('<p class="eyebrow">Prometheus · instrument two</p>');
    put("<h1>You have a result<br>on file</h1>");
    put('<p class="lede">Unlike the personality instrument, this one is meant to be retaken. How you ' +
        'work with a model changes, and the point of measuring it is to watch it move.</p>');
    put(h("div", { class: "btnrow" }, [
      h("button", { class: "btn", text: "Open my report", onclick: nav("prometheus/ai/report") }),
      h("button", { class: "btn ghost", text: "Take it again", onclick: function () {
        Store.clear("ai"); Store.clear("ai.ans"); Store.clear("ai.draft"); window.go("prometheus/ai");
      } })
    ]));
    return;
  }

  const setup = Store.get("ai.setup");
  if (!setup) {
    put('<p class="eyebrow">Prometheus · instrument two</p>');
    put("<h1>Two questions<br>before we start</h1>");
    put('<p class="lede">There is no single correct way to use a model. There is a way that fits the ' +
        'work in front of you. Arguing with it about a routine invoice run is not better practice, it is ' +
        'wasted time, and a scoring system that says otherwise is measuring the wrong thing. So we score ' +
        'you against your task rather than against an ideal.</p>');

    const task = field({ name: "task", label: "The work you use AI for most", type: "select",
      options: Object.keys(A_TASKS).map(function (k) { return { v: k, l: A_TASKS[k].label }; }) });
    const exp = field({ name: "exp", label: "Your expertise in that work", type: "select",
      options: Object.keys(A_EXPERTISE).map(function (k) { return { v: k, l: A_EXPERTISE[k].label }; }),
      hint: "This shifts the target rather than replacing it. A beginner should be leaning on the model to teach; an expert should be delegating more and checking harder." });
    exp._input.value = "intermediate";

    const f = h("form", { class: "lform", onsubmit: function (e) {
      e.preventDefault();
      Store.set("ai.setup", { task: task._input.value, expertise: exp._input.value });
      window.go("prometheus/ai");
    } }, [
      h("div", { class: "fh", text: "Declared context" }),
      h("div", { class: "frow" }, [task, exp]),
      h("div", { class: "btnrow" }, [h("button", { class: "btn", type: "submit", text: "Start the 40 items" })])
    ]);
    put(f);
    return;
  }

  runner({
    key: "ai",
    title: "How I use AI",
    items: A_ITEMS,
    scale: A_SCALE,
    seed: 84102026,
    perPage: 8,
    done: "prometheus/ai/report",
    textOf: function (it) { return it.t; },
    score: function (ans) { return scoreAI(ans, setup.task, setup.expertise); },
    scaleNote: "Answer for how you actually work with a model now, not how you intend to. " +
               "Scoring is against " + A_TASKS[setup.task].label.toLowerCase() + " at " +
               A_EXPERTISE[setup.expertise].label.toLowerCase() + " level, which is what you told us."
  });
});

/* ---- personality report --------------------------------------------- */
function bandTone(key) { return key === "high" ? "hi" : key === "low" ? "lo" : ""; }

function dimBlock(name, pct, bandLabel, bandKey, what, body) {
  const tone = bandTone(bandKey);
  const d = h("div", { class: "dimrow" }, [
    h("div", { class: "dh" }, [
      h("div", { class: "dn", text: name }),
      h("div", { class: "db " + tone, text: bandLabel + " · " + Math.round(pct) + (
        Math.round(pct) % 10 === 1 && Math.round(pct) !== 11 ? "st" :
        Math.round(pct) % 10 === 2 && Math.round(pct) !== 12 ? "nd" :
        Math.round(pct) % 10 === 3 && Math.round(pct) !== 13 ? "rd" : "th") })
    ]),
    h("div", { class: "meter" }, [
      h("i", { class: tone, style: "width:" + pct + "%" }),
      h("div", { class: "mid" }),
      h("div", { class: "pin", style: "left:calc(" + pct + "% - 1px)" })
    ]),
    what ? h("p", { class: "what", text: what }) : null,
    h("p", { class: "body", text: body })
  ]);
  return d;
}

screen("prometheus/personality/report", "prometheus", "Personality report", function () {
  const r = Store.get("personality");
  if (!r) { window.go("prometheus/personality"); return; }

  put('<p class="eyebrow">Prometheus · instrument one</p>');
  put("<h1>Your personality<br>profile</h1>");
  put('<p class="lede">Fifteen dimensions: five factors, and the two aspects that make up each one. ' +
      'The aspects matter more than the factors do. Two people can land in the same place on ' +
      'Conscientiousness and be nothing alike, because one of them got there on Industriousness and the ' +
      'other on Orderliness.</p>');

  put('<div class="callout"><b>Read the percentile carefully</b>' +
      'These percentiles are computed against a stated theoretical distribution, not against a measured ' +
      'population. Prometheus has no normative sample yet. Treat the band as a reading of where you sit ' +
      'on the scale, not as a claim about how you compare to other people. That claim is available only ' +
      'once real respondents exist, and it will be labelled differently when it does.</div>');

  /* One shape is easier to hold than fifteen rows of a table, and the
     aspects are the level where two people with the same factor score
     stop resembling each other. */
  put(ART.frame("Your ten aspects",
    ART.aspectRadar(r.aspects, RADAR_ORDER, RADAR_LABELS),
    "Distance from the centre is your percentile. The dashed ring is the 50th, " +
    "which is the middle of the scale rather than the middle of a population."));

  Object.keys(P_FACTORS).forEach(function (fk) {
    const f = r.factors[fk];
    put(h("div", { class: "factorhead" }, [
      h("div", { class: "fn", text: f.label }),
      h("div", { class: "fv", text: f.band.label + " · " + Math.round(f.pct) + " of 100" })
    ]));
    put(h("p", { class: "lede", style: "font-size:16px;margin-top:10px", text: P_FACTOR_COPY[fk][f.tone] }));

    P_FACTORS[fk].aspects.forEach(function (ak) {
      const a = r.aspects[ak], c = P_COPY[ak];
      put(dimBlock(a.label, a.pct, a.band.label, a.band.key, c.what, c[a.band.key]));
    });
  });

  if (r.interactions.length) {
    put("<h2>Where two traits meet</h2>");
    put('<p class="lede">Each of these fires only because two separate dimensions both landed where they ' +
        'did. They say something the individual scores do not.</p>');
    const v = h("div", { class: "vcards" });
    r.interactions.forEach(function (x) {
      v.appendChild(h("div", { class: "vcard" }, [
        h("div", { class: "vh", text: x.title }),
        h("div", { text: x.body })
      ]));
    });
    put(v);
  } else {
    put("<h2>Where two traits meet</h2>");
    put('<p class="mutednote">None of the defined trait interactions fired for your profile. That is a ' +
        'common and unremarkable result: the combinations Prometheus checks for are the ones with ' +
        'something specific to say, and most profiles trigger none or one of them.</p>');
  }

  const hasAI = !!Store.get("ai");
  put(h("div", { class: "pager" }, [
    h("button", { class: "pg", text: "← Prometheus", onclick: nav("prometheus") }),
    h("button", { class: "pg", text: hasAI ? "Your combined profile →" : "Take the AI instrument →",
                  onclick: nav(hasAI ? "prometheus/profile" : "prometheus/ai") })
  ]));
});

/* ---- AI engagement report ------------------------------------------- */
function modeRow(mkey, actual, target) {
  const a = actual[mkey], t = target[mkey];
  const over = a > t + 2;
  return h("div", { class: "modebar" }, [
    h("div", { class: "ml", text: A_MODES[mkey].label }),
    h("div", { class: "mt" }, [
      h("div", { class: "act " + (over ? "over" : "under"), style: "width:" + clamp(a, 0, 100) + "%" }),
      h("div", { class: "tgt", style: "left:calc(" + clamp(t, 0, 100) + "% - 1px)", title: "target " + pc(t) })
    ]),
    h("div", { class: "mv", html: "<b>" + Math.round(a) + "%</b> / " + Math.round(t) + "%" })
  ]);
}

screen("prometheus/ai/report", "prometheus", "AI engagement report", function () {
  const r = Store.get("ai");
  if (!r) { window.go("prometheus/ai"); return; }

  put('<p class="eyebrow">Prometheus · instrument two</p>');
  put("<h1>" + esc(r.archetype.label) + "</h1>");
  put('<p class="lede">' + esc(r.archetype.line) + " " + esc(r.archetype.body) + "</p>");

  put(ART.frame("Your shape, against the target",
    ART.modeRadar(r.actual, r.target, A_MODES, MODE_ORDER),
    "The alignment score is a one-number summary of the gap between these two outlines."));

  const kp = h("div", { class: "kpis" }, [
    h("div", { class: "kpi" }, [
      h("div", { class: "k", text: "Alignment" }),
      h("div", { class: "v " + (r.alignment >= 70 ? "gain" : r.alignment >= 50 ? "mkt" : "risk"),
                 text: String(r.alignment) }),
      h("div", { class: "s", text: "of 100, against your task" })
    ]),
    h("div", { class: "kpi" }, [
      h("div", { class: "k", text: "Declared task" }),
      h("div", { class: "v", style: "font-size:19px;line-height:1.3", text: A_TASKS[r.task].label }),
      h("div", { class: "s", text: A_EXPERTISE[r.expertise].label + " level" })
    ]),
    h("div", { class: "kpi" }, [
      h("div", { class: "k", text: "Agency tier" }),
      h("div", { class: "v gain", text: pc(r.tiers.agency) }),
      h("div", { class: "s", text: "framing, widening, testing, checking" })
    ]),
    h("div", { class: "kpi" }, [
      h("div", { class: "k", text: "Passivity tier" }),
      h("div", { class: "v", text: pc(r.tiers.passivity) }),
      h("div", { class: "s", text: "work sent out, result taken back" })
    ])
  ]);
  put(kp);

  put('<p class="mutednote">Alignment is distance from the mix your declared task calls for, not a count ' +
      'of good behaviour. A high score means you are working the way this kind of work rewards. Moving ' +
      'everything towards Agency would lower it, which is the point.</p>');

  put("<h2>Your three tiers</h2>");
  const tb = h("div", { class: "tierbar" });
  ["passivity", "partnership", "agency"].forEach(function (t) {
    const w = r.tiers[t];
    /* The word is dropped on narrow screens by CSS rather than by a width
       guess here, because 22% of a phone is not the same as 22% of a desk. */
    tb.appendChild(h("div", { class: "t-" + t, style: "width:" + w + "%",
      html: w >= 9 ? '<span class="tw">' + A_TIERS[t].label + " </span>" + pc(w) : "" }));
  });
  put(tb);
  put('<p class="cap">' + ["passivity", "partnership", "agency"].map(function (t) {
    return A_TIERS[t].label + ": " + esc(A_TIERS[t].blurb);
  }).join(" &nbsp;·&nbsp; ") + "</p>");

  put("<h2>Eight modes, against target</h2>");
  put('<p class="lede">The bar is what you reported. The vertical line is what ' +
      esc(A_TASKS[r.task].label.toLowerCase()) + " at " + esc(A_EXPERTISE[r.expertise].label.toLowerCase()) +
      " level calls for. Amber means you are above target, which is not automatically a fault.</p>");
  const box = h("div", { class: "chartbox", style: "padding:15px 16px 12px" });
  ["passivity", "partnership", "agency"].forEach(function (t) {
    A_TIERS[t].modes.forEach(function (m) { box.appendChild(modeRow(m, r.actual, r.target)); });
  });
  put(box);

  if (r.over.length) {
    put("<h2>Above target</h2>");
    const v = h("div", { class: "vcards" });
    r.over.forEach(function (x) {
      v.appendChild(h("div", { class: "vcard gap" }, [
        h("div", { class: "vh", text: A_MODES[x.m].label + " · " + Math.round(x.gap) + " points over" }),
        h("div", { text: A_MODES[x.m].blurb + " For this kind of work that is more than the task needs. " +
          "Not a fault on its own, but it is time and attention spent where the return is lower." })
      ]));
    });
    put(v);
  }

  put("<h2>What to practise</h2>");
  if (!r.gaps.length) {
    put('<p class="lede">Nothing is meaningfully below target. Your reported mix already matches what ' +
        'this kind of work calls for. The useful next move is to retake this against a different task ' +
        'type, because the mix that fits one kind of work rarely fits another.</p>');
  } else {
    put('<p class="lede">Three modes your declared task wants more of than you reported. Each exercise ' +
        'is small on purpose.</p>');
    const ol = h("ol", { class: "steps" });
    r.gaps.forEach(function (g) {
      const ex = A_EXERCISES[g.m];
      ol.appendChild(h("li", {}, [
        h("b", { text: A_MODES[g.m].label + " · " + Math.round(g.gap) + " points under target. " }),
        document.createTextNode(ex[0]),
        h("div", { class: "cap", text: "Then: " + ex[1] })
      ]));
    });
    put(ol);
  }

  put('<div class="callout"><b>What this instrument is not</b>' +
      'This is self report. It measures what you believe about how you work, which is related to how you ' +
      'work and is not identical to it. The stronger version reads an actual conversation and classifies ' +
      'each message rather than asking you. That build is next, and until it exists this page will keep ' +
      'saying so. The target mixes are Asch Capital priors, reasoned from what each kind of work ' +
      'requires, not fitted to outcome data.</div>');

  const hasP = !!Store.get("personality");
  put(h("div", { class: "pager" }, [
    h("button", { class: "pg", text: "← Prometheus", onclick: nav("prometheus") }),
    h("button", { class: "pg", text: hasP ? "Your combined profile →" : "Take the personality instrument →",
                  onclick: nav(hasP ? "prometheus/profile" : "prometheus/personality") })
  ]));
});

/* ---- the combined profile ------------------------------------------- */
/* FR-22 to FR-25. Every link below is a stated hypothesis with a
   direction, and the copy says what it is. Population benchmarking is
   suppressed entirely because there is no population, which is the
   graceful degradation FR-24 asks for rather than a number invented to
   fill the space. */
const LINKS = [
  { aspect: "intellect",       dir: "high", mode: "tutor",
    claim: "People who enjoy working things out tend to ask the model to teach rather than to tell.",
    why: "Intellect is the appetite for understanding rather than for answers. That appetite has an obvious outlet in a system that will explain itself on request." },
  { aspect: "intellect",       dir: "low",  mode: "oracle",
    claim: "A preference for the working answer over the interesting one tends to show up as Oracle use.",
    why: "If abstraction is not enjoyable, asking for the conclusion and moving on is the efficient choice most of the time. It is expensive only when the situation is genuinely new." },
  { aspect: "industriousness", dir: "high", mode: "frame",
    claim: "People who finish things tend to define the problem before they start.",
    why: "Framing is unglamorous front-loaded work with no visible output. Doing it anyway is the same disposition that finishes a task after the interesting part ends." },
  { aspect: "industriousness", dir: "low",  mode: "production",
    claim: "Difficulty starting tends to show up as heavy Production Assistant use.",
    why: "Delegating the output removes the hardest part of the task, which is beginning it. This is a real solution to a real problem and it also means the capability stays outside you." },
  { aspect: "orderliness",     dir: "high", mode: "verify",
    claim: "People who notice when something is out of place tend to check the model's work.",
    why: "Verification is the same reflex applied to output rather than to a desk. An error registers as an irritant rather than as a neutral fact." },
  { aspect: "aesthetics",      dir: "high", mode: "expand",
    claim: "Openness to the unfamiliar tends to show up as Creative Expander use.",
    why: "Asking for the unconventional version and going past the first workable idea is what a preference for novelty looks like when there is a machine to supply it." },
  { aspect: "aesthetics",      dir: "low",  mode: "production",
    claim: "A preference for proven methods tends to pair with using the model to execute rather than to explore.",
    why: "If the familiar option is the attractive one, the model's value is throughput on a known process rather than the discovery of an unknown one." },
  { aspect: "politeness",      dir: "low",  mode: "challenge",
    claim: "People comfortable with confrontation tend to argue with the model.",
    why: "Critical Challenger requires being willing to push against a confident answer. That is the same disposition that pushes back against a confident person." },
  { aspect: "politeness",      dir: "high", mode: "oracle",
    claim: "A deferential default can extend to the machine.",
    why: "This is the least obvious link here and the one most worth checking against yourself. Accepting a fluent, confident answer without pushing on it is a social reflex operating where there is no one to offend." },
  { aspect: "assertiveness",   dir: "high", mode: "frame",
    claim: "People who set direction for a group tend to set it for a model too.",
    why: "Problem Setter is directive behaviour. Stating the constraints and what a good answer looks like is the same act as setting direction when a group is stuck." },
  { aspect: "withdrawal",      dir: "high", mode: "verify",
    claim: "Anticipating what could go wrong tends to show up as verification.",
    why: "Assuming there is an error and going to look for it is exactly what a low tolerance for unexamined risk produces when applied to output." },
  { aspect: "compassion",      dir: "high", mode: "collab",
    claim: "A conversational, other-oriented default tends to produce collaborative rather than transactional sessions.",
    why: "This is the weakest link in the set. It is included because the behaviour is consistent, not because the mechanism is established." }
];

screen("prometheus/profile", "prometheus", "Combined profile", function () {
  const p = Store.get("personality"), a = Store.get("ai");

  put('<p class="eyebrow">Prometheus · the combined layer</p>');
  put('<h1>Where the two<br><span class="glow">instruments meet</span></h1>');

  if (!p || !a) {
    put('<p class="lede">This layer needs both instruments. It is the only part of Prometheus that ' +
        'cannot be produced from one of them, which is also the reason it is the part worth having.</p>');
    put(h("div", { class: "hubs" }, [
      h("button", { class: "hub", onclick: nav(p ? "prometheus/personality/report" : "prometheus/personality") }, [
        h("div", { class: "hs", text: "Instrument one" }),
        h("div", { class: "hn", text: "Personality" }),
        h("div", { class: "hstat" + (p ? "" : " todo"), text: p ? "Complete" : "Not started · begin →" })
      ]),
      h("button", { class: "hub", onclick: nav(a ? "prometheus/ai/report" : "prometheus/ai") }, [
        h("div", { class: "hs", text: "Instrument two" }),
        h("div", { class: "hn", text: "How I use AI" }),
        h("div", { class: "hstat" + (a ? "" : " todo"), text: a ? "Complete" : "Not started · begin →" })
      ])
    ]));
    return;
  }

  /* A link fires when the personality side is at the stated pole and the
     AI side is meaningfully off target in the direction the link predicts. */
  const fired = LINKS.filter(function (L) {
    const band = p.aspects[L.aspect].band.key;
    const atPole = (L.dir === "high" && (band === "high" || band === "modhigh")) ||
                   (L.dir === "low"  && (band === "low"  || band === "modlow"));
    if (!atPole) return false;
    return a.actual[L.mode] - a.target[L.mode] > 1.5;
  });

  put('<p class="lede">Below are the places where your personality profile and your reported AI ' +
      'behaviour point the same way. These are population level hypotheses about how traits express ' +
      'themselves, checked against your two results. They are not a finding about you specifically, and ' +
      'the difference matters: a pattern that holds across many people can be absent in any one of them.</p>');

  put('<div class="callout"><b>Confidence, stated plainly</b>' +
      'Prometheus has no dataset connecting these two instruments yet, so none of these links are ' +
      'measured on Prometheus users. They are drawn from what each trait is and what each mode requires, ' +
      'and they are reasoned rather than fitted. Population benchmarking is switched off on this page ' +
      'rather than shown against a sample too small to mean anything. When the sample exists, this box ' +
      'gets replaced by a number.</div>');

  if (!fired.length) {
    put("<h2>Nothing lines up</h2>");
    put('<p class="lede">None of the defined links fired for you. Your AI behaviour is not tracking your ' +
        'personality profile in any of the directions Prometheus checks for. That is a real result rather ' +
        'than a null one: it usually means your working habits are being set by the demands of your work ' +
        'rather than by your disposition, which is generally the better of the two ways to arrive at ' +
        'them.</p>');
  } else {
    put("<h2>" + fired.length + " link" + (fired.length === 1 ? "" : "s") + " fired</h2>");
    const v = h("div", { class: "vcards" });
    fired.forEach(function (L) {
      const asp = p.aspects[L.aspect], md = A_MODES[L.mode];
      const delta = Math.round(a.actual[L.mode] - a.target[L.mode]);
      v.appendChild(h("div", { class: "vcard derived" }, [
        h("div", { class: "vh", text: asp.label + " " + asp.band.label.toLowerCase() + "  ⇄  " + md.label }),
        h("div", { text: L.claim }),
        h("div", { class: "arrow", text: "Your reading: " + asp.label + " at the " +
          asp.band.label.toLowerCase() + " end, and " + md.label + " running " + delta +
          " points above what your declared task calls for." }),
        h("div", { style: "margin-top:8px", text: L.why })
      ]));
    });
    put(v);
  }

  put("<h2>The two results side by side</h2>");
  put(h("div", { class: "kpis" }, [
    h("div", { class: "kpi" }, [ h("div", { class: "k", text: "Archetype" }),
      h("div", { class: "v", style: "font-size:20px;line-height:1.25", text: a.archetype.label }),
      h("div", { class: "s", text: a.archetype.line }) ]),
    h("div", { class: "kpi" }, [ h("div", { class: "k", text: "Alignment" }),
      h("div", { class: "v " + (a.alignment >= 70 ? "gain" : a.alignment >= 50 ? "mkt" : "risk"), text: String(a.alignment) }),
      h("div", { class: "s", text: "against " + A_TASKS[a.task].label.toLowerCase() }) ]),
    h("div", { class: "kpi" }, [ h("div", { class: "k", text: "Highest aspect" }),
      h("div", { class: "v", style: "font-size:20px;line-height:1.25",
        text: Object.keys(p.aspects).sort(function (x, y) { return p.aspects[y].pct - p.aspects[x].pct; })
                .map(function (k) { return p.aspects[k].label; })[0] }),
      h("div", { class: "s", text: "of fifteen dimensions" }) ]),
    h("div", { class: "kpi" }, [ h("div", { class: "k", text: "Lowest aspect" }),
      h("div", { class: "v", style: "font-size:20px;line-height:1.25",
        text: Object.keys(p.aspects).sort(function (x, y) { return p.aspects[x].pct - p.aspects[y].pct; })
                .map(function (k) { return p.aspects[k].label; })[0] }),
      h("div", { class: "s", text: "of fifteen dimensions" }) ])
  ]));

  put(h("div", { class: "pager" }, [
    h("button", { class: "pg", text: "← Personality report", onclick: nav("prometheus/personality/report") }),
    h("button", { class: "pg", text: "AI report →", onclick: nav("prometheus/ai/report") })
  ]));
});

/* =====================================================================
   2. RECRUITING
   ---------------------------------------------------------------------
   Structure follows militiacapital.com/#pm: headline, one line of
   qualification, three columns (requirements / structure / additional),
   then an inline track record submission.

   The two review systems get names rather than the words "quantitative"
   and "qualitative":

     THE TAPE   what the numbers say. Returns, risk, sample, decay.
     THE READ   what the numbers cannot say. Process, repeatability,
                whether the edge has a reason.

   EVERY NUMBER AND TERM IN THIS SECTION IS A DRAFT AND NEEDS DAVID'S
   SIGN-OFF, AND PROBABLY COUNSEL'S, BEFORE IT GOES LIVE. Published
   compensation terms and performance thresholds for a fund are not
   ordinary web copy.
   ===================================================================== */

const REC = {
  requirements: [
    "A live track record of at least 12 months. Paper and backtest do not count and will not be read.",
    "Sharpe of 1.1 or better unlevered, 1.5 or better levered, computed daily.",
    "Annualised alpha of 10% or better unlevered, 25% or better levered.",
    "At least 100 independent bets. Positions inside one factor count as one bet, not many.",
    "No catastrophic tail. One good year built on an unhedged short gamma position is not a track record, it is a coin that has not landed yet."
  ],
  structure: [
    { k: "Starting allocation", v: "$1M to $10M, raised quickly where the results hold up." },
    { k: "Compensation",        v: "15% of profits over a hurdle, set at the risk free rate plus 3% or an appropriate benchmark." },
    { k: "Partnership",         v: "After three years, sustained performers take an equal share of the performance fee pool." },
    { k: "Ownership",           v: "You keep your process. We do not tell you what to hold." }
  ],
  additional: [
    "You will not raise money, handle operations, file anything, or talk to an allocator unless you want to.",
    "There is no house stop loss. We size the allocation instead of policing the book.",
    "Either side can end it immediately, for any reason, without explanation.",
    "We are not looking for credentials. We have never once asked to see a CV."
  ]
};

screen("recruiting", "recruiting", "Recruiting", function () {
  put('<p class="eyebrow">Recruiting</p>');
  put("<h1>We are looking for<br>managers who can<br>already prove it</h1>");
  put('<p class="lede">We do not care where you went to school, who you worked for, or whether anyone ' +
      'has ever given you money before. We care about two things: what your real money results say, and ' +
      'how many independent bets they are built on. Send those and we will read them properly.</p>');

  const c = h("div", { class: "cols3" });

  const c1 = h("div", {}, [h("div", { class: "ch", text: "What we require" }), (function () {
    const ul = h("ul");
    REC.requirements.forEach(function (t) { ul.appendChild(h("li", { text: t })); });
    return ul;
  })()]);

  const c2 = h("div", {}, [h("div", { class: "ch", text: "The structure" })].concat(
    REC.structure.map(function (s) {
      return h("div", { class: "spec" }, [h("div", { class: "sub", text: s.k }), document.createTextNode(s.v)]);
    })
  ));

  const c3 = h("div", {}, [h("div", { class: "ch", text: "Everything else" }), (function () {
    const ul = h("ul");
    REC.additional.forEach(function (t) { ul.appendChild(h("li", { text: t })); });
    return ul;
  })()]);

  c.appendChild(c1); c.appendChild(c2); c.appendChild(c3);
  put(c);

  put(ART.frame("Why the bet count is the number we care about",
    ART.betClusters(),
    "A hundred names that all load the same handful of factors is not a hundred " +
    "chances to be right. It is six, repeated. This is the line on the requirements " +
    "list that costs most submissions."));

  put("<h2>What happens to what you send</h2>");
  put('<p class="lede">Your track record goes through two reviews. They are deliberately separate, they ' +
      'are run in that order, and the second one is the one that decides.</p>');

  put('<div class="loopgrid">' +
    '<div class="loopstep"><div class="k">The Tape</div><div class="v">' +
    'The arithmetic, run without opinion. Returns, daily Sharpe, alpha against the right benchmark rather ' +
    'than a convenient one, drawdown shape, exposure through the period, and how much of the result came ' +
    'from how few days. We separate the bets from the positions, because a hundred names in one factor is ' +
    'one bet repeated. Then we look at whether the edge is decaying, which is the number most track ' +
    'records are quietest about.</div></div>' +
    '<div class="loopstep" style="border-left-color:var(--gain)"><div class="k">The Read</div><div class="v">' +
    'The part arithmetic cannot reach. Why does this work, and is the reason still true. What were you ' +
    'doing on the worst three days and did you do what you said you would. Which of these bets would you ' +
    'make again at four times the size, and which one only worked because it was small. We are looking ' +
    'for an edge with a mechanism behind it rather than a result with a story attached afterwards.</div></div>' +
    "</div>");

  put(ART.frame("What The Tape reads",
    ART.tapeSchematic(),
    "Shape, not level. Where the drawdowns sit, how deep, how long to recover, and " +
    "how much of the whole result is carried by a handful of days."));

  put('<p class="mutednote">A record that clears The Tape and fails The Read is the common case, not the ' +
      'rare one. Strong numbers over a short sample are usually a bet that has not been asked to pay out ' +
      'yet. That is the whole reason there are two passes rather than one.</p>');

  /* ---- submission form ---- */
  const nm  = req(field({ name: "name",  label: "Name", auto: "name" }));
  const em  = req(field({ name: "email", label: "Email", type: "email", auto: "email" }));
  const tr  = field({ name: "years", label: "Live track record", type: "select", options: [
    { v: "1-2",  l: "1 to 2 years" }, { v: "2-3", l: "2 to 3 years" },
    { v: "3-5",  l: "3 to 5 years" }, { v: "5+",  l: "More than 5 years" }
  ]});
  const st  = field({ name: "strategy", label: "Strategy, in one line",
                      ph: "Long short equity, small cap, low volatility tilt" });
  const bets= field({ name: "bets", label: "Independent bets in the sample", ph: "e.g. 240" ,
                      hint: "Names inside one factor count once." });
  const rec = req(filePicker({ label: "Live monthly track record", maxMB: 20, multiple: true,
    accept: ".csv,.xlsx,.xls,.pdf,.txt,.json",
    accepthint: "CSV, XLSX, PDF or a broker statement export. Up to 20 MB each.",
    hint: "Monthly net returns at minimum. Daily is better and it lets us compute the numbers above properly. Broker statements are the strongest thing you can send." }), "track");
  const nts = field({ name: "notes", label: "Anything we should know", type: "textarea", rows: 3,
    ph: "Leverage used, the worst drawdown and what caused it, anything in the record that needs explaining." });

  put(buildForm({
    heading: "Submit your track record",
    url: "/api/recruiting",
    mailSubject: "Track record submission",
    fields: [nm, em, tr, st, bets, rec, nts],
    rows: [[nm, em], [tr, bets], [st], [rec], [nts]],
    label: "Submit",
    done: "Received. We read every submission ourselves and we reply either way, usually inside two weeks.",
    note: "What you send stays confidential and is used only to assess your candidacy. We do not share it, " +
          "we do not trade on it, and we do not add you to anything."
  }));

  put('<p class="mutednote" style="margin-top:26px">This page is a description of how we evaluate ' +
      'managers. It is not an offer to buy or sell any security, not an offer of employment, and not a ' +
      'guarantee that any allocation will be made. Past performance does not predict future results. ' +
      'Terms described here are indicative and any actual arrangement is set out in its own ' +
      'documents.</p>');
});

/* =====================================================================
   3. AI OPERATIONS
   ---------------------------------------------------------------------
   Offer ladder and delivery loop configured in offers.js. This screen
   renders it and wires the buy buttons.

   Checkout: a Payment Link is an external Stripe URL, so pressing buy
   leaves the site and lands on Stripe. No card data reaches us and no
   Stripe secret exists in this codebase. Until David pastes the links
   in, a buy button becomes "Request an invoice" and posts to the
   enquiry endpoint, so the page is never dead.
   ===================================================================== */

function offerCard(o, onEnquire) {
  const card = h("div", { class: "offer" + (o.featured ? " featured" : "") }, [
    h("div", { class: "stage", text: o.stage }),
    h("h3", { class: "nm", text: o.name }),
    h("div", { class: "pz", html: esc(o.priceLabel) + (o.priceNote ? "<span>" + esc(o.priceNote) + "</span>" : "") }),
    h("p", { class: "tag", text: o.tagline }),
    h("p", { class: "bd", text: o.body })
  ]);
  const ul = h("ul");
  (o.includes || []).forEach(function (t) { ul.appendChild(h("li", { text: t })); });
  card.appendChild(ul);
  if (o.note) card.appendChild(h("p", { class: "cap", text: o.note }));

  const foot = h("div", { class: "foot" });
  const payUrl = payUrlFor(o);
  if (o.kind === "buy" && payUrl) {
    foot.appendChild(h("a", { class: "btn", href: payUrl, rel: "noopener", target: "_blank",
                              style: "display:block;text-align:center;text-decoration:none", text: o.cta }));
    foot.appendChild(h("div", { class: "cap", text: payNoteFor(o, true) }));
    /* A recurring price on a provider that cannot bill on a schedule
       needs the second half of the arrangement said plainly, not buried
       in the small print under the button. */
    if (o.priceNote === "per month" && PAYMENT.provider === "venmo") {
      foot.appendChild(h("button", { class: "btn ghost sm", style: "width:100%;margin-top:8px",
        text: "Rather be invoiced", onclick: function () { onEnquire(o); } }));
    }
  } else if (o.kind === "buy") {
    foot.appendChild(h("button", { class: "btn", text: "Request an invoice",
                                   onclick: function () { onEnquire(o); } }));
    foot.appendChild(h("div", { class: "cap", text: payNoteFor(o, false) }));
  } else {
    foot.appendChild(h("button", { class: "btn ghost", text: o.cta, onclick: function () { onEnquire(o); } }));
  }
  card.appendChild(foot);
  return card;
}

screen("ai-operations", "ai-operations", "AI Operations", function () {
  put('<p class="eyebrow">Asch AI Operations</p>');
  put("<h1>Most companies do<br>not have an AI problem.<br>They have a<br>process problem</h1>");
  put('<p class="lede">Nearly every business we look at is running processes that were designed around ' +
      'a constraint that stopped existing. The work has never been re-examined, so people absorb it by ' +
      'hand. Automating that is the wrong move: you get the bad version, running faster. We find the ' +
      'work that is costing you, cut what should not be there, and then automate what is left.</p>');

  const scrollToForm = function (o) {
    sel._input.value = o.id;
    document.getElementById("aiops-form").scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(function () { nm2._input.focus(); }, 320);
  };

  put("<h2>Three steps, priced separately</h2>");
  put('<p class="lede">You are not asked to buy the big thing first. Each stage stands on its own and ' +
      'each one earns the next.</p>');

  const grid = h("div", { class: "offers" });
  grid.appendChild(offerCard(OFFERS.mini, scrollToForm));
  grid.appendChild(offerCard(OFFERS.assessment, scrollToForm));
  put(grid);

  const grid2 = h("div", { class: "offers" });
  OFFERS.retainers.forEach(function (r) { grid2.appendChild(offerCard(r, scrollToForm)); });
  put(grid2);

  put(ART.frame("What the assessment hands you",
    ART.impactEffort(),
    "Every opportunity we find, placed on impact against effort. The highlighted " +
    "quadrant is where we start, and it is usually a tool you can adopt rather than " +
    "anything that needs building."));

  put("<h2>How the work actually runs</h2>");
  put('<p class="lede">Same loop, every session. It is deliberately boring, and the order is the part ' +
      'that matters.</p>');
  const lg = h("div", { class: "loopgrid" });
  OFFERS.loop.forEach(function (s, i) {
    lg.appendChild(h("div", { class: "loopstep",
      style: i === 1 ? "border-left-color:var(--amber)" : i === 2 ? "border-left-color:var(--gain)" : "" }, [
      h("div", { class: "k", text: s.k }), h("div", { class: "v", text: s.v })
    ]));
  });
  put(lg);

  put(ART.frame("The middle panel is the argument",
    ART.processLoop(),
    "Automating fourteen steps when eleven would do buys you a faster version of the " +
    "wrong process, and it costs more to run and more to maintain."));

  put('<p class="mutednote">The middle step is the one that gets skipped everywhere else, and it is ' +
      'where most of the return is. A fourteen step process that only needs eleven does not need AI ' +
      'applied to fourteen steps.</p>');

  put("<h2>Who this works for</h2>");
  put(h("div", { class: "fitgrid" }, [
    (function () {
      const d = h("div", { class: "fitcol yes" }, [h("div", { class: "fh2", text: "A fit" })]);
      const ul = h("ul"); OFFERS.fit.yes.forEach(function (t) { ul.appendChild(h("li", { text: t })); });
      d.appendChild(ul); return d;
    })(),
    (function () {
      const d = h("div", { class: "fitcol no" }, [h("div", { class: "fh2", text: "Not a fit" })]);
      const ul = h("ul"); OFFERS.fit.no.forEach(function (t) { ul.appendChild(h("li", { text: t })); });
      d.appendChild(ul); return d;
    })()
  ]));

  put("<h2>The boundaries, published</h2>");
  put('<p class="lede">These exist because an engagement without them stops being deliverable, and the ' +
      'client is the one who pays for that.</p>');
  const sl = h("ol", { class: "steps" });
  OFFERS.scope.forEach(function (t) { sl.appendChild(h("li", { text: t })); });
  put(sl);

  /* ---- enquiry form ---- */
  const nm2 = req(field({ name: "name", label: "Name", auto: "name" }));
  const em2 = req(field({ name: "email", label: "Email", type: "email", auto: "email" }));
  const co  = req(field({ name: "company", label: "Company", auto: "organization" }));
  const sz  = field({ name: "size", label: "Roughly how big", type: "select", options: [
    { v: "u1", l: "Under $1M revenue" }, { v: "1-3", l: "$1M to $3M" }, { v: "3-10", l: "$3M to $10M" },
    { v: "10-50", l: "$10M to $50M" }, { v: "50+", l: "Over $50M" }
  ]});
  const sel = field({ name: "interest", label: "What you want", type: "select", options: [
    { v: "mini",       l: OFFERS.mini.name + " (no charge)" },
    { v: "assessment", l: OFFERS.assessment.name + " (" + OFFERS.assessment.priceLabel + ")" }
  ].concat(OFFERS.retainers.map(function (r) {
    return { v: r.id, l: r.name + " (" + r.priceLabel + " " + r.priceNote + ")" };
  }))});
  const bn  = req(field({ name: "bottleneck", label: "The process that is costing you most", type: "textarea", rows: 3,
    ph: "What it is, roughly how many hours a week it eats, and who does it.",
    hint: "One sentence is enough. This is the thing we open with on the call." }));

  const form = buildForm({
    heading: "Start with the fifteen minutes",
    url: OFFERS_ENDPOINT,
    mailSubject: "AI Operations enquiry",
    fields: [nm2, em2, co, sz, sel, bn],
    rows: [[nm2, em2], [co, sz], [sel], [bn]],
    label: "Send it",
    done: "Received. We reply with two or three times inside one business day.",
    note: "No sequence, no newsletter, no list. One reply from a person."
  });
  form.id = "aiops-form";
  put(form);
});

/* =====================================================================
   4. TRADING DNA
   ---------------------------------------------------------------------
   Manual upload in, manual analysis out. The intake is a real product
   surface; the analysis behind it is us running the file through the
   internal trading intelligence build by hand and sending the report
   back. Nothing about this page claims it is automatic, because it is
   not, and the turnaround stated is the honest one.

   Note for the build: this is intake only. It never places, modifies or
   cancels an order, it holds no broker credential, and it connects to
   no broker API. It reads a file a person chose to send us. That keeps
   it clear of the trading read-only locks in CLAUDE.md by never being
   near them.
   ===================================================================== */

screen("trading-dna", "trading-dna", "Trading DNA", function () {
  put('<p class="eyebrow">Trading DNA</p>');
  put("<h1>Send us your fills.<br>We will tell you<br>what you actually are</h1>");
  put('<p class="lede">Most traders know their P&L and almost nothing else about themselves. Whether the ' +
      'edge is in entry or exit. Whether size tracks conviction or mood. Which hour of the day quietly ' +
      'costs them every year. That is all sitting in the trade history and almost nobody reads it. Send ' +
      'us the export and we will run it through the same analysis we run on ourselves.</p>');

  put(ART.frame("Six markers, read off your fills",
    ART.helix(),
    "Entry against exit. Size discipline. Hold asymmetry. Time and day signature. " +
    "Streak behaviour. Concentration."));

  put("<h2>What comes back</h2>");
  put('<div class="cols3">' +
    '<div><div class="ch">Performance</div><ul>' +
    '<li>Returns and drawdown, computed from the fills rather than from the account summary</li>' +
    '<li>Win rate against average win and average loss, which is the pair that actually matters</li>' +
    '<li>Expectancy per trade, and how many trades the result depends on</li>' +
    '<li>How much of the total came from the best five days, and what is left without them</li>' +
    "</ul></div>" +
    '<div><div class="ch">The DNA markers</div><ul>' +
    '<li><b>Entry against exit.</b> Which half of the trade your edge lives in. Most people are wrong about this.</li>' +
    '<li><b>Size discipline.</b> Whether position size tracks the setup or tracks the last result.</li>' +
    '<li><b>Hold asymmetry.</b> How long you hold winners against losers, which is the single most diagnostic number in the file.</li>' +
    '<li><b>Time and day signature.</b> Where your money is made and where it leaks.</li>' +
    '<li><b>Streak behaviour.</b> What you do differently after three losses, measured rather than remembered.</li>' +
    '<li><b>Concentration.</b> How much of the record is one instrument, one factor, or one week.</li>' +
    "</ul></div>" +
    '<div><div class="ch">What we will say</div><ul>' +
    '<li>The two markers costing you most, in order</li>' +
    '<li>Whether the sample is long enough to conclude anything, stated plainly if it is not</li>' +
    '<li>What we would change first, and what we would leave alone</li>' +
    '<li>Which parts of the result look like edge and which look like exposure</li>' +
    "</ul></div></div>");

  put(ART.frame("Hold asymmetry, the one most people get wrong",
    ART.holdAsymmetry(),
    "Almost everyone believes they cut losers quickly. The fills usually disagree, " +
    "and the size of the disagreement is the most useful single number we hand back."));

  put('<div class="callout"><b>How this actually works right now</b>' +
      'A person runs your file through our system and writes the report. It is not instant and it is not ' +
      'automated, and we would rather say so than dress up a queue as a product. Turnaround is three to ' +
      'five business days. We will tell you if your file is too thin to conclude anything from, and if it ' +
      'is, we will say that instead of producing a report anyway.</div>');

  put("<h2>What to send</h2>");
  put('<ol class="steps">' +
    "<li>Export your trade history from your broker or platform. Most of them have this under an account, " +
    "history, or reports tab. We want the fill level export, not the monthly statement.</li>" +
    "<li>We can read CSV, XLSX, and JSON. If your platform only gives you a PDF, send that and we will " +
    "tell you whether we can get what we need out of it.</li>" +
    "<li>The columns we need are date and time, instrument, side, quantity, and price. Fees and order " +
    "type help. Anything else is a bonus.</li>" +
    "<li>Leave your account number and personal details out of it. We do not need them and we would " +
    "rather not have them.</li>" +
    "</ol>");

  const nm3 = req(field({ name: "name", label: "Name", auto: "name" }));
  const em3 = req(field({ name: "email", label: "Email", type: "email", auto: "email" }));
  const mk  = field({ name: "markets", label: "What you trade", type: "select", options: [
    { v: "equities", l: "Equities" }, { v: "options", l: "Options" }, { v: "futures", l: "Futures" },
    { v: "fx", l: "FX" }, { v: "crypto", l: "Crypto" }, { v: "mixed", l: "A mix" }
  ]});
  const pf  = field({ name: "platform", label: "Broker or platform", ph: "Schwab, IBKR, Tradier, Tradovate" });
  const pd  = field({ name: "period", label: "Period covered", type: "select", options: [
    { v: "u6", l: "Under 6 months" }, { v: "6-12", l: "6 to 12 months" },
    { v: "1-2", l: "1 to 2 years" }, { v: "2+", l: "More than 2 years" }
  ]});
  const fl  = req(filePicker({ label: "Your trade history", maxMB: 25, multiple: true,
    accept: ".csv,.xlsx,.xls,.json,.txt,.pdf",
    accepthint: "CSV, XLSX, JSON or PDF. Up to 25 MB each, several files are fine.",
    hint: "Fill level export. If you have several accounts or several years in separate files, send them all." }), "history");
  const q   = field({ name: "question", label: "Anything you already suspect", type: "textarea", rows: 3,
    ph: "I think I cut winners too early but I have never checked.",
    hint: "If you have a hypothesis we will test it specifically and tell you whether the file supports it." });

  put(buildForm({
    heading: "Send your history",
    url: "/api/trading-dna",
    mailSubject: "Trading DNA submission",
    fields: [nm3, em3, mk, pf, pd, fl, q],
    rows: [[nm3, em3], [mk, pf], [pd], [fl], [q]],
    label: "Send it",
    done: "Received. Your report comes back to the address above inside three to five business days.",
    note: "Your file is used to produce your report and for nothing else. We do not sell it, we do not " +
          "pool it into anything, and we do not trade on it. Ask us to delete it at any point and we will."
  }));

  put('<p class="mutednote" style="margin-top:26px">A Trading DNA report is an analysis of a record you ' +
      'chose to send us. It is not investment advice, not a recommendation to buy or sell anything, and ' +
      'not a prediction. We never see your broker credentials, we never connect to your account, and we ' +
      'cannot place a trade on your behalf. Past performance does not predict future results.</p>');
});

/* =====================================================================
   Registration
   ===================================================================== */
const NEW_SCREENS = [
  { id: "prometheus",    label: "Prometheus" },
  { id: "recruiting",    label: "Recruiting" },
  { id: "ai-operations", label: "AI Operations" },
  { id: "trading-dna",   label: "Trading DNA" }
];

/* Appended, so the new chips sit to the right of everything already in
   the strip and nothing existing moves. */
NEW_SCREENS.forEach(function (s) {
  if (!SCREENS.some(function (x) { return x.id === s.id; })) SCREENS.push(s);
});

/* The strip is built when index.json resolves. If that already happened
   (a warm cache beats these script tags), rebuild it so the new chips
   are not missing, and re-highlight. */
if (typeof buildStrip === "function") {
  const strip = document.getElementById("strip");
  if (strip && strip.children.length) {
    buildStrip();
    const cur = (location.hash.slice(2) || "index");
    const chip = LABS.chipFor(cur);
    [].forEach.call(strip.children, function (c) { c.classList.toggle("on", c.dataset.id === chip); });
  }
}

/* Someone can land straight on #/prometheus. The page's own boot only
   calls route() once index.json resolves, and these screens do not need
   it, so render now rather than sitting behind a 1.7 MB fetch. */
const landing = location.hash.slice(2);
if (landing && LABS.has(landing) && typeof route === "function") route(landing);

})();
