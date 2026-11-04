import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
async function walk(dir) {
  const files = [];
  for (const e of await readdir(dir,{withFileTypes:true})) {
    if (e.isDirectory()) files.push(...await walk(`${dir}/${e.name}`));
    else if (e.name.endsWith('.js')) files.push(`${dir}/${e.name}`);
  }
  return files;
}
const files = (await Promise.all(['src','tests','scripts'].map(walk))).flat();
for (const file of files) {
  const syntax = spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if (syntax.status !== 0) throw new Error(syntax.stderr);
  const source = await readFile(file,'utf8');
  for (const match of source.matchAll(/(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g)) {
    const target = resolve(dirname(file),match[1]);
    await access(target);
    if (file.startsWith('src/domain/') && !target.startsWith(resolve('src/domain') + '/')) throw new Error(`Outward dependency from domain: ${file}`);
    if (file.startsWith('src/game/') && /\/src\/(motion|ui|audio)\//.test(target)) throw new Error(`Game depends on outer layer: ${file}`);
    if (file.startsWith('src/ui/') && /\/src\/(game|motion)\//.test(target) && !target.endsWith('/motionErrors.js')) throw new Error(`View imports mutable game/controller code: ${file}`);
  }
  if ((file.startsWith('src/domain/') || file === 'src/motion/tiltPour.js') && /\b(window|document|navigator|DeviceOrientationEvent|localStorage|sessionStorage|performance)\b/.test(source)) throw new Error(`Browser dependency in pure module: ${file}`);
  if (file.startsWith('src/') && /\b(localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket)\s*[.(]/.test(source)) throw new Error(`Unexpected persistence/network access: ${file}`);
  if (file.startsWith('src/') && file !== 'src/motion/sensorSource.js' && /\b(DeviceOrientationEvent|DeviceMotionEvent)\b|['"]device(?:orientation|motion)['"]/.test(source)) throw new Error(`Native sensor access outside sensorSource: ${file}`);
}
await access('assets/breakfast-anime.png');
await access('assets/barista-chibi.png');
console.log(`Syntax, imports and architecture checks passed (${files.length} JS files).`);
