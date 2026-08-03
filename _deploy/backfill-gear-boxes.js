// _deploy/backfill-gear-boxes.js
//
// One-shot backfill: renders the affiliate gear box into the HTML of posts
// that were generated before generate-blogs.js started emitting it at build
// time.
//
// Why this exists: every post shipped an empty `<div id="rir-gear"></div>` and
// relied on renderGearBox() to fill it in the browser. A live audit of
// realiracing.com found affiliate links present in the served HTML of only 10
// of 28 posts — and those 10 only qualified because their prose happened to
// carry inline data-aff anchors. To a crawler the gear box did not exist, and
// every commission was one JS failure away from disappearing.
//
// Each post already declares its own product keys in the inline
// renderGearBox('rir-gear', [...], 'title') call, so this reads the keys back
// out of the file rather than guessing — the backfill can't invent a product
// the author didn't choose.
//
// Idempotent: a post whose #rir-gear already contains a .gear-box is skipped,
// so re-running changes nothing.
//
// Usage:
//   node _deploy/backfill-gear-boxes.js --dry-run   # report only
//   node _deploy/backfill-gear-boxes.js             # write changes

const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const { loadAffiliateConfig, renderGearBoxHtml, affUrlFor } = require('./lib/affiliates-ssr.js');

const DRY = process.argv.includes('--dry-run');
const BLOG_DIR = 'blog';

const cfg = loadAffiliateConfig();
if (!Object.keys(cfg.products).length) {
  console.error('FATAL: parsed 0 products from js/affiliates.js — aborting rather than writing empty gear boxes.');
  process.exit(1);
}
console.log(`Loaded ${Object.keys(cfg.products).length} products, tag=${cfg.amazonTag || '(none)'}\n`);

const files = fs.readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.html') && f !== 'index.html')
  .sort();

let patched = 0, already = 0, skipped = 0, hydrated = 0;

/* Bake the Associates tag into static `<a data-aff="key" href="…">` anchors.
 * Hand-written posts ship these untagged and rely on hydrateLinks() to add the
 * tag in the browser — so the LINK is crawlable but the COMMISSION still
 * depends on JS running. Writing the tag at build time closes that gap; the
 * data-aff attribute stays so hydrateLinks() can still re-point the link if
 * the tag ever changes without a rebuild. */
function bakeAffiliateTags(html) {
  let count = 0;
  // Rewrite only the href VALUE inside each matching <a …> tag. Attribute
  // order and every other attribute are left exactly as authored.
  const out = html.replace(/<a\s[^>]*>/g, (tag) => {
    const keyM = tag.match(/data-aff="([a-z][a-z0-9-]*)"/);
    if (!keyM) return tag;
    const key = keyM[1];
    if (!cfg.products[key]) return tag;
    if (!/href="[^"]*"/.test(tag)) return tag;
    const want = affUrlFor(cfg, key).replace(/&/g, '&amp;');
    const next = tag.replace(/href="[^"]*"/, `href="${want}"`);
    if (next === tag) return tag;
    count++;
    return next;
  });
  return [out, count];
}

for (const f of files) {
  const p = path.join(BLOG_DIR, f);
  const original = fs.readFileSync(p, 'utf8');
  let html = original;
  const notes = [];

  // 1. Gear box → static, when the post still ships the empty container.
  if (/<div id="rir-gear">\s*<div class="gear-box">/.test(html)) {
    already++;
  } else {
    const empty = html.match(/<div id="rir-gear"><\/div>/);
    // Recover the post's own product keys + box title from its runtime call,
    // so the backfill can never invent a product the author didn't choose.
    const call = html.match(/renderGearBox\(\s*'rir-gear'\s*,\s*(\[[^\]]*\])\s*(?:,\s*'([^']*)')?\s*\)/);

    if (!empty) {
      notes.push('no empty #rir-gear container');
    } else if (!call) {
      notes.push('empty container but no renderGearBox() call to read keys from');
    } else {
      // Machine-generated posts emit a JSON array ("a","b"); older hand-written
      // ones use JS single quotes ('a','b'). Pull the quoted strings out
      // directly so both parse, rather than assuming JSON.
      const keys = (call[1].match(/['"]([a-z][a-z0-9-]*)['"]/g) || []).map((s) => s.slice(1, -1));
      const known = keys.filter((k) => cfg.products[k]);
      const dropped = keys.filter((k) => !cfg.products[k]);

      if (!known.length) {
        notes.push(keys.length ? `none of [${keys.join(', ')}] exist in affiliates.js` : 'no gear keys in renderGearBox()');
      } else {
        html = html.replace(empty[0], renderGearBoxHtml(cfg, known, call[2] || 'The gear in this guide'));
        patched++;
        notes.push(`gear box [${known.join(', ')}]${dropped.length ? ` (dropped unknown: ${dropped.join(', ')})` : ''}`);
      }
    }
  }

  // 2. Bake the Associates tag into every static data-aff anchor — runs on
  //    EVERY file, including ones whose gear box was already static, because
  //    an untagged href earns nothing unless hydrateLinks() gets to run.
  const [tagged, n] = bakeAffiliateTags(html);
  if (n) { html = tagged; hydrated += n; notes.push(`${n} link${n === 1 ? '' : 's'} tagged`); }

  if (html === original) {
    if (notes.length) { console.log(`  skip  ${f} — ${notes.join('; ')}`); skipped++; }
    continue;
  }

  if (!DRY) fs.writeFileSync(p, html);
  console.log(`  ${DRY ? 'would patch' : 'patched'}  ${f} — ${notes.join('; ')}`);
}

console.log(`\n${DRY ? 'DRY RUN — ' : ''}${patched} gear box(es) made static, ${hydrated} affiliate link(s) tagged, ${already} already static, ${skipped} unchanged, ${files.length} scanned.`);
