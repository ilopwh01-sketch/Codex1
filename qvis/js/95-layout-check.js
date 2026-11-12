/* 95-layout-check.js · 배치 검사기 (화면을 못 보는 사람·AI도 간격 문제를 숫자로 확인)
   쓰는 법: 주소 뒤에 ?check=1 을 붙이면 문제 위치에 빨간 테두리와 목록이 뜬다. 테스트(npm test)도 이 함수를 쓴다.
   잡는 것(✗ 실패): 글자끼리 겹침 · 그래프 글자가 그림 밖으로 나감 · 상자 밖으로 삐져나옴 · 말줄임(…) 잘림
            · 한 글자만 다음 줄로 넘어감 · 팝업 안 스크롤 · 화면 밖으로 나감
   알리는 것(△ 경고): 두 단 높이 불균형 · 표 줄 높이 과다 · 축 여백 과다 · 칸 안쪽 여백 과다 ("좁게 적당히" 기준) */
function layoutCheck() {
  var out = [], vw = innerWidth, vh = innerHeight;
  function seen(e) { if (!e || !e.getBoundingClientRect) { return false; } var r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) { return false; } for (var n = e; n && n.nodeType === 1; n = n.parentElement) { var cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) { return false; } } return true; }
  function name(e) { var s = e.tagName.toLowerCase(); if (e.id) { s += '#' + e.id; } if (typeof e.className === 'string' && e.className.trim()) { s += '.' + e.className.trim().split(/\s+/).join('.'); } else if (e.className && e.className.baseVal) { s += '.' + e.className.baseVal.trim().split(/\s+/).join('.'); } return s; }
  function where(e) { var p = e.closest('.panel') ? '팝업' : e.closest('.dock') ? '입력줄' : e.closest('.top') ? '머리줄' : e.closest('.kpi') ? '좌우 숫자' : e.closest('.alertbar') ? '새 불량 알림' : '기본 화면'; return p + ' › ' + name(e); }
  function txt(e) { return (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40); }
  function hit(a, b, pad) { return Math.min(a.right, b.right) - Math.max(a.left, b.left) > pad && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > pad; }
  function add(kind, e, detail) { out.push({ kind: kind, where: where(e), text: txt(e), detail: detail, el: e }); }
  /* 1) 그래프 글자끼리 겹침, 그림 밖으로 나감 */
  Array.prototype.forEach.call(document.querySelectorAll('svg'), function (svg) {
    if (!seen(svg)) { return; }
    var box = (svg.closest('.chartwrap, .pcard, .cbx, .cmain') || svg).getBoundingClientRect();
    var ts = Array.prototype.filter.call(svg.querySelectorAll('text'), function (t) { return seen(t) && t.textContent.trim(); }).map(function (t) { return { t: t, r: t.getBoundingClientRect() }; });
    for (var i = 0; i < ts.length; i++) {
      for (var j = i + 1; j < ts.length; j++) { if (hit(ts[i].r, ts[j].r, 2)) { add('글자 겹침', ts[i].t, '“' + txt(ts[j].t) + '”와 겹침'); } }
      var r = ts[i].r; if (r.left < box.left - 2 || r.right > box.right + 2 || r.top < box.top - 2 || r.bottom > box.bottom + 2) { add('그림 밖 글자', ts[i].t, '그래프 상자 밖으로 ' + Math.round(Math.max(box.left - r.left, r.right - box.right, box.top - r.top, r.bottom - box.bottom)) + 'px'); }
    }
  });
  /* 2) 글자를 직접 가진 HTML 요소들 */
  var leaves = Array.prototype.filter.call(document.querySelectorAll('body *:not(svg):not(svg *):not(script):not(style):not(canvas)'), function (e) {
    return seen(e) && Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
  });
  leaves.forEach(function (e) {
    var cs = getComputedStyle(e);
    if (cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) { add('말줄임 잘림', e, '글이 …로 잘림 (필요 ' + e.scrollWidth + 'px / 칸 ' + e.clientWidth + 'px)'); }
    else if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && e.scrollWidth > e.clientWidth + 1) { add('상자 밖 글자', e, '가로로 ' + (e.scrollWidth - e.clientWidth) + 'px 넘침'); }
    /* 한 글자만 다음 줄 */
    var tn = Array.prototype.filter.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
    if (tn.length === 1 && /[가-힣]/.test(tn[0].textContent) && tn[0].textContent.trim().length >= 4) {
      var rg = document.createRange(); rg.selectNodeContents(tn[0]); var rs = Array.prototype.filter.call(rg.getClientRects(), function (q) { return q.width > 0; });
      var lines = {}; rs.forEach(function (q) { var k = Math.round(q.top / 4); lines[k] = (lines[k] || 0) + q.width; });
      var ks = Object.keys(lines).map(Number).sort(function (a, b) { return a - b; });
      if (ks.length >= 2 && lines[ks[ks.length - 1]] < parseFloat(cs.fontSize) * 1.6) { add('한 글자 줄바꿈', e, '마지막 줄이 ' + Math.round(lines[ks[ks.length - 1]]) + 'px뿐 (글자 1~2개)'); }
    }
  });
  /* 3) 팝업 글자끼리 겹침 (서로 품지 않는 요소만) */
  var pl = leaves.filter(function (e) { return e.closest('.panel.focus'); }).map(function (e) { return { e: e, r: e.getBoundingClientRect() }; });
  for (var a = 0; a < pl.length; a++) { for (var b = a + 1; b < pl.length; b++) { if (!pl[a].e.contains(pl[b].e) && !pl[b].e.contains(pl[a].e) && !pl[a].e.closest('.elpop, .elview') && !pl[b].e.closest('.elpop, .elview') && hit(pl[a].r, pl[b].r, 3)) { add('글자 겹침', pl[a].e, '“' + txt(pl[b].e) + '”와 겹침'); } } }
  /* 4) 팝업 넘침, 화면 밖 */
  var p = document.querySelector('.app.open .panel.focus');
  if (p && seen(p)) { if (p.scrollHeight > p.clientHeight + 1) { add('팝업 안 스크롤', p, (p.scrollHeight - p.clientHeight) + 'px 넘침: 그래프 높이 → 여백 → 겹치는 문장 순서로 줄이기'); } var pr = p.getBoundingClientRect(); if (pr.bottom > vh + 1 || pr.top < 0) { add('화면 밖', p, '팝업이 화면 밖으로 나감'); } }
  var ask = document.getElementById('ask'); if (ask && seen(ask) && ask.getBoundingClientRect().bottom > vh + 1) { add('화면 밖', ask, '입력창이 화면 아래로 밀림 (' + Math.round(ask.getBoundingClientRect().bottom - vh) + 'px)'); }
  if (document.documentElement.scrollHeight > vh + 1 && !document.querySelector('.app.open')) { add('화면 밖', document.body, '기본 화면이 세로로 ' + (document.documentElement.scrollHeight - vh) + 'px 넘침'); }
  /* 5) 간격 과다 경고(△): 실패는 아니지만 "좁게 적당히" 기준보다 넓은 곳 */
  function warn(kind, e, detail) { out.push({ kind: kind, where: where(e), text: txt(e), detail: detail, el: e, level: 'warn' }); }
  /* 글자에 비해 너무 넓은 칸: 테두리·밑줄이 있는 칸이 420px 넘게 늘어났는데 글자는 그 25%도 안 될 때 (예: 분수선이 화면 끝까지) */
  leaves.forEach(function (e) {
    if (!e.closest('.app.open .panel.focus')) { return; }
    var cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (r.width < 420) { return; }
    var lined = ['Top', 'Right', 'Bottom', 'Left'].some(function (sd) { return parseFloat(cs['border' + sd + 'Width']) >= 1 && cs['border' + sd + 'Color'] !== 'rgba(0, 0, 0, 0)'; });
    if (!lined) { return; }
    var rg = document.createRange(); rg.selectNodeContents(e); var tw = rg.getBoundingClientRect().width;
    if (tw < r.width * 0.25) { warn('글자에 비해 넓은 칸', e, '칸 ' + Math.round(r.width) + 'px에 글자 ' + Math.round(tw) + 'px — 칸 폭을 줄이거나 두 칸으로 나누기'); }
  });
  /* EL 팝업은 이미지가 주인공이라 불균형 검사에서 뺀다 */
  var body2 = document.querySelector('.app.open .panel.focus.split:not(.el) #p-body');
  if (body2 && body2.children.length >= 2) { var hs = Array.prototype.map.call(body2.children, function (c) { return c.getBoundingClientRect().height; }), hi = Math.max.apply(null, hs), lo = Math.min.apply(null, hs); if (hi > 320 && lo / hi < 0.5) { warn('두 단 불균형', body2, '짧은 단이 긴 단의 ' + Math.round(lo / hi * 100) + '% (50% 이상 권장)'); } }
  Array.prototype.forEach.call(document.querySelectorAll('.app.open .ptable tbody tr'), function (tr) { var fs = parseFloat(getComputedStyle(tr).fontSize), h = tr.getBoundingClientRect().height; if (seen(tr) && h > fs * 3.4) { warn('표 줄 높이 과다', tr, Math.round(h) + 'px (글자 ' + fs + 'px × 2.6~3.0 권장)'); } });
  Array.prototype.forEach.call(document.querySelectorAll('.app.open svg.chart'), function (svg) { if (!seen(svg)) { return; } var r = svg.getBoundingClientRect(), xs = Array.prototype.filter.call(svg.querySelectorAll('text'), seen).map(function (t) { return t.getBoundingClientRect().left; }); if (xs.length) { var gap = Math.min.apply(null, xs) - r.left; if (gap > 28) { warn('축 여백 과다', svg, '왼쪽 글자 앞이 ' + Math.round(gap) + 'px 비어 있음 (10~24px 권장)'); } } });
  Array.prototype.forEach.call(document.querySelectorAll('.app.open .panel.focus .fb, .app.open .panel.focus .test, .app.open .panel.focus .pareto, .app.open .panel.focus .tile, .app.open .panel.focus .fcard, .app.open .panel.focus .pcard'), function (e) { if (!seen(e)) { return; } var cs = getComputedStyle(e), p = Math.max(parseFloat(cs.paddingTop), parseFloat(cs.paddingLeft)); if (p > 18) { warn('칸 안쪽 여백 과다', e, p + 'px (10~14px 권장)'); } });
  /* 같은 문제 중복 제거 */
  var seenKey = {}; out = out.filter(function (x) { var k = x.kind + x.where + x.text; if (seenKey[k]) { return false; } seenKey[k] = 1; return true; });
  return out;
}
/* ?check=1 이면 화면에 표시 */
(function () {
  if (!/[?&]check=1/.test(location.search)) { return; }
  var box = document.createElement('div'); box.style.cssText = 'position:fixed;z-index:99;left:8px;bottom:8px;max-width:520px;max-height:40vh;overflow:auto;background:#200c04;color:#ffd6b8;border:1px solid #f37321;border-radius:10px;padding:10px 12px;font:12px/1.5 system-ui';
  document.body.appendChild(box);
  setInterval(function () {
    document.querySelectorAll('[data-lc]').forEach(function (e) { e.style.outline = ''; e.removeAttribute('data-lc'); });
    var r = layoutCheck(); r.forEach(function (x) { x.el.setAttribute('data-lc', '1'); x.el.style.outline = x.level === 'warn' ? '2px dashed #ffb385' : '2px solid #ff3b30'; });
    box.textContent = r.length ? '배치 문제 ' + r.filter(function (x) { return x.level !== 'warn'; }).length + '건 · 간격 경고 ' + r.filter(function (x) { return x.level === 'warn'; }).length + '건\n' + r.map(function (x) { return (x.level === 'warn' ? '△ [' : '✗ [') + x.kind + '] ' + x.where + ' “' + x.text + '” — ' + x.detail; }).join('\n') : '배치 문제 없음';
    box.style.whiteSpace = 'pre-wrap';
  }, 1500);
})();
