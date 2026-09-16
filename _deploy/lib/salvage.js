'use strict';

/**
 * Salvage complete JSON objects out of a malformed or truncated array.
 *
 * generate-post-queue.js ran a bare JSON.parse() over the model's reply, so one
 * bad character anywhere — an unescaped quote in a corner-braking description,
 * a reply that hit the token ceiling mid-post — discarded every post in the
 * batch. The articles were generated and paid for, then thrown away because the
 * closing bracket never arrived.
 *
 * This walks the raw text tracking brace depth, aware of strings and escapes,
 * and returns each top-level {...} that parses on its own. A batch truncated
 * after two of three posts yields those two. Braces and quotes inside prose are
 * safe because the scanner knows when it is inside a string.
 *
 * Ported from the monorepo's _deploy/lib/topic-supply.js (netwebmedia/netwebmedia),
 * where the same defect cost two of fourteen batches on 2026-09-15. Kept as a
 * standalone copy rather than a shared dependency because the two repos deploy
 * independently — if the scanner changes there, this is a deliberate port, not a
 * silent drift.
 */

function salvageObjects(raw) {
  const start = raw.indexOf('[');
  if (start === -1) return [];
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

module.exports = { salvageObjects, isUsablePost };
