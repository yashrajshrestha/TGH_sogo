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
  function roomCard(entry, i) {
    var a = entry.attributes || entry;
    var id = entry.id;
    var href = 'reservation.html?room=' + encodeURIComponent(id); // carry the room into the booking form
    var media = a.img && a.img.data;
    var url = media && media.length ? mediaUrl(media[0].attributes.url) : null;
    var right = i % 2 === 1; // alternate the image side, like the original layout
    var bg = url || (right ? 'images/img_2.jpg' : 'images/img_1.jpg');
    return (
      '<div class="site-block-half d-block d-lg-flex bg-white" data-aos="fade">' +
        '<a href="' + href + '" class="image d-block bg-image-2' + (right ? ' order-2' : '') + '" ' +
          'style="background-image: url(\'' + bg + '\');"></a>' +
        '<div class="text' + (right ? ' order-1' : '') + ' bg-light bg-gradient bg-opacity-20">' +
          '<span class="d-block mb-4"><span class="display-4 text-primary">' + money(a.price) + '</span> ' +
            '<span class="text-uppercase letter-spacing-2">/ per night</span></span>' +
          '<h2 class="mb-4">' + esc(a.title) + '</h2>' +
          '<p>' + esc(a.discription) + '</p>' +
          '<p><a href="' + href + '" class="btn btn-primary text-white">Book Now</a></p>' +
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
          return '<option value="' + e.id + '"' + on + '>' + esc(a.title) + ' — ' + money(a.price) + '/night</option>';
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
        el.innerHTML = rooms.map(roomCard).join('');
      })
      .catch(function (e) { console.warn('[TGH] rooms API unavailable, keeping static content:', e.message); });
  }

  // --- Reviews (review.html) ---
  function stars(n) {
    n = Number(n) || 0;
    var out = '';
    for (var i = 0; i < 5; i++) out += i < n ? '★' : '☆';
    return out;
  }

  function reviewCard(entry, i) {
    var a = entry.attributes || entry;
    var img = 'images/person_' + ((i % 3) + 1) + '.jpg'; // no photo field — rotate the stock avatars
    return (
      '<div class="testimonial text-center slider-item">' +
        '<div class="author-image mb-3"><img src="' + img + '" alt="' + esc(a.full_name) + '" class="rounded-circle mx-auto"></div>' +
        '<blockquote>' +
          '<p style="color:#f0a500;font-size:18px;letter-spacing:3px;margin-bottom:10px">' + stars(a.rating) + '</p>' +
          '<p>&ldquo;' + esc(a.description) + '&rdquo;</p>' +
        '</blockquote>' +
        '<p><em>&mdash; ' + esc(a.full_name) + '</em></p>' +
      '</div>'
    );
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
        if (!items.length) return; // no reviews yet — keep the static owl carousel
        // main.js turned this into an owl carousel on the static items. Owl's
        // destroy/re-init on swapped content is unreliable (stale instance +
        // its base `display:none` rule), so replace it with a plain responsive
        // grid of the live reviews — dropping owl-carousel avoids that rule.
        try { $c.trigger('destroy.owl.carousel'); } catch (e) { /* ignore */ }
        $c.removeClass('owl-carousel owl-loaded owl-hidden owl-drag owl-theme js-carousel-2');
        $c.css({ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '28px' });
        $c.html(items.map(reviewCard).join(''));
        $c.children('.testimonial').css({ flex: '1 1 300px', maxWidth: '360px' });
      })
      .catch(function (e) { console.warn('[TGH] reviews API unavailable, keeping static content:', e.message); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadRooms();
    loadReviews();
    loadRoomOptions();
  });
})();
