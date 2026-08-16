// Meta Pixel loader.
//
// The pixel loads on every page view — there is no consent banner. Deliberate call
// (Pravin, 2026-08-16): paid traffic is India-only, and India's DPDP Act doesn't
// require prior opt-in for analytics cookies.
//
// This replaced an opt-in-everywhere banner that was actively breaking the ads. Every
// ad click is a first-time visitor; they landed, saw a cookie banner, ignored it, and
// the pixel never initialised. On 2026-08-16 that produced 0 landing page views and 0
// attribution against 8 real ad clicks, leaving the ad set's "maximize conversions"
// goal with no signal to optimise on.
//
// BEFORE RUNNING ADS IN THE EU/EEA/UK: this needs a consent gate again — GDPR requires
// opt-in before any tracking script loads. The banner markup and its styles are still
// in styles.css under "COOKIE CONSENT BANNER", so restoring it is mostly re-adding the
// branch here. Note the site is publicly reachable from the EU today (organic traffic,
// blog), so this is a known, accepted exposure rather than an unnoticed one.
(function () {
  var CONSENT_KEY = 'dmi_analytics_consent';
  var PIXEL_ID = '591598162417830';

  // Anyone who explicitly declined under the old banner stays opted out — their choice
  // shouldn't be silently reversed by this change. Nothing sets this value any more, so
  // it only ever matches visitors who clicked Decline before 2026-08-16.
  if (localStorage.getItem(CONSENT_KEY) === 'declined') return;

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
    bindOutboundClickTracking();
  }

  // Fires a custom event when a visitor clicks through to University (the
  // enrollment site) — mirrors Plausible's "Outbound Link: Click" goal so the
  // same action can become a Meta custom conversion once it's observed firing.
  function bindOutboundClickTracking() {
    document.addEventListener('click', function (e) {
      var link = e.target && e.target.closest && e.target.closest('a[href]');
      if (!link) return;
      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }
      if (url.hostname === 'university.pravinmishra.com') {
        fbq('trackCustom', 'OutboundClickUniversity', { destination_url: url.href });
      }
    }, true);
  }

  loadMetaPixel();
})();
