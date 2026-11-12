/* 내부 확인용 작은 웹 서버: node tools/serve.js → http://localhost:5173
   (파일 더블클릭으로도 열리지만, DB 주소(fetch)를 시험하려면 서버로 열어야 한다) */
var http = require('http'), fs = require('fs'), path = require('path');
var ROOT = path.resolve(__dirname, '..'), TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
function start(port) {
  var srv = http.createServer(function (req, res) {
    var p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') { p = '/index.html'; }
    var f = path.join(ROOT, p); if (f.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end(); }
    fs.readFile(f, function (err, buf) { if (err) { res.writeHead(404); return res.end('not found'); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(buf); });
  });
  return new Promise(function (ok) { srv.listen(port || 0, '127.0.0.1', function () { ok(srv); }); });
}
module.exports = start;
if (require.main === module) { start(+process.env.PORT || 5173).then(function (s) { console.log('Q.V.I.S → http://localhost:' + s.address().port + '/   (?check=1 배치 검사, ?data=data/sample.json DB 연결 시험)'); }); }
