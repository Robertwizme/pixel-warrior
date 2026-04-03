const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;
const dir = path.join(__dirname);
const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css',
  '.png':'image/png', '.jpg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.json':'application/json', '.woff2':'font/woff2' };
http.createServer((req, res) => {
  let u = req.url.split('?')[0];
  if (u === '/') u = '/index.html';
  const fp = path.join(dir, u);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log('Serving on port ' + port));
