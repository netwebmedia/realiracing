/* RealIRacing — Google Analytics 4 loader (G-2DX10F6KVP)
 *
 * THE ONLY PLACE THE GA4 ID LIVES. Loaded from <head> on every indexable page.
 * Kept as its own file rather than folded into affiliates.js because three
 * pages (the homepage, /blog/ and the slide tool) do not load affiliates.js —
 * tagging via that file would have silently missed the homepage.
 *
 * No inline script anywhere, so a CSP can stay strict if one is ever added:
 * it would only need googletagmanager in script-src plus the collect beacon
 * in connect-src.
 */
(function () {
  var ID = 'G-2DX10F6KVP';
  if (!/(^|\.)realiracing\.com$/i.test(location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('js', new Date());
  gtag('config', ID, { anonymize_ip: true });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
})();
