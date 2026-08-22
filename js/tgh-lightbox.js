/* Thamel Grand Hotel — dependency-free lightbox (photos + video).
   Usage: TGHLightbox.open([{full,alt}|{video,poster,alt}|'url', ...], startIndex) */
(function () {
  'use strict';
  var box, imgEl, videoEl, capEl, counterEl, list = [], idx = 0, lastFocus = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function build() {
    if (box) return;
    box = document.createElement('div');
    box.className = 'tgh-lb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Media viewer');
    box.innerHTML =
      '<button class="tgh-lb-close" aria-label="Close (Esc)">&times;</button>' +
      '<button class="tgh-lb-nav tgh-lb-prev" aria-label="Previous">&#8249;</button>' +
      '<figure class="tgh-lb-stage"><img alt=""><video class="tgh-lb-video" controls playsinline preload="metadata"></video><figcaption></figcaption></figure>' +
      '<button class="tgh-lb-nav tgh-lb-next" aria-label="Next">&#8250;</button>' +
      '<div class="tgh-lb-counter" aria-live="polite"></div>';
    document.body.appendChild(box);
    imgEl = box.querySelector('img');
    videoEl = box.querySelector('.tgh-lb-video');
    capEl = box.querySelector('figcaption');
    counterEl = box.querySelector('.tgh-lb-counter');
    box.querySelector('.tgh-lb-close').onclick = close;
    box.querySelector('.tgh-lb-prev').onclick = function (e) { e.stopPropagation(); go(-1); };
    box.querySelector('.tgh-lb-next').onclick = function (e) { e.stopPropagation(); go(1); };
    box.addEventListener('click', function (e) { if (e.target === box || e.target.tagName === 'FIGURE') close(); });
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
      x0 = null;
    });
    if (!reduce) box.style.transition = 'opacity .28s ease';
  }

  function render() {
    var it = list[idx];
    var alt = (typeof it === 'string') ? '' : (it.alt || '');
    if (videoEl) videoEl.pause();
    if (it && it.video) {
      imgEl.style.display = 'none';
      videoEl.style.display = '';
      videoEl.poster = it.poster || '';
      videoEl.src = it.video;
      var pl = videoEl.play(); if (pl && pl.catch) pl.catch(function () {});
    } else {
      if (videoEl) { videoEl.removeAttribute('src'); if (videoEl.load) videoEl.load(); videoEl.style.display = 'none'; }
      imgEl.style.display = '';
      imgEl.src = (typeof it === 'string') ? it : it.full;
      imgEl.alt = alt;
    }
    capEl.textContent = alt; capEl.style.display = alt ? '' : 'none';
    counterEl.textContent = (idx + 1) + ' / ' + list.length;
    var multi = list.length > 1;
    box.querySelector('.tgh-lb-prev').style.display = multi ? '' : 'none';
    box.querySelector('.tgh-lb-next').style.display = multi ? '' : 'none';
    counterEl.style.display = multi ? '' : 'none';
    [idx + 1, idx - 1].forEach(function (n) {
      var m = list[(n + list.length) % list.length];
      if (m && !m.video) { var u = (typeof m === 'string') ? m : m.full; var pr = new Image(); pr.src = u; }
    });
  }
  function go(d) { idx = (idx + d + list.length) % list.length; render(); }
  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
  }
  function open(items, start) {
    if (!items || !items.length) return;
    build();
    list = items; idx = Math.max(0, Math.min(start || 0, items.length - 1));
    lastFocus = document.activeElement;
    render();
    document.body.style.overflow = 'hidden';
    box.classList.add('is-open');
    document.addEventListener('keydown', onKey);
    box.querySelector('.tgh-lb-close').focus();
  }
  function close() {
    if (videoEl) videoEl.pause();
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.TGHLightbox = { open: open, close: close };
})();
