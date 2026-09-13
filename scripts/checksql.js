const fs = require('fs'), path = require('path');
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) files.push(p); } })('server');
let issues = 0;
const STRS = ["'", '"', '`'];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const re = /db\.prepare\(`([\s\S]*?)`\)\s*\.\s*(run|all|get)\s*\(([\s\S]*?)\)\s*;/g;
  let m;
  while ((m = re.exec(s))) {
    const sql = m[1], method = m[2], argsSrc = m[3];
    const qcount = (sql.match(/\?/g) || []).length;
    if (qcount === 0) continue;
    let d2 = 0, inStr = null, argCount = 0, started = false;
    for (let i = 0; i < argsSrc.length; i++) {
      const c = argsSrc[i];
      if (inStr) { if (c === inStr && argsSrc[i - 1] !== '\\') inStr = null; continue; }
      if (STRS.includes(c)) { inStr = c; continue; }
      if (c === '(' || c === '[' || c === '{') d2++;
      else if (c === ')' || c === ']' || c === '}') d2--;
      else if (c === ',' && d2 === 0) argCount++;
      else if (!/\s/.test(c)) started = true;
    }
    if (started) argCount = argCount + 1;
    const isObj = /^\s*\{/.test(argsSrc);
    const eff = isObj ? 1 : argCount;
    if (eff !== qcount) {
      const line = s.slice(0, m.index).split('\n').length;
      console.log(`MISMATCH ${f}:${line} ${method} sql?=${qcount} args=${eff}${isObj ? ' (obj)' : ''} | ${sql.split('\n')[0].slice(0, 64)}`);
      issues++;
    }
  }
}
console.log(issues ? issues + ' potential mismatch(es)' : 'OK: no positional ? mismatches detected');
