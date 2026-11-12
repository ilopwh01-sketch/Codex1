/* npm test · 화면이 똑같이 작동하는지 + 배치(간격·겹침·줄바꿈) 문제를 숫자로 검사한다.
   고친 뒤에는 항상 실행하고, 실패 목록이 0이 될 때까지 고친다. 캡처는 tests/out/ 에 저장된다(사람 확인용). */
var path = require('path'), fs = require('fs'), serve = require('../tools/serve');
var chromium; try { chromium = require('playwright').chromium; } catch (e) { console.error('playwright가 없습니다: npm install 후 npx playwright install chromium'); process.exit(2); }
var OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
var SIZES = [[1920, 1080], [1366, 768]], fails = [], warns = [];
function fail(where, msg) { fails.push(where + ' — ' + msg); }
(async function () {
  var srv = await serve(0), base = 'http://127.0.0.1:' + srv.address().port + '/index.html';
  var browser = await chromium.launch();
  async function page(w, h, url) {
    var p = await browser.newPage({ viewport: { width: w, height: h } }), errs = [];
    p.on('pageerror', function (e) { errs.push(e.message); }); p.on('console', function (m) { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) { errs.push(m.text()); } });
    await p.goto(url); await p.waitForTimeout(1500); return { p: p, errs: errs };
  }
  async function check(p, where) {
    var r = await p.evaluate(function () { return layoutCheck().map(function (x) { return { w: x.level === 'warn', m: '[' + x.kind + '] ' + x.where + ' “' + x.text + '” ' + x.detail }; }); });
    r.forEach(function (x) { if (x.w) { warns.push(where + ' — ' + x.m); } else { fail(where, x.m); } });
    var ph = await p.evaluate(function () { return /\[담당자\]|undefined|NaN/.test(document.body.innerText) ? document.body.innerText.match(/.{0,20}(\[담당자\]|undefined|NaN).{0,20}/)[0] : ''; });
    if (ph) { fail(where, '화면에 자리표시·오류 글자: ' + ph); }
  }
  /* 1) 데이터 모양 */
  var t = await page(1366, 768, base);
  var de = await t.p.evaluate(function () { return validateData(DATA); }); de.forEach(function (m) { fail('예시 데이터', '형식 오류: ' + m); });
  var bad = await t.p.evaluate(function () { return applyData({ line: '잘못된 데이터' }); }); if (bad !== false) { fail('데이터 검사', '틀린 JSON을 그대로 받아들임'); }
  await t.p.close();
  /* 1-2) 검사기 자체 확인: 일부러 망가뜨린 배치를 잡아내는지 (검사기를 고쳐서 통과시키는 것 방지) */
  t = await page(1366, 768, base);
  var self = await t.p.evaluate(function () {
    var d = document.createElement('div'); d.style.cssText = 'position:fixed;left:20px;top:200px;width:200px;font-size:14px;z-index:50';
    d.innerHTML = '<p id="lc1" style="width:60px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin:0">아주 긴 설비 이름이 잘립니다</p>' +
      '<p id="lc2" style="width:150px;margin:0;word-break:break-all">스트링거 삼호기 재확인</p>' +
      '<svg width="200" height="40" viewBox="0 0 200 40"><text x="10" y="20">겹치는 글자</text><text x="14" y="22">겹치는 글자</text></svg>';
    document.body.appendChild(d);
    var k = layoutCheck().map(function (x) { return x.kind; }); d.remove(); return k;
  });
  ['말줄임 잘림', '글자 겹침'].forEach(function (k) { if (self.indexOf(k) < 0) { fail('검사기 자체 확인', '“' + k + '”를 잡지 못함 — 95-layout-check.js가 망가졌습니다'); } });
  await t.p.close();
  /* 1-3) 파일 더블클릭(file://)으로 열어도 동작하는지: index.html, dist/qvis-pc.html */
  var files = ['index.html'].concat(fs.existsSync(path.join(__dirname, '../dist/qvis-pc.html')) ? ['dist/qvis-pc.html'] : []);
  for (var fi = 0; fi < files.length; fi++) {
    t = await page(1366, 768, 'file://' + path.join(__dirname, '..', files[fi]));
    var ok = await t.p.evaluate(function () { return typeof layoutCheck === 'function' && document.querySelectorAll('.chip').length > 0; });
    if (!ok) { fail('file:// ' + files[fi], '더블클릭으로 열면 화면이 만들어지지 않음'); }
    t.errs.forEach(function (m) { fail('file:// ' + files[fi], '오류: ' + m); }); await t.p.close();
  }
  /* 2) DB 연결 경로 (data/sample.json) */
  t = await page(1366, 768, base + '?data=data/sample.json'); await t.p.waitForTimeout(800);
  var badge = await t.p.textContent('#data-badge'); if (!/DB 연결 ·/.test(badge)) { fail('DB 연결', '배지가 "' + badge + '" (DB 연결 ·  이어야 함)'); }
  t.errs.forEach(function (m) { fail('DB 연결', '오류: ' + m); }); await t.p.close();
  /* 3) 크기별: 기본 화면 + 추천 질문마다 팝업 */
  for (var s = 0; s < SIZES.length; s++) {
    var W = SIZES[s][0], H = SIZES[s][1], tag = W + '×' + H;
    t = await page(W, H, base); await t.p.waitForTimeout(1200);
    await check(t.p, tag + ' 기본 화면'); await t.p.screenshot({ path: path.join(OUT, W + '_idle.png') });
    var n = await t.p.$$eval('.chip', function (a) { return a.length; }); t.errs.forEach(function (m) { fail(tag, '오류: ' + m); }); await t.p.close();
    for (var c = 0; c < n; c++) {
      t = await page(W, H, base);
      var label = await t.p.$eval('.chip >> nth=' + c, function (b) { return b.textContent; }).catch(function () { return '칩 ' + c; });
      label = await t.p.evaluate(function (i) { return document.querySelectorAll('.chip')[i].textContent; }, c);
      await t.p.evaluate(function (i) { document.querySelectorAll('.chip')[i].click(); }, c);
      var opened = await t.p.waitForFunction(function () { return document.querySelector('.app.open') || document.querySelector('.alertbar.on'); }, null, { timeout: 15000 }).then(function () { return true; }).catch(function () { return false; });
      if (!opened) { fail(tag + ' “' + label + '”', '15초 안에 팝업·알림이 열리지 않음'); await t.p.close(); continue; }
      await t.p.waitForTimeout(3200);
      await check(t.p, tag + ' “' + label + '”');
      t.errs.forEach(function (m) { fail(tag + ' “' + label + '”', '오류: ' + m); });
      await t.p.screenshot({ path: path.join(OUT, W + '_' + c + '.png') }); await t.p.close();
    }
  }
  await browser.close(); srv.close();
  if (warns.length) { console.log('\n간격 경고 ' + warns.length + '건 (실패는 아님, 되도록 고치기)\n' + warns.map(function (f) { return ' △ ' + f; }).join('\n')); }
  if (fails.length) { console.log('\n실패 ' + fails.length + '건\n' + fails.map(function (f) { return ' ✗ ' + f; }).join('\n') + '\n\n캡처: tests/out/'); process.exit(1); }
  console.log('통과: 오류 0, 배치 문제 0 (1920×1080, 1366×768 · 기본 화면 + 팝업 ' + '전부). 캡처: tests/out/');
})().catch(function (e) { console.error(e); process.exit(1); });
