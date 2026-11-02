import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=await fs.readdir(path.join(root,'notes'));
assert.equal(files.filter(f=>f.endsWith('.md')).length,8);
const context={window:{}};
vm.runInNewContext(await fs.readFile(path.join(root,'docs/content.js'),'utf8'),context);
const course=context.window.COURSE;
assert.equal(course.units.length,8);
const csv=await fs.readFile(path.join(root,'sources/page-index.csv'),'utf8');
const rows=csv.trim().split(/\r?\n/).slice(1);
assert.equal(rows.length,316);
assert.deepEqual(rows.map(r=>Number(r.split(',')[0])),Array.from({length:316},(_,i)=>i+1));
assert.match(rows[2],/隐私排除/);
assert.match(rows[83],/空白分隔/);assert.match(rows[180],/空白分隔/);
for(const unit of course.units) {
  assert.ok(unit.html.length>300,unit.id+' missing content');
  assert.match(unit.html,/自测/);
  assert.ok(!/<script|<iframe|<img/i.test(unit.html));
  assert.ok(unit.plain.includes('页'));
}
async function walk(dir) {
  for(const entry of await fs.readdir(dir,{withFileTypes:true})) {
    if(entry.name==='.git'||entry.name==='node_modules')continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) await walk(p);
    else {
      assert.ok(!/\.(pdf|docx|jpe?g|png|pem|key)$/i.test(p),'Unexpected public asset: '+p);
      const text=await fs.readFile(p,'utf8');
      assert.ok(!/C:\\Users\\|[A-Z]:\/Users\//i.test(text),'Machine path in '+p);
      assert.ok(!/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/.test(text),'Credential-like value in '+p);
    }
  }
}
await walk(root);
console.log('Verified 8 populated units, 316 unique page rows, source exclusions and public-file checks.');
