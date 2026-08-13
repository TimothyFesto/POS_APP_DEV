// Simple HTTPS-ready static update server for M Generation II POS.
// Put the electron-builder release files (including latest.yml/latest-mac.yml)
// in ./releases and expose this directory over HTTPS.
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const root = path.resolve(__dirname, 'releases');
const port = Number(process.env.PORT || 8080);
fs.mkdirSync(root, { recursive: true });
const mime = { '.yml':'text/yaml', '.yaml':'text/yaml', '.exe':'application/octet-stream', '.dmg':'application/octet-stream', '.zip':'application/zip', '.blockmap':'application/octet-stream' };
http.createServer((req,res)=>{
  const pathname = decodeURIComponent(url.parse(req.url).pathname).replace(/^\/+/, '');
  const file = path.resolve(root, pathname);
  if (!file.startsWith(root)) return void (res.writeHead(403), res.end('Forbidden'));
  fs.stat(file,(err,st)=>{
    if(err || !st.isFile()) return void (res.writeHead(404), res.end('Not found'));
    res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': pathname.endsWith('.yml') ? 'no-cache' : 'public, max-age=300'});
    fs.createReadStream(file).pipe(res);
  });
}).listen(port,()=>console.log(`Update server listening on http://localhost:${port}`));
