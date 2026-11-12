/* 02-chart-kit.js · 그래프 간격 계산 도구
   규칙: 그래프의 x·y 좌표, 눈금, 여백, 라벨 위치는 직접 숫자로 계산하지 말고 이 함수들을 쓴다.
   - chartFrame : 그림 크기와 여백 → 그리는 영역(x0, x1, y0, y1)과 X(), Y() 변환
   - niceTicks  : 보기 좋은 눈금 값 (0, 0.5, 1 ... / 0, 1, 2 ...)
   - axisLeft / axisBottom : 눈금선 + 눈금 글자 SVG 문자열 (글자 간격·정렬 자동)
   - spreadLabels : 오른쪽 끝 라벨들이 서로 겹치지 않게 세로 위치를 벌려 준다
   - textWidth : 글자 폭 어림값 (여백을 글자 길이에 맞출 때) */
var KIT = {
  FONT: 11,          /* 눈금 글자 크기 (viewBox 단위) */
  LABEL_GAP: 16,     /* 오른쪽 끝 라벨 사이 최소 간격 */
  TICK_PAD: 10       /* 눈금 글자와 축 사이 간격 */
};
function textWidth(str, size) { var w = 0; String(str).split('').forEach(function (ch) { w += /[ㄱ-힝]/.test(ch) ? 1.0 : /[0-9.%]/.test(ch) ? 0.6 : 0.62; }); return w * (size || KIT.FONT); }
function niceTicks(min, max, count) {
  var span = max - min, raw = span / Math.max(1, count || 5), mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  var step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag, a = Math.floor(min / step) * step, out = [];
  for (var v = a; v <= max + step * 1e-6; v += step) { if (v >= min - step * 1e-6) { out.push(+v.toFixed(10)); } }
  return { ticks: out, step: step, min: out[0], max: out[out.length - 1] };
}
/* opts: { W, H, xMin, xMax, yMin, yMax, left, right, top, bottom }  left/right를 비우면 라벨 길이로 자동 */
function chartFrame(o) {
  var f = { W: o.W, H: o.H, left: o.left != null ? o.left : 44, right: o.right != null ? o.right : 24, top: o.top != null ? o.top : 20, bottom: o.bottom != null ? o.bottom : 30 };
  f.x0 = f.left; f.x1 = o.W - f.right; f.y0 = f.top; f.y1 = o.H - f.bottom;
  f.X = function (v) { return f.x0 + (v - o.xMin) / (o.xMax - o.xMin) * (f.x1 - f.x0); };
  f.Y = function (v) { return f.y1 - (v - o.yMin) / (o.yMax - o.yMin) * (f.y1 - f.y0); };
  return f;
}
/* 왼쪽 눈금: 가로 격자선 + 오른쪽 맞춤 숫자 */
function axisLeft(f, ticks, fmt) {
  return ticks.map(function (v) { var y = f.Y(v).toFixed(1); return '<line class="grid" x1="' + f.x0 + '" x2="' + f.x1 + '" y1="' + y + '" y2="' + y + '"></line><text x="' + (f.x0 - KIT.TICK_PAD) + '" y="' + (+y + KIT.FONT * 0.36).toFixed(1) + '" text-anchor="end">' + (fmt ? fmt(v) : v) + '</text>'; }).join('');
}
/* 아래 눈금: 가운데 맞춤. 글자가 겹치면 하나 건너 하나만 쓴다 */
function axisBottom(f, ticks, fmt) {
  var labs = ticks.map(function (v) { return fmt ? fmt(v) : String(v); }), widest = Math.max.apply(null, labs.map(function (s) { return textWidth(s); })), gap = ticks.length > 1 ? Math.abs(f.X(ticks[1]) - f.X(ticks[0])) : 1e9, every = Math.max(1, Math.ceil((widest + 8) / gap));
  return ticks.map(function (v, i) { return i % every ? '' : '<text x="' + f.X(v).toFixed(1) + '" y="' + (f.y1 + KIT.FONT + 8) + '" text-anchor="middle">' + labs[i] + '</text>'; }).join('');
}
/* 오른쪽 끝 라벨: [{y, text, cls}] → 서로 LABEL_GAP 이상 떨어지게 y를 조정해 SVG 문자열로 */
function spreadLabels(f, items) {
  var a = items.slice().sort(function (p, q) { return p.y - q.y; });
  for (var i = 1; i < a.length; i++) { if (a[i].y - a[i - 1].y < KIT.LABEL_GAP) { a[i].y = a[i - 1].y + KIT.LABEL_GAP; } }
  var over = a.length ? a[a.length - 1].y - f.y1 : 0; if (over > 0) { a.forEach(function (it) { it.y -= over; }); }
  return a.map(function (it) { return '<text class="' + (it.cls || 'lab') + '" x="' + (f.x1 + 8) + '" y="' + (it.y + KIT.FONT * 0.36).toFixed(1) + '">' + it.text + '</text>'; }).join('');
}
