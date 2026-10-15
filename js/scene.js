/* ==========================================================================
   Blueprint 3D scene — a tilted 900x600 "website plan" with zones that rise
   on hover, float a hologram tooltip, and fly the camera in on click.
   Exposes window.createBlueprintScene(THREE, lines) -> BlueprintScene class.
   ========================================================================== */
(function () {
  'use strict';

  var C = {
    navy800: '#10264a',
    blue600: '#1e4d8c',
    blue400: '#7fb2f0',
    blue200: '#c9ddf5',
    orange: '#ff7a3d',
    wallBack: '#16386a',
    wallWest: '#163f78'
  };
  var SANS = "'Space Grotesk', system-ui, sans-serif";
  var MONO = "'IBM Plex Mono', ui-monospace, monospace";
  var FONTS = ["10px 'IBM Plex Mono'", "600 13px 'IBM Plex Mono'", "700 21px 'Space Grotesk'", "13px 'Space Grotesk'"];

  var DEG = Math.PI / 180;
  var CAM_Z = 4000;
  var RISE = { a: 72, b: 52, c: 96 };
  var REST_H = 14;
  var INTRO = 1.8;
  var SWAY_PERIOD = 14;
  var CAM_DUR = 1.25;
  var UP_DUR = 0.6;
  var DOWN_DUR = 0.45;
  var TINT_DUR = 0.4;
  var WAVE_DUR = 1.4;
  var PX = 4; // canvas texture supersampling

  /* ---------- easing ---------- */
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var d = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(d) < 1e-6) break;
        t -= (((ax * t + bx) * t + cx) * t - x) / d;
      }
      return ((ay * t + by) * t + cy) * t;
    };
  }
  var easeOut = bezier(0.2, 0.8, 0.2, 1);
  var easeInOut = bezier(0.7, 0, 0.2, 1);
  var springy = bezier(0.2, 0.9, 0.25, 1.15);
  var soft = bezier(0.3, 0.7, 0.3, 1);
  var sine = bezier(0.42, 0, 0.58, 1);
  var ease = bezier(0.25, 0.1, 0.25, 1);

  function Tween(v) {
    this.from = v; this.to = v; this.start = 0; this.duration = 0; this.ease = ease;
  }
  Tween.prototype.at = function (t) {
    return this.duration <= 0 ? this.to : this.from + (this.to - this.from) * this.ease((t - this.start) / this.duration);
  };
  Tween.prototype.go = function (v, t, d, e) {
    if (v === this.to) return;
    this.from = this.at(t); this.to = v; this.start = t; this.duration = d; this.ease = e;
  };

  function keyframes(frames, t) {
    if (t <= frames[0][0]) return frames[0][1];
    for (var i = 1; i < frames.length; i++) {
      if (t <= frames[i][0]) {
        var a = frames[i - 1];
        return a[1] + (frames[i][1] - a[1]) * (t - a[0]) / (frames[i][0] - a[0]);
      }
    }
    return frames[frames.length - 1][1];
  }

  /* ---------- 2D canvas helpers ---------- */
  function makeCanvas(w, h, ratio) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * ratio));
    c.height = Math.max(1, Math.round(h * ratio));
    var ctx = c.getContext('2d');
    ctx.scale(c.width / w, c.height / h);
    return [c, ctx];
  }

  function spacing(ctx, em, size) {
    if ('letterSpacing' in ctx) ctx.letterSpacing = em * size + 'px';
  }

  function angledGradient(ctx, w, h, deg, stops) {
    var a = deg * DEG, sx = Math.sin(a), sy = -Math.cos(a);
    var r = (Math.abs(w * sx) + Math.abs(h * sy)) / 2;
    var g = ctx.createLinearGradient(w / 2 - sx * r, h / 2 - sy * r, w / 2 + sx * r, h / 2 + sy * r);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }

  /* Mini UI sketch painted on top of each zone. */
  function paintZoneDetails(ctx, w, h, key, label, hot) {
    var dim = hot ? 'rgba(242, 239, 230, 0.75)' : 'rgba(201, 221, 245, 0.45)';
    var faint = hot ? 'rgba(242, 239, 230, 0.4)' : 'rgba(201, 221, 245, 0.25)';
    var line = hot ? 'rgba(242, 239, 230, 0.8)' : 'rgba(201, 221, 245, 0.7)';
    var box = function (x, y, bw, bh, color) { ctx.fillStyle = color || dim; ctx.fillRect(x, y, bw, bh); };
    var X = 14;

    ctx.fillStyle = hot ? '#fff' : C.blue200;
    ctx.font = (hot ? 600 : 400) + ' 13px ' + MONO;
    spacing(ctx, 0.16, 13);
    ctx.fillText(label, X, key === 'contact' ? 35.4 : 26);
    spacing(ctx, 0, 0);

    switch (key) {
      case 'about':
        box(X, 37.3, 314, 14);
        box(X, 60.3, 233, 14);
        box(X, 83.3, 340, 7);
        box(X, 99.3, 287, 7);
        box(X, 121.3, 80, 18, C.orange);
        box(102, 121.3, 80, 18);
        // portrait placeholder
        ctx.strokeStyle = line;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(384.75, 37.75, 76, 101);
        ctx.beginPath();
        ctx.moveTo(384.75, 37.75); ctx.lineTo(460.75, 138.75);
        ctx.moveTo(460.75, 37.75); ctx.lineTo(384.75, 138.75);
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 'experience':
        box(21, 44, 1.5, 104, faint);
        [150, 120, 135, 110].forEach(function (bw, i) {
          var y = 46 + i * 34;
          ctx.lineWidth = 1.5;
          if (i === 0) {
            box(17, y - 4.5, 10, 10, C.orange);
          } else {
            box(17, y - 4.5, 10, 10, C.navy800);
            ctx.strokeStyle = line;
            ctx.strokeRect(17.75, y - 3.75, 8.5, 8.5);
          }
          box(38, y - 5, bw, 7, i === 0 ? C.orange : dim);
          box(38, y + 6, bw * 0.6, 5, faint);
          box(w - 64, y - 5, 42, 7, faint);
        });
        break;

      case 'projects':
        ctx.lineWidth = 1.5;
        for (var p = 0; p < 2; p++) {
          var px = 14.75 + p * 113, py = 38.75;
          if (p === 0) box(px, py, 104, 66, 'rgba(255, 122, 61, 0.3)');
          ctx.strokeStyle = p === 0 ? C.orange : line;
          ctx.strokeRect(px, py, 104, 66);
          box(px + 9, py + 10, 60, 7, p === 0 ? C.orange : dim);
          box(px + 9, py + 24, 82, 4, faint);
          box(px + 9, py + 32, 70, 4, faint);
          for (var k = 0; k < 3; k++) box(px + 9 + k * 27, py + 46, 22, 10, dim);
        }
        break;

      case 'education':
        box(X, 37.3, 200, 12);
        box(X, 57.3, 98, 3, C.orange);
        [46, 34, 52].forEach(function (cw, i) { box(X + [0, 54, 96][i], 68.3, cw, 11); });
        box(X, 88.3, 140, 7, faint);
        ctx.save();
        ctx.translate(200, 92);
        ctx.rotate(-8 * DEG);
        box(-30, -14, 60, 28, 'rgba(255, 122, 61, 0.14)');
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.strokeRect(-30, -14, 60, 28);
        box(-19, -2.5, 38, 5, C.orange);
        ctx.restore();
        break;

      case 'skills':
        [85, 70, 55, 40].forEach(function (pct, i) {
          var total = 212, y = 37.3 + i * 17;
          box(X, y, total * pct / 100, 7, C.orange);
          box(X + total * pct / 100, y, total * (100 - pct) / 100, 7, 'rgba(201, 221, 245, 0.3)');
        });
        break;

      case 'contact':
        box(X, 45.7, 220, 12);
        box(517, 29.5, 110, 22, C.orange);
        box(635, 29.5, 60, 22);
        box(703, 29.5, 60, 22);
        break;
    }
  }

  function paintZone(ctx, w, h, meta, hot) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = angledGradient(ctx, w, h, 135, hot
      ? [[0, '#2a5a9c'], [0.6, '#1f4a86'], [1, '#1a3f74']]
      : [[0, '#1c3e70'], [0.6, '#16325c'], [1, '#132b50']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hot ? 'rgba(255, 200, 170, 0.4)' : 'rgba(242, 239, 230, 0.28)';
    ctx.fillRect(1.5, 1.5, w - 3, 1);
    ctx.fillRect(1.5, 1.5, 1, h - 3);
    ctx.fillStyle = hot ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(1.5, h - 3.5, w - 3, 2);
    ctx.fillRect(w - 3.5, 1.5, 2, h - 3);
    ctx.save();
    ctx.translate(1.5, 1.5);
    paintZoneDetails(ctx, w, h, meta.key, meta.label, hot);
    ctx.restore();
    ctx.strokeStyle = hot ? C.orange : C.blue200;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
  }

  function paintWall(ctx, w, h, color, horizontal, hi, lo, alpha) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(201, 221, 245, ' + alpha + ')';
    if (horizontal) for (var y = 0; y < h; y += 18) ctx.fillRect(0, y, w, 1);
    else for (var x = 0; x < w; x += 18) ctx.fillRect(x, 0, 1, h);
    var g = horizontal ? ctx.createLinearGradient(0, 0, w, 0) : ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, 'rgba(255, 255, 255, ' + hi + ')');
    g.addColorStop(1, 'rgba(0, 0, 0, ' + lo + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function paintShadow(ctx, w, h, m, blur, color) {
    ctx.clearRect(0, 0, w + m * 2, h + m * 2);
    ctx.save();
    var off = 4096, k = ctx.getTransform().a;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur * k;
    ctx.shadowOffsetX = off * k;
    ctx.fillStyle = '#000';
    ctx.fillRect(m - off, m, w, h);
    ctx.restore();
  }

  /* The board: grid paper + dimension lines + a mock browser window. */
  function paintBoard(ctx, host, vw, vh) {
    ctx.fillStyle = C.navy800;
    ctx.fillRect(0, 0, 900, 600);
    ctx.save();
    ctx.translate(2, 2);
    var stroke = function (color, width, path) {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); path(); ctx.stroke();
    };
    var grid = function (step, alpha) {
      stroke('rgba(127, 178, 240, ' + alpha + ')', 1, function () {
        for (var x = 0.5; x < 896; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, 596); }
        for (var y = 0.5; y < 596; y += step) { ctx.moveTo(0, y); ctx.lineTo(896, y); }
      });
    };
    grid(20, 0.08);
    grid(100, 0.22);
    stroke(C.blue200, 2, function () { ctx.rect(-1, -1, 898, 598); });
    stroke(C.orange, 1, function () {
      var seg = function (a, b, c, d) { ctx.moveTo(a, b); ctx.lineTo(c, d); };
      seg(40, 581.5, 856, 581.5); seg(40.5, 576, 40.5, 587); seg(855.5, 576, 855.5, 587);
      seg(14.5, 40, 14.5, 556); seg(9, 40.5, 20, 40.5); seg(9, 555.5, 20, 555.5);
    });
    var dim = function (x, y, text, rot) {
      var w = text.length * 6.6 + 16;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = C.navy800;
      ctx.fillRect(-w / 2, -7, w, 14);
      ctx.fillStyle = C.orange;
      ctx.font = '11px ' + MONO;
      ctx.textAlign = 'center';
      ctx.fillText(text, 0, 4);
      ctx.restore();
    };
    dim(448, 571, vw + ' PX', 0);
    dim(18, 298, vh + ' PX', Math.PI / 2);

    ctx.fillStyle = 'rgba(11, 26, 51, 0.55)';
    ctx.fillRect(40, 40, 820, 520);
    stroke(C.blue200, 1.5, function () {
      ctx.rect(40.75, 40.75, 818.5, 518.5);
      ctx.moveTo(40, 73.25); ctx.lineTo(860, 73.25);
      [77, 95].forEach(function (x) { ctx.moveTo(x + 4.25, 56.25); ctx.arc(x, 56.25, 4.25, 0, Math.PI * 2); });
    });
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(59, 56.25, 5, 0, Math.PI * 2);
    ctx.fill();
    stroke('rgba(201, 221, 245, 0.6)', 1, function () { ctx.rect(126.5, 48.75, 319, 15); });
    ctx.fillStyle = C.blue400;
    ctx.font = '10px ' + MONO;
    ctx.fillText('https://' + host, 135, 59.7);
    ctx.setLineDash([3, 3]);
    stroke('rgba(201, 221, 245, 0.6)', 1, function () { ctx.rect(60.5, 88.5, 779, 29); });
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(201, 221, 245, 0.6)';
    ctx.fillRect(73, 99, 90, 8);
    ctx.fillStyle = 'rgba(201, 221, 245, 0.45)';
    for (var i = 0; i < 3; i++) ctx.fillRect(609 + i * 58, 100, 44, 6);
    ctx.fillStyle = C.orange;
    ctx.fillRect(783, 100, 44, 6);
    ctx.restore();
  }

  /* Hologram tooltip card. */
  function paintHoloCard(title, sub, ratio) {
    var m = document.createElement('canvas').getContext('2d');
    m.font = '600 11px ' + MONO; spacing(m, 0.2, 11);
    var w1 = m.measureText('\u2192 OPEN').width; spacing(m, 0, 0);
    m.font = '700 21px ' + SANS;
    var w2 = m.measureText(title).width;
    m.font = '13px ' + SANS;
    var w3 = m.measureText(sub).width;
    var W = Math.ceil(Math.max(w1, w2, w3)) + 36, H = 92, M = 26;
    var pair = makeCanvas(W + M * 2, H + M * 2, ratio), canvas = pair[0], ctx = pair[1];
    ctx.translate(M, M);
    ctx.save();
    ctx.shadowColor = 'rgba(80, 200, 255, 0.45)';
    ctx.shadowBlur = 22 * ratio;
    ctx.fillStyle = 'rgba(10, 44, 82, 0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.fillStyle = 'rgba(140, 230, 255, 0.13)';
    for (var y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(120, 220, 255, 0.16)');
    g.addColorStop(1, 'rgba(40, 140, 220, 0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(140, 230, 255, 0.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur = 8 * ratio;
    ctx.shadowColor = 'rgba(120, 225, 255, 0.8)';
    ctx.fillStyle = '#8fe6ff';
    ctx.font = '600 11px ' + MONO;
    spacing(ctx, 0.2, 11);
    ctx.fillText('\u2192 OPEN', 18, 24);
    spacing(ctx, 0, 0);
    ctx.shadowBlur = 14 * ratio;
    ctx.shadowColor = 'rgba(120, 225, 255, 0.75)';
    ctx.font = '700 21px ' + SANS;
    ctx.fillStyle = 'rgba(255, 90, 140, 0.55)'; ctx.fillText(title, 17, 50);
    ctx.fillStyle = 'rgba(90, 230, 255, 0.8)'; ctx.fillText(title, 19, 50);
    ctx.fillStyle = '#f0fdff'; ctx.fillText(title, 18, 50);
    ctx.shadowBlur = 6 * ratio;
    ctx.shadowColor = 'rgba(120, 225, 255, 0.6)';
    ctx.fillStyle = '#a9e9ff';
    ctx.font = '13px ' + SANS;
    ctx.fillText(sub, 18, 73);
    return { canvas: canvas, width: W, height: H, margin: M };
  }

  function paintBeam(ratio) {
    var pair = makeCanvas(190, 80, ratio), c = pair[0], ctx = pair[1];
    var g = ctx.createLinearGradient(0, 80, 0, 0);
    g.addColorStop(0, 'rgba(140, 230, 255, 0.55)');
    g.addColorStop(0.55, 'rgba(90, 200, 255, 0.18)');
    g.addColorStop(1, 'rgba(90, 200, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(190, 0); ctx.lineTo(100.7, 80); ctx.lineTo(89.3, 80);
    ctx.closePath();
    ctx.fill();
    return c;
  }

  function paintScan() {
    var pair = makeCanvas(4, 64, 1), c = pair[0], ctx = pair[1];
    var g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(160, 240, 255, 0)');
    g.addColorStop(0.5, 'rgba(160, 240, 255, 0.28)');
    g.addColorStop(1, 'rgba(160, 240, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 64);
    return c;
  }

  /* ======================================================================
     Factory — receives the THREE module and the fat-line addon classes.
     ====================================================================== */
  window.createBlueprintScene = function (T, L) {
    var ORANGE = new T.Color(C.orange);
    var POLY = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 };

    function BlueprintScene(canvas, zones, host, onReady) {
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera();
      this.raycaster = new T.Raycaster();
      this.zones = [];
      this.lines = [];
      this.disposables = [];
      this.painters = [];
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.host = host;
      this.t0 = performance.now();
      this.ready = false;
      this.viewport = { width: 0, height: 0 };
      this.layout = { width: 1200, height: 640, extraTop: 0, lift: 0, pixelRatio: 1 };
      this.camS = new Tween(1);
      this.camX = new Tween(0);
      this.camY = new Tween(0);
      this.camFlat = new Tween(0);
      this.swayGain = 1;
      this.view = { x: 0, y: 0, zoom: 1 };
      this.viewShown = { x: 0, y: 0, zoom: 1 };
      this.viewLive = false;
      this.active = null;
      this.hover = null;
      this.lastTime = 0;
      this.frameId = 0;
      this.disposed = false;

      this.renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.setClearColor(0x000000, 0);

      // transform chain: camera moves are parents of the intro tilt and idle sway
      var names = ['root', 'camScale', 'camMove', 'camRotZ', 'camRotX', 'tiltX', 'tiltZ', 'swayX', 'swayZ', 'board'];
      var parent = this.scene;
      for (var i = 0; i < names.length; i++) {
        this[names[i]] = new T.Group();
        parent.add(this[names[i]]);
        parent = this[names[i]];
      }
      this.camera.position.set(0, 0, CAM_Z);

      var bc = makeCanvas(900, 600, PX);
      this.boardCanvas = bc[0];
      this.boardCtx = bc[1];
      this.boardTexture = this.texture(this.boardCanvas);
      this.buildBoard();
      for (var z = 0; z < zones.length; z++) this.zones.push(this.buildZone(zones[z]));
      this.frame = this.frame.bind(this);
      this.prepare(onReady);
    }

    var P = BlueprintScene.prototype;

    P.keep = function (o) { this.disposables.push(o); return o; };

    P.texture = function (canvas) {
      var t = this.keep(new T.CanvasTexture(canvas));
      t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      t.generateMipmaps = true;
      t.minFilter = T.LinearMipmapLinearFilter;
      return t;
    };

    P.setLayout = function (l) {
      this.layout = l;
      this.renderer.setPixelRatio(l.pixelRatio);
      this.renderer.setSize(l.width, l.height + l.extraTop, false);
      for (var i = 0; i < this.lines.length; i++) this.lines[i].resolution.set(l.width, l.height + l.extraTop);
    };

    P.setCamera = function (c) {
      var t = this.now(), d = this.reduced ? 0 : CAM_DUR;
      this.camS.go(c ? c.scale : 1, t, d, easeInOut);
      this.camX.go(c ? c.cx : 0, t, d, easeInOut);
      this.camY.go(c ? c.cy : 0, t, d, easeInOut);
      this.camFlat.go(c ? 1 : 0, t, d, easeInOut);
    };

    P.setActive = function (k) { this.active = k; this.retarget(); };
    P.setHover = function (k) { if (k !== this.hover) { this.hover = k; this.retarget(); } };
    P.setView = function (v, live) { this.view = v; this.viewLive = live; };
    P.setViewport = function (w, h) { this.viewport = { width: w, height: h }; if (this.ready) this.paintBoard(); };

    P.pick = function (x, y) {
      this.raycaster.setFromCamera(new T.Vector2(x, y), this.camera);
      var hit = this.raycaster.intersectObjects(this.zones.map(function (z) { return z.box; }), false)[0];
      return hit ? hit.object.userData.key : null;
    };

    P.dispose = function () {
      this.disposed = true;
      cancelAnimationFrame(this.frameId);
      this.disposables.forEach(function (d) { d.dispose(); });
      this.renderer.dispose();
    };

    P.line = function (positions, order) {
      var g = this.keep(new L.LineSegmentsGeometry());
      g.setPositions(positions);
      var m = this.keep(new L.LineMaterial({ color: C.blue200, linewidth: 1.5 }));
      this.lines.push(m);
      var seg = new L.LineSegments2(g, m);
      seg.renderOrder = order;
      return seg;
    };

    P.shadowMesh = function (w, h, m, blur, color) {
      var pair = makeCanvas(w + m * 2, h + m * 2, 0.5);
      paintShadow(pair[1], w, h, m, blur, color);
      var tex = this.keep(new T.CanvasTexture(pair[0]));
      tex.colorSpace = T.SRGBColorSpace;
      var mesh = new T.Mesh(
        this.keep(new T.PlaneGeometry(w + m * 2, h + m * 2)),
        this.keep(new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }))
      );
      mesh.renderOrder = 1;
      return mesh;
    };

    P.buildBoard = function () {
      var plane = new T.Mesh(this.keep(new T.PlaneGeometry(900, 600)), this.keep(new T.MeshBasicMaterial({ map: this.boardTexture })));
      var shadow = this.shadowMesh(900, 600, 200, 120, 'rgba(0, 0, 0, 0.45)');
      shadow.position.set(0, -60, -2);
      shadow.renderOrder = -1;
      this.board.add(shadow, plane);
      var self = this;
      this.painters.push(function () { self.paintBoard(); });
    };

    P.paintBoard = function () {
      paintBoard(this.boardCtx, this.host, this.viewport.width, this.viewport.height);
      this.boardTexture.needsUpdate = true;
    };

    P.buildZone = function (meta) {
      var self = this;
      var w = meta.rect.w, h = meta.rect.h, rise = RISE[meta.height] || RISE.b, rest = REST_H / rise;
      var group = new T.Group();
      group.position.set(2 + meta.rect.x + w / 2 - 450, -(2 + meta.rect.y + h / 2 - 300), 0);

      var wall = function (cw, ch, color, horizontal, hi, lo, alpha) {
        var pair = makeCanvas(cw, ch, 2);
        paintWall(pair[1], cw, ch, color, horizontal, hi, lo, alpha);
        return self.keep(new T.MeshBasicMaterial(Object.assign({ map: self.texture(pair[0]) }, POLY)));
      };
      var back = this.keep(new T.MeshBasicMaterial(Object.assign({ color: C.wallBack }, POLY)));
      var top = makeCanvas(w, h, PX), hot = makeCanvas(w, h, PX);
      var topTex = this.texture(top[0]), hotTex = this.texture(hot[0]);
      this.painters.push(function () {
        paintZone(top[1], w, h, meta, false);
        paintZone(hot[1], w, h, meta, true);
        topTex.needsUpdate = true;
        hotTex.needsUpdate = true;
      });

      // Box face order: +x, -x, +y, -y, +z, -z
      var box = new T.Mesh(this.keep(new T.BoxGeometry(w, h, 1)), [
        back,
        wall(rise, h, C.wallWest, true, 0.1, 0.3, 0.18),
        back,
        wall(w, rise, C.blue600, false, 0.14, 0.25, 0.22),
        this.keep(new T.MeshBasicMaterial(Object.assign({ map: topTex }, POLY))),
        back
      ]);
      box.userData.key = meta.key;

      var raisedTop = new T.Mesh(
        this.keep(new T.PlaneGeometry(w, h)),
        this.keep(new T.MeshBasicMaterial({ map: hotTex, transparent: true, opacity: 0, depthWrite: false }))
      );
      raisedTop.renderOrder = 3;

      var eg = new T.EdgesGeometry(box.geometry);
      var edges = this.line(eg.getAttribute('position').array, 4);
      eg.dispose();

      var shadow = this.shadowMesh(w, h, 70, 32, 'rgba(2, 6, 16, 1)');
      shadow.position.z = 0.4;

      group.add(shadow, box, raisedTop, edges);
      this.board.add(group);

      return {
        meta: meta, rise: rise, rest: rest, group: group, box: box, raisedTop: raisedTop,
        edges: edges, shadow: shadow, height: new Tween(rest), tint: new Tween(0),
        holo: null, holoSince: -10, holoOn: false
      };
    };

    P.buildHologram = function (zone) {
      var card = paintHoloCard(zone.meta.tipTitle, zone.meta.tipSub, 3);
      var opts = { transparent: true, depthTest: false, depthWrite: false };
      var cw = card.width + card.margin * 2, ch = card.height + card.margin * 2;
      var anchor = new T.Group();
      var cardTex = this.keep(new T.CanvasTexture(card.canvas));
      cardTex.colorSpace = T.SRGBColorSpace;
      var cardMesh = new T.Mesh(this.keep(new T.PlaneGeometry(cw, ch)), this.keep(new T.MeshBasicMaterial(Object.assign({ map: cardTex }, opts))));
      var scanTex = this.keep(new T.CanvasTexture(paintScan()));
      scanTex.colorSpace = T.SRGBColorSpace;
      scanTex.repeat.y = 1 / 0.38;
      var scan = new T.Mesh(this.keep(new T.PlaneGeometry(card.width, card.height)), this.keep(new T.MeshBasicMaterial(Object.assign({ map: scanTex, blending: T.AdditiveBlending }, opts))));
      var beamTex = this.keep(new T.CanvasTexture(paintBeam(2)));
      beamTex.colorSpace = T.SRGBColorSpace;
      var beam = new T.Mesh(this.keep(new T.PlaneGeometry(190, 80)), this.keep(new T.MeshBasicMaterial(Object.assign({ map: beamTex }, opts))));
      cardMesh.position.y = 78 + card.height / 2;
      scan.position.y = cardMesh.position.y;
      beam.position.y = 40;
      [beam, cardMesh, scan].forEach(function (m) { m.renderOrder = 10; });
      anchor.add(beam, cardMesh, scan);
      anchor.visible = false;
      zone.group.add(anchor);
      return { anchor: anchor, card: cardMesh, scan: scan, beam: beam, cardHeight: card.height };
    };

    P.prepare = function (onReady) {
      var self = this;
      var fonts = document.fonts ? Promise.all(FONTS.map(function (f) { return document.fonts.load(f); })) : Promise.resolve();
      var timeout = new Promise(function (r) { setTimeout(r, 4000); });
      var go = function () {
        if (self.disposed) return;
        self.painters.forEach(function (p) { p(); });
        self.zones.forEach(function (z) { z.holo = self.buildHologram(z); });
        self.t0 = performance.now();
        self.lastTime = 0;
        self.ready = true;
        self.frame();
        if (onReady) onReady();
      };
      Promise.race([fonts, timeout]).then(go, go);
    };

    P.now = function () { return (performance.now() - this.t0) / 1000; };

    P.retarget = function () {
      var t = this.now();
      for (var i = 0; i < this.zones.length; i++) {
        var z = this.zones[i];
        var up = z.meta.key === this.active || (z.meta.key === this.hover && !this.active);
        if (up) z.height.go(1, t, this.reduced ? 0 : UP_DUR, springy);
        else z.height.go(z.rest, t, this.reduced ? 0 : DOWN_DUR, soft);
        z.tint.go(up ? 1 : 0, t, this.reduced ? 0 : TINT_DUR, ease);
        var holo = z.meta.key === this.hover && !this.active;
        if (holo !== z.holoOn) { z.holoOn = holo; z.holoSince = t; }
      }
    };

    /* Off-axis perspective: 1 world unit == 1 CSS px on the z=0 plane. */
    P.project = function () {
      var l = this.layout, v = this.viewShown;
      var o = l.height / 4;
      var left = (-l.width / 2 - v.x) / v.zoom;
      var right = (l.width / 2 - v.x) / v.zoom;
      var top = (l.height / 2 + l.extraTop + v.y) / v.zoom;
      var bottom = (-l.height / 2 + v.y) / v.zoom;
      var d = 200 / CAM_Z;
      this.camera.position.set(0, o, CAM_Z);
      this.camera.updateMatrixWorld();
      this.camera.projectionMatrix.makePerspective(left * d, right * d, (top - o) * d, (bottom - o) * d, 200, CAM_Z * 3);
      this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    };

    P.wave = function (z, t) {
      if (this.reduced) return z.rest;
      var n = (t - INTRO - z.meta.introDelay) / WAVE_DUR;
      if (n <= 0 || n >= 1) return z.rest;
      if (n < 0.45) return z.rest + (1 - z.rest) * soft(n / 0.45);
      if (n <= 0.55) return 1;
      return 1 - (1 - z.rest) * soft((n - 0.55) / 0.45);
    };

    P.frame = function () {
      if (this.disposed) return;
      this.frameId = requestAnimationFrame(this.frame);
      var t = this.now(), dt = Math.min(0.1, t - this.lastTime);
      this.lastTime = t;

      var k = this.viewLive || this.reduced ? 1 : Math.min(1, dt * 12);
      this.viewShown = {
        x: this.viewShown.x + (this.view.x - this.viewShown.x) * k,
        y: this.viewShown.y + (this.view.y - this.viewShown.y) * k,
        zoom: this.viewShown.zoom + (this.view.zoom - this.viewShown.zoom) * k
      };
      this.project();

      var flat = this.camFlat.at(t), s = this.camS.at(t);
      this.root.position.y = this.layout.lift;
      this.camScale.scale.setScalar(s);
      this.camMove.position.set(-this.camX.at(t), this.camY.at(t), 0);
      this.camRotZ.rotation.z = -30 * DEG * flat;
      this.camRotX.rotation.x = 50 * DEG * flat;

      var a = this.reduced ? 1 : easeOut(t / INTRO);
      this.tiltX.rotation.x = -50 * DEG * a;
      this.tiltZ.rotation.z = 30 * DEG * a;
      this.tiltZ.scale.setScalar(0.82 + 0.18 * a);

      this.swayGain += ((this.camFlat.target === 1 ? 0 : 1) - this.swayGain) * Math.min(1, dt * 5);
      var sway = 0;
      if (!this.reduced && t > INTRO) {
        var p = ((t - INTRO) % SWAY_PERIOD) / SWAY_PERIOD;
        sway = sine(p < 0.5 ? p * 2 : 2 - p * 2) * this.swayGain;
      }
      this.swayX.rotation.x = -3 * DEG * sway;
      this.swayZ.rotation.z = -5 * DEG * sway;

      var lw = 1.5 * s * this.viewShown.zoom * (0.82 + 0.18 * a);
      for (var i = 0; i < this.zones.length; i++) this.updateZone(this.zones[i], t, lw);
      this.renderer.render(this.scene, this.camera);
    };

    P.updateZone = function (z, t, lw) {
      var r = Math.max(z.height.at(t), this.wave(z, t));
      var tint = z.tint.at(t);
      var hgt = z.rise * r;
      z.box.scale.z = hgt;
      z.box.position.z = hgt / 2;
      z.edges.scale.z = hgt;
      z.edges.position.z = hgt / 2;
      z.raisedTop.position.z = hgt + 0.2;
      z.raisedTop.material.opacity = tint;
      z.raisedTop.visible = tint > 0.001;
      z.edges.material.linewidth = lw;
      z.edges.material.color.set(C.blue200).lerp(ORANGE, tint);
      z.shadow.position.x = 14 + 20 * tint;
      z.shadow.position.y = -(18 + 26 * tint);
      z.shadow.scale.setScalar(1 + 0.06 * tint);
      z.shadow.material.opacity = 0.6 + 0.1 * tint;
      if (z.holo) this.updateHologram(z, z.holo, t, hgt);
    };

    P.updateHologram = function (z, h, t, hgt) {
      var since = t - z.holoSince, alpha, sx, drop;
      if (z.holoOn) {
        var e = this.reduced ? 1 : Math.min(1, since / 0.7);
        alpha = keyframes([[0, 0], [0.35, 0.9], [0.55, 0.4], [0.62, 1], [0.7, 0.55], [0.78, 1], [1, 1]], e);
        sx = keyframes([[0, 0.02], [0.35, 0.03], [0.62, 1.04], [1, 1]], e);
        drop = keyframes([[0, 10], [0.35, 0], [1, 0]], e);
        if (since > 0.7 && !this.reduced) {
          var f = ((since - 0.7) % 3.5) / 3.5;
          if (f > 0.47 && f < 0.49) alpha = 0.62;
          else if (f > 0.83 && f < 0.85) alpha = 0.45;
        }
      } else {
        var o = this.reduced ? 1 : Math.min(1, since / 0.25);
        alpha = 1 - o;
        sx = 1 - 0.98 * o;
        drop = 10 * o;
      }
      h.anchor.visible = alpha > 0.001;
      if (!h.anchor.visible) return;
      h.anchor.position.z = hgt + 6;
      z.group.getWorldQuaternion(h.anchor.quaternion).invert();
      h.anchor.scale.set(sx, 1, 1);
      h.anchor.position.y = 0;
      h.card.position.y = 78 + h.cardHeight / 2 - drop;
      h.scan.position.y = h.card.position.y;
      h.card.material.opacity = alpha;
      h.beam.material.opacity = alpha * (0.875 - 0.125 * Math.cos((t / 1.6) * Math.PI * 2));
      h.scan.material.opacity = alpha;
      h.scan.material.map.offset.y = -2.6315789473684212 + ((t % 2.2) / 2.2) * 3.6315789473684212;
    };

    return BlueprintScene;
  };
})();
