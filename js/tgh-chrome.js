/* Thamel Grand Hotel — shared site chrome (DRY: header + footer defined once,
 * used on every page).
 *
 * Each page carries <div id="tgh-header"></div> (high in the body, followed by
 * this script) and <div id="tgh-footer"></div> (near the bottom). The header is
 * injected synchronously during parse — before main.js at the bottom — so the
 * template's main.js still binds the nav toggle and scroll "shrink" to the
 * .js-site-* classes. The footer is injected on DOMContentLoaded (its mount is
 * parsed after this script runs). Change the header/footer once here and every
 * page updates.
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

  // ---- Footer (injected on DOMContentLoaded; its mount is below this script) ----
  function injectFooter() {
    var fmount = document.getElementById('tgh-footer');
    if (!fmount) return;
    var year = new Date().getFullYear();
    fmount.outerHTML =
      '<footer class="section footer-section">' +
        '<div class="container">' +
          '<div class="row mb-4">' +
            '<div class="col-md-3 mb-5">' +
              '<ul class="list-unstyled link">' +
                '<li><a href="rooms.html">The Rooms &amp; Suites</a></li>' +
                '<li><a href="gallery.html">Gallery</a></li>' +
                '<li><a href="about.html">About Us</a></li>' +
                '<li><a href="contact.html">Contact Us</a></li>' +
                '<li><a href="index.html#restaurant">Restaurant</a></li>' +
              '</ul>' +
            '</div>' +
            '<div class="col-md-3 mb-5"></div>' +
            '<div class="col-md-3 mb-5 pr-md-5 contact-info"></div>' +
            '<div class="col-md-3 mb-5">' +
              '<p><span class="d-block"><span class="ion-ios-location h5 mr-3 text-primary"></span>Address:</span>' +
                '<span><a href="https://www.google.com/maps/place/Thamel+Grand+Hotel/@27.7170826,85.3098029,17z/data=!3m1!4b1!4m9!3m8!1s0x39eb18e33639aa63:0xd3a44de7c84b3bd3!5m2!4m1!1i2!8m2!3d27.7170826!4d85.3098029!16s%2Fg%2F1q62kbq1d?entry=ttu" target="_blank" rel="noopener">P885+RWM, Chaksibari Marg, Kathmandu 44600</a></span></p>' +
              '<p><span class="d-block"><span class="ion-ios-telephone h5 mr-3 text-primary"></span>Phone:</span> <span>01-4700296</span></p>' +
              '<p><span class="d-block"><span class="ion-ios-email h5 mr-3 text-primary"></span>Email:</span> <span>info@thamelgrandhotel.com.np</span></p>' +
            '</div>' +
          '</div>' +
          '<div class="row pt-5">' +
            '<p class="col-md-6 text-left">Copyright &copy; ' + year + ' All rights reserved</p>' +
            '<p class="col-md-6 text-right social">' +
              '<a href="https://www.tripadvisor.com/Hotel_Review-g293890-d6468795-Reviews-Thamel_Grand_Hotel-Kathmandu_Kathmandu_Valley_Bagmati_Zone_Central_Region.html" target="_blank" rel="noopener"><span class="fa fa-tripadvisor"></span></a>' +
              '<a href="https://www.facebook.com/thamelgrandhotel.np/" target="_blank" rel="noopener"><span class="fa fa-facebook"></span></a>' +
              '<a href="https://www.instagram.com/thamelgrandhotel2012/" target="_blank" rel="noopener"><span class="fa fa-instagram"></span></a>' +
              '<a href="https://www.booking.com/hotel/np/hamel-rand-otel-td.html" target="_blank" rel="noopener"><span class="fa fa-book"></span></a>' +
            '</p>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectFooter);
  else injectFooter();
})();
