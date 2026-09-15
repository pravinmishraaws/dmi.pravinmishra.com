/* ---------------------------------------------------------------------------
 * DMI WhatsApp chat bubble
 *
 * One self-contained file, same pattern as cohort-popup.js: it injects its own
 * styles and markup, so a page only needs this one <script> line to get it.
 *
 * Deliberately NOT included on apply.html, enroll.html and join.html — those
 * are distraction-free conversion pages that carry no nav, no footer and no
 * popup either. The only way off them is the form.
 *
 * WHY A LINK AND NOT A REAL IN-PAGE CHAT
 * WhatsApp has no first-party embeddable chat widget. Every "WhatsApp widget"
 * you see on other sites is either a third-party product (Wati, AiSensy,
 * Respond.io — needs the paid Cloud API, and the number stops working in the
 * phone app) or exactly this: a styled button that hands off to WhatsApp. This
 * is the free, no-dependency, no-tracking-script version.
 *
 * SHORT LINK vs. PHONE NUMBER — read before "fixing" the missing prefill
 * CONFIG.shortLink is the wa.me/message/<code> link from the WhatsApp Business
 * app (Settings -> Business tools -> Short link). It carries the greeting set
 * in the app, and it CANNOT take a ?text= prefill — appending one is ignored.
 * So every visitor currently arrives in the inbox saying the same thing.
 *
 * To get per-topic prefilled openers instead, put the plain number in
 * CONFIG.phone (digits only, country code first, no + or spaces) and the widget
 * switches to wa.me/<number>?text=... automatically — the panel of topic
 * choices below activates and the short link stops being used. Nothing else
 * needs to change.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var CONFIG = {
    // WhatsApp Business short link — used when `phone` is empty.
    shortLink: 'https://wa.me/message/ERUQWTNKIODIJ1',

    // Digits only, country code first, e.g. '919876543210'. Empty = use the
    // short link above and skip the topic panel (see the header note).
    phone: '',

    label: 'Chat with us',
    ariaLabel: 'Chat with DMI on WhatsApp',

    // Only used when `phone` is set. No prices, cohort dates or waitlist status
    // in any of these — those facts live only on the University storefront.
    topics: [
      { label: 'Joining the next live cohort', text: 'Hi Pravin, I would like to know more about joining the next DMI live cohort.' },
      { label: 'The self-paced track',         text: 'Hi Pravin, I have a question about the DMI self-paced track.' },
      { label: 'Enterprise or campus',         text: 'Hi Pravin, I am enquiring on behalf of a company or a college.' },
      { label: 'Something else',               text: 'Hi Pravin, I have a question about DMI.' }
    ]
  };

  var usePhone = !!CONFIG.phone;

  // The page a question came from is most of the context an answer needs, so it
  // rides along in the prefill — but only when there is a prefill to ride in.
  function chatUrl(text) {
    if (!usePhone) return CONFIG.shortLink;
    var page = document.title || location.pathname;
    return 'https://wa.me/' + CONFIG.phone + '?text=' +
      encodeURIComponent(text + '\n\n(Asked from: ' + page + ')');
  }

  // Plausible already counts this as an outbound click; the named goal is what
  // makes it usable as a conversion. Meta's standard Contact event is what the
  // ad account can optimise against. Both are optional — the pixel is absent
  // for anyone who declined under the old consent banner, and Plausible can be
  // blocked — so neither is ever assumed to exist.
  function track(topic) {
    if (typeof window.plausible === 'function') {
      window.plausible('WhatsApp Chat', { props: { page: location.pathname, topic: topic || 'direct' } });
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Contact', { content_name: 'WhatsApp chat bubble', content_category: topic || 'direct' });
    }
  }

  var CSS = [
    /* z-index sits below the cohort popup (9999) and the consent banner (1000)
       on purpose: when either of those is up, the bubble belongs behind it. */
    '.dmi-wa{position:fixed;right:1.25rem;bottom:1.25rem;z-index:900;',
    'font-family:var(--font,sans-serif);display:flex;flex-direction:column;align-items:flex-end;gap:.6rem}',

    '.dmi-wa-btn{display:inline-flex;align-items:center;gap:.6rem;',
    'padding:.85rem;border:0;border-radius:999px;background:#25D366;color:#fff;',
    'font-family:inherit;font-size:.95rem;font-weight:700;line-height:1;cursor:pointer;',
    'text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.18);',
    'transition:transform .18s ease,box-shadow .18s ease,background .18s ease}',
    '.dmi-wa-btn:hover{background:#1fb356;transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.24)}',
    '.dmi-wa-btn:focus-visible{outline:3px solid #0f0f0f;outline-offset:3px}',
    '.dmi-wa-btn svg{width:26px;height:26px;fill:currentColor;flex:0 0 auto;display:block}',
    '.dmi-wa-btn span{padding-right:.5rem}',

    /* Icon-only on phones: a pill that wide competes with the page itself. */
    '@media (max-width:640px){.dmi-wa{right:1rem;bottom:1rem}.dmi-wa-btn span{display:none}.dmi-wa-btn{padding:.9rem}}',

    '.dmi-wa-panel{width:270px;max-width:calc(100vw - 2rem);background:#fff;',
    'border:1px solid var(--border,#e8e8e8);border-radius:var(--radius,12px);',
    'box-shadow:0 12px 34px rgba(0,0,0,.16);overflow:hidden}',
    '.dmi-wa-panel[hidden]{display:none}',
    '.dmi-wa-head{background:#25D366;color:#fff;padding:.85rem 1rem;font-size:.9rem;font-weight:700}',
    '.dmi-wa-head small{display:block;font-weight:600;opacity:.9;font-size:.78rem;margin-top:.15rem}',
    '.dmi-wa-topic{display:block;width:100%;text-align:left;padding:.7rem 1rem;',
    'border:0;border-top:1px solid var(--border,#e8e8e8);background:#fff;color:var(--text,#0f0f0f);',
    'font-family:inherit;font-size:.88rem;font-weight:600;line-height:1.4;cursor:pointer;text-decoration:none}',
    '.dmi-wa-topic:first-of-type{border-top:0}',
    '.dmi-wa-topic:hover{background:var(--bg-card2,#f4f4f4)}',
    '.dmi-wa-topic:focus-visible{outline:2px solid #25D366;outline-offset:-2px}',

    '@media (prefers-reduced-motion:reduce){.dmi-wa-btn{transition:none}.dmi-wa-btn:hover{transform:none}}'
  ].join('');

  // Same glyph the badge and leaderboard share buttons already use.
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 0C5.463 0 .16 5.303.16 11.88c0 2.096.549 4.14 1.595 5.945L.057 24l6.304-1.654a11.86 11.86 0 0 0 5.68 1.447h.005c6.576 0 11.88-5.303 11.88-11.88 0-3.176-1.237-6.163-3.482-8.409A11.82 11.82 0 0 0 12.04 0zm6.988 16.964c-.298.836-1.48 1.53-2.404 1.72-.66.14-1.522.25-4.421-.951-3.712-1.538-6.099-5.303-6.284-5.55-.184-.246-1.508-2.01-1.508-3.834 0-1.824.957-2.72 1.297-3.09.34-.37.74-.462.988-.462.246 0 .494 0 .71.011.227.011.532-.086.833.635.31.74 1.055 2.559 1.147 2.744.092.184.153.4.03.646-.122.246-.183.4-.364.615-.184.216-.386.482-.552.646-.184.184-.375.383-.161.752.216.37.958 1.583 2.055 2.563 1.412 1.258 2.6 1.646 2.97 1.83.37.185.586.154.8-.093.216-.246.926-1.08 1.174-1.45.246-.37.492-.309.83-.185.34.123 2.155 1.017 2.524 1.202.37.185.615.277.708.43.092.153.092.892-.208 1.727z"/></svg>';

  function anchor(cls, href, extra) {
    var a = document.createElement('a');
    a.className = cls;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    if (extra) extra(a);
    return a;
  }

  function build() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.className = 'dmi-wa';

    var panel = null;

    // With no prefill available the panel would be four links to the same URL,
    // so the button just goes straight to WhatsApp.
    if (usePhone) {
      panel = document.createElement('div');
      panel.className = 'dmi-wa-panel';
      panel.hidden = true;

      var head = document.createElement('div');
      head.className = 'dmi-wa-head';
      head.innerHTML = 'Chat with the DMI team<small>We usually reply within a day</small>';
      panel.appendChild(head);

      CONFIG.topics.forEach(function (topic) {
        var item = anchor('dmi-wa-topic', chatUrl(topic.text));
        item.textContent = topic.label;
        item.addEventListener('click', function () {
          track(topic.label);
          close();
        });
        panel.appendChild(item);
      });

      root.appendChild(panel);
    }

    var btn;
    if (usePhone) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
    } else {
      btn = anchor('', chatUrl());
      btn.addEventListener('click', function () { track(null); });
    }
    btn.className = 'dmi-wa-btn';
    btn.setAttribute('aria-label', CONFIG.ariaLabel);
    btn.innerHTML = ICON + '<span>' + CONFIG.label + '</span>';
    root.appendChild(btn);

    document.body.appendChild(root);

    if (!usePhone) return;

    function close() {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
