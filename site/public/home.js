/* Home page script. Needs mo-core.js (ScrollCraft); queued until it has run. */
(window.__moReady = window.__moReady || []).push(function () {
ScrollCraft.mount(document.body);

/* The agent OS: 33 tiles. Three are real work in build; every other tile is
   planned and says so. Order is fixed so the lit tiles land mid-grid. */
(function () {
  var grid = document.getElementById('os-grid');
  if (!grid) return;
  var lit = { 5: 1, 16: 1, 27: 1 };
  var html = '';
  for (var i = 0; i < 33; i++) {
    html += '<span class="os__tile' + (lit[i] ? ' os__tile--build' : '') + '" style="--i:' + i + '"></span>';
  }
  grid.innerHTML = html;
})();

/* SIGNATURE MOVE · the pipeline lights the mark.
   Scroll through the method act draws the brackets (brief), then the nib
   (design), fills it (build), and finally hands over to the owner's render,
   whose gold edge lights (ship). Own rAF loop; the engine is untouched. */
(function () {
  var act = document.getElementById('method');
  if (!act) return;
  var root = document.documentElement;
  var bars = [1, 2, 3, 4].map(function (n) { return document.getElementById('st' + n); });
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, target = 0, raf = 0;
  function seg(p, a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }
  function write(p) {
    var v = [seg(p, 0.02, 0.24), seg(p, 0.26, 0.49), seg(p, 0.51, 0.72), seg(p, 0.76, 0.95)];
    for (var i = 0; i < 4; i++) {
      act.style.setProperty('--b' + (i + 1), v[i].toFixed(3));
      if (bars[i]) bars[i].style.setProperty('--v', v[i].toFixed(3));
    }
  }
  function progress() {
    var r = act.getBoundingClientRect(), t = r.height - innerHeight;
    return t > 0 ? Math.max(0, Math.min(1, -r.top / t)) : 0;
  }
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
  addEventListener('resize', onScroll);
  onScroll(); write(cur);
})();

/* Nav: mark the section on screen. */
(function () {
  var links = [].slice.call(document.querySelectorAll('.nav__links a'));
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  ['about', 'services', 'harkardah', 'work', 'contact'].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
})();
});
