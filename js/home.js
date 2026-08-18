/* RealIRacing — homepage behaviour (slideshow, media tabs, poll, smooth scroll).
   Extracted from an inline <script> in index.html on 2026-08-18 so the site can
   enforce a Content-Security-Policy without 'unsafe-inline' in script-src. The
   onclick="" attributes that used to drive these are now addEventListener
   bindings for the same reason — inline handlers are inline script as far as
   CSP is concerned, so leaving even one would have forced the policy open. */
(function () {
  'use strict';

  /* ── SLIDESHOW ── */
  var currentSlide = 0;
  var slideshowTimer = null;
  var SLIDE_DURATION = 5000;

  var slides = document.querySelectorAll('.slide');
  var dots   = document.querySelectorAll('.progress-dot');

  function goToSlide(n) {
    if (!slides.length) return;
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    resetTimer();
  }
  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlide() { goToSlide(currentSlide - 1); }

  function resetTimer() {
    clearInterval(slideshowTimer);
    slideshowTimer = setInterval(nextSlide, SLIDE_DURATION);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { goToSlide(i); });
  });

  var prevBtn = document.querySelector('.slide-nav-prev');
  var nextBtn = document.querySelector('.slide-nav-next');
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  var ss = document.getElementById('slideshow');
  if (ss) {
    // Pause on hover
    ss.addEventListener('mouseenter', function () { clearInterval(slideshowTimer); });
    ss.addEventListener('mouseleave', resetTimer);

    // Touch swipe support
    var touchStartX = 0;
    ss.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    ss.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { dx < 0 ? nextSlide() : prevSlide(); }
    }, { passive: true });
  }

  // Keyboard support
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft')  prevSlide();
  });

  if (slides.length) resetTimer();

  /* ── TAB SWITCHER ── */
  // Reads the target panel from data-tab. The old version called switchTab('x')
  // from an onclick and then used the non-standard global `event` to find which
  // tab to highlight; currentTarget is the element the listener is bound to, so
  // it is correct even when the click lands on a child node.
  document.querySelectorAll('.media-tab').forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      var name = tab.getAttribute('data-tab');
      var panel = document.querySelector('#panel-' + name);
      if (!panel) return;
      document.querySelectorAll('.media-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.media-panel').forEach(function (p) { p.classList.remove('active'); });
      panel.classList.add('active');
      e.currentTarget.classList.add('active');
    });
  });

  /* ── POLL ── */
  document.querySelectorAll('.poll-option').forEach(function (opt) {
    opt.addEventListener('click', function (e) {
      document.querySelectorAll('.poll-option').forEach(function (o) { o.classList.remove('selected'); });
      e.currentTarget.classList.add('selected');
    });
  });

  /* ── SMOOTH SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
