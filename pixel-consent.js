// Cookie consent banner + conditional Meta Pixel loader.
// Pixel does not fire until the visitor accepts — default is privacy-preserving (no tracking until opt-in).
(function () {
  var CONSENT_KEY = 'dmi_analytics_consent';
  var PIXEL_ID = '591598162417830';

  function loadMetaPixel() {
    if (window.fbq) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
  }

  var consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'granted') {
    loadMetaPixel();
    return;
  }
  if (consent === 'declined') {
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.createElement('div');
    banner.id = 'dmi-consent-banner';
    banner.innerHTML =
      '<div class="dmi-consent-inner">' +
      '<p>We use analytics cookies to understand how visitors use this site.</p>' +
      '<div class="dmi-consent-actions">' +
      '<button type="button" id="dmi-consent-decline">Decline</button>' +
      '<button type="button" id="dmi-consent-accept">Accept</button>' +
      '</div></div>';
    document.body.appendChild(banner);

    document.getElementById('dmi-consent-accept').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'granted');
      loadMetaPixel();
      banner.remove();
    });
    document.getElementById('dmi-consent-decline').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'declined');
      banner.remove();
    });
  });
})();
