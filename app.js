// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  // Close nav on outside click
  document.addEventListener('click', e => {
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
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
