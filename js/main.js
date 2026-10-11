/* ============================================================
   main.js — shared behaviour for every page
   Everything is progressive: with JS disabled the site is still
   fully readable and navigable.
   ============================================================ */
(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var themeToggle = $('#themeToggle');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  if (themeToggle) {
    setTheme(root.getAttribute('data-theme') || 'light');
    themeToggle.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------- Mobile navigation ---------- */
  var nav = $('#nav');
  var navToggle = $('#navToggle');

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });

    // Close when a link is chosen or the viewport grows past the breakpoint.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- Sticky header, scroll progress, back-to-top ---------- */
  var header = $('#header');
  var progress = $('#scrollProgress');
  var toTop = $('#toTop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle('is-stuck', y > 8);
    if (progress) progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('is-visible', y > 600);

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealables = $$('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Animated counters ---------- */
  var counters = $$('[data-count]');

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffixEl = el.querySelector('span');
    var suffixHTML = suffixEl ? suffixEl.outerHTML : '';
    var duration = 1400;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = Math.round(target * eased) + suffixHTML;
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  if (counters.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        var s = el.querySelector('span');
        el.innerHTML = el.getAttribute('data-count') + (s ? s.outerHTML : '');
      });
    } else {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* ---------- Project filtering ---------- */
  var filterBar = $('#filters');

  if (filterBar) {
    var projects = $$('[data-category]');
    var countEl = $('#projectCount');

    function applyFilter(value) {
      var shown = 0;

      projects.forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(/\s+/);
        var match = value === 'all' || cats.indexOf(value) !== -1;
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });

      if (countEl) countEl.textContent = shown + (shown === 1 ? ' project' : ' projects');
    }

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;

      $$('.filter', filterBar).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      applyFilter(btn.getAttribute('data-filter'));
    });
  }

  /* ---------- Forms ---------- */
  $$('form[data-validate]').forEach(function (form) {
    var status = $('.form__status', form);

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input) {
      var field = fieldOf(input);
      if (!field) return true;

      var value = (input.value || '').trim();
      var ok = true;

      if (input.type === 'checkbox') {
        ok = !input.hasAttribute('required') || input.checked;
      } else if (input.hasAttribute('required') && !value) {
        ok = false;
      } else if (input.type === 'email' && value) {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      } else if (input.hasAttribute('minlength') && value) {
        ok = value.length >= parseInt(input.getAttribute('minlength'), 10);
      }

      field.classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    }

    // Validate on blur, then live-update once a field is already flagged.
    $$('input, textarea, select', form).forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        var f = fieldOf(input);
        if (f && f.classList.contains('has-error')) validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = $$('input, textarea, select', form);
      var firstInvalid = null;

      fields.forEach(function (input) {
        if (!validate(input) && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        if (status) status.classList.remove('is-visible');
        return;
      }

      // No backend in this static build - simulate a successful send.
      var submitBtn = $('[type="submit"]', form);
      var original = submitBtn ? submitBtn.innerHTML : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending...';
      }

      window.setTimeout(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = original; }
        form.reset();
        if (status) {
          status.classList.add('is-visible');
          status.focus({ preventScroll: true });
        }
      }, 900);
    });
  });

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
