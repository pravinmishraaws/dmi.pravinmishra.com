// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

// Matches the nav breakpoint in styles.css. Below it the bar is a stacked
// panel and the mega-menus behave as accordions; above it they open on hover
// and this file leaves them alone entirely.
var navMobile = window.matchMedia('(max-width: 1080px)');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  var dropdowns = navLinks.querySelectorAll('li.has-dropdown');

  // On a phone the parent of a mega-menu is a disclosure control, not a
  // destination: tapping "Proof" should open and close its section rather
  // than navigate away before the submenu can be read. Every child link in
  // the panel still navigates normally, and on desktop this does nothing.
  dropdowns.forEach(li => {
    var parentLink = li.querySelector(':scope > a');
    if (!parentLink) return;
    parentLink.addEventListener('click', e => {
      if (!navMobile.matches) return;
      e.preventDefault();
      var wasOpen = li.classList.contains('open');
      dropdowns.forEach(other => other.classList.remove('open'));
      if (!wasOpen) li.classList.add('open');
    });
  });

  // Close the whole panel when a real destination is chosen — but not when the
  // tap was on a disclosure control, or the panel would shut as it expanded.
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (navMobile.matches && link.parentElement.classList.contains('has-dropdown')) return;
      navLinks.classList.remove('open');
      dropdowns.forEach(li => li.classList.remove('open'));
    });
  });

  // Close nav on outside click
  document.addEventListener('click', e => {
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      dropdowns.forEach(li => li.classList.remove('open'));
    }
  });

  // Crossing the breakpoint (rotating a phone, resizing a window) must not
  // strand an accordion open, since above it .open has no styling to undo.
  navMobile.addEventListener('change', () => {
    navLinks.classList.remove('open');
    dropdowns.forEach(li => li.classList.remove('open'));
  });
}

// ---------------------------------------------------------------------------
// Single source of truth for the "students graded" headline number.
//
// This number appears on the homepage, the enterprise/campus pitch pages, the
// stories page and all three conversion landing pages. It used to be hardcoded
// separately on each of them, which meant four pages stating four different
// counts of the same metric at the same time — the worst possible detail to get
// wrong on pages whose entire argument is "no black box, everything is
// verifiable". Now every instance is filled from the same two CSVs the
// leaderboard pages render, so they cannot drift apart again.
//
//   data-graded="total"   cohort + self-paced — everyone the grader scores daily
//   data-graded="cohort"  the Live-track leaderboard only, so link text that
//                         promises "N students" matches the rows on the page
//                         it links to
//
// The number written in the HTML is only a no-JS fallback. A failed fetch
// leaves it alone rather than blanking the stat.
// ---------------------------------------------------------------------------
(function () {
  var here = (document.currentScript && document.currentScript.src) || 'app.js';

  function fill(key, n) {
    if (!(n > 0)) return;
    document.querySelectorAll('[data-graded="' + key + '"]').forEach(function (el) {
      el.textContent = String(n);
    });
  }

  function load() {
    if (!document.querySelector('[data-graded]')) return;

    var rows = function (csv) {
      return csv.trim().split('\n').slice(1).filter(function (l) { return l.trim(); }).length;
    };
    var get = function (name) {
      return fetch(new URL('data/' + name, here).href).then(function (r) { return r.text(); });
    };

    Promise.all([get('leaderboard.csv'), get('self-paced-leaderboard.csv')])
      .then(function (csvs) {
        var cohort = rows(csvs[0]);
        fill('cohort', cohort);
        fill('total', cohort + rows(csvs[1]));
      })
      .catch(function () { /* leave the HTML fallback numbers in place */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
