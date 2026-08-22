/* Events/Explore page: load real blogs from the PHP API into the grid (static cards = fallback). */
(function () {
  var el = document.getElementById('blogs-list');
  if (!el) return;
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  fetch('/api/blogs?populate=*&sort=createdAt:desc')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      var items = (res && res.data) || [];
      if (!items.length) return; // keep static fallback
      el.innerHTML = items.map(function (b) {
        var a = b.attributes || b;
        var media = a.header_img && a.header_img.data;
        var img = media ? media.attributes.url : 'images/hotel/tgh-3.jpg';
        var date = a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '';
        var intro = String(a.introduction || a.description || '').replace(/<[^>]*>/g,'').trim().slice(0, 130);
        var href = 'blog.html?id=' + b.id;
        return '<div class="col-lg-4 col-md-6 col-sm-6 col-12 post mb-5" data-aos="fade-up">' +
          '<div class="media media-custom d-block mb-4 h-100">' +
            '<a href="' + href + '" class="mb-4 d-block"><img loading="lazy" decoding="async" src="' + img + '" alt="' + esc(a.title) + '" class="img-fluid"></a>' +
            '<div class="media-body">' +
              '<span class="meta-post">' + date + '</span>' +
              '<h2 class="mt-0 mb-3"><a href="' + href + '">' + esc(a.title) + '</a></h2>' +
              '<p>' + esc(intro) + '&hellip;</p>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    })
    .catch(function (e) { console.warn('[TGH] blogs list unavailable, keeping static:', e.message); });
})();
