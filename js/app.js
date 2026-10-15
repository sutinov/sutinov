/* ==========================================================================
   App controller — header, 3D stage, sheet dialogs, mobile controls.
   ========================================================================== */
(function () {
  'use strict';

  var CV = window.CV;
  var ZONES = CV.zones;
  var KEYS = ZONES.map(function (z) { return z.key; });
  var BY_KEY = {};
  ZONES.forEach(function (z) { BY_KEY[z.key] = z; });

  var FOCUS_MS = 520;   // camera flies in, then sheet unfolds
  var TRAVEL_MS = 1300; // prev/next: fold, fly, unfold
  var CLOSE_MS = 760;
  var MOBILE_Q = '(max-width: 820px), (max-height: 560px)';

  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var sec = function (n) { return n.toFixed(2) + 's'; };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* ---------------------------------------------------------------- DOM */
  var root = $('#app');
  var wrap = $('.bp-wrap');
  var stage = $('.bp-stage');
  var canvas = $('.bp-gl');
  var spinner = $('.bp-spinner');

  $('.bp-h1').textContent = CV.profile.name;
  $('.bp-role-text').textContent = CV.profile.role;
  document.title = CV.profile.name + ' \u2014 Blueprint CV';

  // mobile nav + screen-reader buttons
  var mnav = $('.bp-mnav');
  var sr = $('.bp-sr');
  ZONES.forEach(function (z, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'bp-mbtn';
    b.innerHTML = '<span class="n">' + pad(i + 1) + '</span><span class="l">' + esc(z.short) + '</span><span class="ab">' + esc(z.abbr) + '</span>';
    b.addEventListener('click', function () { focus(z.key); });
    mnav.appendChild(b);

    var s = document.createElement('button');
    s.type = 'button';
    s.textContent = 'Open ' + z.title;
    s.addEventListener('focus', function () { hoverKey = z.key; syncHover(); });
    s.addEventListener('blur', function () { hoverKey = null; syncHover(); });
    s.addEventListener('click', function (e) { e.stopPropagation(); focus(z.key); });
    sr.appendChild(s);
  });

  /* -------------------------------------------------------------- state */
  var state = { open: null, reading: false, closing: false };
  var timer = 0;
  var scene = null;
  var sceneReady = false;
  var hoverKey = null;

  function setState(patch) {
    for (var k in patch) state[k] = patch[k];
    render();
  }
  function later(fn, ms) { clearTimeout(timer); timer = setTimeout(fn, ms); }
  function closeThen(fn) {
    clearTimeout(timer);
    if (state.reading) { setState({ closing: true }); later(fn, CLOSE_MS); }
    else fn();
  }
  function focus(key) {
    if (state.open !== null && state.reading) { setState({ open: key }); return; }
    setState({ open: key, reading: false, closing: false });
    later(function () { setState({ reading: true }); }, FOCUS_MS);
  }
  function close() {
    if (state.closing || state.open === null) return;
    closeThen(function () { setState({ open: null, reading: false, closing: false }); });
  }
  function travel(key) {
    if (state.closing) return;
    closeThen(function () {
      setState({ open: key, reading: false, closing: false });
      later(function () { setState({ reading: true }); }, TRAVEL_MS);
    });
  }
  function neighbours() {
    var i = state.open ? KEYS.indexOf(state.open) : 0;
    return {
      index: i,
      prev: KEYS[(i + KEYS.length - 1) % KEYS.length],
      next: KEYS[(i + 1) % KEYS.length]
    };
  }

  /* Camera framing for a focused zone (board units are 900 x 600). */
  function framing(rect) {
    if (!rect) return { scale: 1, cx: 0, cy: 0, zoom: '1.0' };
    var w = stage.offsetWidth || 1200, h = stage.offsetHeight || 640;
    var fitH = h * 0.62 / rect.h;
    var a = Math.min(w * 0.66 / rect.w, fitH);
    var b = Math.min(1.8, w * 0.94 / rect.w, fitH);
    var s = Math.max(1, Math.min(Math.max(a, b), 4.2));
    return { scale: s, cx: rect.x + rect.w / 2 - 450, cy: rect.y + rect.h / 2 - 300, zoom: s.toFixed(1) };
  }

  /* ------------------------------------------------------------- render */
  var reticleKey = null, reticleEl = null;
  var sheetKey = null, sheetEl = null;

  function render() {
    root.className = ['bp-root', state.open && 'bp-focus', state.open && state.reading && 'bp-reading', state.closing && 'bp-closing', !scene && sceneFailed && 'bp-nogl']
      .filter(Boolean).join(' ');
    if (state.reading) wrap.setAttribute('aria-hidden', 'true'); else wrap.removeAttribute('aria-hidden');

    var zone = state.open ? BY_KEY[state.open] : null;
    var f = framing(zone ? zone.rect : null);
    if (scene) {
      scene.setCamera(zone ? f : null);
      scene.setActive(state.open);
    }
    syncHover();

    // focus reticle (re-created per zone so its animation replays)
    if ((zone ? zone.key : null) !== reticleKey) {
      if (reticleEl) reticleEl.remove();
      reticleEl = null;
      reticleKey = zone ? zone.key : null;
      if (zone) {
        reticleEl = document.createElement('div');
        reticleEl.className = 'bp-reticle';
        reticleEl.setAttribute('aria-hidden', 'true');
        reticleEl.innerHTML = '<span class="rc tl"></span><span class="rc tr"></span><span class="rc bl"></span><span class="rc br"></span><span class="cross"></span>' +
          '<span class="ro">FOCUS \u25b8 ' + esc(zone.short) + ' \u00b7 LOUPE \u00d7' + f.zoom + '</span>';
        root.appendChild(reticleEl);
      }
    }

    // sheet dialog
    var want = zone && state.reading ? zone.key : null;
    if (want !== sheetKey) {
      if (sheetEl) sheetEl.remove();
      sheetEl = null;
      sheetKey = want;
      if (want) {
        sheetEl = buildSheet(zone);
        root.appendChild(sheetEl);
        var body = $('.bp-body', sheetEl);
        if (body) body.scrollTop = 0;
        var btn = $('.bp-close', sheetEl);
        if (btn) btn.focus({ preventScroll: true });
      }
    }
  }

  function syncHover() {
    if (scene) scene.setHover(state.open ? null : hoverKey);
    stage.style.cursor = hoverKey && !state.open ? 'pointer' : '';
  }

  /* ------------------------------------------------------------- sheets */
  function buildSheet(zone) {
    var n = neighbours();
    var prev = BY_KEY[n.prev], next = BY_KEY[n.next];
    var el = document.createElement('div');
    el.className = 'bp-ov';
    el.innerHTML =
      '<button type="button" class="bp-scrim" aria-label="Close sheet" tabindex="-1"></button>' +
      '<div role="dialog" aria-modal="true" aria-label="' + esc(zone.title) + '" class="bp-dlg">' +
        '<span class="dlg-sweep down"></span><span class="dlg-sweep up"></span>' +
        '<span class="dlg-corner tl"></span><span class="dlg-corner tr"></span><span class="dlg-corner bl"></span><span class="dlg-corner br"></span>' +
        '<div class="bp-bar">' +
          '<h2 class="bp-bartitle"><span class="dot-live"></span>' + esc(zone.title) + '</h2>' +
          '<button type="button" class="bp-btn bp-navbtn strong bp-close">' +
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13"/></svg>BACK TO PLAN' +
          '</button>' +
        '</div>' +
        '<div class="bp-body">' + SHEETS[zone.key]() + '</div>' +
        '<div class="bp-foot">' +
          '<button type="button" class="bp-btn bp-navbtn bp-prev">\u2190 ' + esc(prev.short) + '</button>' +
          '<span class="bp-count">SHEET ' + pad(n.index + 1) + ' OF ' + pad(ZONES.length) + '</span>' +
          '<button type="button" class="bp-btn bp-navbtn bp-next">' + esc(next.short) + ' \u2192</button>' +
        '</div>' +
      '</div>';
    $('.bp-scrim', el).addEventListener('click', close);
    $('.bp-close', el).addEventListener('click', close);
    $('.bp-prev', el).addEventListener('click', function () { travel(n.prev); });
    $('.bp-next', el).addEventListener('click', function () { travel(n.next); });
    var copy = $('.contact-copy', el);
    if (copy) copy.addEventListener('click', onCopy);
    return el;
  }

  function chips(items, cls, base, step) {
    return '<div class="chips">' + items.map(function (t, i) {
      var style = base != null ? ' style="animation-delay:' + sec(base + i * step) + '"' : '';
      return '<span class="chip' + (cls ? ' ' + cls : '') + '"' + style + '>' + esc(t) + '</span>';
    }).join('') + '</div>';
  }

  function facts(list, cls, base) {
    return '<dl class="' + cls + '">' + list.map(function (f, i) {
      return '<div class="fact" style="animation-delay:' + sec(base + i * 0.1) + '"><dt class="fact-k">' + esc(f.k) + '</dt><dd class="fact-v">' + esc(f.v) + '</dd></div>';
    }).join('') + '</dl>';
  }

  var HATCH = [
    'repeating-linear-gradient(45deg, #C9DDF5 0 1px, transparent 1px 6px)',
    'repeating-linear-gradient(-45deg, #C9DDF5 0 1px, transparent 1px 6px)',
    'repeating-linear-gradient(0deg, #C9DDF5 0 1px, transparent 1px 6px)',
    'radial-gradient(#C9DDF5 1px, transparent 1.5px)',
    'repeating-linear-gradient(90deg, #C9DDF5 0 1px, transparent 1px 6px)'
  ];

  var SHEETS = {
    about: function () {
      var p = CV.profile;
      return '<div class="about">' +
        '<div class="about-text">' +
          '<p class="about-lead rise" style="animation-delay:' + sec(1.15) + '">' + esc(p.intro) + '</p>' +
          '<p class="about-bio rise" style="animation-delay:' + sec(1.25) + '">' + esc(p.bio) + '</p>' +
          '<div class="about-links rise" style="animation-delay:' + sec(1.35) + '">' +
            '<a class="bp-btn ghost-link" href="' + esc(p.linkedin) + '" target="_blank" rel="noopener noreferrer">LINKEDIN \u2197</a>' +
            '<a class="bp-btn ghost-link" href="' + esc(p.cvFile) + '" target="_blank" rel="noopener">DOWNLOAD CV \u2193</a>' +
          '</div>' +
          '<div class="about-langs rise" style="animation-delay:' + sec(1.45) + '">' +
            '<div class="kicker">SPOKEN LANGUAGES</div>' + chips(p.languages, '', 1.55, 0.06) +
          '</div>' +
        '</div>' +
        facts(p.facts, 'about-facts', 1.2) +
      '</div>';
    },

    experience: function () {
      return '<div class="roles">' + CV.experience.map(function (r, i) {
        return '<article class="bp-card panel role-card" style="animation-delay:' + sec(1.1 + i * 0.32) + '">' +
          '<h3 class="role-title">' + esc(r.role) + ' <span class="role-company">@ ' + esc(r.company) + '</span></h3>' +
          '<div class="role-dates">' + esc(r.dates) + '</div>' +
          '<ul class="role-points">' + r.points.map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>' +
          chips(r.tags, 'dashed') +
        '</article>';
      }).join('') + '</div>';
    },

    projects: function () {
      return '<div class="projects">' + CV.projects.map(function (p, i) {
        var d = 1.3 + i * 0.15;
        return '<article class="bp-card panel project-card" style="animation-delay:' + sec(1.15 + i * 0.15) + '">' +
          '<div class="skill-head"><span class="kicker">PRJ-' + pad(i + 1) + ' \u00b7 ' + esc(p.kind) + '</span>' +
          '<span class="skill-hatch" style="background-image:' + HATCH[(i + 1) % HATCH.length] + '"></span></div>' +
          '<h3 class="project-name">' + esc(p.name) + '</h3>' +
          '<div class="skill-bar" style="animation-delay:' + sec(d) + '"></div>' +
          '<p class="project-desc">' + esc(p.desc) + '</p>' +
          '<div class="kicker">STACK</div>' +
          chips(p.stack, '', d + 0.2, 0.05) +
        '</article>';
      }).join('') + '</div>';
    },

    education: function () {
      var e = CV.education;
      return '<div class="edu">' +
        '<div class="edu-col">' + e.degrees.map(function (d, i) {
          return '<article class="bp-card panel edu-card" style="animation-delay:' + sec(1.15 + i * 0.2) + '">' +
            '<div class="edu-stamp" style="animation-delay:' + sec(1.9 + i * 0.2) + '">GRADUATED</div>' +
            '<div class="edu-meta">' + esc(d.degree.toUpperCase()) + '</div>' +
            '<h3 class="edu-title">' + esc(d.field) + '</h3>' +
            '<div class="edu-rule" style="animation-delay:' + sec(1.4 + i * 0.2) + '"></div>' +
            '<div class="edu-degree">' + esc(e.institution) + '</div>' +
          '</article>';
        }).join('') + '</div>' +
        facts(e.facts, 'edu-facts', 1.25) +
      '</div>';
    },

    skills: function () {
      return '<div class="skills">' + CV.skills.map(function (g, i) {
        var d = 1.3 + i * 0.12;
        return '<div class="bp-card panel skill-card" style="animation-delay:' + sec(1.15 + i * 0.1) + '">' +
          '<div class="skill-head"><span class="kicker">MAT-' + pad(i + 1) + ' \u00b7 ' + g.items.length + ' ITEMS</span>' +
          '<span class="skill-hatch" style="background-image:' + HATCH[i % HATCH.length] + '"></span></div>' +
          '<div class="skill-name">' + esc(g.name) + '</div>' +
          '<div class="skill-bar" style="animation-delay:' + sec(d) + '"></div>' +
          chips(g.items, '', d + 0.2, 0.05) +
        '</div>';
      }).join('') + '</div>';
    },

    contact: function () {
      var p = CV.profile;
      var links = [
        { k: 'LINKEDIN', v: '/blagoj-sutinov', href: p.linkedin, ext: true },
        { k: 'PHONE', v: p.phone, href: p.phoneHref, ext: false },
        { k: 'CV', v: 'Download PDF', href: p.cvFile, ext: true }
      ];
      return '<div class="contact">' +
        '<div class="contact-cta">' +
          '<p class="contact-line">Like what you see?<br>Get in touch.</p>' +
          '<p class="contact-sub">Open to Java, Spring Boot and Angular roles or an interesting project. Email is the quickest way to reach me.</p>' +
          '<div class="rise contact-mailbox" style="animation-delay:' + sec(1.3) + '">' +
            '<a class="contact-mail" href="mailto:' + esc(p.email) + '">' + esc(p.email) + ' \u2192</a>' +
            '<div class="contact-copyrow">' +
              '<button type="button" class="bp-btn contact-copy">' +
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="9" height="9"/><path d="M10.5 5.5v-4h-9v9h4"/></svg>COPY EMAIL' +
              '</button>' +
              '<span class="contact-copied-slot" role="status" aria-live="polite"></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="contact-links">' + links.map(function (l, i) {
          return '<a class="bp-btn contact-link" href="' + esc(l.href) + '"' + (l.ext ? ' target="_blank" rel="noopener noreferrer"' : '') +
            ' style="animation-delay:' + sec(1.5 + i * 0.15) + ', ' + sec(1.7 + i * 0.15) + '">' +
            '<span class="k">' + esc(l.k) + '</span><span>' + esc(l.v) + ' \u2197</span></a>';
        }).join('') +
          '<div class="contact-based"><span>BASED IN</span><span>' + esc(p.location) + '</span></div>' +
        '</div>' +
      '</div>';
    }
  };

  var copiedTimer = 0;
  function onCopy() {
    var email = CV.profile.email;
    var done = function (ok) {
      if (!ok) return;
      var slot = $('.contact-copied-slot');
      if (!slot) return;
      slot.innerHTML = '<span class="contact-copied">\u2713 COPIED</span>';
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(function () { slot.innerHTML = ''; }, 1900);
    };
    var fallback = function () {
      var t = document.createElement('textarea');
      t.value = email; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      t.remove();
      return ok;
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(function () { done(true); }, function () { done(fallback()); });
    } else {
      done(fallback());
    }
  }

  /* ----------------------------------------------------------- keyboard */
  window.addEventListener('keydown', function (e) {
    if (!state.open) return;
    var n = neighbours();
    if (e.key === 'Escape') close();
    else if (state.reading && e.key === 'ArrowLeft') travel(n.prev);
    else if (state.reading && e.key === 'ArrowRight') travel(n.next);
  });

  /* --------------------------------------------- pan / zoom (mobile view) */
  var mq = window.matchMedia(MOBILE_Q);
  var view = { x: 0, y: 0, zoom: 1 };
  var viewLive = false;
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  function setView(v, live) {
    var z = clamp(v.zoom, 1, 3);
    var mx = 300 + (z - 1) * 450, my = 200 + (z - 1) * 300;
    view = { x: clamp(v.x, -mx, mx), y: clamp(v.y, -my, my), zoom: z };
    viewLive = !!live;
    if (scene) scene.setView(view, viewLive);
    zoomLabel.textContent = '\u00d7' + view.zoom.toFixed(1);
    slider.value = view.zoom;
    slider.setAttribute('aria-valuetext', '\u00d7' + view.zoom.toFixed(1));
    resetBtn.disabled = view.x === 0 && view.y === 0 && view.zoom === 1;
  }
  var zoomLabel = $('.bp-vlevel');
  var slider = $('.bp-vslider');
  var resetBtn = $('.bp-vbtn');
  var stick = $('.bp-vstick');
  var knob = $('.bp-vknob');

  slider.addEventListener('input', function () { setView({ x: view.x, y: view.y, zoom: Number(slider.value) }, true); });
  slider.addEventListener('change', function () { setView(view, false); });
  resetBtn.addEventListener('click', function () { setView({ x: 0, y: 0, zoom: 1 }, false); });

  // joystick
  var STICK_R = 30, stickVec = { x: 0, y: 0 }, stickRaf = 0, stickHeld = false;
  function stickMove(e) {
    var r = stick.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    var k = Math.min(1, STICK_R / (Math.hypot(dx, dy) || 1));
    knob.style.transform = 'translate(' + (dx * k).toFixed(1) + 'px, ' + (dy * k).toFixed(1) + 'px)';
    stickVec = { x: dx * k / STICK_R, y: dy * k / STICK_R };
  }
  stick.addEventListener('pointerdown', function (e) {
    if (!e.isPrimary) return;
    stick.setPointerCapture(e.pointerId);
    stickHeld = true;
    stick.classList.add('held');
    stickMove(e);
    var last = performance.now();
    var tick = function (now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (stickVec.x || stickVec.y) {
        var speed = 420 * view.zoom;
        setView({ x: view.x - stickVec.x * speed * dt, y: view.y - stickVec.y * speed * dt, zoom: view.zoom }, true);
      }
      stickRaf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(stickRaf);
    stickRaf = requestAnimationFrame(tick);
  });
  stick.addEventListener('pointermove', function (e) { if (stickHeld && e.isPrimary) stickMove(e); });
  var stickUp = function () {
    if (!stickHeld) return;
    stickHeld = false;
    cancelAnimationFrame(stickRaf);
    stickVec = { x: 0, y: 0 };
    knob.style.transform = '';
    stick.classList.remove('held');
    setView(view, false);
  };
  stick.addEventListener('pointerup', stickUp);
  stick.addEventListener('pointercancel', stickUp);
  stick.addEventListener('keydown', function (e) {
    var dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    var d = dirs[e.key];
    if (!d) return;
    e.preventDefault();
    setView({ x: view.x - d[0] * 40, y: view.y - d[1] * 40, zoom: view.zoom }, false);
  });

  /* ------------------------------------------------------- stage input */
  var drag = null;
  function stageScale() { return stage.getBoundingClientRect().width / (stage.offsetWidth || 1) || 1; }
  function pick(cx, cy) {
    if (!scene || !sceneReady) return null;
    var r = canvas.getBoundingClientRect();
    return scene.pick(((cx - r.left) / r.width) * 2 - 1, 1 - ((cy - r.top) / r.height) * 2);
  }
  stage.addEventListener('pointerdown', function (e) {
    if (!mq.matches || state.open || !e.isPrimary) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  });
  stage.addEventListener('pointermove', function (e) {
    if (drag && e.pointerId === drag.id) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; stage.setPointerCapture(e.pointerId); }
      if (drag.moved) {
        var s = stageScale();
        setView({ x: drag.vx + dx / s, y: drag.vy + dy / s, zoom: view.zoom }, true);
      }
    }
    if (e.pointerType === 'mouse') {
      var k = pick(e.clientX, e.clientY);
      if (k !== hoverKey) { hoverKey = k; syncHover(); }
    }
  });
  var endDrag = function () {
    if (drag && drag.moved) { setView(view, false); stage.dataset.dragged = '1'; }
    drag = null;
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', function () { if (hoverKey) { hoverKey = null; syncHover(); } });
  stage.addEventListener('click', function (e) {
    if (stage.dataset.dragged) { delete stage.dataset.dragged; return; }
    var k = pick(e.clientX, e.clientY);
    if (k) focus(k);
  });

  /* ------------------------------------------------------ scene bootstrap */
  var sceneFailed = false;

  function layoutScene() {
    if (!scene) return;
    var r = stage.getBoundingClientRect();
    var s = r.width / (stage.offsetWidth || 1) || 1;
    var extra = Math.max(0, r.top / s);
    canvas.style.top = -extra + 'px';
    canvas.style.height = stage.offsetHeight + extra + 'px';
    scene.setLayout({
      width: stage.offsetWidth,
      height: stage.offsetHeight,
      extraTop: extra,
      lift: (parseFloat(getComputedStyle(stage).paddingBottom) || 0) / 2,
      pixelRatio: Math.min(3, Math.max(1.5, window.devicePixelRatio * s))
    });
    scene.setViewport(window.innerWidth, window.innerHeight);
    if (state.open) scene.setCamera(framing(BY_KEY[state.open].rect));
  }

  function fail(err) {
    if (err) console.warn('Blueprint 3D unavailable:', err);
    sceneFailed = true;
    scene = null;
    spinner.remove();
    var msg = document.createElement('div');
    msg.className = 'bp-fallback';
    msg.innerHTML = '<span class="kicker">3D PLAN UNAVAILABLE</span><span>Use the sheet buttons below to browse the CV.</span>';
    stage.appendChild(msg);
    render();
  }

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  function initScene(threeMod, linesMod) {
    var Scene = window.createBlueprintScene(threeMod, linesMod);
    scene = new Scene(canvas, ZONES, CV.profile.site, function () {
      sceneReady = true;
      canvas.classList.add('ready');
      spinner.remove();
    });
    layoutScene();
    new ResizeObserver(layoutScene).observe(stage);
    window.addEventListener('resize', layoutScene);
    setView(view, false);
    render();
  }

  if (!webglOK()) {
    fail('WebGL not supported');
  } else if (window.THREE && window.THREE_LINES) {
    // Fast path: loaded offline from local bundle
    initScene(window.THREE, window.THREE_LINES);
  } else {
    // Dynamic import fallback (CDN / ES modules)
    Promise.all([
      import('three'),
      import('three/addons/lines/LineSegments2.js'),
      import('three/addons/lines/LineSegmentsGeometry.js'),
      import('three/addons/lines/LineMaterial.js')
    ]).then(function (mods) {
      initScene(mods[0], {
        LineSegments2: mods[1].LineSegments2,
        LineSegmentsGeometry: mods[2].LineSegmentsGeometry,
        LineMaterial: mods[3].LineMaterial
      });
    }).catch(fail);
  }

  setView(view, false);
  render();
})();
