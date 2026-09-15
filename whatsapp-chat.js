/* ---------------------------------------------------------------------------
 * DMI WhatsApp chat bubble
 *
 * The floating "Chat with us" button, bottom-right, on every content page.
 * It does not link to WhatsApp directly — it opens the lead gate in
 * whatsapp-gate.js, which collects the details the Sendy sequence needs and
 * then opens the chat. whatsapp-gate.js must load before this file.
 *
 * Deliberately NOT included on apply.html, enroll.html and join.html — those
 * are distraction-free conversion pages that carry no nav, no footer and no
 * popup either. The only way off them is the form.
 *
 * Everything about where the chat actually points, and the fields collected
 * on the way, lives in whatsapp-gate.js. This file is only the bubble.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var LABEL = 'Chat with us';
  var ARIA = 'Chat with DMI on WhatsApp';
  var LEAD_SOURCE = 'whatsapp-float';

  var CSS = [
    /* Below the gate overlay (10000), the cohort popup (9999) and the consent
       banner (1000) on purpose: when any of those is up, the bubble belongs
       behind it. */
    '.dmi-wa{position:fixed;right:1.25rem;bottom:1.25rem;z-index:900;',
    'font-family:var(--font,sans-serif)}',

    '.dmi-wa-btn{display:inline-flex;align-items:center;gap:.6rem;',
    'padding:.85rem;border:0;border-radius:999px;background:#25D366;color:#fff;',
    'font-family:inherit;font-size:.95rem;font-weight:700;line-height:1;cursor:pointer;',
    'box-shadow:0 6px 20px rgba(0,0,0,.18);',
    'transition:transform .18s ease,box-shadow .18s ease,background .18s ease}',
    '.dmi-wa-btn:hover{background:#1fb356;transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.24)}',
    '.dmi-wa-btn:focus-visible{outline:3px solid #0f0f0f;outline-offset:3px}',
    '.dmi-wa-btn svg{width:26px;height:26px;fill:currentColor;flex:0 0 auto;display:block}',
    '.dmi-wa-btn span{padding-right:.5rem}',

    /* Icon-only on phones: a pill that wide competes with the page itself. */
    '@media (max-width:640px){.dmi-wa{right:1rem;bottom:1rem}.dmi-wa-btn span{display:none}.dmi-wa-btn{padding:.9rem}}',
    '@media (prefers-reduced-motion:reduce){.dmi-wa-btn{transition:none}.dmi-wa-btn:hover{transform:none}}'
  ].join('');

  function build() {
    if (!window.DMIWhatsAppGate) return;   // gate script missing — show nothing

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.className = 'dmi-wa';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dmi-wa-btn';
    btn.setAttribute('aria-label', ARIA);
    btn.innerHTML = window.DMIWhatsAppGate.icon + '<span>' + LABEL + '</span>';
    btn.addEventListener('click', function () {
      window.DMIWhatsAppGate.open({ leadSource: LEAD_SOURCE });
    });

    root.appendChild(btn);
    document.body.appendChild(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
