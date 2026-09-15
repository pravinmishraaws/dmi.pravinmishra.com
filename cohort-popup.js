/* ---------------------------------------------------------------------------
 * DMI announcement popup
 *
 * One self-contained file: it injects its own styles and markup, so a page only
 * needs <script src="cohort-popup.js"></script> (or "../cohort-popup.js" under
 * blog/ and s/) to get it. Deliberately NOT included on apply.html, enroll.html
 * and join.html — those are distraction-free conversion pages.
 *
 * TO UPDATE FOR THE NEXT COHORT: edit the CAMPAIGN block below and nothing else.
 * Bump `id` whenever the message changes — the dismissal memory is keyed on it,
 * so a new id re-shows the popup to people who dismissed the previous one.
 *
 * The popup removes itself once `startsAt` has passed, so a stale cohort date
 * can never sit on the site after the fact.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var CAMPAIGN = {
    id: 'cohort-4-jan-2027',
    badge: 'Next live cohort',
    title: 'DMI Cohort 4 starts January 9, 2027',
    // Midnight IST on the start date (IST = UTC+5:30), used for the countdown
    // and as the moment the popup stops showing itself.
    startsAt: '2027-01-09T00:00:00+05:30',
    dateLabel: 'Saturday, 9 January 2027',
    noteLabel: 'Orientation recording out now',
    image: 'images/cohort4-orientation.jpg',
    imageAlt: 'DMI Orientation session',
    videoUrl: 'https://youtu.be/XrLU54Orqsg',
    videoLabel: 'Watch the orientation recording',
    ctaUrl: 'https://forms.gle/t8AnbtieRmGAiFHw5',
    ctaLabel: 'Join the Cohort 4 waiting list',
    // How long a dismissal is remembered, in days. Clicking the CTA (they are
    // on the list already) suppresses it for much longer than "Maybe later".
    dismissDays: 7,
    convertedDays: 120,
    delayMs: 6000
  };

  var STORE_KEY = 'dmi-popup:' + CAMPAIGN.id;
  var startsAt = new Date(CAMPAIGN.startsAt).getTime();

  // ---- guards ------------------------------------------------------------
  if (!startsAt || Date.now() >= startsAt) return;   // cohort already started
  if (window.top !== window.self) return;            // never inside an iframe

  try {
    var until = window.localStorage.getItem(STORE_KEY);
    if (until && Date.now() < Number(until)) return;
  } catch (e) { /* private mode — just show it */ }

  function remember(days) {
    try {
      window.localStorage.setItem(STORE_KEY, String(Date.now() + days * 864e5));
    } catch (e) { /* nothing we can do, and nothing that should break the page */ }
  }

  // ---- asset paths -------------------------------------------------------
  // Pages under blog/ and s/ load this as "../cohort-popup.js", so derive the
  // root prefix from our own <script src> rather than assuming we're at /.
  var root = '';
  var self = document.currentScript;
  if (self && self.src) {
    var m = self.src.match(/(.*\/)cohort-popup\.js/);
    if (m) root = m[1];
  }

  // ---- styles ------------------------------------------------------------
  var css = [
    '.dmi-pop-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;',
      'padding:1.25rem;background:rgba(10,12,16,0.72);backdrop-filter:blur(4px);opacity:0;transition:opacity .25s ease}',
    '.dmi-pop-overlay.is-open{opacity:1}',
    '.dmi-pop{position:relative;width:100%;max-width:520px;max-height:calc(100vh - 2.5rem);overflow-y:auto;',
      'background:#12161f;color:#fff;border-radius:16px;border:1px solid rgba(255,255,255,0.08);',
      'box-shadow:0 24px 64px rgba(0,0,0,0.45);font-family:var(--font,"Mulish",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);',
      'transform:translateY(12px) scale(.98);transition:transform .25s ease}',
    '.dmi-pop-overlay.is-open .dmi-pop{transform:none}',
    '.dmi-pop-close{position:absolute;top:.75rem;right:.75rem;z-index:2;width:36px;height:36px;border:0;border-radius:50%;',
      'background:rgba(10,12,16,0.6);color:#fff;font-size:1.25rem;line-height:1;cursor:pointer;transition:background .15s ease}',
    '.dmi-pop-close:hover{background:rgba(10,12,16,0.9)}',
    '.dmi-pop-banner{display:block;position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:16px 16px 0 0;background:#0b0e14}',
    '.dmi-pop-banner img{width:100%;height:100%;object-fit:cover;display:block}',
    '.dmi-pop-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;',
      'background:linear-gradient(180deg,rgba(10,12,16,.15) 0%,rgba(10,12,16,.65) 100%)}',
    '.dmi-pop-play span{display:flex;align-items:center;gap:.55rem;padding:.6rem 1.1rem;border-radius:999px;',
      'background:rgba(232,160,32,.95);color:#12161f;font-weight:800;font-size:.875rem}',
    '.dmi-pop-banner:hover .dmi-pop-play span{background:#f2bc55}',
    '.dmi-pop-body{padding:1.5rem}',
    '.dmi-pop-badge{display:inline-flex;align-items:center;gap:.45rem;padding:.35rem .85rem;margin-bottom:.9rem;',
      'border:1px solid rgba(232,160,32,.45);border-radius:999px;background:rgba(232,160,32,.12);',
      'color:#f2bc55;font-size:.75rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}',
    '.dmi-pop h2{margin:0 0 .75rem;font-size:1.5rem;line-height:1.3;font-weight:800;color:#fff}',
    '.dmi-pop-meta{display:flex;flex-wrap:wrap;gap:.35rem 1.25rem;margin-bottom:1.35rem;',
      'color:rgba(255,255,255,.72);font-size:.9375rem}',
    '.dmi-pop-meta span{display:inline-flex;align-items:center;gap:.45rem}',
    '.dmi-pop svg{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;',
      'stroke-linecap:round;stroke-linejoin:round}',
    '.dmi-pop svg.dmi-pop-ifill{fill:currentColor;stroke:none}',
    '.dmi-pop-label{margin:0 0 .6rem;font-size:.6875rem;font-weight:800;letter-spacing:1.5px;',
      'text-transform:uppercase;color:rgba(255,255,255,.5)}',
    '.dmi-pop-count{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-bottom:1.35rem}',
    '.dmi-pop-count div{padding:.6rem .25rem;border-radius:10px;background:rgba(255,255,255,.07);text-align:center}',
    '.dmi-pop-count b{display:block;font-size:1.5rem;font-weight:800;line-height:1.2;font-variant-numeric:tabular-nums}',
    '.dmi-pop-count small{font-size:.625rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.5)}',
    '.dmi-pop-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem}',
    '.dmi-pop-cta{flex:1 1 240px;padding:.9rem 1.25rem;border-radius:10px;background:#E8A020;color:#12161f;',
      'font-weight:800;font-size:1rem;text-align:center;text-decoration:none;transition:background .15s ease}',
    '.dmi-pop-cta:hover{background:#f2bc55}',
    '.dmi-pop-later{padding:.9rem .5rem;border:0;background:none;color:rgba(255,255,255,.6);',
      'font-family:inherit;font-size:.9375rem;font-weight:700;cursor:pointer}',
    '.dmi-pop-later:hover{color:#fff}',
    '.dmi-pop-alt{margin:1.25rem -1.5rem -1.5rem;padding:1rem 1.5rem;border-top:1px solid rgba(255,255,255,.08);text-align:center}',
    '.dmi-pop-alt a{color:#f2bc55;font-weight:700;font-size:.9375rem;text-decoration:none}',
    '.dmi-pop-alt a:hover{text-decoration:underline}',
    'body.dmi-pop-open{overflow:hidden}',
    '@media (max-width:420px){.dmi-pop-body{padding:1.25rem}.dmi-pop h2{font-size:1.25rem}',
      '.dmi-pop-count b{font-size:1.25rem}.dmi-pop-alt{margin:1.25rem -1.25rem -1.25rem;padding:1rem 1.25rem}}',
    '@media (prefers-reduced-motion:reduce){.dmi-pop-overlay,.dmi-pop{transition:none}}'
  ].join('');

  // Inline so the popup stays one file with no icon-font or image dependency.
  var ICON_DATE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2M17 2v2M3 8h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" class="dmi-pop-ifill"><path d="M8 5.5v13l11-6.5z"/></svg>';

  // ---- markup ------------------------------------------------------------
  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'dmi-pop-overlay';
    overlay.innerHTML =
      '<div class="dmi-pop" role="dialog" aria-modal="true" aria-labelledby="dmiPopTitle">' +
        '<button type="button" class="dmi-pop-close" aria-label="Close">&times;</button>' +
        '<a class="dmi-pop-banner" href="' + CAMPAIGN.videoUrl + '" target="_blank" rel="noopener">' +
          '<img src="' + root + CAMPAIGN.image + '" alt="' + CAMPAIGN.imageAlt + '" loading="lazy" />' +
          '<span class="dmi-pop-play"><span>' + ICON_PLAY + CAMPAIGN.videoLabel + '</span></span>' +
        '</a>' +
        '<div class="dmi-pop-body">' +
          '<p class="dmi-pop-badge">' + CAMPAIGN.badge + '</p>' +
          '<h2 id="dmiPopTitle">' + CAMPAIGN.title + '</h2>' +
          '<p class="dmi-pop-meta">' +
            '<span>' + ICON_DATE + CAMPAIGN.dateLabel + '</span>' +
            '<span>' + ICON_PLAY + CAMPAIGN.noteLabel + '</span>' +
          '</p>' +
          '<p class="dmi-pop-label">Starts in</p>' +
          '<div class="dmi-pop-count" id="dmiPopCount" aria-live="off">' +
            '<div><b data-unit="d">--</b><small>Days</small></div>' +
            '<div><b data-unit="h">--</b><small>Hrs</small></div>' +
            '<div><b data-unit="m">--</b><small>Min</small></div>' +
            '<div><b data-unit="s">--</b><small>Sec</small></div>' +
          '</div>' +
          '<div class="dmi-pop-actions">' +
            '<a class="dmi-pop-cta" href="' + CAMPAIGN.ctaUrl + '" target="_blank" rel="noopener">' +
              CAMPAIGN.ctaLabel + ' &rarr;</a>' +
            '<button type="button" class="dmi-pop-later">Maybe later</button>' +
          '</div>' +
          altLink() +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  // Secondary way out of the popup — skipped on the page it points at, so it
  // never offers a link to where the reader already is.
  function altLink() {
    if (/how-it-works\.html$/.test(location.pathname)) return '';
    return '<div class="dmi-pop-alt">' +
             '<a href="' + root + 'how-it-works.html">See how the internship works &rarr;</a>' +
           '</div>';
  }

  // ---- behaviour ---------------------------------------------------------
  var overlay, timer, lastFocus;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function tick() {
    var left = startsAt - Date.now();
    if (left <= 0) { close(0); return; }
    var s = Math.floor(left / 1000);
    var v = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
    var cells = overlay.querySelectorAll('#dmiPopCount b');
    for (var i = 0; i < cells.length; i++) {
      cells[i].textContent = pad(v[cells[i].getAttribute('data-unit')]);
    }
  }

  function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') close(CAMPAIGN.dismissDays); }

  function close(days) {
    if (!overlay) return;
    if (days) remember(days);
    clearInterval(timer);
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('dmi-pop-open');
    overlay.classList.remove('is-open');
    var node = overlay;
    overlay = null;
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function open() {
    if (document.querySelector('.dmi-pop-overlay')) return;
    lastFocus = document.activeElement;
    overlay = build();
    tick();
    timer = setInterval(tick, 1000);

    overlay.querySelector('.dmi-pop-close').addEventListener('click', function () { close(CAMPAIGN.dismissDays); });
    overlay.querySelector('.dmi-pop-later').addEventListener('click', function () { close(CAMPAIGN.dismissDays); });
    // Joined the list or opened the video — no reason to nag them again soon.
    overlay.querySelector('.dmi-pop-cta').addEventListener('click', function () { close(CAMPAIGN.convertedDays); });
    overlay.querySelector('.dmi-pop-banner').addEventListener('click', function () { close(CAMPAIGN.dismissDays); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(CAMPAIGN.dismissDays); });
    document.addEventListener('keydown', onKey);

    document.body.classList.add('dmi-pop-open');
    // Next frame, so the opening transition actually runs.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!overlay) return;
        overlay.classList.add('is-open');
        overlay.querySelector('.dmi-pop-close').focus();
      });
    });
  }

  function schedule() { setTimeout(open, CAMPAIGN.delayMs); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
})();
