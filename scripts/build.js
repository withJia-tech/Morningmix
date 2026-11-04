import { mkdir, rm, cp, copyFile } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
for (const dir of ['src','assets']) await cp(dir,`dist/${dir}`,{recursive:true});
await copyFile('index.html','dist/index.html');
console.log('Static testing build written to dist/. No tests or private fixtures included.');
