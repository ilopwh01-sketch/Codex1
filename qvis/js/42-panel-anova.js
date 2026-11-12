/* 42-panel-anova.js · 설비 비교 팝업(분산분석) */
/* 설비 비교: 리지라인 분포 + F 식 + F분포 위 p값 */
function buildAnova(p) {
  var big = window.matchMedia('(min-width: 901px)').matches, W = 760, rowH = big ? (window.innerHeight < 900 ? 52 : 70) : 60, top = 20, gs = p.groups, A = p.A, k = gs.length, H = top + rowH * k + 34, m = { l: 70, r: 24 };
  var all = [].concat.apply([], gs.map(function (g) { return g[1]; })), lo = Math.floor((Math.min.apply(null, all) - 0.3) * 2) / 2, hi = Math.ceil((Math.max.apply(null, all) + 0.3) * 2) / 2;
  var X = function (v) { return m.l + (v - lo) / (hi - lo) * (W - m.l - m.r); }, bw = 0.16, dens = [], mx = 0, seed = 5, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  gs.forEach(function (g) { var row = []; for (var i = 0; i <= 80; i++) { var v = lo + (hi - lo) * i / 80, dd = g[1].reduce(function (s, u) { return s + Math.exp(-0.5 * Math.pow((v - u) / bw, 2)); }, 0); row.push([v, dd]); mx = Math.max(mx, dd); } dens.push(row); });
  var s = '<svg class="chart anv" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + gs.map(function (g) { return g[0] + ' 평균 ' + mean(g[1]).toFixed(2) + '%'; }).join(', ') + '">';
  for (var t = Math.ceil(lo * 2) / 2; t <= hi + 1e-9; t += 0.5) { s += '<line class="grid" x1="' + X(t) + '" x2="' + X(t) + '" y1="' + top + '" y2="' + (H - 26) + '"></line><text x="' + X(t) + '" y="' + (H - 8) + '" text-anchor="middle">' + t.toFixed(1) + '%</text>'; }
  dens.forEach(function (row, gi) {
    var b = top + rowH * (gi + 1) - 6, hot = gi === p.worst && p.sig, d = 'M ' + X(lo) + ' ' + b; row.forEach(function (q) { d += ' L ' + X(q[0]).toFixed(1) + ' ' + (b - q[1] / mx * (rowH - 14)).toFixed(1); }); d += ' L ' + X(hi) + ' ' + b;
    var gm = mean(gs[gi][1]);
    /* 이름과 평균은 글자 크기(14, 11)에 맞춰 위아래로 KIT.LABEL_GAP 이상 벌린다 */
      s += '<text class="gname" x="0" y="' + (b - 8) + '">' + gs[gi][0] + '</text><text class="gval' + (hot ? ' hot' : '') + '" x="0" y="' + (b - 8 + KIT.LABEL_GAP + 4) + '">평균 ' + gm.toFixed(2) + '%</text>';
    s += '<line class="base" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + b + '" y2="' + b + '"></line>';
    s += '<path class="kd' + (hot ? ' hot' : '') + '" style="--i:' + gi + '" d="' + d + ' Z"></path><path class="kl' + (hot ? ' hot' : '') + '" pathLength="1" style="--i:' + gi + '" d="' + d + '"></path>';
    gs[gi][1].forEach(function (v, j) { s += '<circle class="jd' + (hot ? ' hot' : '') + '" style="--i:' + (gi * 4 + j * 0.4).toFixed(1) + '" cx="' + X(v + (rnd() - 0.5) * 0.03).toFixed(1) + '" cy="' + (b - 5 - rnd() * (rowH * 0.45)).toFixed(1) + '" r="3"><title>' + gs[gi][0] + ' · ' + v.toFixed(2) + '%</title></circle>'; });
    s += '<line class="gm" style="--i:' + gi + '" x1="' + X(gm) + '" x2="' + X(gm) + '" y1="' + b + '" y2="' + (b - rowH + 12) + '"></line>';
    var ay = b - rowH * 0.62; if (Math.abs(X(gm) - X(A.gm)) > 8) { s += '<line class="dev' + (hot ? ' hot' : '') + '" style="--i:' + gi + '" x1="' + X(A.gm) + '" x2="' + X(gm) + '" y1="' + ay + '" y2="' + ay + '" marker-end="url(#anv-ar' + (hot ? 'h' : '') + ')"></line>'; }
  });
  s = s.replace('<svg class="chart anv"', '<svg class="chart anv"') + '<defs><marker id="anv-ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#1FCFBE"></path></marker><marker id="anv-arh" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#F37321"></path></marker></defs>';
  s += '<line class="om" x1="' + X(A.gm) + '" x2="' + X(A.gm) + '" y1="' + (top - 6) + '" y2="' + (H - 26) + '"></line><text class="om-t" x="' + (X(A.gm) + 6) + '" y="' + (top + 4) + '">전체 평균 ' + A.gm.toFixed(2) + '%</text></svg>';
  /* F 식 */
  var fb = '<div class="fcard"><div class="mini-k">F 통계량</div><div class="frow"><span class="fF">F =</span><span class="frac"><span class="nu">그룹 간 변동 ÷ df</span><span class="de">그룹 내 변동 ÷ df</span></span></div>' +
    '<div class="fl" style="--i:1">= <b class="nu">' + A.msb.toFixed(3) + '</b> ÷ <b class="de">' + A.msw.toFixed(3) + '</b></div><div class="fl" style="--i:2">= <b class="fv">' + A.F.toFixed(2) + '</b><span class="df">df ' + A.d1 + ', ' + A.d2 + '</span></div><div class="fx">호기 사이 차이가 호기 안의 흔들림보다 <b>' + A.F.toFixed(1) + '배</b> 큽니다.</div></div>';
  /* F분포와 p값 */
  /* 높은 화면은 그림을 키우고(오른쪽 단으로 보냄), 낮은 화면은 높이만 줄인다. 세로 위치는 모두 바닥선 FB 기준 */
  var tall = window.innerHeight >= 900 && window.matchMedia('(min-width: 901px)').matches;
  var FW = 360, FH = tall ? 150 : 118, FB = FH - 38, xm = Math.max(8, Math.ceil(A.F + 2)), FX = function (x) { return 16 + x / xm * (FW - 30); }, ymx = 0, pts = [];
  for (var i = 1; i <= 120; i++) { var x = i / 120 * xm, y = fpdf(x, A.d1, A.d2); pts.push([x, y]); if (x > 0.3) { ymx = Math.max(ymx, y); } }
  ymx = Math.max(ymx, Math.min(1.2, fpdf(0.05, A.d1, A.d2)));
  var FY = function (y) { return FB - Math.min(y, ymx) / ymx * (FB - 20); }, cd = '', tail = 'M ' + FX(A.F).toFixed(1) + ' ' + FB;
  pts.forEach(function (q, i) { cd += (i ? ' L ' : 'M ') + FX(q[0]).toFixed(1) + ' ' + FY(q[1]).toFixed(1); if (q[0] >= A.F) { tail += ' L ' + FX(q[0]).toFixed(1) + ' ' + FY(q[1]).toFixed(1); } });
  tail += ' L ' + FX(xm) + ' ' + FB + ' Z';
  var fc = '<div class="pcard"><div class="mini-k">F에서 p값으로</div><svg class="chart fdist" viewBox="0 0 ' + FW + ' ' + FH + '" role="img" aria-label="F ' + A.F.toFixed(2) + ' 오른쪽 꼬리 면적 p ' + pTxt(A.p) + '"><line class="axis" x1="16" x2="' + (FW - 14) + '" y1="' + FB + '" y2="' + FB + '"></line>';
  for (var tk = 0; tk <= xm; tk += (xm > 10 ? 4 : 2)) { fc += '<text x="' + FX(tk) + '" y="' + (FB + 16) + '" text-anchor="middle">' + tk + '</text>'; }
  fc += '<path class="tail" d="' + tail + '"></path><path class="fcurve" pathLength="1" d="' + cd + '"></path><path class="fmk" d="M ' + FX(A.F) + ' ' + FB + ' l -5 9 h 10 z"></path><text class="fv-t" x="' + FX(A.F) + '" y="' + (FB + 34) + '" text-anchor="middle">F ' + A.F.toFixed(2) + '</text>';
  fc += '<path class="brk" d="M ' + FX(A.F) + ' ' + (FB - 24) + ' v -6 H ' + FX(xm) + ' v 6"></path><text class="pv-t" x="' + ((FX(A.F) + FX(xm)) / 2) + '" y="' + (FB - 38) + '" text-anchor="middle">p = ' + pTxt(A.p) + '</text></svg>';
  fc += '<div class="verdict' + (p.sig ? ' sig' : '') + '">' + (p.sig ? '설비 간 차이가 우연이 아님 (5% 기준)' : '우연한 차이일 수 있음') + '</div></div>';
  var box = el('div', 'cmain'), lg = el('div', 'legend');
  [['k', '호기별 분포 · 점 하나 = 1시간'], ['g', '호기 평균'], ['o', '전체 평균']].forEach(function (x) { var sp = el('span'), ic = el('i', x[0]); sp.appendChild(ic); sp.appendChild(document.createTextNode(x[1])); lg.appendChild(sp); });
  var wrap = el('div', 'chartwrap'); wrap.innerHTML = s; box.appendChild(lg); box.appendChild(wrap);
  /* 높은 화면: p값 카드는 오른쪽 단(조치·의견 아래)으로 보내 두 단 높이를 맞춘다 */
  var row = el('div', 'anv-row' + (tall ? ' one' : '')); row.innerHTML = tall ? fb : fb + fc; box.appendChild(row); pBody.appendChild(box);
  if (tall) { var holder = el('div'); holder.innerHTML = fc; p._side = holder.firstChild; } else { p._side = null; }
}
