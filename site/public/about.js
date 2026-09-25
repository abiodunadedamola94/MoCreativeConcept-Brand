/* /about page script. Needs mo-core.js (ScrollCraft); queued until it has run.
   Everything on this page is driven by the engine and CSS (--sc-p), so all the
   page has to do is mount. */
(window.__moReady = window.__moReady || []).push(function () {
  ScrollCraft.mount(document.body);
});
