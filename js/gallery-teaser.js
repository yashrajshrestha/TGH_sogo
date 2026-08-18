/* Homepage gallery teaser: show a handful of photos, open lightbox on click. */
(function () {
  var el = document.getElementById('galleryTeaser');
  var data = window.TGH_GALLERY || {};
  if (!el) return;
  var all = [];
  Object.keys(data).forEach(function (c) { data[c].forEach(function (it) { all.push(it); }); });
  // pick a spread: first few rooms, dining, exterior
  var pick = [];
  ['Rooms', 'Dining', 'Cafe & Exterior', 'Rooms'].forEach(function (c, i) {
    (data[c] || []).slice(i === 3 ? 4 : 0, i === 3 ? 6 : 2).forEach(function (it) { pick.push(it); });
  });
  pick = pick.slice(0, 8);
  el.innerHTML = pick.map(function (it, i) {
    return '<a href="gallery.html" data-i="' + i + '"><img loading="lazy" src="' + it.thumb + '" alt="' + it.alt + '"></a>';
  }).join('');
  Array.prototype.forEach.call(el.querySelectorAll('a'), function (a) {
    a.addEventListener('click', function (e) {
      if (!window.TGHLightbox) return; // fall back to navigating to gallery.html
      e.preventDefault();
      window.TGHLightbox.open(pick.map(function (x) { return { full: x.full, alt: x.alt }; }), +a.getAttribute('data-i'));
    });
  });
})();
