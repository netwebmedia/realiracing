#!/usr/bin/env node
// _deploy/generate-post-queue.js
// Auto-generates RealIRacing blog post JSON files using the Claude API.
//
// Usage:
//   node _deploy/generate-post-queue.js                    # generate 20 posts
//   node _deploy/generate-post-queue.js --count 40         # generate 40 posts
//   node _deploy/generate-post-queue.js --start-date 2026-08-01 --count 20
//
// Requires: ANTHROPIC_API_KEY env var

const fs   = require('fs');
const path = require('path');

process.chdir(path.join(__dirname, '..'));

const QUEUE_DIR     = path.join('_deploy', 'posts-queue');
const PUBLISHED_DIR = path.join(QUEUE_DIR, '_published');
const API_URL       = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-haiku-4-5-20251001';
const BATCH_SIZE    = 2; // posts per API call — RealIRacing posts run 1200-1700
                          // words plus FAQs/gearKeys, so batches stay smaller
                          // than NWM's (3) to comfortably fit the 8192-token cap.

// ─── CLI args ────────────────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const countArg     = args.indexOf('--count');
const dateArg      = args.indexOf('--start-date');
const TARGET       = countArg !== -1 ? parseInt(args[countArg + 1], 10) : 20;
const START_DATE   = dateArg  !== -1 ? new Date(args[dateArg + 1])     : new Date();

// ─── Affiliate gear key allowlist ────────────────────────────────────────────
// Parsed live from js/affiliates.js — same parser as generate-blogs.js — so
// the prompt always offers the model the real, current product key list.
function loadAllowedGearKeys() {
  const src = fs.readFileSync(path.join('js', 'affiliates.js'), 'utf8');
  const keys = [];
  const re = /'([a-z][a-z0-9-]*)':\s*\{\s*\r?\n\s*name:\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(src))) keys.push({ key: m[1], name: m[2] });
  return keys;
}

// ─── Topic pool ──────────────────────────────────────────────────────────────
// Sim-racing buyer-intent, how-to and comparison topics — broad enough to
// cover 100+ unique posts without repetition. Deliberately avoids exact
// duplication of the hand-built posts already live in blog/ (wheel buyer's
// guides, MOZA R9 settings, R9 vs R12, R9 vs CSL DD, cockpit tiers, pedals,
// budget rig, safety rating, OBS streaming, VR vs triples, BMW M4 GT4,
// starter setup) — these topics take fresh angles instead.

const TOPIC_POOL = [
  // Wheelbases & wheels
  'entry direct drive wheelbases compared for first-time buyers',
  'when to upgrade from a belt-driven wheel to direct drive',
  'quick-release standards explained and why they matter',
  'wheel rim size and diameter for open-wheel racing',
  'servo vs direct drive: what the terminology actually means in 2026',
  'how torque rating relates to real-world sim racing feel',
  'used sim racing wheelbase buying guide: what to check',

  // Pedals & braking
  'heel-toe braking technique on a load cell pedal',
  'pedal spacing and angle setup for consistent braking',
  'hydraulic vs load cell pedals for iRacing',
  'clutch pedal setups for manual iRacing cars',
  'brake pedal calibration curves explained',

  // Cockpits & rig building
  'DIY sim racing rig vs buying a pre-built cockpit',
  'monitor stand vs triple monitor rig arm setups',
  'seat position and ergonomics for long endurance stints',
  'cable management for a multi-peripheral sim rig',
  'button box and handbrake add-ons for rally and drift',

  // FFB & settings
  'iRacing FFB clipping: how to diagnose and fix it',
  'in-car vs in-menu FFB adjustments explained',
  'damping and friction settings on direct drive wheels',
  'setting up FFB for rain and low-grip conditions',
  'why FFB feels different car to car in iRacing',

  // iRacing-specific tips / SR / iRating
  'iRacing license classes explained for new members',
  'how the iRacing multiplier affects rating gains',
  'reading incident points and what actually causes them',
  'best practices for iRacing qualifying sessions',
  'iRacing series selection guide by skill level',
  'understanding strength of field in iRacing',
  'team endurance racing on iRacing: getting started',

  // Streaming & content
  'multi-camera setups for sim racing streams',
  'overlay and HUD tools for iRacing streams',
  'growing a sim racing YouTube channel from zero',
  'microphone and audio setup for sim racing commentary',
  'editing iRacing race highlights for social media',

  // Car & discipline guides
  'oval racing fundamentals for road racers switching over',
  'rally cross and dirt disciplines on iRacing',
  'endurance racing fuel and tire strategy basics',
  'formula car vs GT car handling differences',
  'left-foot braking technique for advanced drivers',
  'wet weather driving technique in iRacing',

  // Displays & PC hardware
  'GPU upgrade guide specifically for sim racing frame rates',
  'CPU vs GPU bottlenecks in iRacing',
  'refresh rate and input lag for competitive sim racing',
  'VR headset comparison for PCVR sim racing in 2026',

  // Budget & buying strategy
  'building a sim rig incrementally without buyer\'s remorse',
  'secondhand sim racing gear: what to check before buying',
  'sim racing gear worth buying used vs new',
  'seasonal sales strategy for sim racing hardware purchases',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function existingSlugs() {
  const slugs = new Set();
  for (const dir of [QUEUE_DIR, PUBLISHED_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const slug = f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.json$/, '');
      slugs.add(slug);
    }
  }
  // Also fold in slugs already published as .html, so the generator never
  // re-proposes a topic that's already live on the site.
  if (fs.existsSync('blog')) {
    for (const f of fs.readdirSync('blog')) {
      if (f.endsWith('.html') && f !== 'index.html') slugs.add(f.replace(/\.html$/, ''));
    }
  }
  return slugs;
}

function dateLabel(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── API call ────────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 90000; // hard cap per API call; without this a stalled
                                   // connection hangs the whole job.

async function generateBatch(topics, publishDate, usedSlugs, gearOptions) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const dateStr  = isoDate(publishDate);
  const labelStr = dateLabel(publishDate);
  const recentSlugs = [...usedSlugs].slice(-150);
  const gearKeyList = gearOptions.map(g => `${g.key} (${g.name})`).join(', ');

  const systemPrompt = `You are Carlos Martinez, an iRacing sim racer who writes the blog at RealIRacing (realiracing.com), an Amazon Associates affiliate site about sim racing gear and iRacing technique. You race on your own rig — a MOZA R9 direct drive wheelbase, MOZA CRP2 load-cell pedals, and a fixed aluminum cockpit — and you write from that first-person, real-rig perspective. Genuinely useful, specific, opinionated content — never vague marketing copy.

Voice rules:
- First person ("I", "my rig", "I race on"), grounded in the MOZA R9 setup described above
- Hedge every hardware spec you mention — use "~" (roughly) for torque figures, prices, and other numbers that change over time (e.g. "~9 N·m", never a bare unhedged figure presented as exact)
- NEVER use the words "risk-free", "guaranteed", or similar absolute claims — sim racing gear is a real purchase with real trade-offs, and you say so honestly
- No fabricated specs, review counts, or lap-time claims — if you don't know a number, describe the trade-off qualitatively instead
- FAQ answers must be plain text (no inline HTML tags) since they also populate FAQPage JSON-LD

Return ONLY a valid JSON array of exactly ${topics.length} blog post objects. No markdown, no explanation, just the JSON array.

Each object must have exactly these fields:
- slug: URL-friendly string, lowercase, hyphens, no dates, 3-7 words, must NOT be in this already-used list: ${JSON.stringify(recentSlugs)}
- tag: a short two-part category label separated by " · ", e.g. "Buyer's Guide · Hardware", "Setup Guides · FFB", "iRacing Tips · Licenses", "Car Guide · GT Racing", "Streaming · OBS", "Hardware · Displays"
- author: "Carlos Martinez"
- readTime: e.g. "7 min read" or "8 min read"
- title: compelling, specific title (8-14 words)
- description: 1-2 sentence meta description, under 160 chars, benefit-focused
- sections: array of 9-13 section objects. Each section object has exactly ONE of these keys (except tip, which may also carry a sibling "tipLabel"):
  - {"p": "paragraph text"} — body paragraph (inline <a href="..."> and <strong> allowed)
  - {"h2": "heading text"} — section heading
  - {"h3": "subheading text"} — optional subheading
  - {"list": ["item 1", "item 2", "item 3"]} — bullet list (inline HTML allowed per item)
  - {"olist": ["step 1", "step 2"]} — numbered list
  - {"tip": "callout text", "tipLabel": "short label"} — a highlighted insight callout box
  Structure: 1-2 intro paragraphs (the FIRST paragraph is treated as the article lead), then 3-4 h2 sections each with paragraphs, at least one list, one tip callout. Total should read as 1200-1700 words of real content, not padding.
- faqs: array of exactly 4 objects {"q": "question text", "a": "plain-text answer, no HTML"} — specific, genuinely useful answers, not restatements of the description
- gearKeys: array of 2-4 strings, ONLY from this exact allowed list of product keys: ${gearKeyList}. Pick keys genuinely relevant to the post's topic.
- published: "${dateStr}"
- dateLabel: "${labelStr}"

Rules:
- Every slug must be unique within this batch and not in the used-slugs list above
- gearKeys MUST only use keys from the allowed list verbatim (exact key strings, e.g. "moza-r9" not "MOZA R9")
- Include at least one internal cross-reference per post as an inline <a href="some-other-slug.html"> where it's genuinely relevant (use plausible existing RealIRacing slugs like "best-sim-racing-wheels-iracing.html", "moza-r9-iracing-settings.html", "best-sim-racing-cockpit-2026.html", "best-sim-racing-pedals-iracing-2026.html" — these already exist on the site)
- Each post must stand alone as genuinely useful content a real sim racer would want to read`;

  const userPrompt = `Generate ${topics.length} blog posts on these topics:\n${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      }),
      signal: ac.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content[0].text.trim();
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  return JSON.parse(clean);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set. Add it as a repo secret (Settings -> Secrets and variables -> Actions) and as an env var locally. Get a key at https://console.anthropic.com');
    process.exit(1);
  }

  if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });
  if (!fs.existsSync(PUBLISHED_DIR)) fs.mkdirSync(PUBLISHED_DIR, { recursive: true });

  const allowedGearKeys = loadAllowedGearKeys();
  if (allowedGearKeys.length === 0) {
    console.error('Error: could not parse any product keys from js/affiliates.js — aborting so we never ship posts with an empty gear allowlist.');
    process.exit(1);
  }

  const used   = existingSlugs();
  const topics = shuffle(TOPIC_POOL);
  let written  = 0;
  let topicIdx = 0;

  let currentDate = new Date(START_DATE);
  const queueFiles = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json') && /^\d{4}-\d{2}-\d{2}/.test(f));
  if (queueFiles.length > 0) {
    const latestFile = queueFiles.sort().pop();
    const latestDate = new Date(latestFile.slice(0, 10));
    if (latestDate >= currentDate) currentDate = addDays(latestDate, 1);
  }

  console.log(`Generating ${TARGET} posts starting from ${isoDate(currentDate)}...`);
  console.log(`Allowed gear keys: ${allowedGearKeys.map(g => g.key).join(', ')}`);

  const MAX_STALLS = 6;
  let stalls   = 0;
  let dayCount = 0; // posts written for the current date — advance date every 2/day

  while (written < TARGET) {
    if (stalls >= MAX_STALLS) {
      console.error(`Stopping early: ${MAX_STALLS} consecutive batches produced no posts. Wrote ${written}/${TARGET}.`);
      break;
    }

    const remaining = TARGET - written;
    const batchSize = Math.min(BATCH_SIZE, remaining, topics.length - topicIdx);
    if (batchSize === 0) break;

    const batch = topics.slice(topicIdx, topicIdx + batchSize);
    topicIdx += batchSize;
    if (topicIdx >= topics.length) topicIdx = 0; // cycle if needed

    console.log(`  Batch: ${batch.length} post(s) for ${isoDate(currentDate)}...`);

    let posts;
    try {
      posts = await generateBatch(batch, currentDate, used, allowedGearKeys);
    } catch (e) {
      console.error(`  Error in batch: ${e.message}`);
      await new Promise(r => setTimeout(r, 5000));
      try { posts = await generateBatch(batch, currentDate, used, allowedGearKeys); }
      catch (e2) { console.error(`  Retry failed: ${e2.message}`); stalls++; continue; }
    }

    if (!Array.isArray(posts)) {
      console.error('  Batch returned non-array response; skipping.');
      stalls++;
      continue;
    }

    const allowedKeySet = new Set(allowedGearKeys.map(g => g.key));
    let wroteThisBatch = 0;
    for (const post of posts) {
      if (!post || !post.slug || typeof post.slug !== 'string' || !Array.isArray(post.sections)) {
        console.warn('  Skipping post with missing/invalid slug or sections.');
        continue;
      }

      let slug = post.slug;
      if (used.has(slug)) {
        let n = 2;
        while (used.has(`${post.slug}-${n}`)) n++;
        slug = `${post.slug}-${n}`;
        post.slug = slug;
      }

      // Validate gearKeys against the live allowlist; never let a post ship
      // with zero valid keys — fall back to the core rig.
      let gearKeys = Array.isArray(post.gearKeys) ? post.gearKeys.filter(k => allowedKeySet.has(k)) : [];
      if (gearKeys.length === 0) gearKeys = ['moza-r9', 'cockpit'];
      post.gearKeys = gearKeys;

      const filename = `${isoDate(currentDate)}-${slug}.json`;
      const filepath = path.join(QUEUE_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(post, null, 2) + '\n');
      used.add(slug);
      written++;
      wroteThisBatch++;
      dayCount++;
      console.log(`  + ${filename}`);

      // Advance the publish date every 2 posts (2/day cadence, matching the
      // publish workflow's ~2-4/day pace for a niche affiliate site).
      if (dayCount >= 2) {
        currentDate = addDays(currentDate, 1);
        dayCount = 0;
      }
    }

    stalls = wroteThisBatch === 0 ? stalls + 1 : 0;

    if (written < TARGET) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone. Generated ${written} posts.`);
  console.log(`Queue now has ${fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.json')).length} pending posts.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
