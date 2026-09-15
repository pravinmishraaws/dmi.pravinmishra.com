/* ---------------------------------------------------------------------------
 * DMI WhatsApp
 *
 * Two things, one file:
 *   1. The floating "Chat with us" bubble, bottom-right, on every content page.
 *   2. The inline "Talk to us on WhatsApp" CTAs, bound by [data-wa-link].
 *
 * Both open WhatsApp directly. Deliberately NOT on apply.html, enroll.html and
 * join.html — those are distraction-free conversion pages whose only exit is
 * the form.
 *
 * WHY THERE IS NO LONGER A LEAD FORM IN FRONT OF THIS
 * There was one (whatsapp-gate.js, PR #328, removed in the next PR — it is in
 * git history if it is ever wanted back). Its justification was the Meta Lead
 * event with a hashed email. But the ads point at apply.html and join.html,
 * which are dedicated capture pages already doing that job properly — so the
 * gate duplicated the paid funnel while charging friction on the one channel
 * whose whole value is having none.
 *
 * The details the gate used to collect are now asked for inside WhatsApp, via
 * the Business app's automatic Greeting message. That asks the same questions
 * of someone who is already in a conversation, instead of asking them of
 * someone deciding whether to start one.
 *
 * THE OPENING MESSAGE IS THE ONLY CONTEXT THAT REACHES THE INBOX
 * Nothing posts anywhere any more, so each CTA's data-wa-text is the only way
 * to tell a campus enquiry from a blog reader's question. It ONLY works once
 * PHONE below is set: the wa.me/message/<code> short link cannot carry a
 * ?text= prefill — appending one is silently ignored. Until then every entry
 * point lands in the inbox looking identical.
 *
 * USAGE
 *   <button type="button" class="btn-whatsapp" data-wa-link
 *           data-lead-source="whatsapp-campus-hero"
 *           data-wa-text="Hi Pravin, ...">Talk to us on WhatsApp</button>
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  // WhatsApp Business short link, from the app: Settings → Business tools →
  // Short link. Used only while PHONE is empty.
  var SHORT_LINK = 'https://wa.me/message/ERUQWTNKIODIJ1';

  // Digits only, country code first, no '+' and no spaces (e.g. '919876543210').
  // Setting this switches every entry point to wa.me/<number>?text=... and
  // turns on the per-placement opening messages. Nothing else needs changing.
  var PHONE = '';

  var FLOAT_LABEL = 'Chat with us';
  var FLOAT_ARIA = 'Chat with DMI on WhatsApp';
  var DEFAULT_TEXT = 'Hi Pravin, I have a question about DMI.';

  function chatUrl(text) {
    if (!PHONE) return SHORT_LINK;
    return 'https://wa.me/' + PHONE + '?text=' +
      encodeURIComponent((text || DEFAULT_TEXT) +
        '\n\n(Asked from: ' + (document.title || location.pathname) + ')');
  }

  // Per-placement, so it stays possible to tell which of the eleven entry
  // points earns its space. Both are optional — the pixel is absent for anyone
  // who declined under the old consent banner, and Plausible can be blocked.
  function track(leadSource) {
    if (typeof window.plausible === 'function') {
      window.plausible('WhatsApp Chat', { props: { leadSource: leadSource || 'unknown' } });
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Contact', { content_name: leadSource || 'unknown' });
    }
  }

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 0C5.463 0 .16 5.303.16 11.88c0 2.096.549 4.14 1.595 5.945L.057 24l6.304-1.654a11.86 11.86 0 0 0 5.68 1.447h.005c6.576 0 11.88-5.303 11.88-11.88 0-3.176-1.237-6.163-3.482-8.409A11.82 11.82 0 0 0 12.04 0zm6.988 16.964c-.298.836-1.48 1.53-2.404 1.72-.66.14-1.522.25-4.421-.951-3.712-1.538-6.099-5.303-6.284-5.55-.184-.246-1.508-2.01-1.508-3.834 0-1.824.957-2.72 1.297-3.09.34-.37.74-.462.988-.462.246 0 .494 0 .71.011.227.011.532-.086.833.635.31.74 1.055 2.559 1.147 2.744.092.184.153.4.03.646-.122.246-.183.4-.364.615-.184.216-.386.482-.552.646-.184.184-.375.383-.161.752.216.37.958 1.583 2.055 2.563 1.412 1.258 2.6 1.646 2.97 1.83.37.185.586.154.8-.093.216-.246.926-1.08 1.174-1.45.246-.37.492-.309.83-.185.34.123 2.155 1.017 2.524 1.202.37.185.615.277.708.43.092.153.092.892-.208 1.727z"/></svg>';

  var CSS = [
    /* Float. z-index below the cohort popup (9999) and the consent banner
       (1000) on purpose: when either is up, the bubble belongs behind it. */
    '.dmi-wa{position:fixed;right:1.25rem;bottom:1.25rem;z-index:900;font-family:var(--font,sans-serif)}',
    '.dmi-wa-btn{display:inline-flex;align-items:center;gap:.6rem;padding:.85rem;border:0;',
    'border-radius:999px;background:#25D366;color:#fff;font-family:inherit;font-size:.95rem;',
    'font-weight:700;line-height:1;cursor:pointer;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.18);',
    'transition:transform .18s ease,box-shadow .18s ease,background .18s ease}',
    '.dmi-wa-btn:hover{background:#1fb356;transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.24)}',
    '.dmi-wa-btn:focus-visible{outline:3px solid #0f0f0f;outline-offset:3px}',
    '.dmi-wa-btn svg{width:26px;height:26px;fill:currentColor;flex:0 0 auto;display:block}',
    '.dmi-wa-btn span{padding-right:.5rem}',
    '@media (max-width:640px){.dmi-wa{right:1rem;bottom:1rem}.dmi-wa-btn span{display:none}.dmi-wa-btn{padding:.9rem}}',

    /* Inline CTA, secondary to whatever enroll/quote button it sits beside. */
    '.btn-whatsapp{display:inline-flex;align-items:center;gap:.5rem;padding:11px 22px;',
    'border:1px solid #25D366;border-radius:var(--radius,12px);background:#fff;color:#1a8f4c;',
    'font-family:var(--font,sans-serif);font-size:.95rem;font-weight:700;line-height:1.2;',
    'cursor:pointer;text-decoration:none;transition:background .18s ease,color .18s ease}',
    '.btn-whatsapp svg{width:18px;height:18px;fill:#25D366;flex:0 0 auto}',
    '.btn-whatsapp:hover{background:#25D366;color:#fff}',
    '.btn-whatsapp:hover svg{fill:#fff}',
    '.cta-banner .btn-whatsapp{background:transparent;border-color:rgba(255,255,255,.55);color:#fff}',
    '.cta-banner .btn-whatsapp svg{fill:#fff}',
    '.cta-banner .btn-whatsapp:hover{background:#25D366;border-color:#25D366;color:#fff}',

    /* Quieter text-link variant for "not sure which track?" lines. */
    '.wa-inline-note{font-size:.9rem;color:var(--text-muted,#666);margin-top:1rem}',
    '.wa-link{background:none;border:0;padding:0;font:inherit;color:#1a8f4c;font-weight:700;',
    'cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
    '.cta-banner .wa-inline-note{color:rgba(255,255,255,.85)}',
    '.cta-banner .wa-link{color:#fff}',

    '@media (prefers-reduced-motion:reduce){.dmi-wa-btn{transition:none}.dmi-wa-btn:hover{transform:none}}'
  ].join('');

  // At load, not lazily: these styles also cover the inline CTAs, which are in
  // the page markup and visible immediately.
  var style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // Delegated, so CTAs rendered after load work too.
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-wa-link]');
    if (!el) return;
    e.preventDefault();
    track(el.getAttribute('data-lead-source'));
    var w = window.open(chatUrl(el.getAttribute('data-wa-text')), '_blank');
    if (w) w.opener = null;
  });

  function buildFloat() {
    var root = document.createElement('div');
    root.className = 'dmi-wa';

    // A real link, so it is middle-clickable and Plausible's own outbound
    // tracking sees it as well.
    var a = document.createElement('a');
    a.className = 'dmi-wa-btn';
    a.href = chatUrl(DEFAULT_TEXT);
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', FLOAT_ARIA);
    a.innerHTML = ICON + '<span>' + FLOAT_LABEL + '</span>';
    a.addEventListener('click', function () { track('whatsapp-float'); });

    root.appendChild(a);
    document.body.appendChild(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildFloat);
  } else {
    buildFloat();
  }
})();
