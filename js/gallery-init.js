/* Gallery page: build filterable grid from TGH_GALLERY, open lightbox on click. */
(function () {
  var data = window.TGH_GALLERY || {};
  var cats = Object.keys(data);
  var filters = document.getElementById('galleryFilters');
  var grid = document.getElementById('galleryGrid');
  if (!filters || !grid) return;
  var all = [];
  cats.forEach(function (c) { data[c].forEach(function (it) { var o = {}; for (var k in it) o[k] = it[k]; o.cat = c; all.push(o); }); });

  function render(cat) {
    var items = cat === 'All' ? all : all.filter(function (x) { return x.cat === cat; });
    grid.innerHTML = items.map(function (it, i) {
      return '<button type="button" class="tgh-tile" data-i="' + i + '"><img loading="lazy" src="' + it.thumb + '" alt="' + it.alt + '"></button>';
    }).join('');
    Array.prototype.forEach.call(grid.querySelectorAll('.tgh-tile'), function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-i');
        window.TGHLightbox.open(items.map(function (x) { return { full: x.full, alt: x.alt }; }), i);
      });
    });
    Array.prototype.forEach.call(filters.children, function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
    });
  }

  var tabs = ['All'].concat(cats);
  filters.innerHTML = tabs.map(function (c) { return '<button type="button" class="tgh-gf" data-cat="' + c + '">' + c + '</button>'; }).join('');
  Array.prototype.forEach.call(filters.children, function (btn) {
    btn.addEventListener('click', function () { render(btn.getAttribute('data-cat')); });
  });
  render('All');
})();
