(function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/live/sw.js', { scope: '/live/' }).catch(() => {});
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  const btn = document.getElementById('installBtn');
  const hint = document.getElementById('installHint');
  const getApp = document.getElementById('getApp');
  const joinBtn = document.getElementById('joinBtn');
  const joinTitle = document.getElementById('joinTitle');

  if (standalone) {
    if (getApp) getApp.classList.add('hide');
    if (joinTitle) joinTitle.classList.remove('hide');
    if (joinBtn) {
      joinBtn.className = 'go';
      joinBtn.textContent = 'See the live camera';
    }
    return;
  }

  const isJoe = Boolean(getApp);

  if (!btn) return;

  const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!mobile) {
    btn.hidden = true;
    if (hint) {
      hint.hidden = false;
      hint.textContent = isJoe
        ? 'Joe should open this on his phone, not a computer. On the phone, tap Download the app.'
        : 'No download on a computer. This page is already the camera. On a phone, Chrome can put SiteEye on the home screen.';
    }
    return;
  }

  btn.hidden = false;
  btn.textContent = 'Download the app';
  let deferred = null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.textContent = 'Download the app';
  });

  btn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      if (hint) {
        hint.hidden = false;
        hint.textContent = isJoe
          ? 'It is on your home screen. Open SiteEye from there, then type the 4 letters.'
          : 'It is on your home screen. Open that icon next time you run the camera.';
      }
      return;
    }
    if (hint) {
      hint.hidden = false;
      hint.textContent = ios
        ? 'Safari: tap Share, then Add to Home Screen.'
        : (isJoe
          ? 'Chrome: tap the three dots, then Add to Home screen / Install app. Open that icon, then type the 4 letters.'
          : 'Chrome: tap the three dots, then Add to Home screen / Install app.');
    }
  });
})();
