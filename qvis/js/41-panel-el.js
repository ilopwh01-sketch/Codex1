/* 41-panel-el.js · EL 이미지 팝업: 하프셀 그림, 검출 박스, 확대 창, 휠 확대 */
/* EL 이미지: 실제로는 검사기 이미지 파일을 넣는다. 여기서는 하프셀 모듈(24열 × 6행, 가운데 갈림)을 예시로 그린다.
   elGeo: 셀 (열, 행) → 이미지 안 비율 좌표. 박스·확대 창·그림이 모두 이 함수 하나를 쓴다. */
function elGeo(p) {
  var mx = 0.012, my = 0.022, cg = p.split ? 0.008 : 0, gap = 0.0016;
  var cw = (1 - 2 * mx - cg) / p.cols, rh = (1 - 2 * my) / p.rows;
  return { cw: cw, rh: rh, cell: function (c, r) {
    var x = mx + c * cw + (p.split && c >= p.split ? cg : 0);
    return { x: x + gap, y: my + r * rh + gap * 1.7, w: cw - gap * 2, h: rh - gap * 3.4 };
  } };
}
function drawEL(cv, p) {
  var g2 = cv.getContext('2d'), W = cv.width, H = cv.height, G = elGeo(p), seed = 7;
  var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g2.fillStyle = '#020407'; g2.fillRect(0, 0, W, H);
  var bad = {}; p.cells.forEach(function (c) { bad[c.c + ',' + c.r] = c.type; });
  for (var r = 0; r < p.rows; r++) {
    for (var c = 0; c < p.cols; c++) {
      var R = G.cell(c, r), x = R.x * W, y = R.y * H, w = R.w * W, h = R.h * H, L = 0.72 + rnd() * 0.2, t = bad[c + ',' + r];
      var gr = g2.createLinearGradient(x, y, x + w * 0.4, y + h);
      gr.addColorStop(0, 'rgb(' + Math.round(214 * L) + ',' + Math.round(220 * L) + ',' + Math.round(224 * L) + ')'); gr.addColorStop(1, 'rgb(' + Math.round(168 * L) + ',' + Math.round(176 * L) + ',' + Math.round(182 * L) + ')');
      g2.fillStyle = gr; g2.fillRect(x, y, w, h);
      /* 얼룩덜룩한 결정 질감 */
      for (var k = 0; k < 46; k++) { var a = rnd(); g2.fillStyle = a < 0.75 ? 'rgba(0,0,0,' + (0.03 + rnd() * 0.07).toFixed(3) + ')' : 'rgba(255,255,255,' + (0.03 + rnd() * 0.05).toFixed(3) + ')'; g2.beginPath(); g2.ellipse(x + rnd() * w, y + rnd() * h, 2 + rnd() * 7, 2 + rnd() * 5, rnd() * 3, 0, 6.3); g2.fill(); }
      /* 가장자리 살짝 어둡게 */
      g2.strokeStyle = 'rgba(0,0,0,0.28)'; g2.lineWidth = 3; g2.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      /* 가로 버스바 점선 */
      g2.fillStyle = 'rgba(0,0,0,0.42)';
      [0.3, 0.7].forEach(function (f) { for (var d = 0; d < w - 4; d += 9) { g2.fillRect(x + 2 + d, y + h * f - 1, 5, 2); } });
      if (t === '미접합') { var f0 = rnd() < 0.5 ? 0.3 : 0.7, dg = g2.createLinearGradient(0, y + h * (f0 - 0.2), 0, y + h * (f0 + 0.2)); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(0.25, 'rgba(0,0,0,0.86)'); dg.addColorStop(0.75, 'rgba(0,0,0,0.86)'); dg.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = dg; g2.fillRect(x, y + h * (f0 - 0.2), w, h * 0.4); }
      if (t === '크랙') {
        /* 사선 금 + 금 아래쪽이 끊겨 어두워진 쐐기 */
        var pts = [[x + w * (0.05 + rnd() * 0.2), y + h * 0.18]], n = 7;
        for (var q = 1; q <= n; q++) { pts.push([x + w * (0.1 + 0.85 * q / n) + (rnd() - 0.5) * w * 0.08, y + h * (0.18 + 0.5 * q / n) + (rnd() - 0.5) * h * 0.04]); }
        g2.fillStyle = 'rgba(0,0,0,0.62)'; g2.beginPath(); g2.moveTo(pts[0][0], pts[0][1]); pts.forEach(function (pt) { g2.lineTo(pt[0], pt[1]); }); g2.lineTo(x + w, y + h); g2.lineTo(x + w * 0.35, y + h); g2.closePath(); g2.fill();
        g2.strokeStyle = 'rgba(0,0,0,0.95)'; g2.lineWidth = 2.5; g2.beginPath(); pts.forEach(function (pt, i) { if (i) { g2.lineTo(pt[0], pt[1]); } else { g2.moveTo(pt[0], pt[1]); } }); g2.stroke();
        g2.lineWidth = 1.5; g2.beginPath(); var b = pts[3]; g2.moveTo(b[0], b[1]); g2.lineTo(b[0] - w * 0.25, b[1] + h * 0.14); g2.lineTo(b[0] - w * 0.32, b[1] + h * 0.3); g2.stroke();
      }
    }
  }
}
/* EL 이미지 화면
   - 실제 이미지: canvas 자리에 <img src="검사기 이미지 경로">를 넣고, 불량 좌표(픽셀)를 이미지 크기로 나눈 비율로 넘기면 된다.
   - 확대는 이미지 묶음(stage)에 transform을 거는 방식이라 실제 사진에도 그대로 쓴다. */
var elTimers = [];
function clearEL() { elTimers.forEach(clearTimeout); elTimers = []; }
function buildEL(p) {
  clearEL();
  var box = el('div', 'cmain'), view = el('div', 'elview'), stage = el('div', 'elstage'), cv = document.createElement('canvas');
  cv.width = 2400; cv.height = 1420; cv.className = 'elimg'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', p.module + ' EL 이미지 예시. 검출 셀 ' + p.cells.length + '개 표시');
  drawEL(cv, p); stage.appendChild(cv);
  /* 붙어 있는 같은 불량을 한 묶음으로 */
  var groups = [], G = elGeo(p);
  p.cells.forEach(function (c) {
    if (p.cells.filter(function (o) { return o.r === c.r && o.type === c.type && o.c === c.c - 1; })[0]) { return; }
    var grp = [c], nx = c; while ((nx = p.cells.filter(function (o) { return o.r === c.r && o.type === c.type && o.c === nx.c + 1; })[0])) { grp.push(nx); }
    var R0 = G.cell(grp[0].c, c.r), R1 = G.cell(grp[grp.length - 1].c, c.r);
    groups.push({ cells: grp, type: c.type, top: Math.max.apply(null, grp.map(function (o) { return o.conf; })), x: R0.x, y: R0.y, w: R1.x + R1.w - R0.x, h: R0.h,
      label: grp[0].id + (grp.length > 1 ? '~' + grp[grp.length - 1].id.split('-')[1] : '') + ' · ' + c.type });
  });
  groups.sort(function (a2, b2) { return b2.top - a2.top; });
  p.cells.forEach(function (c) {
    var gi = groups.indexOf(groups.filter(function (g) { return g.cells.indexOf(c) >= 0; })[0]), g0 = groups[gi];
    var bx = el('div', 'elbox ' + (c.type === '미접합' ? 'hot' : 'warn')); var RC = G.cell(c.c, c.r); bx.style.left = (RC.x * 100) + '%'; bx.style.top = (RC.y * 100) + '%';
    bx.style.width = (RC.w * 100) + '%'; bx.style.height = (RC.h * 100) + '%'; bx.style.setProperty('--d', (300 + (c.r + 0.5) / p.rows * 900) + 'ms'); bx.dataset.g = String(gi);
    if (g0.cells[0] === c) { var tag = el('span', 'tag', c.type + (g0.cells.length > 1 ? ' ' + g0.cells.length + '셀 · 최고 ' : ' ') + g0.top.toFixed(1) + '%'); if (c.r === 0) { tag.classList.add('below'); } bx.appendChild(tag); }
    stage.appendChild(bx);
  });
  view.appendChild(stage);
  view.appendChild(el('div', 'scan')); view.appendChild(el('div', 'grain'));
  ['tl', 'tr', 'bl', 'br'].forEach(function (k) { view.appendChild(el('span', 'brk ' + k)); });
  view.appendChild(el('div', 'hud h1', 'EL · ' + p.module + ' · ' + p.time));
  var hud2 = el('div', 'hud h2', 'AI 검출 ' + p.cells.length + '셀'); view.appendChild(hud2);
  view.appendChild(el('div', 'hud h3', '예시 렌더링 · 휠로 확대, 드래그로 이동, 더블클릭으로 원래대로'));
  view.tabIndex = 0; view.setAttribute('aria-label', 'EL 이미지. 휠이나 + - 키로 확대, 0 키로 원래대로');

  /* ---- 확대 창(팝업): 불량 묶음마다 확대 사진이 튀어나오고, 누르면 사라진다 ---- */
  var pops = [];
  function popFor(i) {
    if (pops[i]) { return; }
    seen[i] = true;
    var g = groups[i], PW = 0.34, PH = PW * (view.clientWidth / view.clientHeight) / 1.5;
    var card = el('button', 'elpop ' + (g.type === '미접합' ? 'hot' : 'warn')); card.type = 'button'; card.setAttribute('aria-label', g.label + ' 확대 사진. 누르면 닫힘');
    var zc = document.createElement('canvas'); zc.width = 960; zc.height = 640;
    var cw = G.cw * cv.width, sw = Math.max(g.w * cv.width + cw * 3, cw * 6), sh = Math.max(sw * 640 / 960, g.h * cv.height * 1.35); sw = sh * 960 / 640;
    var sx = Math.max(0, Math.min(cv.width - sw, (g.x + g.w / 2) * cv.width - sw / 2)), sy = Math.max(0, Math.min(cv.height - sh, (g.y + g.h / 2) * cv.height - sh / 2));
    zc.getContext('2d').drawImage(cv, sx, sy, sw, sh, 0, 0, 960, 640);
    card.appendChild(zc); card.appendChild(el('span', 'zl', (i + 1) + '/' + groups.length + ' · ' + g.type + ' ' + g.cells.length + '셀 · ' + g.top.toFixed(1) + '%'));
    /* 위치: 불량 반대쪽 절반에 크게. 두 번째 창은 첫 창 반대쪽 */
    var gcx = g.x + g.w / 2, gcy = g.y + g.h / 2, other = pops.filter(function (c) { return c; })[0];
    var side = other ? (other.dataset.side === 'left' ? 'right' : 'left') : (gcx > 0.5 ? 'left' : 'right');
    var left = side === 'left' ? 0.015 : 1 - PW - 0.015, top = Math.max(0.12, Math.min(1 - PH - 0.03, gcy - PH / 2));
    card.dataset.side = side; card.style.left = (left * 100) + '%'; card.style.top = (top * 100) + '%'; card.style.width = (PW * 100) + '%';
    card.style.transformOrigin = ((gcx - left) / PW * 100).toFixed(1) + '% ' + ((gcy - top) / PH * 100).toFixed(1) + '%';
    /* 불량 자리와 창을 잇는 선 */
    var ex = side === 'left' ? left + PW : left, ey = top + PH / 2;
    var ln = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ln.setAttribute('class', 'eline ' + (g.type === '미접합' ? 'hot' : 'warn')); ln.setAttribute('viewBox', '0 0 100 100'); ln.setAttribute('preserveAspectRatio', 'none'); ln.setAttribute('aria-hidden', 'true');
    ln.innerHTML = '<line x1="' + (gcx * 100) + '" y1="' + (gcy * 100) + '" x2="' + (ex * 100) + '" y2="' + (ey * 100) + '" pathLength="1"></line><circle cx="' + (gcx * 100) + '" cy="' + (gcy * 100) + '" r="0.6"></circle>';
    card.addEventListener('click', function (ev) { ev.stopPropagation(); closePop(i); });
    view.appendChild(ln); view.appendChild(card); pops[i] = card; card._line = ln;
    requestAnimationFrame(function () { card.classList.add('on'); ln.classList.add('on'); });
  }
  var seq = false, seen = {};
  function closePop(i, quiet) { var c = pops[i]; if (!c) { return; } pops[i] = null;
    if (seq && !quiet) { var nx = -1; for (var j = 0; j < groups.length; j++) { if (!seen[j]) { nx = j; break; } } if (nx >= 0) { elTimers.push(setTimeout(function () { popFor(nx); }, 320)); } } c.classList.remove('on'); c.classList.add('off'); if (c._line) { c._line.classList.remove('on'); } setTimeout(function () { c.remove(); if (c._line) { c._line.remove(); } }, 260); }
  function closeAllPops() { seq = false; pops.forEach(function (c, i) { if (c) { closePop(i, true); } }); }
  if (!reduce) { groups.slice(0, 2).forEach(function (g, i) { elTimers.push(setTimeout(function () { popFor(i); }, 1500 + i * 450)); }); } else { groups.slice(0, 2).forEach(function (g, i) { popFor(i); }); }

  /* ---- 휠 확대 · 드래그 이동 ---- */
  var k = 1, tx = 0, ty = 0, drag = null, moved = false;
  function apply(anim) {
    var W = view.clientWidth, H = view.clientHeight;
    tx = Math.min(0, Math.max(W - W * k, tx)); ty = Math.min(0, Math.max(H - H * k, ty));
    stage.classList.toggle('noanim', !anim);
    stage.style.setProperty('--k', k.toFixed(3)); stage.style.transform = 'translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px) scale(' + k.toFixed(3) + ')';
    view.classList.toggle('zoomed', k > 1.01); hud2.textContent = k > 1.01 ? '×' + k.toFixed(1) + ' 확대' : 'AI 검출 ' + p.cells.length + '셀';
  }
  function zoomAt(mx, my, nk, anim) {
    nk = Math.max(1, Math.min(6, nk)); if (nk > 1.01) { closeAllPops(); }
    var sx2 = (mx - tx) / k, sy2 = (my - ty) / k; k = nk; tx = mx - sx2 * k; ty = my - sy2 * k; apply(anim);
  }
  view.addEventListener('wheel', function (ev) {
    ev.preventDefault(); var r = view.getBoundingClientRect();
    zoomAt(ev.clientX - r.left, ev.clientY - r.top, k * Math.exp(-ev.deltaY * 0.0018), true);
  }, { passive: false });
  view.addEventListener('pointerdown', function (ev) { if (ev.target.closest && ev.target.closest('.elpop')) { return; } drag = { x: ev.clientX, y: ev.clientY, tx: tx, ty: ty }; moved = false; });
  view.addEventListener('pointermove', function (ev) {
    if (!drag || k <= 1.01) { return; }
    var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; view.classList.add('dragging'); }
    tx = drag.tx + dx; ty = drag.ty + dy; apply(false);
  });
  function endDrag() { drag = null; view.classList.remove('dragging'); }
  view.addEventListener('pointerup', endDrag); view.addEventListener('pointerleave', endDrag);
  view.addEventListener('dblclick', function () { k = 1; tx = 0; ty = 0; apply(true); });
  view.addEventListener('click', function (ev) {
    if (moved) { moved = false; return; }
    var bx = ev.target.closest ? ev.target.closest('.elbox') : null;
    if (bx && k <= 1.01) { popFor(+bx.dataset.g); }
  });
  view.addEventListener('keydown', function (ev) {
    var W = view.clientWidth / 2, H = view.clientHeight / 2;
    if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); zoomAt(W, H, k * 1.4, true); }
    else if (ev.key === '-') { ev.preventDefault(); zoomAt(W, H, k / 1.4, true); }
    else if (ev.key === '0') { ev.preventDefault(); k = 1; tx = 0; ty = 0; apply(true); }
    else if (ev.key === 'Escape') { closeAllPops(); }
  });
  box.appendChild(view);
  var list = el('div', 'elcells');
  groups.forEach(function (g, i) {
    var chip = el('button', 'elchip ' + (g.type === '미접합' ? 'hot' : 'warn'), g.label + ' ' + g.top.toFixed(1) + '%'); chip.type = 'button'; chip.style.setProperty('--i', i);
    chip.addEventListener('click', function () { seq = false; k = 1; tx = 0; ty = 0; apply(true); if (pops[i]) { closePop(i, true); return; } popFor(i); });
    list.appendChild(chip);
  });
  box.appendChild(list); pBody.appendChild(box);
}
