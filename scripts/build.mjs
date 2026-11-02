import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
let marked;
try { ({marked} = await import('marked')); }
catch(error) {
  if(!process.env.NOTES_NODE_MODULES) throw error;
  ({marked} = await import(pathToFileURL(path.join(process.env.NOTES_NODE_MODULES,'marked/lib/marked.esm.js'))));
}
const read = p => fs.readFile(path.join(root,p),'utf8');
const course = JSON.parse(await read('sources/course.json'));
marked.use({renderer:{html(){return '';}}});
function parse(md) {
  // Only Markdown, no raw HTML from source notes. Generated HTML is trusted locally.
  return marked.parse(md.replace(/<!--[\s\S]*?-->/g,''), {gfm:true});
}
for(const unit of course.units) {
  const md=await read(unit.file);
  const text=md.replace(/^# .*\r?\n/,'').replace(/^> .*\r?\n/m,'').trim();
  unit.html=parse(text);
  unit.plain=text.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[#*|_`>]/g,'');
}
let about=await read('sources/about.md');
const corrections=(await read('sources/corrections.md')).replace(/^# .*\r?\n/,'');
about=about.replace('<!-- CORRECTIONS -->',corrections);
course.aboutHtml=parse(about);
// Embedded data supports both GitHub Pages and offline file:// reading.
await fs.writeFile(path.join(root,'docs/content.js'),'window.COURSE = '+JSON.stringify(course).replace(/</g,'\\u003c')+';\n');
await fs.copyFile(path.join(root,'sources/page-index.csv'),path.join(root,'docs/source-index.csv'));
console.log(`Built ${course.units.length} units; ${course.source.pageCount} source pages indexed.`);
