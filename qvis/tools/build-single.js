/* npm run build · 나눠진 파일을 파일 하나로 묶는다 → dist/qvis-pc.html
   (USB로 옮기거나 더블클릭으로 바로 여는 배포용. 고칠 때는 항상 css/·js/ 원본을 고치고 다시 build) */
var fs = require('fs'), path = require('path'), ROOT = path.resolve(__dirname, '..');
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, function (m, f) { return '<style>\n/* ' + f + ' */\n' + fs.readFileSync(path.join(ROOT, f), 'utf8') + '</style>'; });
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, function (m, f) { return '<script>\n/* ' + f + ' */\n' + fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/<\/script/gi, '<\\/script') + '</script>'; });
html = html.replace(/src="(assets\/[^"]+\.png)"/g, function (m, f) { return 'src="data:image/png;base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64') + '"'; });
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/qvis-pc.html'), html);
console.log('dist/qvis-pc.html ' + Math.round(html.length / 1024) + 'KB');
