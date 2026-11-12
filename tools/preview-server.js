// Local preview helper.
//   http://localhost:8787/                 -> phone-frame preview (tools/phone-preview.html)
//   http://localhost:8787/<file>.json      -> files from data/ (latest.json, index.json, archive/...)
// Run from the repo root: node tools/preview-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.end();

    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(root, 'tools', 'phone-preview.html');
    if (urlPath.endsWith('.json')) {
      file = path.normalize(path.join(dataDir, urlPath));
      // Only serve files inside data/.
      if (!file.startsWith(dataDir + path.sep)) {
        res.statusCode = 403;
        return res.end('Forbidden');
      }
    }
    fs.readFile(file, (err, body) => {
      if (err) {
        res.statusCode = 404;
        return res.end('Not found');
      }
      res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'text/html');
      res.end(body);
    });
  })
  .listen(8787, () => console.log('Preview: http://localhost:8787'));
