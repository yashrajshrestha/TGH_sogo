/* Homepage Photos preview: a limited spread of gallery photos, lightbox on click,
   with a "View full gallery" button elsewhere in the section linking to gallery.html. */
(function () {
  var el = document.getElementById('galleryTeaser');
  var data = window.TGH_GALLERY || {};
  if (!el) return;
  var pick = [];
  (data['Rooms'] || []).slice(0, 4).forEach(function (it) { pick.push(it); });
  (data['Dining'] || []).slice(0, 2).forEach(function (it) { pick.push(it); });
  (data['Cafe & Exterior'] || []).slice(0, 2).forEach(function (it) { pick.push(it); });
  pick = pick.slice(0, 8);
  el.innerHTML = pick.map(function (it, i) {
    return '<button type="button" class="tgh-tile" data-i="' + i + '"><img loading="lazy" decoding="async" src="' + it.thumb + '" alt="' + it.alt + '"></button>';
  }).join('');
  Array.prototype.forEach.call(el.querySelectorAll('.tgh-tile'), function (b) {
    b.addEventListener('click', function () {
      if (!window.TGHLightbox) return;
      window.TGHLightbox.open(pick.map(function (x) { return { full: x.full, alt: x.alt }; }), +b.getAttribute('data-i'));
    });
  });
})();
