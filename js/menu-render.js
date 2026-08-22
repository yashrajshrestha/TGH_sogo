/* Render the Black Olives Cafe menu (tabs + categorised item rows). */
(function () {
  var data = window.TGH_MENU || {};
  var tabsEl = document.getElementById('menuTabs');
  var bodyEl = document.getElementById('menuBody');
  if (!tabsEl || !bodyEl) return;
  var keys = Object.keys(data);
  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  // Photographed dishes get a small thumbnail inline beside the name, like a
  // real restaurant menu. Keyed by exact item name (only these have photos).
  var PHOTO = {
    'Croissant Breakfast': 'croissant-breakfast.webp',
    'MoMo — vegetable or chicken': 'momo.webp',
    'Pad Thai — vegetable / chicken / prawn': 'pad-thai.webp',
    'Margherita / Baby Corn & Mushroom': 'pizza.webp',
    'Black Olives King Burger': 'burger.webp',
    'Bolognese / Carbonara': 'carbonara.webp',
    'Cappuccino / Latte / Mocha': 'cappuccino.webp',
    'Virgin Mojito': 'mojito.webp'
  };
  // Prices are intentionally not rendered: the menu on the site is a taster,
  // not a price list. `price` stays in menu-data.js so it can come back easily.
  function itemHtml(it) {
    var desc = it.desc ? '<div class="mi-desc">' + esc(it.desc) + '</div>' : '';
    var img = PHOTO[it.name];
    var thumb = img ? '<img class="mi-thumb" src="images/menu/' + img + '" alt="" loading="lazy" width="56" height="56">' : '';
    var body = '<div class="mi-text"><div class="mi-head"><span class="mi-name">' + esc(it.name) +
      '</span></div>' + desc + '</div>';
    return '<div class="menu-item' + (img ? ' has-photo' : '') + '">' + thumb + body + '</div>';
  }
  function groupHtml(g) {
    return '<div class="menu-group" id="mg-' + slug(g.group) + '"><h4 class="menu-group-title">' + esc(g.group) + '</h4>' +
      g.items.map(itemHtml).join('') + '</div>';
  }
  function render(tab) {
    Array.prototype.forEach.call(tabsEl.children, function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
    bodyEl.innerHTML = (data[tab] || []).map(groupHtml).join('');
  }
  tabsEl.innerHTML = keys.map(function (k) { return '<button type="button" class="tgh-menu-tab" data-tab="' + esc(k) + '">' + esc(k) + '</button>'; }).join('');
  Array.prototype.forEach.call(tabsEl.children, function (b) { b.addEventListener('click', function () { render(b.getAttribute('data-tab')); }); });
  render(keys[0]);

  // The template's scroll plugins swallow native smooth scrolling, so tween by hand.
  function glideTo(el) {
    var header = document.querySelector('.site-header');
    var pad = (header ? header.offsetHeight : 0) + 18;
    var rect = el.getBoundingClientRect();
    var start = window.pageYOffset;
    var fits = rect.height < window.innerHeight - pad;
    var target = start + rect.top - (fits ? Math.max(pad, (window.innerHeight - rect.height) / 2) : pad);
    target = Math.max(0, Math.min(target, document.body.scrollHeight - window.innerHeight));
    var dist = target - start, t0 = null, dur = 460;
    if (Math.abs(dist) < 2) return;
    // No animation when the tab is backgrounded (rAF is paused there) or when
    // the visitor asked for reduced motion - just land on it.
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.hidden || still) { window.scrollTo(0, target); return; }
    requestAnimationFrame(function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;   // easeInOutQuad
      window.scrollTo(0, start + dist * e);
      if (p < 1) requestAnimationFrame(step);
    });
  }

  // Let the highlights strip open a tab and scroll to one group.
  window.TGHMenu = {
    show: function (tab, group) {
      if (!data[tab]) return;
      render(tab);
      var el = group && document.getElementById('mg-' + slug(group));
      glideTo(el || tabsEl);
      if (el) { el.classList.add('mg-flash'); setTimeout(function(){ el.classList.remove('mg-flash'); }, 1400); }
    }
  };
  var strip = document.getElementById('menuHighlights');
  if (strip) strip.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('.mh-card') : null;
    if (card) window.TGHMenu.show(card.getAttribute('data-tab'), card.getAttribute('data-group'));
  });
})();
