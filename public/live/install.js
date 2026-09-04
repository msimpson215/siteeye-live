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
  const joinBtn = document.getElementById('joinBtn');
  const joinTitle = document.getElementById('joinTitle');
  const titleEl = document.getElementById('getAppTitle');
  const copyEl = document.getElementById('getAppCopy');

  if (standalone) {
    if (getApp) getApp.classList.add('hide');
    if (joinTitle) joinTitle.classList.remove('hide');
    if (joinBtn) {
      joinBtn.className = 'go';
      joinBtn.textContent = 'View live camera';
    }
    return;
  }

  const isJoe = Boolean(getApp);
  const ios = /iphone|ipad|ipod/i.test(ua);
  const iosChrome = ios && /crios/i.test(ua);
  const iosOther = ios && /fxios|edgios|opios|instagram|fbav|line\//i.test(ua);
  const iosSafari = ios && !iosChrome && !iosOther;

  if (isJoe && ios && (iosChrome || iosOther)) {
    if (titleEl) titleEl.textContent = 'Open this in Safari';
    if (copyEl) {
      copyEl.textContent = iosChrome
        ? 'iPhone needs Safari for this, not Chrome. Tap the Share icon, then Open in Safari. Then Add to Home Screen.'
        : 'This opened inside another app. Tap Share, then Open in Safari. Then Add to Home Screen.';
    }
    if (btn) btn.textContent = 'Use Safari';
    if (hint) {
      hint.hidden = false;
      hint.textContent = 'Safari: Share (the square with the arrow) → Add to Home Screen. Then open the SiteEye icon and enter the site code.';
    }
  } else if (isJoe && iosSafari) {
    if (titleEl) titleEl.textContent = 'Add SiteEye to this iPhone';
    if (copyEl) copyEl.textContent = 'Safari: tap Share, then Add to Home Screen. Open that icon, then enter the site code.';
    if (btn) btn.textContent = 'Add to Home Screen';
    if (hint) {
      hint.hidden = false;
      hint.textContent = 'Bottom of Safari: Share (square with arrow) → Add to Home Screen → Add. There is no App Store file to download.';
    }
  }

  if (!btn) return;

  const mobile = /android|iphone|ipad|ipod/i.test(ua);
  if (!mobile) {
    btn.hidden = true;
    if (hint) {
      hint.hidden = false;
      hint.textContent = isJoe
        ? 'Open this on a phone, then add it to the home screen.'
        : 'No download on a computer. On a phone, Chrome or Safari can put SiteEye on the home screen.';
    }
    return;
  }

  btn.hidden = false;
  if (!ios) btn.textContent = 'Download the app';
  let deferred = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    if (!ios) btn.textContent = 'Download the app';
  });

  btn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      if (hint) {
        hint.hidden = false;
        hint.textContent = isJoe
          ? 'SiteEye is on your home screen. Open that icon, then enter the site code.'
          : 'It is on your home screen. Open that icon next time you run the camera.';
      }
      return;
    }
    if (hint) {
      hint.hidden = false;
      hint.textContent = ios
        ? 'Safari: Share (square with the arrow) → Add to Home Screen → Add. Then open the SiteEye icon.'
        : (isJoe
          ? 'Chrome: tap the three dots, then Add to Home screen / Install app. Open that icon, then enter the site code.'
          : 'Chrome: tap the three dots, then Add to Home screen / Install app.');
    }
  });
})();
