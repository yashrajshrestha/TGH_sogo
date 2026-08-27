/* Trips & tours listing.
 *
 * Renders the article grid on events.html (all posts) and the three-card
 * teaser on index.html (latest three). Static-first: the bundled copy in
 * js/blog-data.js paints immediately so the grid is real with no backend
 * running, then the PHP API replaces it if it is reachable. Previously the
 * page shipped hardcoded placeholder cards and only the API could fix them,
 * which meant Lorem Ipsum whenever the API was down or absent (localhost). */
(function () {
  var mounts = [
    { el: document.getElementById('blogs-list'), limit: 0 },  // events.html — all
    { el: document.getElementById('blogs'),      limit: 3 }   // index.html — latest 3
  ].filter(function (m) { return m.el; });
  if (!mounts.length) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fmtDate(v) {
    if (!v) return '';
    var d = new Date(String(v).length === 10 ? v + 'T00:00:00' : v);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Header images are stored with a leading slash in the DB and relatively in
  // the bundled copy; the pages are served from the site root either way.
  function img(u) { return u ? String(u).replace(/^\//, '') : 'images/hotel/tgh-3.jpg'; }

  function card(p, i) {
    var href  = 'blog.html?id=' + p.id;
    var intro = String(p.introduction || p.description || '')
                  .replace(/[#*_>`]/g, '').replace(/<[^>]*>/g, '').trim();
    if (intro.length > 150) intro = intro.slice(0, 150).replace(/\s+\S*$/, '') + '…';
    return '<div class="col-lg-4 col-md-6 col-sm-6 col-12 post mb-5" data-aos="fade-up"' +
             ' data-aos-delay="' + ((i % 3) + 1) * 100 + '">' +
             '<div class="media media-custom d-block mb-4 h-100">' +
               '<a href="' + href + '" class="mb-4 d-block">' +
                 '<img loading="lazy" decoding="async" src="' + esc(img(p.header_img)) + '"' +
                 ' alt="' + esc(p.title) + '" class="img-fluid"></a>' +
               '<div class="media-body">' +
                 '<span class="meta-post">' + esc(fmtDate(p.date)) + '</span>' +
                 '<h2 class="mt-0 mb-3"><a href="' + href + '">' + esc(p.title) + '</a></h2>' +
                 '<p>' + esc(intro) + '</p>' +
               '</div>' +
             '</div>' +
           '</div>';
  }

  function newestFirst(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); }

  function render(posts) {
    if (!posts.length) return;
    posts = posts.slice().sort(newestFirst);
    mounts.forEach(function (m) {
      m.el.innerHTML = (m.limit ? posts.slice(0, m.limit) : posts).map(card).join('');
    });
  }

  render(window.TGH_BLOGS || []);

  fetch('/api/blogs?populate=*&sort=createdAt:desc')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      var items = (res && res.data) || [];
      if (!items.length) return;                       // keep the bundled copy
      render(items.map(function (b) {
        var a  = b.attributes || b;
        var hi = a.header_img && a.header_img.data
                   ? a.header_img.data.attributes.url : a.header_img;
        return {
          id: b.id, title: a.title, introduction: a.introduction,
          description: a.description, header_img: hi,
          date: a.publishedAt || a.createdAt || a.published_at || a.created_at
        };
      }));
    })
    .catch(function (e) {
      console.warn('[TGH] blogs API unavailable, showing bundled articles:', e.message);
    });
})();
