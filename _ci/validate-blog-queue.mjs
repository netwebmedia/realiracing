#!/usr/bin/env node
/**
 * Blog queue integrity — run in deploy.yml before anything ships.
 *
 *   node _ci/validate-blog-queue.mjs
 *
 * Three failures this catches, all of which have actually happened on one of
 * Don Gastón's blogs:
 *
 * 1. SUFFIXED TWINS. generate-post-queue.js used to auto-suffix a slug
 *    collision — -2, then -3, forever — and TOPIC_POOL wraps (`topicIdx = 0
 *    // cycle if needed`), so it was guaranteed to revisit covered ground. The
 *    monorepo cleared 18 of these by hand on 2026-08-25 after 7 auto-published.
 *    On an affiliate site a near-identical second page splits the ranking
 *    signal for the exact queries that earn the commission. The generator now
 *    drops collisions; this makes sure none reaches the site anyway.
 *
 * 2. TOPIC POOL EXHAUSTION. One post per topic means the supply is the topic
 *    count, not some combinatorial number. Golferos hit exactly this on
 *    2026-09-16: its run reported "0 combinaciones sin usar" and exited 1 with
 *    the queue already empty, and the only fix — writing new topics — needs a
 *    human. Nothing had counted the remainder until it was zero. This fails
 *    with runway left instead.
 *
 * 3. MALFORMED QUEUE JSON. A post the renderer would crash on, or one with no
 *    sections, should not sit in the queue waiting to be published.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE = path.join(ROOT, '_deploy', 'posts-queue');
const PUBLISHED = path.join(QUEUE, '_published');
const BLOG = path.join(ROOT, 'blog');
const GENERATOR = path.join(ROOT, '_deploy', 'generate-post-queue.js');

/** Two posts per day is this site's cadence; a week of runway is the floor. */
const MIN_FREE_TOPICS = 14;

const errors = [];
const notes = [];

// ─── 1. no suffixed twins, anywhere ──────────────────────────────────────────

const SUFFIXED = /-(\d+)$/;
const liveSlugs = fs.existsSync(BLOG)
  ? fs.readdirSync(BLOG).filter((f) => f.endsWith('.html') && f !== 'index.html').map((f) => f.slice(0, -5))
  : [];

const queueSlugs = [];
for (const dir of [QUEUE, PUBLISHED]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    let post;
    try {
      post = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    } catch (e) {
      errors.push(`${path.relative(ROOT, path.join(dir, f))}: not valid JSON — ${e.message}`);
      continue;
    }
    // 3. shape check, pending items only — _published is history, not a queue.
    if (dir === QUEUE) {
      if (!post.slug) errors.push(`${f}: no slug`);
      if (!Array.isArray(post.sections) || post.sections.length === 0) errors.push(`${f}: no sections — the renderer would emit an empty post`);
    }
    if (post.slug) queueSlugs.push(post.slug);
  }
}

for (const slug of [...new Set([...liveSlugs, ...queueSlugs])]) {
  const m = SUFFIXED.exec(slug);
  if (!m) continue;
  const base = slug.slice(0, -m[0].length);
  // A trailing number is only suspicious when the unsuffixed twin also exists
  // — "best-budget-sim-racing-wheel-2026" is a year, not a collision.
  if (liveSlugs.includes(base) || queueSlugs.includes(base)) {
    errors.push(`"${slug}" is a suffixed twin of "${base}" — drop it, never publish both`);
  }
}

// ─── 2. topic headroom ───────────────────────────────────────────────────────

const src = fs.readFileSync(GENERATOR, 'utf8');
const poolMatch = /const TOPIC_POOL = \[([\s\S]*?)\n\];/.exec(src);
if (!poolMatch) {
  errors.push('could not find TOPIC_POOL in _deploy/generate-post-queue.js');
} else {
  const topics = (poolMatch[1].match(/^\s*'(?:[^'\\]|\\.)*'/gm) || []).length;
  // Each published or live post consumed one topic. This is approximate — the
  // model picks its own slug, so a topic and its post do not share a key — but
  // the COUNT is exact, and the count is what runs out.
  const consumed = new Set([...liveSlugs, ...queueSlugs]).size;
  const free = topics - consumed;
  notes.push(`topic pool: ${topics} topics, ${consumed} posts already written, ~${free} unused`);
  if (free < MIN_FREE_TOPICS) {
    errors.push(
      `only ~${free} unused topic(s) left (floor ${MIN_FREE_TOPICS}, ~7 days at 2/day). ` +
      'Add topics to TOPIC_POOL in _deploy/generate-post-queue.js covering subjects the ' +
      'corpus does not have yet — the generator drops a collision rather than suffixing it, ' +
      'so an exhausted pool means it silently writes nothing.'
    );
  }
}

// ─── report ──────────────────────────────────────────────────────────────────

for (const n of notes) console.log(`  ${n}`);
if (errors.length) {
  console.error(`\n✗ blog queue validation failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('✓ blog queue OK — no suffixed twins, topic pool has runway, queue JSON is well-formed');
