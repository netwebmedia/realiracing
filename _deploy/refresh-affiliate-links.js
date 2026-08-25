#!/usr/bin/env node
/* _deploy/refresh-affiliate-links.js
 *
 * Rewrites every affiliate href already published on the site so it matches
 * the current js/affiliates.js.
 *
 * WHY THIS EXISTS
 * Affiliate URLs are baked into the served HTML at build time (see
 * _deploy/lib/affiliates-ssr.js) so crawlers can see them. That is the right
 * call for SEO, but it means editing js/affiliates.js only changes NEW posts —
 * every already-published post keeps the URL it was rendered with. Readers
 * still got the new link because js/affiliates.js re-renders the gear box and
 * re-hydrates anchors on DOMContentLoaded, but the HTML crawlers read stayed
 * stale. This script closes that gap.
 *
 * HOW IT WORKS
 * Every affiliate anchor on the site — inside a gear box and inline in prose —
 * carries data-aff="<product key>". That key is the join. For each anchor we
 * look the key up in the live config and rewrite href, target and rel. Nothing
 * else in the page is touched, so it is safe to re-run at any time.
 *
 * Unknown keys are reported and left alone rather than silently dropped: a key
 * that no longer exists in affiliates.js is a content bug worth seeing.
 *
 * USAGE
 *   node _deploy/refresh-affiliate-links.js            # apply
 *   node _deploy/refresh-affiliate-links.js --dry-run  # report only
 */

const fs = require('fs');
const path = require('path');
const { loadAffiliateConfig } = require('./lib/affiliates-ssr.js');

const DRY = process.argv.includes('--dry-run');

/* Same escaping the SSR renderer uses, so a refreshed href is byte-identical
 * to one this repo would have rendered from scratch. */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function affUrlFor(cfg, key) {
  const p = cfg.products[key];
  if (!p) return null;
  let url = p.amazonUrl;
  if (cfg.amazonTag && cfg.amazonTag !== 'PENDING-20') {
    url += (url.indexOf('?') === -1 ? '?' : '&') + 'tag=' + encodeURIComponent(cfg.amazonTag);
  }
  return url;
}

/* Collect every .html that carries at least one affiliate anchor. */
function htmlFiles(dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const cfg = loadAffiliateConfig();
const knownKeys = Object.keys(cfg.products);
if (!knownKeys.length) {
  console.error('refresh-affiliate-links: parsed 0 products from js/affiliates.js — aborting.');
  process.exit(1);
}

/* Matches an <a> tag carrying data-aff, in either attribute order. */
const ANCHOR = /<a\b[^>]*\bdata-aff="([a-z0-9-]+)"[^>]*>/gi;

let filesChanged = 0, linksChanged = 0, unknown = [];

for (const file of htmlFiles('.')) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('data-aff=')) continue;

  let changed = 0;
  const out = src.replace(ANCHOR, (tag, key) => {
    const url = affUrlFor(cfg, key);
    if (!url) { unknown.push(`${path.relative('.', file)} → ${key}`); return tag; }

    const href = esc(url);
    let next = /\bhref="[^"]*"/.test(tag)
      ? tag.replace(/\bhref="[^"]*"/, `href="${href}"`)
      : tag.replace(/^<a\b/, `<a href="${href}"`);

    /* Affiliate links must always disclose and must never leak window.opener. */
    if (!/\brel="[^"]*"/.test(next)) next = next.replace(/^<a\b/, '<a rel="sponsored noopener"');
    if (!/\btarget="[^"]*"/.test(next)) next = next.replace(/^<a\b/, '<a target="_blank"');

    if (next !== tag) changed++;
    return next;
  });

  if (changed && out !== src) {
    if (!DRY) fs.writeFileSync(file, out);
    filesChanged++; linksChanged += changed;
    console.log(`${DRY ? 'would update' : 'updated'}  ${path.relative('.', file)}  (${changed} link${changed === 1 ? '' : 's'})`);
  }
}

console.log(`\n${DRY ? 'DRY RUN — ' : ''}${linksChanged} link(s) across ${filesChanged} file(s).`);
if (unknown.length) {
  console.log(`\n${unknown.length} anchor(s) reference a key that no longer exists in js/affiliates.js:`);
  for (const u of unknown) console.log('  ' + u);
  process.exitCode = 1;
}
