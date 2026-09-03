(function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/live/sw.js', { scope: '/live/' }).catch(() => {});
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (standalone) return;

  const btn = document.getElementById('installBtn');
  const hint = document.getElementById('installHint');
  if (!btn) return;

  const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!mobile) {
    btn.hidden = true;
    if (hint) {
      hint.hidden = false;
      hint.textContent = 'No download on a computer. This page is already the app. On a phone, Chrome can put a SiteEye icon on the home screen.';
    }
    return;
  }

  btn.hidden = false;
  let deferred = null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.textContent = 'Add SiteEye to this phone';
  });

  if (ios) btn.textContent = 'Add SiteEye to this phone';

  btn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      btn.hidden = true;
      if (hint) hint.hidden = true;
      return;
    }
    if (hint) {
      hint.hidden = false;
      hint.textContent = ios
        ? 'Safari: tap Share, then Add to Home Screen.'
        : 'Chrome: tap the three dots, then Add to Home screen / Install app.';
    }
  });
})();
