/* 60-orb.js · 가운데 오브(구체) 그리기. 한화 Tricircle 값은 공식 CI에서 맞춘 값이니 바꾸지 않는다 */
/* ---------- 구체 그리기 ---------- */
var cv = $('orb'), g = cv.getContext('2d'), W = 0, dpr = 1;
var COL = { teal: [31, 207, 190], blue: [10, 143, 203], violet: [11, 59, 143], gold: [142, 221, 187], warm: [243, 115, 33], cell: [120, 190, 220] };
var blobs = [['teal', 0.9, 0.0, 1.0, 0.8], ['blue', -0.7, 1.7, 0.8, 1.0], ['violet', 0.55, 3.1, 1.0, 0.7], ['gold', -1.1, 4.4, 0.7, 0.9], ['warm', 0.8, 5.5, 0.9, 0.9]];
var sheen = 0, orbit = 0, M = { phase: 'free', time: 0, next: 3.5 };
var coreEl = document.querySelector('.core');
var rgba = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
var mix = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round); };
function resize() { var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; cv.width = Math.round(W * dpr); cv.height = Math.round(W * dpr); if (reduce) { draw(performance.now()); } }
function voice(t) { return 0.35 + 0.65 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1 + 1.3) + 0.35 * Math.sin(t * 13.7)); }
var rot = 0, last = 0;
function draw(now) {
  var t = (now - S.t0) / 1000, dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
  S.target = S.name === 'alert' ? 0.62 + 0.28 * Math.abs(Math.sin(t * 6)) : S.name === 'idle' ? 0.12 + 0.05 * Math.sin(t * 1.2) : S.name === 'thinking' ? 0.3 + 0.08 * Math.sin(t * 9) : Math.min(1, voice(t) * (S.name === 'speaking' ? 0.8 : 1));
  S.level += (S.target - S.level) * Math.min(1, dt * 9); S.spin += (S.spinT - S.spin) * Math.min(1, dt * 3); S.alert += (S.alertT - S.alert) * Math.min(1, dt * 2.5); rot += dt * S.spin;
  var L = S.level, cx = W / 2, cy = W / 2, R = W / 2 * 0.94;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, W);
  sheen += dt * (0.13 + 0.3 * L);

  /* 0. 햇빛 코로나: 구체 뒤로 퍼지는 금빛과 빛살 */
  var sun = mix(COL.gold, COL.warm, S.alert * 0.7);
  g.globalCompositeOperation = 'lighter';
  var cr = g.createRadialGradient(cx, cy, R * 0.5, cx, cy, R);
  cr.addColorStop(0, rgba(sun, 0.16 + 0.14 * L)); cr.addColorStop(1, rgba(sun, 0));
  g.fillStyle = cr; g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fill();
  g.lineCap = 'round';
  for (var q = 0; q < 56; q++) {
    var ra = q / 56 * 6.2832 + rot * 0.25, w = 0.5 + 0.5 * Math.sin(q * 2.37 + t * 1.6), r1 = R * 0.63, r2 = R * (0.72 + 0.2 * w * (0.45 + L));
    var lg = g.createLinearGradient(cx + Math.cos(ra) * r1, cy + Math.sin(ra) * r1, cx + Math.cos(ra) * r2, cy + Math.sin(ra) * r2);
    lg.addColorStop(0, rgba(sun, 0.26 * w)); lg.addColorStop(1, rgba(sun, 0));
    g.strokeStyle = lg; g.lineWidth = Math.max(1, R * 0.007); g.beginPath(); g.moveTo(cx + Math.cos(ra) * r1, cy + Math.sin(ra) * r1); g.lineTo(cx + Math.cos(ra) * r2, cy + Math.sin(ra) * r2); g.stroke();
  }
  g.globalCompositeOperation = 'source-over';

  /* 1. 안쪽에서 일렁이는 빛 */
  g.save(); g.beginPath(); g.arc(cx, cy, R * 0.6, 0, 6.2832); g.clip(); g.filter = 'blur(' + (R * 0.075).toFixed(1) + 'px)'; g.globalCompositeOperation = 'lighter';
  blobs.forEach(function (b, i) {
    var a = t * b[1] * (0.5 + S.spin * 0.5) + b[2], reach = R * (0.16 + 0.2 * L);
    var x = cx + Math.cos(a) * reach * b[3] + Math.cos(a * 1.9 + i) * R * 0.06, y = cy + Math.sin(a * 1.2) * reach * b[4] + Math.sin(a * 2.3 + i) * R * 0.06;
    var rad = R * (0.3 + 0.07 * Math.sin(t * 0.9 + i * 2) + 0.16 * L), k = b[0] === 'warm' ? 0.15 + 0.85 * S.alert : (S.name === 'thinking' && b[0] === 'violet' ? 1 : 0.8);
    var gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba(COL[b[0]], 0.75 * k)); gr.addColorStop(1, rgba(COL[b[0]], 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill();
  });
  g.restore();
  var cg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.6); cg.addColorStop(0, 'rgba(7,18,38,0.55)'); cg.addColorStop(0.55, 'rgba(7,18,38,0.18)'); cg.addColorStop(1, 'rgba(7,18,38,0)');
  g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, R * 0.6, 0, 6.2832); g.fill();

  /* 1-2. 태양광 셀 격자: 물결처럼 일렁이고, 햇빛 띠가 비스듬히 지나감 */
  g.save(); g.beginPath(); g.arc(cx, cy, R * 0.6, 0, 6.2832); g.clip();
  var N = 6, side = R * 1.2 / N, gx = cx - R * 0.6, gy = cy - R * 0.6, ch = side * 0.13, gap = Math.max(1.5, side * 0.05);
  g.beginPath();
  for (var ci = 0; ci < N; ci++) {
    for (var cj = 0; cj < N; cj++) {
      var wob = Math.sin(t * 1.4 + ci * 0.7 + cj * 0.5) * R * (0.003 + 0.012 * L), x = gx + ci * side + gap + wob, y = gy + cj * side + gap - wob, s = side - gap * 2;
      g.moveTo(x + ch, y); g.lineTo(x + s - ch, y); g.lineTo(x + s, y + ch); g.lineTo(x + s, y + s - ch); g.lineTo(x + s - ch, y + s); g.lineTo(x + ch, y + s); g.lineTo(x, y + s - ch); g.lineTo(x, y + ch); g.closePath();
      for (var bb = 1; bb <= 3; bb++) { g.moveTo(x + s * bb / 4, y + 1); g.lineTo(x + s * bb / 4, y + s - 1); }
    }
  }
  g.lineWidth = 1; g.strokeStyle = rgba(COL.cell, 0.13); g.stroke();
  var sp = (sheen % 1.7) - 0.35, st = function (v) { return Math.max(0, Math.min(1, v)); };
  var sg = g.createLinearGradient(gx, gy, gx + R * 1.2, gy + R * 1.2);
  sg.addColorStop(st(sp - 0.2), rgba(sun, 0)); sg.addColorStop(st(sp), rgba([225, 250, 242], 0.75)); sg.addColorStop(st(sp + 0.2), rgba(sun, 0));
  g.globalCompositeOperation = 'lighter'; g.strokeStyle = sg; g.lineWidth = 1.3; g.stroke();
  var sf = g.createLinearGradient(gx, gy, gx + R * 1.2, gy + R * 1.2);
  sf.addColorStop(st(sp - 0.16), rgba(sun, 0)); sf.addColorStop(st(sp), rgba(sun, 0.12)); sf.addColorStop(st(sp + 0.16), rgba(sun, 0));
  g.fillStyle = sf; g.fillRect(gx, gy, R * 1.2, R * 1.2);
  g.restore();

  /* 2. 가장자리에서 일렁이는 띠 */
  g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  var ribbons = [['teal', 3, 0.9, 0], ['blue', 5, -0.7, 1.4], ['gold', 4, 1.3, 2.6], ['violet', 6, -1.1, 4.0]];
  ribbons.forEach(function (rb, j) {
    var amp = R * (0.008 + 0.055 * L) * (1 - j * 0.14), col = mix(COL[rb[0]], COL.warm, j === 0 ? S.alert * 0.8 : 0);
    g.beginPath();
    for (var k = 0; k <= 180; k++) {
      var th = k / 180 * 6.2832, r = R * 0.62 + amp * (Math.sin(rb[1] * th + t * rb[2] * 2 + rb[3]) * 0.65 + Math.sin((rb[1] + 2) * th - t * rb[2] * 1.3 + rb[3] * 2) * 0.35);
      var px = cx + Math.cos(th) * r, py = cy + Math.sin(th) * r; if (k) { g.lineTo(px, py); } else { g.moveTo(px, py); }
    }
    g.closePath(); g.strokeStyle = rgba(col, 0.85 - j * 0.14); g.lineWidth = 2.2 - j * 0.3; g.shadowColor = rgba(col, 0.9); g.shadowBlur = 14 + 22 * L; g.stroke();
  });
  g.shadowBlur = 0;

  /* 2-2. 세 고리 엠블럼: 크기가 다른 기울어진 타원 세 개가 아래 오른쪽으로 겹쳐 쌓이고,
     안쪽 타원을 비켜 놓아 고리마다 한쪽은 굵고 한쪽은 가는 초승달 획이 된다.
     큰 고리는 천천히, 안쪽 고리는 더 빨리 돌아 서로 감기듯 움직인다. */
  orbit += dt * (0.22 + 1.5 * L + (S.name === 'thinking' ? 0.9 : 0));
  var oc = mix([243, 115, 33], COL.warm, S.alert * 0.6), U = R * 0.5;
  /* 합체: 돌던 고리가 마크 자세로 튕기듯 모였다가(0.75s) 잠깐 멈추고(1.6s) 다시 풀린다(0.9s).
     대기 중에는 7초마다, 답을 시작할 때는 바로 */
  M.time += dt;
  if (M.phase === 'free' && S.name === 'idle') { M.next -= dt; if (M.next <= 0) { M.phase = 'in'; M.time = 0; } }
  if (M.phase === 'in' && M.time >= 0.75) { M.phase = 'hold'; M.time = 0; }
  else if (M.phase === 'hold' && M.time >= 1.6) { M.phase = 'out'; M.time = 0; }
  else if (M.phase === 'out' && M.time >= 0.9) { M.phase = 'free'; M.time = 0; M.next = 7; }
  var mg = 0, fl = M.phase === 'hold' ? Math.max(0, 1 - M.time / 0.7) : 0;
  if (M.phase === 'in') { var mq = Math.min(1, M.time / 0.75) - 1; mg = 1 + 2.5 * mq * mq * mq + 1.5 * mq * mq; }
  else if (M.phase === 'hold') { mg = 1; }
  else if (M.phase === 'out') { var po = Math.min(1, M.time / 0.9); mg = 1 - po * po * (3 - 2 * po); }
  if (reduce) { mg = 1; fl = 0; }
  /* 한화 트라이서클: 공식 CI 이미지에서 따낸 세 고리. 값은 마크 가로폭 기준
     [중심x, 중심y, 장반경, 단반경, 기울기, 안쪽 타원 이동x, 이동y, 안쪽 장반경 비, 단반경 비, 공식 색].
     ① 맨 위, ② 중간, ③ 맨 아래 순서로 겹친다. mg = 1 이면 공식 마크와 같은 모양·비례·색 */
  var TRI = [
    [0.6487, 0.4994, 0.3306, 0.2489, -2.9913, 0.0137, -0.0286, 0.8735, 0.8043, [251, 181, 132]],
    [0.5568, 0.6228, 0.2677, 0.2531, 2.2835, -0.0105, -0.0202, 0.8782, 0.8675, [248, 155, 108]],
    [0.4491, 0.3772, 0.4481, 0.3119, 2.6362, 0.007, 0.0059, 0.8092, 0.9259, [243, 115, 33]]
  ];
  var Wm = R * 1.02, mc = Math.max(0, Math.min(1, mg));
  g.globalCompositeOperation = 'source-over';
  TRI.forEach(function (rg, n) {
    var k = 2 - n, free = orbit * (1 + 0.55 * k), spin = Math.atan2(Math.sin(free), Math.cos(free)) * (1 - mg);
    var breathe = 1 + 0.03 * Math.sin(t * 1.3 + k * 1.9) * (1 - mc) + 0.05 * L * (1 - mc) + 0.06 * fl;
    var vx = (rg[0] - 0.5) * Wm * breathe, vy = (rg[1] - 0.457) * Wm * breathe, ca = Math.cos(spin), sa = Math.sin(spin);
    var x = cx + vx * ca - vy * sa, y = cy + vx * sa + vy * ca, th = rg[4] + spin * 1.3;
    var A = rg[2] * Wm * breathe, Bm = rg[3] * Wm * breathe, hx = x + (rg[5] * ca - rg[6] * sa) * Wm * breathe, hy = y + (rg[5] * sa + rg[6] * ca) * Wm * breathe;
    var path = new Path2D(); path.ellipse(x, y, A, Bm, th, 0, 6.2832);
    var hole = new Path2D(); hole.ellipse(hx, hy, A * rg[7], Bm * rg[8], th, 0, 6.2832); path.addPath(hole);
    var col = rg[9];
    g.shadowColor = rgba(col, 0.35 + 0.25 * fl); g.shadowBlur = 4 + 8 * L + 18 * fl;
    g.globalAlpha = Math.min(1, 0.16 + 0.1 * L + 0.4 * mc);
    g.fillStyle = rgba(col, 1); g.fill(path, 'evenodd');
    g.shadowBlur = 0;
    if (mc < 1 && g.createConicGradient) {
      var sh = g.createConicGradient(orbit * 2.2 + k * 2.1, x, y);
      sh.addColorStop(0, rgba(col, 0)); sh.addColorStop(0.8, rgba(col, 0)); sh.addColorStop(0.94, rgba([255, 240, 214], 0.9)); sh.addColorStop(1, rgba(col, 0));
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - mc) * (0.22 + 0.25 * L); g.fillStyle = sh; g.fill(path, 'evenodd'); g.globalCompositeOperation = 'source-over';
    }
    g.globalAlpha = 1;
  });
  coreEl.classList.toggle('merged', M.phase === 'hold' || (M.phase === 'in' && M.time > 0.45));
  g.shadowBlur = 0; g.globalCompositeOperation = 'lighter';
  if (fl > 0) {
    g.strokeStyle = rgba(mix(oc, [255, 236, 200], 0.4), 0.4 * fl); g.lineWidth = 1.5 + R * 0.012 * fl;
    g.beginPath(); g.arc(cx, cy, R * (0.62 + 0.3 * (1 - fl)), 0, 6.2832); g.stroke();
  }

  /* 3. 목소리 크기를 따라 움직이는 막대 */
  var bars = 72, show = S.name === 'listening' || S.name === 'speaking' || S.name === 'alert' ? 1 : S.name === 'thinking' ? 0.35 : 0.12;
  for (var i = 0; i < bars; i++) {
    var th2 = i / bars * 6.2832 - 1.5708, n = 0.5 + 0.5 * Math.sin(i * 1.7 + t * 6.1) * Math.sin(i * 0.37 - t * 3.3), len = R * (0.012 + 0.085 * L * n * show);
    var r0 = R * 0.705; g.strokeStyle = rgba(mix(COL.teal, COL.warm, S.alert * 0.6), 0.25 + 0.6 * n * show); g.lineWidth = Math.max(1.5, R * 0.011);
    g.beginPath(); g.moveTo(cx + Math.cos(th2) * r0, cy + Math.sin(th2) * r0); g.lineTo(cx + Math.cos(th2) * (r0 + len), cy + Math.sin(th2) * (r0 + len)); g.stroke();
  }

  /* 4. 바깥 링과 눈금 */
  g.globalCompositeOperation = 'source-over'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(169,188,203,0.28)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R * 0.82, 0, 6.2832); g.stroke();
  for (var m = 0; m < 60; m++) { var th3 = m / 60 * 6.2832 + rot * 0.15, big = m % 5 === 0; g.strokeStyle = 'rgba(169,188,203,' + (big ? 0.6 : 0.28) + ')'; g.beginPath(); g.moveTo(cx + Math.cos(th3) * R * 0.86, cy + Math.sin(th3) * R * 0.86); g.lineTo(cx + Math.cos(th3) * R * (big ? 0.9 : 0.88), cy + Math.sin(th3) * R * (big ? 0.9 : 0.88)); g.stroke(); }
  var arcCol = mix(COL.teal, COL.warm, S.alert);
  g.strokeStyle = rgba(arcCol, 0.95); g.lineWidth = Math.max(2, R * 0.012); g.shadowColor = rgba(arcCol, 0.9); g.shadowBlur = 12;
  g.beginPath(); g.arc(cx, cy, R * 0.95, rot, rot + 1.25); g.stroke();
  g.beginPath(); g.arc(cx, cy, R * 0.95, rot + 3.1416, rot + 3.1416 + 0.5); g.stroke();
  g.strokeStyle = rgba(COL.blue, 0.8); g.lineWidth = Math.max(1.5, R * 0.007); g.beginPath(); g.arc(cx, cy, R * 0.775, -rot * 1.4, -rot * 1.4 + 0.8); g.stroke();
  g.shadowBlur = 0; g.fillStyle = rgba(arcCol, 1);
  [rot + 1.25 + 0.12, rot + 3.1416 + 0.5 + 0.12].forEach(function (a) { g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95, Math.max(1.8, R * 0.008), 0, 6.2832); g.fill(); });
}
