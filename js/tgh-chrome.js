/* Thamel Grand Hotel — shared site header (DRY: defined once, used on every page).
 *
 * Each page carries only <div id="tgh-header"></div> followed by this script.
 * The script runs synchronously during parse (it sits high in the body, before
 * main.js at the bottom), so the template's main.js still binds the nav toggle
 * and the scroll "shrink" to the .js-site-* classes exactly as before.
 *
 * Change the header once here and every page updates.
 */
(function () {
  'use strict';
  var mount = document.getElementById('tgh-header');
  if (!mount) return;

  var NAV = [
    ['index.html', 'Home'],
    ['rooms.html', 'Rooms'],
    ['gallery.html', 'Gallery'],
    ['about.html', 'About'],
    ['events.html', 'Events'],
    ['contact.html', 'Contact'],
    ['reservation.html', 'Reservation']
  ];

  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (!here) here = 'index.html';

  var items = NAV.map(function (n) {
    var active = (n[0] === here) ? ' class="active"' : '';
    return '<li' + active + '><a href="' + n[0] + '">' + n[1] + '</a></li>';
  }).join('');

  mount.outerHTML =
    '<header class="site-header js-site-header">' +
      '<div class="container-fluid"><div class="row align-items-center">' +
        '<div class="col-6 col-lg-4 site-logo">' +
          '<img decoding="async" src="images/thamellogo-removebg-preview.png" alt="Thamel Grand Hotel" class="logo-size" style="height:56px;width:56px;">' +
          '<a href="index.html">Thamel Grand Hotel</a>' +
        '</div>' +
        '<div class="col-6 col-lg-8">' +
          '<div class="site-menu-toggle js-site-menu-toggle"><span></span><span></span><span></span></div>' +
          '<div class="site-navbar js-site-navbar"><nav role="navigation"><div class="container">' +
            '<div class="row full-height align-items-center"><div class="col-md-6 mx-auto">' +
              '<ul class="list-unstyled menu">' + items + '</ul>' +
            '</div></div>' +
          '</div></nav></div>' +
        '</div>' +
      '</div></div>' +
    '</header>';
})();
