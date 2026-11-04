import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('.');
const args = process.argv.slice(2), option = name => args.includes(name) ? args[args.indexOf(name)+1] : undefined;
const port = Number(option('--port') || process.env.PORT || 3000), host = option('--host') || '127.0.0.1';
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    // Serve only the public application; never AGENTS, test fixtures or source archives.
    if (pathname !== '/' && pathname !== '/index.html' && !/^\/(src|assets)\//.test(pathname)) throw new Error('Not public');
    const file = resolve(root,'.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) throw new Error('Invalid path');
    const body = await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port,host,() => console.log(`morningmixer: http://${host}:${port}`));
