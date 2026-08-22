/* Thamel Grand Hotel — API-driven collections (DRY).
 *
 * ONE engine, mountCollection(), powers every list on the site that comes
 * from the API. Today that's the homepage Reviews slider and the Trips & Tours
 * grid; the same call can drive the Events page or any future list.
 *
 * Methodology: progressive enhancement. The real content is also baked into
 * the page as static HTML. On load we fetch the API and, if it answers,
 * replace the static markup with the live data. If the API is down/empty, or
 * JS is off, the static fallback stays — the section is never blank.
 */
(function () {
  'use strict';

  // ---------- shared presentation helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function initials(name) {
    var p = String(name || '').trim().split(/[\s-]+/).filter(Boolean);
    if (!p.length) return '?';
    return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
  function colorFor(name) {
    var pal = ['#8e4d3b', '#3b6ea5', '#4b7a52', '#8a5a9e', '#b5852f', '#487b7b', '#a24d5c', '#5b6a8a'];
    var h = 0, s = String(name || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return pal[h % pal.length];
  }
  function stars(n) {
    n = Math.round(Number(n) || 0);
    var o = '';
    for (var i = 0; i < 5; i++) o += i < n ? '★' : '☆';
    return o;
  }

  // ---------- reusable card slider (autoplay + arrows + dots + responsive) ----------
  // The template's owl-carousel is unreliable when content is injected after
  // page load, so we roll a small dependable slider instead.
  function buildSlider(el, opts) {
    opts = opts || {};
    var interval = opts.interval || 5000;
    var originals = Array.prototype.slice.call(el.children);
    if (!originals.length) return;
    var col = el.closest('[class*="col-"]');
    if (col) { col.style.maxWidth = '100%'; col.style.flex = '0 0 100%'; col.style.marginLeft = '0'; col.style.marginRight = '0'; }
    el.setAttribute('style', 'position:relative;overflow:hidden;max-width:1500px;margin:0 auto;padding:0 6px;');
    var track = document.createElement('div');
    track.setAttribute('style', 'display:flex;');
    originals.forEach(function (c) {
      c.setAttribute('style', 'background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.07);padding:26px 22px;text-align:center;min-height:280px;height:auto;display:flex;flex-direction:column;justify-content:flex-start;box-sizing:border-box;margin:0;');
      var slide = document.createElement('div');
      slide.setAttribute('style', 'box-sizing:border-box;padding:14px;flex:0 0 33.3333%;');
      slide.appendChild(c);
      track.appendChild(slide);
    });
    el.innerHTML = '';
    el.appendChild(track);
    var perView = 3, idx = 0, timer, animating = false;
    var baseSlides = Array.prototype.slice.call(track.children);
    function pvFor() { var w = window.innerWidth; return w < 640 ? 1 : (w < 1024 ? 2 : 3); }
    function removeClones() { Array.prototype.slice.call(track.querySelectorAll('.tgh-clone')).forEach(function (n) { track.removeChild(n); }); }
    function addClones() { for (var i = 0; i < perView; i++) { var cl = baseSlides[i % baseSlides.length].cloneNode(true); cl.className = 'tgh-clone'; track.appendChild(cl); } }
    function setFlex() { Array.prototype.forEach.call(track.children, function (s) { s.style.flex = '0 0 ' + (100 / perView) + '%'; }); }
    function apply(anim) { track.style.transition = anim ? 'transform .6s ease' : 'none'; track.style.transform = 'translateX(-' + (idx * (100 / perView)) + '%)'; }
    function next() { if (animating) return; animating = true; idx++; apply(true); setTimeout(function () { if (idx >= originals.length) { idx = 0; apply(false); } animating = false; }, 640); }
    function prev() { if (animating) return; animating = true; if (idx <= 0) { idx = originals.length; apply(false); void track.offsetWidth; } idx--; apply(true); setTimeout(function () { animating = false; }, 640); }
    function play() { clearInterval(timer); timer = setInterval(next, interval); }
    function resize() { perView = pvFor(); removeClones(); addClones(); setFlex(); if (idx > originals.length) idx = 0; apply(false); }
    [['‹', prev, 'left'], ['›', next, 'right']].forEach(function (a) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = a[0];
      b.setAttribute('style', 'position:absolute;top:50%;' + a[2] + ':0;transform:translateY(-50%);z-index:3;width:40px;height:40px;border:none;border-radius:50%;background:rgba(20,20,20,.4);color:#fff;font-size:22px;line-height:1;cursor:pointer;');
      b.onclick = function () { a[1](); play(); };
      el.appendChild(b);
    });
    el.onmouseenter = function () { clearInterval(timer); };
    el.onmouseleave = play;
    window.addEventListener('resize', resize);
    resize(); play();
  }

  // ---------- the generic engine ----------
  // cfg: { name, url, container, toCards(items)->[Node], onReady(container)?, fallback(container)? }
  function mountCollection(cfg) {
    var container = document.querySelector(cfg.container);
    if (!container) return;
    fetch(cfg.url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var items = data && data.data;
        if (!items || !items.length) throw new Error('empty');
        container.innerHTML = '';
        cfg.toCards(items).forEach(function (node) { container.appendChild(node); });
        if (cfg.onReady) cfg.onReady(container);
      })
      .catch(function (e) {
        console.warn('[TGH] ' + cfg.name + ' from API unavailable (' + e.message + ') — keeping static content.');
        if (cfg.fallback) cfg.fallback(container);
      });
  }

  // ---------- per-type card templates (the only non-shared code) ----------
  function reviewCard(a) {
    var name = a.full_name || '';
    var el = document.createElement('div');
    el.className = 'ts-item';
    el.innerHTML =
      '<div style="width:60px;height:60px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:600;background:' + colorFor(name) + ';">' + esc(initials(name)) + '</div>' +
      '<div style="color:#f0a500;font-size:16px;letter-spacing:2px;margin-bottom:10px;">' + stars(a.rating) + '</div>' +
      '<p style="color:#555;font-size:14.5px;line-height:1.6;margin:0 0 12px;">' + esc(a.description) + '</p>' +
      '<div style="color:#222;font-weight:600;font-size:15px;margin-top:auto;">' + esc(name) + '</div>';
    return el;
  }

  // The DB header images still point at room photos; map the known posts to the
  // subject-correct local images. Remove once the DB stores the right headers.
  var TRIP_IMG = { 1: 'images/trips/nagarkot-sunrise.jpg', 2: 'images/trips/newari-alley.jpg', 3: 'images/trips/kumari-durbar.jpg', 4: 'images/trips/boudhanath.jpg' };
  function tripCard(blog) {
    var a = blog.attributes || {};
    var hdr = a.header_img && a.header_img.data && a.header_img.data.attributes && a.header_img.data.attributes.url;
    var img = TRIP_IMG[blog.id] || hdr || '';
    var d = new Date(a.createdAt);
    var date = isNaN(d.getTime()) ? '' : d.toLocaleString('default', { month: 'long' }) + ' ' + d.getDate() + ', ' + d.getFullYear();
    var teaser = String(a.introduction || a.description || '').slice(0, 120);
    var col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 col-sm-6 col-12 post mb-5';
    col.setAttribute('data-aos', 'fade-up');
    col.innerHTML =
      '<div class="media media-custom d-block mb-4 h-100">' +
        '<a href="blog.html?id=' + esc(blog.id) + '" class="mb-4 d-block"><img class="img-fluid" src="' + esc(img) + '" alt="' + esc(a.title || '') + '" loading="lazy" decoding="async"></a>' +
        '<div class="media-body">' +
          '<span class="meta-post">' + esc(date) + '</span>' +
          '<h2 class="mt-0 mb-3"><a href="blog.html?id=' + esc(blog.id) + '">' + esc(a.title || '') + '</a></h2>' +
          '<p>' + esc(teaser) + '</p>' +
        '</div>' +
      '</div>';
    return col;
  }

  // ---------- wire the sections through the SAME engine ----------
  function init() {
    // Reviews — card slider
    mountCollection({
      name: 'reviews',
      url: '/api/reviews',
      container: '#reviews',
      toCards: function (items) { return items.map(function (r) { return reviewCard(r.attributes || {}); }); },
      onReady: function (c) {
        try { if (window.jQuery) window.jQuery('#reviews').trigger('destroy.owl.carousel'); } catch (e) { /* ignore */ }
        c.className = '';
        buildSlider(c, { interval: 4500 });
      },
      // API down/empty: turn the baked-in static cards into the same slider.
      fallback: function (c) {
        if (c.dataset.slid) return;
        c.dataset.slid = '1';
        c.className = '';
        buildSlider(c, { interval: 4500 });
      }
    });

    // Trips & Tours — grid (static grid already in the HTML is the fallback)
    mountCollection({
      name: 'blogs',
      url: '/api/blogs?populate=*',
      container: '#blogs',
      toCards: function (items) { return items.map(tripCard); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Expose for reuse elsewhere (e.g. the Events page).
  window.TGHCollections = { mount: mountCollection, buildSlider: buildSlider };
})();
