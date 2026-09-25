/* /motion page script. Needs mo-core.js (ScrollCraft); queued until it has run.
   1. Mount the engine.
   2. The playhead: scroll through the hero act is linear time; the curve is
      drawn up to it, the dot rides the curve, and the object on the track moves
      by the brand easing, cubic-bezier(0.23, 1, 0.32, 1). Same law as the home
      page's method act: own rAF, lerped, instant under reduced motion.
   3. The reel: nothing autoplays. A click loads the clip (or the Figma embed)
      in place; clips pause when they leave the screen. */
(window.__moReady = window.__moReady || []).push(function () {
  ScrollCraft.mount(document.body);

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 2 · Playhead ─────────────────────────────────────────────────────── */
  (function () {
    var act = document.getElementById('playhead');
    if (!act) return;
    var rect = document.getElementById('mt-clip-rect');
    var dot = document.getElementById('mt-dot');
    var head = document.getElementById('mt-head');
    var obj = document.getElementById('mt-obj');
    var frame = document.getElementById('mt-frame');
    var track = obj && obj.parentNode;
    var X1 = 0.23, Y1 = 1, X2 = 0.32, Y2 = 1;
    function bz(t, a, b) { var u = 1 - t; return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t; }
    function ease(x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 24; i++) { var v = bz(t, X1, X2); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return bz(t, Y1, Y2);
    }
    var railW = 0;
    function measure() { railW = track ? Math.max(0, track.clientWidth - 40) : 0; }
    function write(p) {
      var e = ease(p), x = 20 + 200 * p, y = 160 - 140 * e;
      if (rect) rect.setAttribute('width', (x + 2).toFixed(2));
      if (dot) { dot.setAttribute('cx', x.toFixed(2)); dot.setAttribute('cy', y.toFixed(2)); }
      if (head) { head.setAttribute('x1', x.toFixed(2)); head.setAttribute('x2', x.toFixed(2)); }
      if (obj) obj.style.setProperty('--mt-x', (e * railW).toFixed(1) + 'px');
      if (frame) { var f = Math.round(p * 60); frame.textContent = (f < 10 ? '0' : '') + f; }
    }
    function progress() {
      var r = act.getBoundingClientRect(), t = r.height - innerHeight;
      return t > 0 ? Math.max(0, Math.min(1, -r.top / t)) : 0;
    }
    var cur = 0, target = 0, raf = 0;
    function tick() {
      cur += (target - cur) * 0.16;
      if (Math.abs(target - cur) < 0.0008) cur = target;
      write(cur);
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    }
    function onScroll() {
      target = progress();
      if (reduced) { cur = target; write(cur); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', function () { measure(); write(cur); onScroll(); });
    measure(); cur = target = progress(); write(cur);
  })();

  /* ── 3 · Reel ─────────────────────────────────────────────────────────── */
  (function () {
    var media = [].slice.call(document.querySelectorAll('.mt-media'));
    media.forEach(function (m) {
      var btn = m.querySelector('.mt-media__poster');
      var slot = m.querySelector('.mt-media__embed');
      if (!btn || !slot) return;
      btn.addEventListener('click', function () {
        if (slot.firstChild) return;
        var src = m.getAttribute('data-video'), fig = m.getAttribute('data-figma');
        if (src) {
          var v = document.createElement('video');
          v.src = src; v.muted = true; v.loop = true; v.playsInline = true; v.controls = true;
          v.setAttribute('playsinline', ''); v.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Motion piece');
          // A clip that no longer resolves says so, and points at the Figma file.
          v.addEventListener('error', function () {
            if (v.parentNode) v.parentNode.removeChild(v);
            m.classList.remove('is-playing'); m.classList.add('is-offline');
            var hint = m.querySelector('.mt-media__hint');
            if (hint) hint.textContent = 'This clip is offline. Use the link below.';
          });
          slot.appendChild(v);
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else if (fig) {
          var f = document.createElement('iframe');
          f.src = fig; f.allowFullscreen = true; f.title = btn.getAttribute('aria-label') || 'Figma prototype';
          f.setAttribute('loading', 'lazy');
          slot.appendChild(f);
        } else return;
        m.classList.add('is-playing');
        var focusable = slot.firstChild; if (focusable && focusable.focus) focusable.setAttribute('tabindex', '0');
      });
    });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target.querySelector('.mt-media__embed video');
        if (v && !e.isIntersecting) v.pause();
      });
    }, { threshold: 0.2 });
    media.forEach(function (m) { io.observe(m); });
  })();
});
