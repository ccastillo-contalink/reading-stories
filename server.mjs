import http from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./docs/', import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf','.webp':'image/webp'};
const server = http.createServer(async (req,res) => {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, {'Allow':'GET, HEAD'}); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let target = resolve(root, '.' + (pathname.endsWith('/') ? pathname+'index.html' : pathname));
    if (!target.startsWith(resolve(root)+sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const file = await stat(target);
    if (!file.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type':mime[extname(target)] || 'application/octet-stream','Content-Length':file.size,'X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : await readFile(target));
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port,'127.0.0.1',()=>console.log(`Cuentos con Bluey: http://localhost:${port}`));

