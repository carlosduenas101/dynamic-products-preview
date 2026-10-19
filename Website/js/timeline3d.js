/* Dynamic Products, Inc. milestones: the serpentine steel pipe rendered with Three.js r128.
   Procedural brushed-steel textures (color, bump, roughness), a studio environment for reflections,
   flange collars at every milestone. Aligned 1:1 with the CSS layout using an orthographic camera.
   Falls back to the CSS pipe when WebGL or Three.js is not available, and below 1101px. */
(function () {
  "use strict";
  var T = window.THREE;
  var timeline = document.querySelector(".timeline");
  var wrap = timeline && timeline.querySelector(".tl-wrap");
  if (!T || !wrap) return;
  var vq = window.matchMedia("(max-width: 719px)");
  var renderer = null, canvas = null, built = false, visible = false;

  /* ---------- procedural textures ---------- */
  function noise(ctx, w, h, alpha, size) {
    for (var i = 0; i < w * h * 0.05; i++) {
      var v = Math.random() * 255;
      ctx.fillStyle = "rgba(" + v + "," + v + "," + v + "," + alpha + ")";
      ctx.fillRect(Math.random() * w, Math.random() * h, size, size);
    }
  }
  function steelMaps() {
    var W = 1024, H = 256;
    function mk() { var c = document.createElement("canvas"); c.width = W; c.height = H; return c; }
    var col = mk(), bump = mk(), rough = mk();
    var a = col.getContext("2d"), b = bump.getContext("2d"), r = rough.getContext("2d");
    /* base steel */
    var g = a.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#b4bccb"); g.addColorStop(0.5, "#c9d0dc"); g.addColorStop(1, "#aab2c0");
    a.fillStyle = g; a.fillRect(0, 0, W, H);
    b.fillStyle = "#808080"; b.fillRect(0, 0, W, H);
    r.fillStyle = "#6a6a6a"; r.fillRect(0, 0, W, H);
    /* mill scale mottling */
    for (var i = 0; i < 260; i++) {
      var x = Math.random() * W, y = Math.random() * H, rad = 6 + Math.random() * 40;
      var rg = a.createRadialGradient(x, y, 0, x, y, rad);
      var dark = Math.random() < 0.6;
      rg.addColorStop(0, dark ? "rgba(40,48,62,0.09)" : "rgba(245,248,255,0.10)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      a.fillStyle = rg; a.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    /* brushed streaks along the pipe (horizontal in the texture) */
    for (var s = 0; s < 900; s++) {
      var yy = Math.random() * H, len = 80 + Math.random() * 520, xx = Math.random() * W;
      var l = 120 + Math.random() * 120;
      var al = 0.03 + Math.random() * 0.07;
      a.fillStyle = "rgba(" + l + "," + l + "," + (l + 8) + "," + al + ")";
      a.fillRect(xx, yy, len, 1);
      b.fillStyle = "rgba(" + (Math.random() < 0.5 ? 255 : 0) + "," + (Math.random() < 0.5 ? 255 : 0) + ",128," + al * 1.6 + ")";
      b.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255," + al * 2 + ")" : "rgba(0,0,0," + al * 2 + ")";
      b.fillRect(xx, yy, len, 1);
      r.fillStyle = "rgba(" + (Math.random() < 0.5 ? 255 : 0) + "," + (Math.random() < 0.5 ? 255 : 0) + "," + (Math.random() < 0.5 ? 255 : 0) + ",0.05)";
      r.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
      r.fillRect(xx, yy, len, 1);
    }
    noise(a, W, H, 0.03, 1); noise(b, W, H, 0.25, 1); noise(r, W, H, 0.25, 1);
    /* girth weld with heat-affected zone at the tile seam */
    function weld(ctx, x, wd, isCol) {
      for (var k = -1; k <= 1; k++) {
        var xx = x + k * W;
        if (isCol === "col") {
          var hz = ctx.createLinearGradient(xx - 60, 0, xx + 60, 0);
          hz.addColorStop(0, "rgba(0,0,0,0)");
          hz.addColorStop(0.35, "rgba(120,100,150,0.20)");
          hz.addColorStop(0.5, "rgba(70,60,80,0.35)");
          hz.addColorStop(0.65, "rgba(150,110,70,0.20)");
          hz.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = hz; ctx.fillRect(xx - 60, 0, 120, H);
        } else if (isCol === "bump") {
          var bg = ctx.createLinearGradient(xx - wd, 0, xx + wd, 0);
          bg.addColorStop(0, "rgba(255,255,255,0)"); bg.addColorStop(0.5, "rgba(255,255,255,0.95)"); bg.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = bg; ctx.fillRect(xx - wd, 0, wd * 2, H);
          /* ripple of the weld bead */
          for (var yy = 0; yy < H; yy += 5) {
            ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(xx - wd * 0.6, yy, wd * 1.2, 2);
          }
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(xx - wd, 0, wd * 2, H);
        }
      }
    }
    weld(a, 0, 12, "col"); weld(b, 0, 11, "bump"); weld(r, 0, 12, "rough");
    return { col: col, bump: bump, rough: rough };
  }
  function envTexture() {
    var c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#f4f7ff"); g.addColorStop(0.32, "#cfd7e6"); g.addColorStop(0.5, "#5a6376");
    g.addColorStop(0.62, "#1a2030"); g.addColorStop(1, "#05070c");
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    /* softboxes: long strips and side windows */
    x.fillStyle = "rgba(255,255,255,0.95)";
    x.fillRect(120, 70, 300, 46); x.fillRect(600, 60, 320, 38);
    x.fillStyle = "rgba(235,242,255,0.85)";
    for (var i = 0; i < 4; i++) x.fillRect(i * 256 + 40, 150, 44, 170);
    x.fillStyle = "rgba(255,160,120,0.35)"; x.fillRect(430, 200, 90, 120);
    return c;
  }

  /* ---------- scene ---------- */
  var scene, camera, tube, parts = [], maps = {}, envRT = null, pmrem = null;

  function build() {
    var wrapRect = wrap.getBoundingClientRect();
    var W = Math.round(wrapRect.width), H = Math.round(wrapRect.height);
    var olRect = wrap.querySelector("ol").getBoundingClientRect();
    var olL = olRect.left - wrapRect.left, olR = olRect.right - wrapRect.left;
    var pipe = parseFloat(getComputedStyle(timeline).getPropertyValue("--pipe")) || 22;
    var lis = [].slice.call(wrap.querySelectorAll("li"));
    var tops = [];
    lis.forEach(function (li) { if (tops.indexOf(li.offsetTop) < 0) tops.push(li.offsetTop); });
    tops.sort(function (p, q) { return p - q; });
    var rows = tops.length;
    var vertical = vq.matches;
    var row = rows > 1 ? tops[1] - tops[0] : 200;
    var bendX = Math.max(10, (W - (olR - olL)) / 2 - pipe / 2);

    if (!renderer) {
      canvas = document.createElement("canvas");
      canvas.className = "tl-canvas";
      canvas.setAttribute("aria-hidden", "true");
      wrap.insertBefore(canvas, wrap.firstChild);
      try {
        renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
      } catch (e) { renderer = null; canvas.remove(); return false; }
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      renderer.setClearColor(0x000000, 0);
      var m = steelMaps();
      var tex = function (c, srgb) {
        var t = new T.CanvasTexture(c);
        t.wrapS = t.wrapT = T.RepeatWrapping;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        if (srgb) t.encoding = T.sRGBEncoding;
        return t;
      };
      maps.col = tex(m.col, true); maps.bump = tex(m.bump); maps.rough = tex(m.rough);
      var envTex = new T.CanvasTexture(envTexture());
      envTex.mapping = T.EquirectangularReflectionMapping;
      envTex.encoding = T.sRGBEncoding;
      pmrem = new T.PMREMGenerator(renderer);
      envRT = pmrem.fromEquirectangular(envTex);
      envTex.dispose();
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var PAD = 16;
    renderer.setSize(W, H + PAD * 2, false);
    canvas.style.width = W + "px"; canvas.style.height = H + PAD * 2 + "px"; canvas.style.top = -PAD + "px";

    /* dispose previous geometry */
    if (scene) parts.forEach(function (p) { p.geometry.dispose(); });
    scene = new T.Scene();
    scene.environment = envRT.texture;
    parts = [];
    camera = new T.OrthographicCamera(0, W, PAD, -(H + PAD), -600, 600);
    camera.position.z = 100;

    var steel = new T.MeshStandardMaterial({
      map: maps.col, bumpMap: maps.bump, bumpScale: 0.7, roughnessMap: maps.rough,
      metalness: 0.88, roughness: 0.4, envMapIntensity: 1.6
    });
    var flangeMat = new T.MeshStandardMaterial({ color: 0x8993a6, metalness: 0.95, roughness: 0.4, envMapIntensity: 1.4 });

    /* centerline: one straight run per row (alternating direction) plus a tail run, joined by bends */
    var rx = bendX, ry = row / 2, pts = [], step = 6, x, i, t, lvl, dirR, y, bendRight;
    var VX = 16, vTop = 11, vBot = lis[lis.length - 1].offsetTop + 11 + 30;
    if (vertical) {
      for (y = vTop; y <= vBot; y += step) pts.push(new T.Vector3(VX, -y, 0));
    }
    for (lvl = 0; !vertical && lvl <= rows; lvl++) {
      dirR = lvl % 2 === 0;
      y = lvl * row + pipe / 2;
      if (dirR) { for (x = olL; x <= olR; x += step) pts.push(new T.Vector3(x, -y, 0)); }
      else { for (x = olR; x >= olL; x -= step) pts.push(new T.Vector3(x, -y, 0)); }
      if (lvl === rows) break;
      bendRight = dirR;
      for (i = 1; i <= 60; i++) {
        t = -Math.PI / 2 + (Math.PI * i) / 60;
        var bx = bendRight ? olR + rx * Math.cos(t) : olL - rx * Math.cos(t);
        pts.push(new T.Vector3(bx, -(y + ry + ry * Math.sin(t)), 0));
      }
    }
    var curve = new T.CatmullRomCurve3(pts, false, "centripetal");
    var len = curve.getLength();
    var geo = new T.TubeGeometry(curve, pts.length * 3, pipe / 2, 40, false);
    ["col", "bump", "rough"].forEach(function (k) { maps[k].repeat.set(len / 520, 1); });
    tube = new T.Mesh(geo, steel);
    scene.add(tube); parts.push(tube);

    function collar(cx, cy, w, extra) {
      var g = new T.CylinderGeometry(pipe / 2 + extra, pipe / 2 + extra, w, 48, 1);
      var m = new T.Mesh(g, flangeMat);
      if (!vertical) m.rotation.z = Math.PI / 2;
      m.position.set(cx, -cy, 0);
      scene.add(m); parts.push(m);
      /* chamfer lip */
      var lg = new T.CylinderGeometry(pipe / 2 + extra + 1.5, pipe / 2 + extra + 1.5, 2, 48, 1);
      var lm = new T.Mesh(lg, flangeMat); if (!vertical) lm.rotation.z = Math.PI / 2;
      if (vertical) lm.position.set(cx, -(cy + w / 2), 0); else lm.position.set(cx + w / 2, -cy, 0);
      scene.add(lm); parts.push(lm);
    }
    if (vertical) {
      collar(VX, vTop - 2, 12, 8);
      collar(VX, vBot + 2, 12, 8);
      lis.forEach(function (li) { collar(VX, li.offsetTop + 11, 10, 6); });
    } else {
      /* open end flanges */
      collar(olL - 2, pipe / 2, 12, 8);
      collar(rows % 2 === 0 ? olR + 2 : olL - 2, rows * row + pipe / 2, 12, 8);
      /* collar at every milestone, under the red marker */
      lis.forEach(function (li) {
        collar(olL + li.offsetLeft + 29, li.offsetTop + pipe / 2, 10, 6);
      });
    }

    /* socket-head cap screws in brushed steel (hex socket, chamfered rim) at every milestone */
    function brushedCap() {
      var c = document.createElement("canvas"); c.width = c.height = 256;
      var g = c.getContext("2d"), i;
      g.fillStyle = "#4a4d55"; g.fillRect(0, 0, 256, 256);
      if (g.createConicGradient) {
        var cg = g.createConicGradient(Math.PI * 0.25, 128, 128);
        cg.addColorStop(0, "rgba(255,255,255,0.75)"); cg.addColorStop(0.18, "rgba(40,42,48,0.65)");
        cg.addColorStop(0.5, "rgba(235,238,245,0.7)"); cg.addColorStop(0.68, "rgba(30,32,38,0.7)");
        cg.addColorStop(1, "rgba(255,255,255,0.75)");
        g.fillStyle = cg; g.fillRect(0, 0, 256, 256);
      }
      for (i = 1; i < 128; i += 1) {
        g.strokeStyle = "rgba(" + (Math.random() > 0.5 ? "255,255,255" : "0,0,0") + "," + (0.03 + Math.random() * 0.08) + ")";
        g.lineWidth = 0.6; g.beginPath(); g.arc(128, 128, i, 0, Math.PI * 2); g.stroke();
      }
      var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
    }
    var capTex = brushedCap();
    var headSide = new T.MeshStandardMaterial({ color: 0x3d414b, metalness: 0.95, roughness: 0.4, envMapIntensity: 1.3 });
    var headTop = new T.MeshStandardMaterial({ map: capTex, metalness: 0.7, roughness: 0.42, envMapIntensity: 0.7 });
    var bevelMat = new T.MeshStandardMaterial({ color: 0x9097a6, metalness: 0.95, roughness: 0.3, envMapIntensity: 1.3 });
    var lipMat = new T.MeshStandardMaterial({ color: 0x6c7384, metalness: 0.95, roughness: 0.32, envMapIntensity: 1.2 });
    var recessMat = new T.MeshStandardMaterial({ color: 0x050607, metalness: 0.2, roughness: 0.85 });
    function addPart(g, mat, cx, cy, z, spin) {
      var m = new T.Mesh(g, mat);
      m.rotation.set(Math.PI / 2, spin || 0, 0);
      m.position.set(cx, -cy, z);
      scene.add(m); parts.push(m);
    }
    function bolt(cx, cy) {
      var z0 = pipe / 2 + 1;
      addPart(new T.CylinderGeometry(13, 13, 7, 64, 1), headSide, cx, cy, z0 + 3.5);                      /* head barrel */
      addPart(new T.CylinderGeometry(10.6, 12.8, 1.8, 64, 1), [bevelMat, headTop, bevelMat], cx, cy, z0 + 7.9); /* chamfer + brushed face */
      addPart(new T.CylinderGeometry(7.6, 7.6, 0.7, 6, 1), lipMat, cx, cy, z0 + 8.9, Math.PI / 6);              /* socket lip */
      addPart(new T.CylinderGeometry(6.1, 6.1, 0.8, 6, 1), recessMat, cx, cy, z0 + 9.3, Math.PI / 6);               /* hex socket */
    }
    lis.forEach(function (li) {
      if (vertical) bolt(VX, li.offsetTop + 11);
      else bolt(olL + li.offsetLeft + 29, li.offsetTop + pipe / 2);
    });

    /* lights */
    var key = new T.DirectionalLight(0xffffff, 1.9); key.position.set(-300, 420, 500); scene.add(key);
    var fill = new T.DirectionalLight(0x9fb4ff, 0.45); fill.position.set(400, -200, 300); scene.add(fill);
    scene.add(new T.AmbientLight(0xffffff, 0.35));
    built = true;
    return true;
  }
  function draw() {
    if (renderer && scene) renderer.render(scene, camera);
  }
  function enable() {
    if (!build()) return;
    timeline.classList.add("tl-3d");
    /* layout changes with the class (pipe thickness), so rebuild once it settles */
    requestAnimationFrame(function () { build(); draw(); });
  }
  function disable() {
    timeline.classList.remove("tl-3d");
    if (canvas) canvas.style.display = "none";
  }
  var enableWrap = function () {
    if (canvas) canvas.style.display = "";
    enable();
  };
  /* build lazily when the section is near the viewport */
  var start = function () { enableWrap(); };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { io.disconnect(); start(); }
    }, { rootMargin: "300px 0px" });
    io.observe(timeline);
  } else start();
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (built || canvas) enableWrap(); }, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (built) enableWrap(); });
})();
