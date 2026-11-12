/* 43-panel-stats.js · 통계 분석 팝업: p 관리도, 파레토, 두 비율 검정 */
function buildStats(p) {
  var big = window.matchMedia('(min-width: 901px)').matches, W = 760, H = !big ? 230 : window.innerHeight < 900 ? 188 : 300, m = { l: 44, r: 96, t: 24, b: 30 };
  var ymax = Math.ceil(Math.max.apply(null, p.pts.map(function (q) { return Math.max(q.p, q.ucl); })) + 0.5), n = p.pts.length;
  var X = function (i) { return m.l + (i + 0.5) / n * (W - m.l - m.r); }, Y = function (v) { return m.t + (1 - v / ymax) * (H - m.t - m.b); }, half = (W - m.l - m.r) / n / 2, x0 = m.l, x1 = W - m.r, yb = Y(0);
  /* 관리 상한은 시간마다 n이 달라 계단 모양. 계단선 위쪽은 '관리 이탈 구역'으로 칠하고, 선이 그 구역에 들어가면 오렌지로 바뀐다 */
  var step = '', us = p.pts.map(function (q) { return q.ucl; }), flat = Math.max.apply(null, us) - Math.min.apply(null, us) < 0.15, um = us.reduce(function (a, b) { return a + b; }, 0) / n;
  p.pts.forEach(function (q, i) { var y = Y(flat ? um : q.ucl).toFixed(1); step += (i ? ' L ' : 'M ') + (X(i) - half).toFixed(1) + ' ' + y + ' L ' + (X(i) + half).toFixed(1) + ' ' + y; });
  var zone = step + ' L ' + x1 + ' ' + m.t + ' L ' + x0 + ' ' + m.t + ' Z';
  var line = p.pts.map(function (q, i) { return X(i).toFixed(1) + ',' + Y(q.p).toFixed(1); }).join(' ');
  var s = '<svg class="chart pchart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="시간별 불량률 p 관리도. 관리 상한을 넘은 구간은 오렌지">';
  s += '<defs><linearGradient id="ps-wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1FCFBE" stop-opacity="0.22"></stop><stop offset="1" stop-color="#1FCFBE" stop-opacity="0"></stop></linearGradient>' +
    '<linearGradient id="ps-zone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F37321" stop-opacity="0.16"></stop><stop offset="1" stop-color="#F37321" stop-opacity="0.04"></stop></linearGradient>' +
    '<clipPath id="ps-clip"><path d="' + zone + '"></path></clipPath></defs>';
  for (var v = 0; v <= ymax; v++) { s += '<line class="grid" x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(v) + '" y2="' + Y(v) + '"></line><text x="' + (x0 - 10) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '%</text>'; }
  p.pts.forEach(function (q, i) { s += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + (q.h < 10 ? '0' : '') + q.h + '시</text>'; });
  s += '<path class="zone" d="' + zone + '" fill="url(#ps-zone)"></path><text class="zl" x="' + (x0 + 10) + '" y="' + (m.t + 16) + '">관리 이탈 구역</text>';
  s += '<path class="ucl" d="' + step + '"></path><line class="cl" x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(p.p0) + '" y2="' + Y(p.p0) + '"></line>';
  var lu = flat ? um : p.pts[n - 1].ucl, yu = Y(lu), yc = Y(p.p0); if (Math.abs(yu - yc) < 16) { yc = yu + 16; }
  s += '<text class="lab-u" x="' + (x1 + 10) + '" y="' + (yu + 4) + '">UCL ' + lu.toFixed(2) + '%</text><text class="lab-c" x="' + (x1 + 10) + '" y="' + (yc + 4) + '">평균 ' + p.p0.toFixed(2) + '%</text>';
  s += '<path class="pwash" d="M ' + X(0).toFixed(1) + ' ' + yb + ' L ' + line.split(' ').join(' L ').replace(/,/g, ' ') + ' L ' + X(n - 1).toFixed(1) + ' ' + yb + ' Z" fill="url(#ps-wash)"></path>';
  s += '<polyline class="today" pathLength="1" points="' + line + '"></polyline><polyline class="today hotline" pathLength="1" clip-path="url(#ps-clip)" points="' + line + '"></polyline>';
  p.pts.forEach(function (q, i) {
    if (q.out) { s += '<circle class="ring" cx="' + X(i) + '" cy="' + Y(q.p) + '" r="7"></circle>'; }
    s += '<circle class="pt' + (q.out ? ' out' : '') + '" style="--i:' + i + '" cx="' + X(i) + '" cy="' + Y(q.p) + '" r="' + (q.out ? 6.5 : 3.8) + '"></circle>';
    if (q.out) { s += '<text class="out-lab" x="' + X(i) + '" y="' + (Y(q.p) - 16) + '" text-anchor="middle">' + q.p.toFixed(1) + '%</text>'; }
  });
  s += '<g id="ps-hv" style="display:none"><line class="cross" id="ps-hl" y1="' + m.t + '" y2="' + yb + '"></line></g>';
  s += '<rect x="' + x0 + '" y="' + m.t + '" width="' + (x1 - x0) + '" height="' + (yb - m.t) + '" fill="transparent"></rect></svg>';
  var box = el('div', 'cmain'), lg = el('div', 'legend');
  [['', '시간별 불량률'], ['c', p.base + ' 평균 (중심선)'], ['x', '관리 상한 UCL (3σ)'], ['z', '관리 이탈 구역']].forEach(function (x) { var sp = el('span'), ic = el('i', x[0]); sp.appendChild(ic); sp.appendChild(document.createTextNode(x[1])); lg.appendChild(sp); });
  var wrap = el('div', 'chartwrap'); wrap.innerHTML = s; var tip = el('div', 'ctip'); wrap.appendChild(tip); box.appendChild(lg); box.appendChild(wrap);
  var svg = wrap.querySelector('svg'), hv = svg.querySelector('#ps-hv'), hl = svg.querySelector('#ps-hl');
  function show(i) {
    var q = p.pts[i], x = X(i), y = Y(q.p); hv.style.display = ''; hl.setAttribute('x1', x); hl.setAttribute('x2', x);
    tip.textContent = ''; tip.appendChild(el('b', '', q.p.toFixed(2) + '%' + (q.out ? ' · 관리 상한 초과' : ''))); tip.appendChild(document.createTextNode((q.h < 10 ? '0' : '') + q.h + '시 · ' + q.d + '/' + q.n + '매 · UCL ' + q.ucl.toFixed(2) + '%'));
    var r = svg.getBoundingClientRect(), k = r.width / W; tip.style.left = Math.max(90, Math.min(r.width - 90, x * k)) + 'px'; tip.style.top = (y * k - 10) + 'px'; tip.classList.add('on');
  }
  svg.addEventListener('pointermove', function (ev) { var r = svg.getBoundingClientRect(), hx = (ev.clientX - r.left) * W / r.width; show(Math.max(0, Math.min(n - 1, Math.round((hx - m.l) / (2 * half) - 0.5)))); });
  svg.addEventListener('pointerleave', function () { hv.style.display = 'none'; tip.classList.remove('on'); });
  var row = el('div', 'stats-row'), par = el('div', 'pareto'), ph = el('div', 'mini-k', '불량 유형 파레토');
  par.appendChild(ph); var plist = el('div', 'plist'), mkh = function () { var hdr = el('div', 'prow phd'); ['유형', '', '건수', '누적'].forEach(function (t) { hdr.appendChild(el('span', '', t)); }); return hdr; }; plist.appendChild(mkh()); par.appendChild(plist);
  p.pareto.forEach(function (x, i) {
    var r = el('div', 'prow' + (i < 3 ? ' hot' : '')), nm = el('span', 'nm', x.name), bar = el('span', 'pbar'), f = el('i'), vv = el('span', 'v', String(x.v)), cu = el('span', 'cu', Math.round(x.cum) + '%');
    r.style.setProperty('--i', i); bar.appendChild(f); r.appendChild(nm); r.appendChild(bar); r.appendChild(vv); r.appendChild(cu); if (i === 4) { var h2 = mkh(); h2.classList.add('h2'); plist.appendChild(h2); } plist.appendChild(r);
    setTimeout(function () { f.style.width = Math.round(x.v / p.pareto[0].v * 100) + '%'; }, reduce ? 0 : 300 + i * 60);
  });
  var tc = el('div', 'test' + (p.test.sig ? ' sig' : '')); tc.appendChild(el('div', 'mini-k', '오늘 vs ' + p.base));
  var tg = el('div', 'tgrid');
  [['오늘', f2(p.test.p1) + '%', '+' + f2(p.test.p1 - p.test.p0) + '%p', 'hot'], [p.base, f2(p.test.p0) + '%', '기준', ''], ['z 값', p.test.z.toFixed(2), '두 비율 검정', ''], ['p 값', p.test.pv.replace('p ', '').replace('= ', ''), '5% 기준', p.test.sig ? 'hot' : '']].forEach(function (x) { var t = el('div', 'tile' + (x[3] ? ' ' + x[3] : '')); t.appendChild(el('span', 'tl', x[0])); t.appendChild(el('b', '', x[1])); t.appendChild(el('span', 'ts', x[2])); tg.appendChild(t); });
  tc.appendChild(tg);
  tc.appendChild(el('div', 'verdict', p.test.sig ? '유의하게 높음 (5% 기준)' : '유의한 차이 없음'));
  row.appendChild(par); p._side = tc; box.appendChild(row); pBody.appendChild(box);
}
