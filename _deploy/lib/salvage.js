'use strict';

/**
 * Salvage complete JSON objects out of a malformed or truncated reply.
 *
 * generate-post-queue.js ran a bare JSON.parse() over the model's reply, so one
 * bad character anywhere — an unescaped quote in a corner-braking description,
 * a reply that hit the token ceiling mid-post — discarded every post in the
 * batch. The articles were generated and paid for, then thrown away because the
 * closing bracket never arrived.
 *
 * This walks the raw text tracking brace depth, aware of strings and escapes,
 * and returns each top-level {...} that parses on its own. A batch truncated
 * after two of three posts yields those two; a reply that is one bare object
 * rather than an array yields that object. Braces and quotes inside prose are
 * safe because the scanner knows when it is inside a string.
 *
 * Ported from the monorepo's _deploy/lib/topic-supply.js (netwebmedia/netwebmedia),
 * where the same defect cost two of fourteen batches on 2026-09-15. Kept as a
 * standalone copy rather than a shared dependency because the two repos deploy
 * independently — if the scanner changes there, this is a deliberate port, not a
 * silent drift.
 */

function salvageObjects(raw) {
  // Start at whichever comes first, `[` or `{`. Anchoring on `[` alone made a
  // reply that is a BARE OBJECT unsalvageable: the first `[` in it belongs to an
  // inner field ("sections"), so the scan began inside the post and returned its
  // section objects — none of which pass isUsablePost — while the post itself,
  // complete and paid for, was never looked at. That is not hypothetical: it is
  // 11 of the 31 calls in the 2026-09-16 run.
  const candidates = [raw.indexOf('{'), raw.indexOf('[')].filter((i) => i !== -1);
  if (!candidates.length) return [];
  const start = Math.min(...candidates);
  const out = [];
  let depth = 0;
  let objStart = -1;
  let inStr = false;
  let esc = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') { if (depth === 0) objStart = i; depth++; continue; }
    if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try { out.push(JSON.parse(raw.slice(objStart, i + 1))); } catch { /* skip the broken one */ }
        objStart = -1;
      }
    }
  }
  return out;
}

/** A post object this queue can actually render. */
function isUsablePost(o) {
  return !!(o && typeof o.slug === 'string' && o.slug && Array.isArray(o.sections) && o.sections.length);
}

/**
 * Turn one model reply into posts.
 *
 * Lives here rather than inline in generate-post-queue.js so _ci/validate-batch-
 * parse.mjs exercises the real thing. A test that re-implements the contract
 * passes while the shipping code is broken, which is how the bare-object bug
 * below would have gone on hiding.
 *
 * `via` says which route produced the posts: an `array` reply is returned
 * unfiltered (the caller validates each post and warns per post, which is where
 * that reporting belongs); `object` and `salvage` are already filtered to what
 * the renderer can use.
 */
function parseBatchReply(clean) {
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return { posts: parsed, via: 'array' };
    // A single post is the common case (BATCH_SIZE is 1), and asked for "an
    // array of exactly 1 object" the model quite reasonably returns the object
    // on its own a fair share of the time. That reply parses perfectly — it
    // just is not an Array, and rejecting it binned a complete, paid-for post
    // on 11 of 31 calls in the 2026-09-16 run.
    if (isUsablePost(parsed)) return { posts: [parsed], via: 'object' };
  } catch { /* fall through to salvage */ }

  const salvaged = salvageObjects(clean).filter(isUsablePost);
  return salvaged.length ? { posts: salvaged, via: 'salvage' } : { posts: [], via: 'none' };
}

module.exports = { salvageObjects, isUsablePost, parseBatchReply };
