// _deploy/backfill-gear-jump.js
//
// One-shot, idempotent backfill: adds the "Gear picks ↓" jump link to the
// byline row of every post that carries an affiliate gear box (#rir-gear).
//
// Why: an audit on 2026-10-06 found the first affiliate link on the top
// buyer's-guide posts sat 4,700px down the page (roughly six screens on a
// phone). The byline row is above the fold on every screen size, so the link
// puts the gear box one tap from the first paint. generate-blogs.js emits the
// same link for every post rendered from now on.
//
// Posts without #rir-gear are skipped: the anchor would go nowhere.
//
// Usage:
//   node _deploy/backfill-gear-jump.js --dry-run
//   node _deploy/backfill-gear-jump.js

const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const DRY = process.argv.includes('--dry-run');
const DIR = 'blog';
const LINK = '<span class="dot">·</span>\n      <a class="meta-gear" href="#rir-gear">Gear picks ↓</a>';
let added = 0, skipped = 0, noBox = 0;

for (const f of fs.readdirSync(DIR).filter(n => n.endsWith('.html') && n !== 'index.html')) {
  const file = path.join(DIR, f);
  const src = fs.readFileSync(file, 'utf8');
  const crlf = src.includes('\r\n');
  let s = crlf ? src.replace(/\r\n/g, '\n') : src;
  if (s.includes('class="meta-gear"')) { skipped++; continue; }
  if (!s.includes('id="rir-gear"')) { noBox++; continue; }
  const m = s.match(/(<div class="article-meta">[\s\S]*?)(\n    <\/div>)/);
  if (!m) { noBox++; continue; }
  s = s.replace(m[0], m[1] + '\n      ' + LINK + m[2]);
  if (crlf) s = s.replace(/\n/g, '\r\n');
  if (!DRY) fs.writeFileSync(file, s);
  added++;
}
console.log(`${DRY ? '[dry-run] ' : ''}added=${added} already=${skipped} no-gear-box/meta=${noBox}`);
