/* Contact form: validate and open the guest's email app addressed to the hotel.
   Works client-side (no backend needed). */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var status = document.getElementById('contactStatus');
  function val(id) { var el = form.querySelector('#' + id); return el ? el.value.trim() : ''; }
  function say(msg, ok) { if (status) { status.textContent = msg; status.className = 'mt-3 ' + (ok ? 'text-success' : 'text-danger'); } }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = val('name'), phone = val('phone'), email = val('email'), message = val('message');
    if (!name || !email || !message) { say('Please add your name, email and a message.', false); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say('That email address looks off — please check it.', false); return; }
    var subject = encodeURIComponent('Enquiry from ' + name + ' — Thamel Grand Hotel');
    var body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\nPhone: ' + phone + '\n\n' + message);
    window.location.href = 'mailto:info@thamelgrandhotel.com.np?subject=' + subject + '&body=' + body;
    say('Opening your email app… if nothing happens, write to us at info@thamelgrandhotel.com.np.', true);
  });
})();
