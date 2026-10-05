/* RealIRacing — lite YouTube embeds.
 * Markup is a normal link to the video wrapped in .lite-yt[data-video-id], so it works
 * with JavaScript off. On click the thumbnail is swapped for a youtube-nocookie iframe
 * (no YouTube request is made until the visitor asks for the video). External file on
 * purpose: the CSP has no 'unsafe-inline' for scripts. */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('.lite-yt .lite-yt-link');
    if (!link) return;
    var box = link.closest('.lite-yt');
    var id = box && box.getAttribute('data-video-id');
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;
    e.preventDefault();
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    f.title = link.getAttribute('data-title') || 'YouTube video player';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.setAttribute('allowfullscreen', '');
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    box.textContent = '';
    box.appendChild(f);
    f.focus();
  });
})();
