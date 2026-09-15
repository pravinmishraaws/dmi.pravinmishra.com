/* ---------------------------------------------------------------------------
 * DMI WhatsApp lead gate
 *
 * Every WhatsApp entry point on the site goes through here: the floating
 * bubble (whatsapp-chat.js) and every inline "Talk to us on WhatsApp" CTA.
 * Clicking one opens a short form; submitting it posts the lead to the same
 * Pabbly webhook apply.html and join.html use, and opens WhatsApp.
 *
 * WHY GATE A CHAT BUTTON AT ALL
 * Two reasons, and the second is the bigger one:
 *   1. The email sequence downstream in Sendy is personalised. Without a
 *      first name and an email address there is no subscriber to send to and
 *      the sequence simply doesn't run — so the fields are not optional
 *      decoration, they are what makes the follow-up work at all.
 *   2. An ungated wa.me click is invisible to Meta: it fires a Contact event
 *      with no identity attached, which the ad account can't match to anyone.
 *      Gated, it becomes a real Lead with a hashed email flowing through CAPI.
 *      With GA4's purchase event still broken, that is the most reliable
 *      conversion signal the India ad spend has.
 *
 * THE FIELDS ARE DELIBERATELY IDENTICAL TO apply.html
 * firstName, email and describe are the same names, the same select options
 * and the same payload keys, so these leads land in the existing "DMI Ads"
 * Pabbly workflow without a mapping change. The WhatsApp number is the one
 * addition, borrowed from join.html (optional there too). If apply.html's
 * fields ever change, change them here in the same PR or the webhook starts
 * receiving two different shapes.
 *
 * leadSource IS PER PLACEMENT, NOT PER PAGE
 * Each CTA sets its own — 'whatsapp-float', 'whatsapp-enterprise-hero' and so
 * on — mirroring the existing 'fb-compact' / 'fb-landing' split. It is the
 * only way to tell afterwards which of the placements actually earns its
 * space, so never let two CTAs share one.
 *
 * !! PABBLY MUST BRANCH ON leadSource BEFORE THIS GOES LIVE !!
 * These leads hit the same workflow as the waitlist. Unless the workflow
 * branches on a 'whatsapp-' leadSource prefix, someone who asks "do you offer
 * EMI?" gets dropped into the full waitlist email sequence.
 *
 * USAGE
 *   <button class="btn-whatsapp" data-wa-gate data-lead-source="whatsapp-...">
 *     Talk to us on WhatsApp
 *   </button>
 * or from script: window.DMIWhatsAppGate.open({ leadSource: '...' })
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  // Same Catch Webhook trigger as apply.html and join.html.
  var PABBLY_WEBHOOK_URL = 'https://connect.pabbly.com/webhook-listener/webhook/IjU3NjYwNTZkMDYzMjA0MzU1MjY0NTUzMiI_3D_pc/IjU3NjcwNTY4MDYzNjA0MzU1MjY1NTUzNjUxMzUi_pc';

  // WhatsApp Business short link. It cannot carry a ?text= prefill — putting
  // the plain number (digits only, country code first) in PHONE switches every
  // entry point to wa.me/<number>?text=... and each CTA's data-wa-text is then
  // used as the opening message. See whatsapp-chat.js's header.
  var SHORT_LINK = 'https://wa.me/message/ERUQWTNKIODIJ1';
  var PHONE = '';

  var DESCRIBE_OPTIONS = ['Student', 'Developer', 'QA', 'SysAdmin', 'IT Support',
                          'Working in IT', 'Non-IT', 'Career break', 'Other'];

  var pageLoadedAt = Date.now();
  var fbclid = new URLSearchParams(window.location.search).get('fbclid') || '';

  // --- helpers copied verbatim from apply.html / join.html -----------------

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  }

  function sha256Hex(str) {
    var data = new TextEncoder().encode(str.trim().toLowerCase());
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  // Meta's user_data.ph wants digits only before hashing.
  function sha256HexPhone(rawPhone) {
    return sha256Hex(rawPhone.replace(/\D/g, ''));
  }

  // Read at submit time, not page load: the pixel may not have written _fbc yet.
  function resolveFbc() {
    var cookie = getCookie('_fbc');
    if (cookie) return cookie;
    return fbclid ? 'fb.1.' + pageLoadedAt + '.' + fbclid : '';
  }

  function chatUrl(text) {
    if (!PHONE) return SHORT_LINK;
    return 'https://wa.me/' + PHONE + '?text=' +
      encodeURIComponent((text || 'Hi Pravin, I have a question about DMI.') +
        '\n\n(Asked from: ' + (document.title || location.pathname) + ')');
  }

  // --- styles --------------------------------------------------------------

  var CSS = [
    '.dmi-wg-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;',
    'justify-content:center;padding:1.25rem;background:rgba(0,0,0,.55);',
    'font-family:var(--font,sans-serif);overflow-y:auto}',
    '.dmi-wg-overlay[hidden]{display:none}',

    '.dmi-wg-card{position:relative;width:100%;max-width:400px;background:#fff;',
    'border-radius:var(--radius,12px);box-shadow:0 20px 60px rgba(0,0,0,.3);',
    'padding:1.75rem 1.5rem 1.4rem;margin:auto}',

    '.dmi-wg-close{position:absolute;top:.6rem;right:.6rem;width:34px;height:34px;border:0;',
    'border-radius:50%;background:transparent;color:var(--text-muted,#666);font-size:1.4rem;',
    'line-height:1;cursor:pointer}',
    '.dmi-wg-close:hover{background:var(--bg-card2,#f4f4f4);color:var(--text,#0f0f0f)}',

    '.dmi-wg-head{display:flex;align-items:center;gap:.6rem;margin-bottom:.35rem}',
    '.dmi-wg-head svg{width:26px;height:26px;fill:#25D366;flex:0 0 auto}',
    '.dmi-wg-head h2{font-size:1.15rem;font-weight:800;color:var(--text,#0f0f0f);margin:0;line-height:1.3}',
    '.dmi-wg-sub{font-size:.88rem;color:var(--text-muted,#666);margin:0 0 1.15rem;line-height:1.5}',

    '.dmi-wg-field{margin-bottom:.8rem}',
    '.dmi-wg-field label{display:block;font-size:.8rem;font-weight:700;margin-bottom:.3rem;color:var(--text,#0f0f0f)}',
    '.dmi-wg-field input,.dmi-wg-field select{width:100%;padding:.65rem .75rem;font-family:inherit;',
    'font-size:.92rem;color:var(--text,#0f0f0f);background:#fff;',
    'border:1px solid var(--border,#e8e8e8);border-radius:8px}',
    '.dmi-wg-field input:focus,.dmi-wg-field select:focus{outline:2px solid var(--accent,#E8A020);',
    'outline-offset:-1px;border-color:var(--accent,#E8A020)}',

    '.dmi-wg-submit{width:100%;margin-top:.5rem;padding:.8rem 1rem;border:0;border-radius:10px;',
    'background:#25D366;color:#fff;font-family:inherit;font-size:.98rem;font-weight:800;cursor:pointer;',
    'display:inline-flex;align-items:center;justify-content:center;gap:.5rem}',
    '.dmi-wg-submit:hover:not(:disabled){background:#1fb356}',
    '.dmi-wg-submit:disabled{opacity:.65;cursor:default}',
    '.dmi-wg-submit svg{width:20px;height:20px;fill:currentColor}',

    /* iOS Safari zooms the whole page in when a focused input's font-size is
       under 16px, and does not zoom back out afterwards — so the visitor is
       left on a page they have to pinch to escape, mid-form. 16px exactly is
       the threshold. Phone widths only; the desktop card keeps .92rem. */
    '@media (max-width:640px){.dmi-wg-field input,.dmi-wg-field select{font-size:16px}}',

    '.dmi-wg-privacy{font-size:.75rem;color:var(--text-muted,#666);text-align:center;margin:.8rem 0 0;line-height:1.5}',
    '.dmi-wg-msg{font-size:.85rem;text-align:center;margin-top:.8rem;display:none}',
    '.dmi-wg-msg.show{display:block}',
    '.dmi-wg-msg.error{color:#b3261e}',
    '.dmi-wg-done{text-align:center;padding:.5rem 0}',
    '.dmi-wg-done .tick{font-size:2rem;line-height:1}',
    '.dmi-wg-done h3{font-size:1.05rem;font-weight:800;margin:.5rem 0 .4rem;color:var(--text,#0f0f0f)}',
    '.dmi-wg-done p{font-size:.88rem;color:var(--text-muted,#666);margin:0 0 1rem;line-height:1.55}',
    '.dmi-wg-done a{display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.2rem;border-radius:10px;',
    'background:#25D366;color:#fff;font-weight:800;font-size:.92rem;text-decoration:none}',

    /* The inline CTA button, used on the Tier 1 pages. */
    '.btn-whatsapp{display:inline-flex;align-items:center;gap:.5rem;padding:11px 22px;',
    'border:1px solid #25D366;border-radius:var(--radius,12px);background:#fff;color:#1a8f4c;',
    'font-family:var(--font,sans-serif);font-size:.95rem;font-weight:700;line-height:1.2;',
    'cursor:pointer;text-decoration:none;transition:background .18s ease,color .18s ease}',
    '.btn-whatsapp svg{width:18px;height:18px;fill:#25D366;flex:0 0 auto}',
    '.btn-whatsapp:hover{background:#25D366;color:#fff}',
    '.btn-whatsapp:hover svg{fill:#fff}',
    /* On the dark CTA bands the white-on-dark variant reads better. */
    '.cta-banner .btn-whatsapp{background:transparent;border-color:rgba(255,255,255,.55);color:#fff}',
    '.cta-banner .btn-whatsapp svg{fill:#fff}',
    '.cta-banner .btn-whatsapp:hover{background:#25D366;border-color:#25D366;color:#fff}',
    /* A quieter text-link variant for "not sure which track?" lines. */
    '.wa-inline-note{font-size:.9rem;color:var(--text-muted,#666);margin-top:1rem}',
    '.wa-link{background:none;border:0;padding:0;font:inherit;color:#1a8f4c;font-weight:700;',
    'cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
    '.cta-banner .wa-inline-note{color:rgba(255,255,255,.85)}',
    '.cta-banner .wa-link{color:#fff}'
  ].join('');

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 0C5.463 0 .16 5.303.16 11.88c0 2.096.549 4.14 1.595 5.945L.057 24l6.304-1.654a11.86 11.86 0 0 0 5.68 1.447h.005c6.576 0 11.88-5.303 11.88-11.88 0-3.176-1.237-6.163-3.482-8.409A11.82 11.82 0 0 0 12.04 0zm6.988 16.964c-.298.836-1.48 1.53-2.404 1.72-.66.14-1.522.25-4.421-.951-3.712-1.538-6.099-5.303-6.284-5.55-.184-.246-1.508-2.01-1.508-3.834 0-1.824.957-2.72 1.297-3.09.34-.37.74-.462.988-.462.246 0 .494 0 .71.011.227.011.532-.086.833.635.31.74 1.055 2.559 1.147 2.744.092.184.153.4.03.646-.122.246-.183.4-.364.615-.184.216-.386.482-.552.646-.184.184-.375.383-.161.752.216.37.958 1.583 2.055 2.563 1.412 1.258 2.6 1.646 2.97 1.83.37.185.586.154.8-.093.216-.246.926-1.08 1.174-1.45.246-.37.492-.309.83-.185.34.123 2.155 1.017 2.524 1.202.37.185.615.277.708.43.092.153.092.892-.208 1.727z"/></svg>';

  // --- the gate ------------------------------------------------------------

  var overlay, card, current = null, built = false;

  // The stylesheet goes in at load, not on first open: it styles the inline
  // .btn-whatsapp CTAs sitting in the page markup, which are visible long
  // before anyone opens the gate. Only the overlay itself is built lazily.
  (function injectStyles() {
    var style = document.createElement('style');
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  })();

  function inject() {
    if (built) return;
    built = true;

    overlay = document.createElement('div');
    overlay.className = 'dmi-wg-overlay';
    overlay.hidden = true;
    card = document.createElement('div');
    card.className = 'dmi-wg-card';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) close();
    });
  }

  function close() {
    overlay.hidden = true;
    current = null;
    document.body.style.overflow = '';
  }

  function formHtml(opts) {
    var options = DESCRIBE_OPTIONS.map(function (o) {
      return '<option>' + o + '</option>';
    }).join('');
    return '' +
      '<button type="button" class="dmi-wg-close" aria-label="Close">&times;</button>' +
      '<div class="dmi-wg-head">' + ICON + '<h2>' + opts.title + '</h2></div>' +
      '<p class="dmi-wg-sub">' + opts.blurb + '</p>' +
      '<form novalidate="false">' +
        '<div class="dmi-wg-field"><label for="dmiWgName">First name</label>' +
        '<input type="text" id="dmiWgName" required autocomplete="given-name" /></div>' +
        '<div class="dmi-wg-field"><label for="dmiWgEmail">Email</label>' +
        '<input type="email" id="dmiWgEmail" required autocomplete="email" /></div>' +
        '<div class="dmi-wg-field"><label for="dmiWgPhone">WhatsApp number (with country code) — optional</label>' +
        '<input type="tel" id="dmiWgPhone" placeholder="+91 98765 43210" autocomplete="tel" /></div>' +
        '<div class="dmi-wg-field"><label for="dmiWgDescribe">What best describes you right now?</label>' +
        '<select id="dmiWgDescribe" required>' +
          '<option value="" disabled selected>Select one</option>' + options +
        '</select></div>' +
        '<button type="submit" class="dmi-wg-submit">' + ICON + 'Start chat on WhatsApp</button>' +
      '</form>' +
      '<div class="dmi-wg-msg"></div>' +
      '<p class="dmi-wg-privacy">Your details are used to reply to you and to send DMI updates. Unsubscribe anytime.</p>';
  }

  function open(opts) {
    inject();
    current = {
      leadSource: (opts && opts.leadSource) || 'whatsapp-unknown',
      text: (opts && opts.text) || ''
    };
    card.innerHTML = formHtml({
      title: (opts && opts.title) || 'Chat with us on WhatsApp',
      blurb: (opts && opts.blurb) ||
        'Share your details and we\'ll pick this up on WhatsApp — usually within a day.'
    });
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    card.querySelector('.dmi-wg-close').addEventListener('click', close);
    card.querySelector('form').addEventListener('submit', submit);
    setTimeout(function () { card.querySelector('#dmiWgName').focus(); }, 40);

    // Intent, as distinct from the Lead fired on submit: the gap between the
    // two is how many people the form itself is costing.
    if (typeof window.plausible === 'function') {
      window.plausible('WhatsApp Gate Opened', { props: { leadSource: current.leadSource } });
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Contact', { content_name: current.leadSource });
    }
  }

  function submit(e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('.dmi-wg-submit');
    var msg = card.querySelector('.dmi-wg-msg');
    msg.className = 'dmi-wg-msg';

    var firstName = form.querySelector('#dmiWgName').value.trim();
    var email = form.querySelector('#dmiWgEmail').value.trim();
    var phone = form.querySelector('#dmiWgPhone').value.trim();
    var describe = form.querySelector('#dmiWgDescribe').value;
    if (!firstName || !email || !describe) {
      msg.className = 'dmi-wg-msg show error';
      msg.textContent = 'Please fill in your name, email and the last question.';
      return;
    }

    // Open WhatsApp NOW, inside the click gesture. Doing it after awaiting the
    // webhook gets the window blocked — the gesture has expired by then. The
    // lead is posted with keepalive below and does not need to be awaited.
    var waWindow = window.open(chatUrl(current.text), '_blank');
    if (waWindow) waWindow.opener = null;

    btn.disabled = true;
    btn.textContent = 'Opening WhatsApp…';

    var eventId = uuid();
    var fbc = resolveFbc();
    var fbp = getCookie('_fbp');

    Promise.all([
      sha256Hex(email),
      sha256Hex(firstName),
      phone ? sha256HexPhone(phone) : Promise.resolve('')
    ]).then(function (hashes) {
      var payload = {
        firstName: firstName,
        email: email,
        emailHash: hashes[0],
        firstNameHash: hashes[1],
        whatsapp: phone,
        phoneHash: hashes[2],
        describe: describe,
        fbclid: fbclid,
        fbc: fbc,
        fbp: fbp,
        eventId: eventId,
        leadSource: current.leadSource,
        pageUrl: window.location.href,
        submittedAt: new Date().toISOString(),
        eventTimeUnix: Math.floor(Date.now() / 1000)
      };
      return fetch(PABBLY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    }).then(function (response) {
      if (!response.ok) throw new Error('Webhook returned ' + response.status);
      if (typeof window.plausible === 'function') {
        window.plausible('WhatsApp Lead', { props: { leadSource: current.leadSource } });
      }
      if (window.fbq) fbq('track', 'Lead', {}, { eventID: eventId });
    }).catch(function (err) {
      // The chat is already open, so this is never shown as a failure to the
      // visitor — it only matters to us that the lead didn't reach Pabbly.
      console.error('WhatsApp lead submit failed', err);
    }).then(function () {
      done(waWindow);
    });
  }

  function done(waWindow) {
    card.innerHTML =
      '<button type="button" class="dmi-wg-close" aria-label="Close">&times;</button>' +
      '<div class="dmi-wg-done">' +
        '<div class="tick">✅</div>' +
        '<h3>' + (waWindow ? 'WhatsApp is opening' : 'Ready when you are') + '</h3>' +
        '<p>' + (waWindow
          ? 'If the WhatsApp tab didn\'t appear, your browser may have blocked it — use the button below.'
          : 'Your browser blocked the WhatsApp window. Tap below to open the chat.') + '</p>' +
        '<a href="' + chatUrl(current.text) + '" target="_blank" rel="noopener">' + ICON + 'Open WhatsApp</a>' +
      '</div>';
    card.querySelector('.dmi-wg-close').addEventListener('click', close);
  }

  // --- binding -------------------------------------------------------------

  // Delegated, so CTAs rendered after load (course cards, blog lists) work too.
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-wa-gate]');
    if (!el) return;
    e.preventDefault();
    open({
      leadSource: el.getAttribute('data-lead-source'),
      text: el.getAttribute('data-wa-text') || '',
      title: el.getAttribute('data-wa-title') || '',
      blurb: el.getAttribute('data-wa-blurb') || ''
    });
  });

  window.DMIWhatsAppGate = { open: open, close: close, icon: ICON };
})();
