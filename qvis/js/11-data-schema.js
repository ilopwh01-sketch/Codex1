/* 11-data-schema.js · DATA 모양 검사. DB에서 받은 JSON이 틀리면 화면을 바꾸지 않고 이유를 알려 준다.
   필드 설명은 data/SCHEMA.md. 필드를 추가하면 여기와 SCHEMA.md를 같이 고친다. */
function validateData(d) {
  var e = [], isNum = function (v) { return typeof v === 'number' && isFinite(v); }, isStr = function (v) { return typeof v === 'string' && v.length > 0; };
  function need(path, ok) { if (!ok) { e.push(path); } }
  function arr(path, v, each) { if (!Array.isArray(v)) { e.push(path + ' (배열이어야 함)'); return; } v.forEach(function (x, i) { each(x, path + '[' + i + ']'); }); }
  if (!d || typeof d !== 'object') { return ['DATA 전체 (객체가 아님)']; }
  need('line', isStr(d.line)); need('date', isStr(d.date)); need('target', isNum(d.target)); need('inspected', isNum(d.inspected) && d.inspected > 0); need('defects', isNum(d.defects)); need('closedAlarms', isNum(d.closedAlarms));
  arr('byProcess', d.byProcess, function (x, p) { need(p + ' [이름, 건수]', Array.isArray(x) && isStr(x[0]) && isNum(x[1])); });
  var h = d.hourly || {}; need('hourly.hours', Array.isArray(h.hours) && h.hours.length > 1); need('hourly.today (hours와 같은 길이)', Array.isArray(h.today) && h.today.length === (h.hours || []).length); need('hourly.usual (hours와 같은 길이)', Array.isArray(h.usual) && h.usual.length === (h.hours || []).length);
  var s = d.issue || {}; need('issue.eq', isStr(s.eq)); need('issue.type', isStr(s.type)); need('issue.lastHour', isNum(s.lastHour)); need('issue.usualHour', isNum(s.usualHour));
  arr('issue.causes', s.causes, function (c, p) { need(p + '.label', isStr(c.label)); need(p + '.pct', isNum(c.pct)); arr(p + '.leaves', c.leaves, function (l, q) { need(q + '.n', isStr(l.n)); need(q + '.p', isNum(l.p)); }); });
  var t = d.detection || {}; need('detection.time', isStr(t.time)); need('detection.module', isStr(t.module)); need('detection.eq', isStr(t.eq)); need('detection.verdict', isStr(t.verdict));
  arr('detection.cells', t.cells, function (c, p) { need(p + ' [셀ID, 유형, 확신도%, 열(0~23), 행(0~5)]', Array.isArray(c) && isStr(c[0]) && isStr(c[1]) && isNum(c[2]) && isNum(c[3]) && isNum(c[4]) && c[3] >= 0 && c[3] < 24 && c[4] >= 0 && c[4] < 6); });
  var b = d.baseline || {}; need('baseline.label', isStr(b.label)); need('baseline.n', isNum(b.n) && b.n > 0); need('baseline.d', isNum(b.d));
  var hc = d.hourlyCounts || {}; need('hourlyCounts.hours', Array.isArray(hc.hours) && hc.hours.length > 1); need('hourlyCounts.n (hours와 같은 길이)', Array.isArray(hc.n) && hc.n.length === (hc.hours || []).length); need('hourlyCounts.d (hours와 같은 길이)', Array.isArray(hc.d) && hc.d.length === (hc.hours || []).length);
  arr('defectTypes', d.defectTypes, function (x, p) { need(p + ' [유형, 건수]', Array.isArray(x) && isStr(x[0]) && isNum(x[1])); });
  var c = d.compare || {}; need('compare.eq', isStr(c.eq)); need('compare.groups (2개 이상)', Array.isArray(c.groups) && c.groups.length >= 2);
  arr('compare.groups', c.groups, function (g, p) { need(p + ' [이름, 숫자 배열(2개 이상)]', Array.isArray(g) && isStr(g[0]) && Array.isArray(g[1]) && g[1].length >= 2 && g[1].every(isNum)); });
  arr('alarms', d.alarms, function (a, p) { need(p + '.eq', isStr(a.eq)); need(p + '.what', isStr(a.what)); need(p + '.min', isNum(a.min)); });
  arr('events', d.events, function (v, p) { ['date', 'time', 'insp', 'type', 'module'].forEach(function (k) { need(p + '.' + k, isStr(v[k])); }); need(p + '.qty', isNum(v.qty)); need(p + '.shiftCount', isNum(v.shiftCount)); need(p + '.suspects', Array.isArray(v.suspects)); need(p + '.route', Array.isArray(v.route) && v.route.length > 0); });
  need('events (1건 이상)', Array.isArray(d.events) && d.events.length > 0);
  return e;
}
