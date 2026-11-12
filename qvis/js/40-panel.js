/* 40-panel.js · 근거 팝업 열기/닫기 + 표·마인드맵·경로·시간대 그래프 */
function mapSVG(p) {
  var s = '<svg class="map" viewBox="0 0 460 300" role="img" aria-label="' + p.center + ' 원인 마인드맵">', i = 0, by = [50, 150, 250];
  p.branches.forEach(function (b, k) {
    var y = by[k];
    s += '<path class="link' + (b.hot ? ' hot' : '') + '" pathLength="1" style="--i:' + (i++) + '" d="M140 150 C 156 150, 154 ' + y + ', 170 ' + y + '"></path>';
    b.leaves.forEach(function (lf, j) { var ly = y + (j ? 22 : -22); s += '<path class="link' + (b.hot && !j ? ' hot' : '') + '" pathLength="1" style="--i:' + (i++) + '" d="M290 ' + y + ' C 305 ' + y + ', 303 ' + ly + ', 318 ' + ly + '"></path>'; });
  });
  s += '<g class="node center" style="--i:0"><rect x="10" y="126" width="130" height="48" rx="12"></rect><text x="75" y="155" text-anchor="middle" font-weight="700">' + p.center + '</text></g>';
  i = 1;
  p.branches.forEach(function (b, k) {
    var y = by[k];
    s += '<g class="node' + (b.hot ? ' hot' : '') + '" style="--i:' + (i++) + '"><rect x="170" y="' + (y - 17) + '" width="120" height="34" rx="10"></rect><text x="230" y="' + (y + 4.5) + '" text-anchor="middle" font-weight="700">' + b.label + '</text></g>';
    b.leaves.forEach(function (lf, j) { var ly = y + (j ? 22 : -22); s += '<g class="node' + (b.hot && !j ? ' hot' : '') + '" style="--i:' + (i++) + '"><rect x="318" y="' + (ly - 15) + '" width="138" height="30" rx="9"></rect><text class="sm" x="387" y="' + (ly + 4) + '" text-anchor="middle">' + lf + '</text></g>'; });
  });
  return s + '</svg>';
}
function openPanel(p) {
  clearEL(); lastPanel = p; pKick.textContent = p.kicker; pTitle.textContent = p.title; pBody.textContent = '';
  if (p.type === 'table') {
    var tb = el('table', 'ptable'), hd = el('thead'), hr = el('tr'), bd = el('tbody'), fills = [];
    var isNum = function (t) { return /^[+\-]?[\d.,]+\s*(%|%p|분|건|매|시)?$/.test(String(t).trim()); }, numCol = p.cols.map(function (c, k) { return p.rows.every(function (r) { return r.cells[k] == null || isNum(r.cells[k]); }); });
    p.cols.forEach(function (c, k) { hr.appendChild(el('th', numCol[k] && c ? 'num' : '', c)); }); hd.appendChild(hr); tb.appendChild(hd);
    p.rows.forEach(function (r, i) {
      var tr = el('tr', 'in'), td = el('td'), bar = el('div', 'bar' + (r.hot ? ' hot' : '')), f = el('i');
      tr.style.setProperty('--i', i); r.cells.forEach(function (c, k) { tr.appendChild(el('td', numCol[k] ? 'num' : '', c)); });
      bar.appendChild(f); td.appendChild(bar); tr.appendChild(td); bd.appendChild(tr); fills.push([f, r.bar]);
    });
    tb.appendChild(bd); pBody.appendChild(tb);
    requestAnimationFrame(function () { requestAnimationFrame(function () { fills.forEach(function (x, i) { setTimeout(function () { x[0].style.width = Math.round(x[1] * 100) + '%'; }, reduce ? 0 : 260 + i * 60); }); }); });
  } else if (p.type === 'chart') {
    buildChart(p);
  } else if (p.type === 'anova') {
    buildAnova(p);
  } else if (p.type === 'stats') {
    buildStats(p);
  } else if (p.type === 'el') {
    buildEL(p);
  } else if (p.type === 'route') {
    var ol = el('ol', 'route');
    p.steps.forEach(function (st, i) {
      var li = el('li', st.bad ? 'bad' : st.hot ? 'hot' : ''), dot = el('span', 'dot'), mid = el('span', 'st', st.st), sub = el('span', 'sub', st.sub || '');
      li.style.setProperty('--i', i); dot.setAttribute('aria-hidden', 'true'); mid.appendChild(sub);
      li.appendChild(dot); li.appendChild(mid); li.appendChild(el('span', 'tm', st.tm)); ol.appendChild(li);
    });
    pBody.appendChild(ol);
  } else { pBody.innerHTML = mapSVG(p); }
  var extras = el('div', 'extras');
  if (p.actions && p.actions.length) {
    var sec = el('section', 'sec'), hd2 = el('div', 'sec-k'), ul = el('ul', 'acts');
    hd2.appendChild(el('span', '', '조치 필요')); hd2.appendChild(el('span', 'cnt', p.actions.length + '건')); sec.appendChild(hd2);
    p.actions.forEach(function (x, i) {
      var li = el('li', 'act'), lb = el('label'), cb = el('input'), bx = el('span', 'box'), tx = el('span', 'tx', x.t), who = el('span', 'who', x.who || '');
      cb.type = 'checkbox'; cb.id = 'act-' + i; bx.setAttribute('aria-hidden', 'true');
      bx.innerHTML = '<svg viewBox="0 0 14 14"><path d="M2.5 7.5l3 3 6-6.5"></path></svg>';
      lb.appendChild(cb); lb.appendChild(bx); lb.appendChild(tx); lb.appendChild(who); li.appendChild(lb); li.style.setProperty('--i', i); ul.appendChild(li);
    });
    sec.appendChild(ul); extras.appendChild(sec);
  }
  if (p.feedback) { var fb = el('div', 'fb'), fk = el('span', 'k', 'QVIS 의견 · 규칙 기반 판단'); fb.appendChild(fk); fb.appendChild(document.createTextNode(p.feedback)); extras.appendChild(fb); }
  if (p._side) { p._side.classList.add('side-card'); extras.appendChild(p._side); }
  if (extras.childNodes.length) { pBody.appendChild(extras); }
  panel.classList.add('focus', 'split'); panel.classList.toggle('wide', p.type === 'chart' || p.type === 'stats' || p.type === 'anova' || p.type === 'el'); panel.classList.toggle('el', p.type === 'el'); app.classList.add('focus');
  app.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); more.textContent = '근거 닫기';
}
function hm(h) { var H = Math.floor(h), M = Math.round((h - H) * 60); return (H < 10 ? '0' : '') + H + ':' + (M < 10 ? '0' : '') + M; }
function buildChart(p) {
  var big = window.matchMedia('(min-width: 901px)').matches, W = big ? 760 : 400, H = big ? 360 : 230, m = big ? { l: 44, r: 56, t: 22, b: 30 } : { l: 36, r: 34, t: 16, b: 26 }, x0 = 6, x1 = 15;
  var X = function (h) { return m.l + (h - x0) / (x1 - x0) * (W - m.l - m.r); }, Y = function (v) { return m.t + (1 - v / p.yMax) * (H - m.t - m.b); };
  var pts = function (arr) { return arr.map(function (v, i) { return X(p.hours[i]).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' '); };
  var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="시간대별 불량률. 13시 이후 목표 1.50%를 넘어 지금 3.1%">';
  var gv = []; for (var g0 = 0; g0 <= Math.floor(p.yMax); g0++) { gv.push(g0); }
  gv.forEach(function (v) { s += '<line class="grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"></line><text x="' + (m.l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '%</text>'; });
  [6, 8, 10, 12, 14].forEach(function (h) { s += '<text x="' + X(h) + '" y="' + (H - 6) + '" text-anchor="middle">' + (h < 10 ? '0' : '') + h + '시</text>'; });
  var ty = Y(p.target); s += '<line class="target" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + ty + '" y2="' + ty + '"></line><text class="lab" x="' + (m.l + 4) + '" y="' + (ty - 6) + '">목표 ' + p.target.toFixed(2) + '%</text>';
  /* 목표를 넘은 구간 찾기 */
  var cross = null, over = [];
  for (var i = 1; i < p.today.length; i++) { if (cross === null && p.today[i - 1] <= p.target && p.today[i] > p.target) { var f = (p.target - p.today[i - 1]) / (p.today[i] - p.today[i - 1]); cross = p.hours[i - 1] + f * (p.hours[i] - p.hours[i - 1]); over.push([cross, p.target]); } if (cross !== null) { over.push([p.hours[i], p.today[i]]); } }
  var last = p.hours.length - 1, ex = X(p.hours[last]), ey = Y(p.today[last]);
  s += '<polygon class="wash" points="' + X(p.hours[0]) + ',' + Y(0) + ' ' + pts(p.today) + ' ' + ex + ',' + Y(0) + '"></polygon>';
  if (over.length) { s += '<polygon class="hotwash" points="' + over.map(function (q) { return X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1); }).join(' ') + ' ' + ex + ',' + ty + '"></polygon>'; }
  s += '<polyline class="usual" points="' + pts(p.usual) + '"></polyline>';
  s += '<polyline class="today" pathLength="1" points="' + pts(p.today) + '"></polyline>';
  if (over.length) { s += '<polyline class="over" pathLength="1" points="' + over.map(function (q) { return X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1); }).join(' ') + '"></polyline>'; }
  s += '<g class="end"><circle class="ring" cx="' + ex + '" cy="' + ey + '" r="6"></circle><circle cx="' + ex + '" cy="' + ey + '" r="5" fill="#F37321" stroke="#0A1830" stroke-width="2"></circle><text class="end-lab" x="' + ex + '" y="' + (ey - 12) + '" text-anchor="middle">' + p.today[last].toFixed(1) + '%</text></g>';
  s += '<g id="hover" style="display:none"><line class="cross" id="hv-l" y1="' + m.t + '" y2="' + Y(0) + '"></line><circle id="hv-d" r="4.5" fill="#1FCFBE" stroke="#0A1830" stroke-width="2"></circle></g>';
  s += '<rect id="hit" x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="transparent"></rect></svg>';
  var lg = el('div', 'legend'); [['', '오늘'], ['u', '평소 (최근 7일 같은 시간)'], ['t', '목표']].forEach(function (x) { var sp = el('span'), ic = el('i', x[0]); sp.appendChild(ic); sp.appendChild(document.createTextNode(x[1])); lg.appendChild(sp); });
  var wrap = el('div', 'chartwrap'); wrap.innerHTML = s; var tip = el('div', 'ctip'); wrap.appendChild(tip);
  var box = el('div', 'cmain'); box.appendChild(lg); box.appendChild(wrap); pBody.appendChild(box);
  var svg = wrap.querySelector('svg'), hv = svg.querySelector('#hover'), hl = svg.querySelector('#hv-l'), hd = svg.querySelector('#hv-d');
  function show(i) {
    var x = X(p.hours[i]), y = Y(p.today[i]); hv.style.display = ''; hl.setAttribute('x1', x); hl.setAttribute('x2', x); hd.setAttribute('cx', x); hd.setAttribute('cy', y);
    tip.textContent = ''; var bb = el('b', '', p.today[i].toFixed(2) + '%'); tip.appendChild(bb); tip.appendChild(document.createTextNode(hm(p.hours[i]) + ' · 평소 ' + p.usual[i].toFixed(2) + '%'));
    var r = svg.getBoundingClientRect(), k = r.width / W; tip.style.left = Math.max(60, Math.min(r.width - 60, x * k)) + 'px'; tip.style.top = (y * k) + 'px'; tip.classList.add('on');
  }
  function near(ev) { var r = svg.getBoundingClientRect(), hx = (ev.clientX - r.left) * W / r.width, best = 0; p.hours.forEach(function (h, i) { if (Math.abs(X(h) - hx) < Math.abs(X(p.hours[best]) - hx)) { best = i; } }); return best; }
  svg.addEventListener('pointermove', function (ev) { show(near(ev)); });
  svg.addEventListener('pointerleave', function () { hv.style.display = 'none'; tip.classList.remove('on'); });
}
function closePanel() { clearEL(); app.classList.remove('open', 'focus'); panel.setAttribute('aria-hidden', 'true'); more.textContent = '근거 보기'; }
more.addEventListener('click', function () { if (app.classList.contains('open')) { closePanel(); } else if (lastPanel) { openPanel(lastPanel); } });
$('p-close').addEventListener('click', closePanel);
