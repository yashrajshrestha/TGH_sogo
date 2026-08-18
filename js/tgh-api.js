/* Thamel Grand Hotel — pull live content from the Strapi API.
 * Progressive enhancement: if the API is reachable it replaces the hardcoded
 * demo content; if it's down, the static markup is left untouched. */
(function () {
  'use strict';
  var API = 'http://localhost:1337';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function money(v) {
    var n = Number(v) || 0;
    return 'NPR ' + n.toLocaleString('en-IN');
  }
  function mediaUrl(u) {
    return u ? (/^https?:/.test(u) ? u : API + u) : null;
  }

  // --- Rooms (rooms.html) ---

  // Clean line icons (inline SVG — no external deps, work offline). Stroke inherits
  // the accent colour set in CSS.
  function featIcon(name) {
    var p = {
      bed: '<path d="M2 17v-4a2 2 0 0 1 2-2h12a4 4 0 0 1 4 4v2"/><path d="M2 17v3M22 17v3M2 20h20"/><path d="M5 11V8h6v3"/>',
      balcony: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M12 3v18"/><path d="M8.5 11h.01M15.5 11h.01"/>',
      view: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 15l5-4 4 3 3-2 6 4"/><circle cx="8" cy="9" r="1.5"/>',
      sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 12a2 2 0 0 1 2 2v3h16v-3a2 2 0 0 1 2-2 2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M5 17v2M19 17v2"/>',
      wifi: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
      tv: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M8 21h8M12 17v4"/>',
      fridge: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M10 6v1.5M10 13v3"/>',
      desk: '<rect x="5" y="5" width="14" height="9" rx="1"/><path d="M3 18h18l-1.2-2H4.2L3 18Z"/>',
      bath: '<path d="M6 12V6.5A2 2 0 0 1 9.8 6"/><path d="M3 12h18v2.5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V12Z"/><path d="M7 18.5l-1 2M18 18.5l1 2"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (p[name] || p.bed) + '</svg>';
  }

  // Turn a room's title + description into a few scannable feature chips
  // (bed config first, then stand-out features, then core amenities).
  function roomFeatures(title, desc) {
    var t = (String(title || '') + ' ' + String(desc || '')).toLowerCase();
    var f = [];
    if (/triple/.test(t)) f.push(['bed', 'Sleeps 3 · 3 beds']);
    else if (/twin/.test(t)) f.push(['bed', '2 twin beds']);
    else if (/family/.test(t) && /queen/.test(t)) f.push(['bed', 'Queen bed · family']);
    else if (/queen/.test(t)) f.push(['bed', 'Queen bed']);
    else if (/king/.test(t)) f.push(['bed', 'King bed']);
    else if (/double/.test(t)) f.push(['bed', 'Double bed']);
    else if (/single/.test(t)) f.push(['bed', 'Queen bed']);
    else f.push(['bed', 'Premium bedding']);
    if (/balcony/.test(t)) f.push(['balcony', 'Private balcony']);
    if (/city view|panoram|floor-to-ceiling/.test(t)) f.push(['view', 'City view']);
    if (/lounge|sitting|suite/.test(t)) f.push(['sofa', 'Sitting lounge']);
    f.push(['wifi', 'Free Wi-Fi']);
    f.push(['tv', 'Flat-screen TV']);
    if (/desk/.test(t)) f.push(['desk', 'Work desk']);
    // No minibar or bathtub at this property — always show a plain ensuite bathroom.
    f.push(['bath', 'Ensuite bathroom']);
    var seen = {}, out = [];
    f.forEach(function (x) { if (!seen[x[1]]) { seen[x[1]] = 1; out.push(x); } });
    return out.slice(0, 6);
  }

  // A single tight lead line — the first sentence, trimmed. No wall of text.
  function shortLead(desc) {
    var s = String(desc || '').trim();
    if (!s) return '';
    var first = s.split('. ')[0];
    if (!/[.!?]$/.test(first)) first += '.';
    if (first.length > 130) first = first.slice(0, 127).replace(/\s+\S*$/, '') + '…';
    return first;
  }

  function ensureRoomStyles() {
    if (document.getElementById('tgh-room-styles')) return;
    var css =
      '.tgh-lead{color:#6b6b6b;font-size:15px;line-height:1.65;margin:0 0 20px;max-width:48ch;}' +
      '.tgh-feats{display:grid;grid-template-columns:1fr 1fr;gap:13px 22px;margin:0 0 28px;}' +
      '.tgh-feat{display:flex;align-items:center;gap:10px;font-family:"Roboto",arial,sans-serif;font-size:14px;color:#3a3a3a;line-height:1.25;}' +
      '.tgh-feat svg{flex:0 0 21px;width:21px;height:21px;color:#c98a2b;}' +
      '.tgh-feat span{white-space:nowrap;}' +
      '@media (max-width:480px){.tgh-feats{grid-template-columns:1fr;}}' +
      // Even, tidy grid: uniform card height, image fills, text vertically centred.
      '#rooms-container .site-block-half{margin-bottom:0;overflow:hidden;}' +
      '#rooms-container .site-block-half .text{display:flex;flex-direction:column;justify-content:center;}' +
      '@media (min-width:992px){#rooms-container .site-block-half .text{min-height:460px;}}' +
      // Sliding photo gallery on each room card.
      '.room-gallery{position:relative;width:100%;min-height:320px;overflow:hidden;}' +
      '@media (min-width:992px){.room-gallery{width:50%;min-height:460px;}}' +
      '.rg-slides{position:absolute;inset:0;}' +
      '.rg-slide{position:absolute;inset:0;display:block;background-size:cover;background-position:center;opacity:0;transition:opacity .6s ease;}' +
      '.rg-slide.is-active{opacity:1;}' +
      '.rg-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:42px;height:42px;border:none;border-radius:50%;background:rgba(20,20,20,.42);color:#fff;font-size:24px;line-height:1;cursor:pointer;opacity:0;transition:opacity .25s,background .2s;}' +
      '.room-gallery:hover .rg-arrow{opacity:1;}' +
      '.rg-arrow:hover{background:rgba(20,20,20,.7);}' +
      '.rg-prev{left:12px;}.rg-next{right:12px;}' +
      '.rg-dots{position:absolute;bottom:14px;left:0;right:0;display:flex;justify-content:center;gap:7px;z-index:3;}' +
      '.rg-dot{width:8px;height:8px;border-radius:50%;border:none;background:rgba(255,255,255,.55);cursor:pointer;padding:0;transition:background .2s,width .2s;}' +
      '.rg-dot.is-active{background:#ffba5a;}' +
      '@media (hover:none){.rg-arrow{opacity:1;}}';
    var s = document.createElement('style');
    s.id = 'tgh-room-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // Each room type gets a curated set of real photos (matched by bed config from the
  // owner's photo set), shown as a sliding gallery on the room card.
  function roomGallery(title) {
    var t = String(title || '').toLowerCase();
    var G = {
      single: ['images/rooms/single-1.jpg', 'images/rooms/single-2.jpg', 'images/rooms/single-3.jpg', 'images/rooms/single-4.jpg'],
      twin: ['images/rooms/twin-1.jpg', 'images/rooms/twin-2.jpg', 'images/rooms/twin-3.jpg', 'images/rooms/twin-4.jpg'],
      twinbalcony: ['images/rooms/twinbalcony-1.jpg', 'images/rooms/twinbalcony-2.jpg', 'images/rooms/twinbalcony-3.jpg', 'images/rooms/twinbalcony-4.jpg'],
      triple: ['images/rooms/triple-1.jpg', 'images/rooms/triple-2.jpg', 'images/rooms/triple-3.jpg', 'images/rooms/triple-4.jpg'],
      family: ['images/rooms/family-1.jpg', 'images/rooms/family-2.jpg', 'images/rooms/family-3.jpg', 'images/rooms/family-4.jpg'],
      cityview: [{ video: 'media/rooms/cityview.mp4', poster: 'media/rooms/cityview-poster.jpg' }, 'images/rooms/cityview-1.jpg', 'images/rooms/cityview-2.jpg', 'images/rooms/cityview-3.jpg', 'images/rooms/cityview-4.jpg']
    };
    if (/single/.test(t)) return G.single;
    if (/triple/.test(t)) return G.triple;
    if (/family|queen\s*suite/.test(t)) return G.family;
    if (/twin/.test(t) && /balcony/.test(t)) return G.twinbalcony;
    if (/twin/.test(t)) return G.twin;
    if (/city|view/.test(t)) return G.cityview;
    return G.twin;
  }

  function roomCard(entry, i) {
    var a = entry.attributes || entry;
    var id = entry.id;
    var href = 'reservation.html?room=' + encodeURIComponent(id); // carry the room into the booking form
    var media = a.img && a.img.data;
    var url = media && media.length ? mediaUrl(media[0].attributes.url) : null;
    var right = i % 2 === 1; // alternate the image side, like the original layout
    // Sliding gallery of type-matched photos (API photo first if one is uploaded).
    var imgs = roomGallery(a.title);
    if (url) imgs = [url].concat(imgs);
    var slides = imgs.map(function (u, idx) {
      var active = idx === 0 ? ' is-active' : '';
      if (u && u.video) {
        return '<div class="rg-slide rg-slide-video' + active + '" role="img" aria-label="' + esc(a.title) + ' video tour">' +
          '<video muted loop playsinline preload="metadata" poster="' + u.poster + '"><source src="' + u.video + '" type="video/mp4"></video>' +
          '<span class="rg-play" aria-hidden="true">&#9658;</span></div>';
      }
      return '<div class="rg-slide' + active + '" ' +
        'style="background-image:url(\'' + u + '\');" role="img" aria-label="' + esc(a.title) + ' photo ' + (idx + 1) + '"></div>';
    }).join('');
    var dots = imgs.map(function (u, idx) {
      return '<button type="button" class="rg-dot' + (idx === 0 ? ' is-active' : '') + '" data-idx="' + idx + '" aria-label="Go to photo ' + (idx + 1) + '"></button>';
    }).join('');
    var gallery =
      '<div class="room-gallery' + (right ? ' order-2' : '') + '" data-imgs="' + encodeURIComponent(JSON.stringify(imgs)) + '" data-title="' + esc(a.title) + '">' +
        '<div class="rg-slides">' + slides + '</div>' +
        '<button type="button" class="rg-arrow rg-prev" aria-label="Previous photo">‹</button>' +
        '<button type="button" class="rg-arrow rg-next" aria-label="Next photo">›</button>' +
        '<div class="rg-dots">' + dots + '</div>' +
      '</div>';
    var chips = roomFeatures(a.title, a.discription).map(function (x) {
      return '<div class="tgh-feat">' + featIcon(x[0]) + '<span>' + esc(x[1]) + '</span></div>';
    }).join('');
    return (
      '<div class="site-block-half d-block d-lg-flex bg-white" data-aos="fade">' +
        gallery +
        '<div class="text' + (right ? ' order-1' : '') + ' bg-light bg-gradient bg-opacity-20">' +
          '<h2 class="mb-2">' + esc(a.title) + '</h2>' +
          '<p class="tgh-lead">' + esc(shortLead(a.discription)) + '</p>' +
          '<div class="tgh-feats">' + chips + '</div>' +
          '<p class="mb-0"><a href="' + href + '" class="btn btn-primary text-white">Book Now</a></p>' +
        '</div>' +
      '</div>'
    );
  }

  // --- Reservation room selector (reservation.html) ---
  function loadRoomOptions() {
    var sel = document.getElementById('room');
    if (!sel) return;
    var wanted = new URLSearchParams(window.location.search).get('room');
    fetch(API + '/api/rooms?filters[isdisplay][$eq]=true&sort=price:asc')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (res) {
        var rooms = (res && res.data) || [];
        sel.innerHTML = '<option value="">Select a room…</option>' + rooms.map(function (e) {
          var a = e.attributes || e;
          var on = String(e.id) === String(wanted) ? ' selected' : '';
          return '<option value="' + e.id + '"' + on + '>' + esc(a.title) + '</option>';
        }).join('');
      })
      .catch(function (e) { console.warn('[TGH] could not load rooms for the selector:', e.message); });
  }

  function loadRooms() {
    var el = document.getElementById('rooms-container');
    if (!el) return;
    fetch(API + '/api/rooms?populate=*&filters[isdisplay][$eq]=true&sort=price:asc')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (res) {
        var rooms = (res && res.data) || [];
        if (!rooms.length) return; // nothing published yet — keep the static demo rooms
        ensureRoomStyles();
        el.innerHTML = rooms.map(roomCard).join('');
        initRoomGalleries();
      })
      .catch(function (e) { console.warn('[TGH] rooms API unavailable, keeping static content:', e.message); });
  }

  // Wire up each room card's sliding gallery: autoplay + arrows + dots, pause on hover.
  function initRoomGalleries() {
    var galleries = document.querySelectorAll('#rooms-container .room-gallery');
    Array.prototype.forEach.call(galleries, function (g) {
      var slides = g.querySelectorAll('.rg-slide');
      var dots = g.querySelectorAll('.rg-dot');
      var idx = 0, timer;
      // Parse this room's photo set + open it in the lightbox when the photo is clicked.
      var imgs = [];
      try { imgs = JSON.parse(decodeURIComponent(g.getAttribute('data-imgs') || '[]')); } catch (e) { imgs = []; }
      var title = g.getAttribute('data-title') || '';
      var wrap = g.querySelector('.rg-slides');
      if (wrap && imgs.length && window.TGHLightbox) {
        wrap.style.cursor = 'zoom-in';
        wrap.addEventListener('click', function () {
          window.TGHLightbox.open(imgs.map(function (u) {
            return (u && u.video) ? { video: u.video, poster: u.poster, alt: title } : { full: u, alt: title };
          }), idx);
        });
      }
      // Autoplay any inline video slide (muted loop preview).
      Array.prototype.forEach.call(g.querySelectorAll('.rg-slide-video video'), function (v) {
        var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
      });
      if (slides.length < 2) { // single photo — hide slider controls (lightbox still works)
        Array.prototype.forEach.call(g.querySelectorAll('.rg-arrow'), function (b) { b.style.display = 'none'; });
        var dc = g.querySelector('.rg-dots'); if (dc) dc.style.display = 'none';
        return;
      }
      function show(n) {
        idx = (n + slides.length) % slides.length;
        Array.prototype.forEach.call(slides, function (s, k) { s.classList.toggle('is-active', k === idx); });
        Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle('is-active', k === idx); });
      }
      function play() { clearInterval(timer); timer = setInterval(function () { show(idx + 1); }, 4500); }
      g.querySelector('.rg-next').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); show(idx + 1); play(); });
      g.querySelector('.rg-prev').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); show(idx - 1); play(); });
      Array.prototype.forEach.call(dots, function (d) {
        d.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); show(+d.getAttribute('data-idx')); play(); });
      });
      g.addEventListener('mouseenter', function () { clearInterval(timer); });
      g.addEventListener('mouseleave', play);
      play();
    });
  }

  // --- Reviews (review.html) ---
  function stars(n) {
    n = Number(n) || 0;
    var out = '';
    for (var i = 0; i < 5; i++) out += i < n ? '★' : '☆';
    return out;
  }

  // Initials avatar: no photo field on reviews, and stock faces would misrepresent
  // real guests — so render a clean coloured circle with the guest's initials.
  function initials(name) {
    var parts = String(name || '').trim().split(/[\s-]+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function avatarColor(name) {
    var palette = ['#8e4d3b', '#3b6ea5', '#4b7a52', '#8a5a9e', '#b5852f', '#487b7b', '#a24d5c', '#5b6a8a'];
    var h = 0, s = String(name || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  }

  function reviewCard(entry) {
    var a = entry.attributes || entry;
    var name = a.full_name || '';
    return (
      '<div class="ts-item">' +
        '<div style="width:60px;height:60px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:600;background:' + avatarColor(name) + ';">' + esc(initials(name)) + '</div>' +
        '<div style="color:#f0a500;font-size:16px;letter-spacing:2px;margin-bottom:10px;">' + stars(a.rating) + '</div>' +
        '<p style="color:#555;font-size:14.5px;line-height:1.6;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">' + esc(a.description) + '</p>' +
        '<div style="color:#222;font-weight:600;font-size:15px;margin-top:auto;">' + esc(name) + '</div>' +
      '</div>'
    );
  }

  // Reliable review slider (autoplay + arrows + responsive). Replaces the
  // template's owl-carousel, whose re-init on injected content is unreliable.
  function buildSlider(el, opts) {
    opts = opts || {};
    var interval = opts.interval || 5000;
    var originals = Array.prototype.slice.call(el.children);
    if (!originals.length) return;
    // Break out of the narrow Bootstrap column so 5 cards have room to breathe.
    var col = el.closest('[class*="col-"]');
    if (col) { col.style.maxWidth = '100%'; col.style.flex = '0 0 100%'; col.style.marginLeft = '0'; col.style.marginRight = '0'; }
    el.setAttribute('style', 'position:relative;overflow:hidden;max-width:1500px;margin:0 auto;padding:0 6px;');
    var track = document.createElement('div');
    track.setAttribute('style', 'display:flex;');
    originals.forEach(function (c) {
      c.setAttribute('style', 'background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.07);padding:26px 22px;text-align:center;height:280px;display:flex;flex-direction:column;justify-content:flex-start;box-sizing:border-box;margin:0;');
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

  function loadReviews() {
    if (typeof window.jQuery === 'undefined') return;
    var $ = window.jQuery;
    var $c = $('.js-carousel-2');
    if (!$c.length) return;
    fetch(API + '/api/reviews?sort=createdAt:desc')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (res) {
        var items = (res && res.data) || [];
        if (!items.length) return; // no reviews yet — keep the static content
        try { $c.trigger('destroy.owl.carousel'); } catch (e) { /* ignore */ }
        var el = $c[0];
        el.className = '';
        el.innerHTML = items.map(reviewCard).join('');
        buildSlider(el, { interval: 4500 });
      })
      .catch(function (e) { console.warn('[TGH] reviews API unavailable, keeping static content:', e.message); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadRooms();
    loadReviews();
    loadRoomOptions();
  });
})();
