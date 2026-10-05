// _deploy/lib/affiliates-ssr.js
//
// Server-side mirror of the runtime affiliate renderer in js/affiliates.js.
//
// The gear box used to exist only after JavaScript ran: every post shipped an
// empty `<div id="rir-gear"></div>` and renderGearBox() filled it in the
// browser. A live audit of realiracing.com found affiliate links in the served
// HTML of just 10 of 28 posts — and only because those posts' prose carried
// inline data-aff anchors. Crawlers saw nothing, and every commission depended
// on JS executing. Rendering the box at build time fixes both.
//
// js/affiliates.js stays the single source of truth for product data; this
// module PARSES it rather than duplicating it, so the two can never drift.
// Kept as its own module (not inside generate-blogs.js) because that script
// executes its pipeline at top level — requiring it would publish posts.

const fs = require('fs');
const path = require('path');

const AFFILIATES_JS = path.join('js', 'affiliates.js');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const unquote = (s) => s.replace(/\\'/g, "'").replace(/\\\\/g, '\\');

/* Parse amazonTag, products and the FTC disclosure out of js/affiliates.js. */
function loadAffiliateConfig(file) {
  const src = fs.readFileSync(file || AFFILIATES_JS, 'utf8');

  const tagM = src.match(/amazonTag:\s*'([^']*)'/);
  const amazonTag = tagM ? tagM[1] : '';

  // Each product is `'key': { name: '…', amazonUrl: '…', note: '…' }`.
  const products = {};
  const re = /'([a-z][a-z0-9-]*)':\s*\{\s*\r?\n\s*name:\s*'((?:[^'\\]|\\.)*)',\s*\r?\n\s*amazonUrl:\s*'((?:[^'\\]|\\.)*)',\s*\r?\n\s*note:\s*'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(src))) {
    products[m[1]] = { name: unquote(m[2]), amazonUrl: unquote(m[3]), note: unquote(m[4]) };
  }

  const discM = src.match(/var DISCLOSURE = '((?:[^'\\]|\\.)*)'/);
  const disclosure = discM
    ? unquote(discM[1])
    : 'Some links are affiliate links — I may earn a commission at no cost to you.';

  return { amazonTag, products, disclosure };
}

/* Mirrors affUrl() in js/affiliates.js — the tag is appended only once a real
 * Associates ID is configured, never for the 'PENDING-20' placeholder. */
function affUrlFor(cfg, key) {
  const p = cfg.products[key];
  if (!p) return '#';
  let url = p.amazonUrl;
  if (cfg.amazonTag && cfg.amazonTag !== 'PENDING-20') {
    url += (url.indexOf('?') === -1 ? '?' : '&') + 'tag=' + encodeURIComponent(cfg.amazonTag);
  }
  return url;
}

/* Products Carlos actually races and streams on (the "actual rig" group in
 * js/affiliates.js, minus WHOOP: the band on his wrist is a 4.0, the product
 * linked is the 5.0 you can buy now). These get the "Raced on" badge in the
 * comparison table; every other pick is a researched recommendation, exactly as
 * the disclosure paragraph on each post already says. No ratings, no scores and
 * no prices are shown anywhere in the box. */
const RIG_KEYS = new Set([
  'moza-r9', 'moza-cs-v2', 'moza-crp2', 'gpu-rtx-5060-ti', 'cpu-ryzen-7-5700', 'monitor-1440p-120',
]);

/* Produces the gear box renderGearBox() would build in the DOM, as a comparison
 * table: pick, why it made the list, and whether it is on Carlos's own rig.
 * Unknown keys are dropped rather than throwing — a bad key must never break
 * the pipeline. Returns the empty container unchanged when nothing valid
 * remains, so the runtime path can still try. data-aff is emitted so
 * hydrateLinks() can re-point a link if the tag ever changes without a rebuild;
 * every link keeps rel="sponsored noopener" and the Associates tag. */
function renderGearBoxHtml(cfg, keys, title) {
  const rows = (keys || [])
    .filter((k) => cfg.products[k])
    .map((k) => {
      const p = cfg.products[k];
      const a = `<a href="${esc(affUrlFor(cfg, k))}" data-aff="${esc(k)}" target="_blank" rel="sponsored noopener">${esc(p.name)}</a>`;
      const status = RIG_KEYS.has(k)
        ? '<span class="rig-badge">Raced on</span>'
        : '<span class="rig-badge rig-badge--rec">Researched pick</span>';
      return `            <tr><th scope="row">${a}</th><td>${esc(p.note)}</td><td>${status}</td></tr>`;
    });

  if (!rows.length) return '<div id="rir-gear"></div>';

  return `<div id="rir-gear"><div class="gear-box">
        <span class="box-label">${esc(title || 'Gear used & recommended')}</span>
        <div class="table-scroll">
          <table class="gear-table">
            <thead><tr><th scope="col">Pick</th><th scope="col">Why it made the list</th><th scope="col">Tested?</th></tr></thead>
            <tbody>
${rows.join('\n')}
            </tbody>
          </table>
        </div>
        <p class="aff-note">${esc(cfg.disclosure)}</p>
      </div></div>`;
}

/* schema.org ItemList of Product entries for a post's gear keys. Deliberately
 * has no offers, price, rating or review: none of those exist as real data, and
 * affiliate URLs are not the product's canonical page. */
function gearItemListLd(cfg, keys, pageUrl, title) {
  const items = (keys || []).filter((k) => cfg.products[k]).map((k, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Product',
      name: cfg.products[k].name,
      description: cfg.products[k].note,
      url: `${pageUrl}#rir-gear`,
    },
  }));
  if (!items.length) return null;
  return { '@context': 'https://schema.org', '@type': 'ItemList', name: title || 'The gear in this guide', itemListElement: items };
}

module.exports = { loadAffiliateConfig, affUrlFor, renderGearBoxHtml, gearItemListLd, RIG_KEYS, esc };
