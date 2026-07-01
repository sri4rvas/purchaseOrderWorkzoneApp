/*
 * Patch generated deployer package.json engines after `cds build`.
 * The CF Node.js buildpack now ships only Node 22/24, but cds/hdi-deploy
 * stamp `^16 || ^18 || ^20` into gen/db (and older cds into gen/srv),
 * which the buildpack cannot satisfy. Re-pin to Node 22.
 */
const fs = require('fs');
const range = '^20 || ^22';
for (const f of ['gen/db/package.json', 'gen/srv/package.json']) {
  if (!fs.existsSync(f)) continue;
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  p.engines = { node: range };
  fs.writeFileSync(f, JSON.stringify(p, null, 2));
  console.log('patched engines in', f, '->', range);
}
