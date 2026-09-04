(function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/live/sw.js', { scope: '/live/' }).catch(() => {});
  }

  const ua = navigator.userAgent || '';
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  const btn = document.getElementById('installBtn');
  const hint = document.getElementById('installHint');
  const getApp = document.getElementById('getApp');
  const ios = /iphone|ipad|ipod/i.test(ua);

  if (standalone && getApp) getApp.classList.add('hide');
  if (!btn) return;

  const mobile = /android|iphone|ipad|ipod/i.test(ua);
  if (!mobile) {
    btn.hidden = true;
    return;
  }

  btn.hidden = false;
  let deferred = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
  });

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
        ? 'Safari: Share (square with the arrow) → Add to Home Screen. Optional. The live picture works from this page either way.'
        : 'Chrome: three dots → Add to Home screen. Optional. The live picture works from this page either way.';
    }
  });
})();
