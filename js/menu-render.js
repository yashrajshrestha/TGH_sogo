/* Render the Black Olives Cafe menu (tabs + categorised item rows). */
(function () {
  var data = window.TGH_MENU || {};
  var tabsEl = document.getElementById('menuTabs');
  var bodyEl = document.getElementById('menuBody');
  if (!tabsEl || !bodyEl) return;
  var keys = Object.keys(data);
  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }
  // Prices are intentionally not rendered: the menu on the site is a taster,
  // not a price list. `price` stays in menu-data.js so it can come back easily.
  function itemHtml(it) {
    var desc = it.desc ? '<div class="mi-desc">' + esc(it.desc) + '</div>' : '';
    return '<div class="menu-item"><div class="mi-head"><span class="mi-name">' + esc(it.name) +
      '</span></div>' + desc + '</div>';
  }
  function groupHtml(g) {
    return '<div class="menu-group"><h4 class="menu-group-title">' + esc(g.group) + '</h4>' +
      g.items.map(itemHtml).join('') + '</div>';
  }
  function render(tab) {
    Array.prototype.forEach.call(tabsEl.children, function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
    bodyEl.innerHTML = (data[tab] || []).map(groupHtml).join('');
  }
  tabsEl.innerHTML = keys.map(function (k) { return '<button type="button" class="tgh-menu-tab" data-tab="' + esc(k) + '">' + esc(k) + '</button>'; }).join('');
  Array.prototype.forEach.call(tabsEl.children, function (b) { b.addEventListener('click', function () { render(b.getAttribute('data-tab')); }); });
  render(keys[0]);
})();
