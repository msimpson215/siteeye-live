/* Shared AI tab behaviour for the Prototype / Production pages. Mirrors index.html. */
(function () {
  var loggedIn = false;
  var modal = document.getElementById('leadModal');
  var panel = document.getElementById('axonPanel');
  if (!modal || !panel) return;

  function openLead() {
    modal.classList.remove('done-mode');
    document.getElementById('leadErr').textContent = '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeLead() {
    modal.classList.remove('open', 'done-mode');
    modal.setAttribute('aria-hidden', 'true');
  }
  function openAxon() {
    var f = document.getElementById('axonFrame');
    if (!f.getAttribute('src') || f.getAttribute('src') === 'about:blank') f.src = '/siteeye-ai.html';
    panel.classList.add('open');
  }
  function closeAxon() { panel.classList.remove('open'); }
  function startTalk() { if (loggedIn) openAxon(); else openLead(); }

  Array.prototype.forEach.call(document.querySelectorAll('[data-ai]'), function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); startTalk(); });
  });
  document.getElementById('axonClose').onclick = closeAxon;
  document.getElementById('axonScrim').onclick = closeAxon;
  document.getElementById('leadClose').onclick = closeLead;
  document.getElementById('leadScrim').onclick = closeLead;
  document.getElementById('leadDone').onclick = closeLead;

  document.getElementById('leadForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = document.getElementById('leadErr');
    var go = document.getElementById('leadGo');
    err.textContent = '';
    go.disabled = true;
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('leadEmail').value,
        phone: document.getElementById('leadPhone').value,
        marketing: document.getElementById('leadMarketing').checked
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok || !data.ok) {
          err.textContent = data.error || 'Something went wrong';
        } else {
          modal.classList.add('done-mode');
        }
      });
    }).catch(function () {
      err.textContent = 'Could not reach server';
    }).then(function () { go.disabled = false; });
  });

  fetch('/api/auth/status').then(function (r) { return r.json(); }).then(function (s) {
    loggedIn = Boolean(s && s.loggedIn);
  }).catch(function () {});

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAxon(); closeLead(); }
  });
})();