/* ---------------------------------------------------------------------------
 * DMI next-cohort call-to-action
 *
 * Every "Join Cohort N" button on the site gets its label, link and lifetime
 * from the COHORT block below, so the date lives in one place instead of on
 * every page. Include with <script src="cohort-cta.js"></script> (or
 * "../cohort-cta.js" under blog/ and s/) and mark up the page with:
 *
 *   data-cohort-cta          on an <a>: link + label are replaced
 *   data-cohort-cta="href"   on an <a>: only the link is replaced (the
 *                            element has its own structured content)
 *   data-cohort-show hidden  on anything: revealed while the campaign runs
 *
 * Once `startsAt` passes the script does nothing: elements marked
 * data-cohort-show stay hidden, and existing links keep whatever href/label
 * the page shipped with — so a stale cohort date can't sit on the site.
 *
 * The announcement popup (cohort-popup.js) has its own CAMPAIGN block with
 * the same date; update both together for the next cohort.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var COHORT = {
    label: 'Join Cohort 4: starts 9 Jan 2027 →',
    url: 'https://forms.gle/t8AnbtieRmGAiFHw5?utm_medium=cta-live-waitlist&utm_source=dmi',
    // Midnight IST on the start date, same moment the popup retires itself.
    startsAt: '2027-01-09T00:00:00+05:30'
  };

  var startsAt = new Date(COHORT.startsAt).getTime();
  if (!startsAt || Date.now() >= startsAt) return;

  document.querySelectorAll('a[data-cohort-cta]').forEach(function (a) {
    a.href = COHORT.url;
    a.target = '_blank';
    a.rel = 'noopener';
    if (a.getAttribute('data-cohort-cta') !== 'href') a.textContent = COHORT.label;
  });
  document.querySelectorAll('[data-cohort-show]').forEach(function (el) {
    el.hidden = false;
  });
})();
