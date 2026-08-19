/* Homepage room grid: load the real rooms from the PHP API so it always matches rooms.html.
   Static cards remain as fallback if the API is down. */
(function () {
  var el = document.getElementById('homeRooms');
  if (!el) return;
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function roomImage(title) {
    var t = String(title || '').toLowerCase();
    if (/single/.test(t)) return 'images/rooms/single-1.jpg';
    if (/triple/.test(t)) return 'images/rooms/triple-1.jpg';
    if (/family|queen\s*suite/.test(t)) return 'images/rooms/family-1.jpg';
    if (/twin/.test(t) && /balcony/.test(t)) return 'images/rooms/twinbalcony-1.jpg';
    if (/twin/.test(t)) return 'images/rooms/twin-1.jpg';
    if (/double/.test(t)) return 'images/rooms/single-2.jpg';
    if (/city|view/.test(t)) return 'images/rooms/cityview-1.jpg';
    return 'images/rooms/twin-1.jpg';
  }
  fetch('/api/rooms?filters[isdisplay][$eq]=true&sort=price:asc')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      var rooms = (res && res.data) || [];
      if (!rooms.length) return; // keep static fallback
      el.innerHTML = rooms.map(function (e) {
        var a = e.attributes || e;
        var name = a.title || '';
        return '<div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up">' +
          '<a href="rooms.html" class="tgh-room-card">' +
            '<div class="rc-media"><img src="' + roomImage(name) + '" alt="' + esc(name) + '" loading="lazy" decoding="async"></div>' +
            '<div class="rc-body"><h3 class="rc-name">' + esc(name) + '</h3>' +
            '<span class="rc-cta">View room <span aria-hidden="true">&rarr;</span></span></div>' +
          '</a></div>';
      }).join('');
    })
    .catch(function (e) { console.warn('[TGH] home rooms unavailable, keeping static:', e.message); });
})();
