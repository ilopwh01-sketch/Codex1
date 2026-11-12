/* 20-rules.js · 규칙 기반 답(AI 없음): 질문 의도(QA) → RULES[의도](DATA) → 문장·수치 칩·근거 팝업·조치·의견 */
var RULES = {
  trend: function (d) {
    var hr = d.hourly, n = hr.today.length - 1, now = hr.today[n], cross = null;
    for (var i = 1; i <= n && cross === null; i++) { if (hr.today[i - 1] <= d.target && hr.today[i] > d.target) { cross = hr.hours[i - 1] + (d.target - hr.today[i - 1]) / (hr.today[i] - hr.today[i - 1]) * (hr.hours[i] - hr.hours[i - 1]); } }
    var j = n; while (j > 0 && hr.hours[n] - hr.hours[j] < 1) { j--; }
    var rise = now - hr.today[j], next = now + rise;
    return {
      a: (cross !== null ? hmTxt(cross) + '부터 불량률이 목표 ' + f2(d.target) + '%를 넘기 시작해 ' : '') + '지금은 ' + f1(now) + '%입니다. 같은 시간대 평소 수준은 ' + f1(hr.usual[n]) + '%입니다.',
      facts: ['지금 ' + f1(now) + '%', '목표 ' + f2(d.target) + '%'].concat(cross !== null ? [hmClock(cross) + '부터 초과'] : []),
      alert: now > d.target * 1.5 ? 0.8 : now > d.target ? 0.5 : 0,
      panel: { type: 'chart', kicker: '시간대별 불량률', title: '오늘 06시 ~ 지금 · ' + d.line, target: d.target, yMax: Math.max(3.5, Math.ceil(now + 0.5)), hours: hr.hours, today: hr.today, usual: hr.usual },
      actions: [{ t: '초과 시작 전후 설비 변경 이력 확인 (' + hr.change + ')', who: '공정' }, { t: '초과 구간 생산분 EL 재검 여부 결정', who: '품질' }],
      feedback: rise > 0 ? '최근 1시간 동안 ' + f1(rise) + '%p 올랐습니다. 지금 속도가 이어지면 1시간 뒤 ' + f1(next) + '% 안팎이 됩니다.' : '최근 1시간 동안 더 오르지 않았습니다.'
    };
  },
  rate: function (d) {
    var r = d.defects / d.inspected * 100, diff = r - d.target, top = d.byProcess.slice().sort(function (x, y) { return y[1] - x[1]; })[0], share = Math.round(top[1] / d.defects * 100), max = top[1];
    return {
      a: '오늘 불량률은 ' + f2(r) + '%로 목표 ' + f2(d.target) + '%보다 ' + f2(Math.abs(diff)) + '%p ' + (diff > 0 ? '높습니다' : '낮습니다') + '. 불량이 가장 많은 공정은 ' + top[0] + '(' + top[1] + '건)입니다.',
      facts: ['불량률 ' + f2(r) + '%', '목표 ' + f2(d.target) + '%', '검사 ' + num(d.inspected) + '매'],
      alert: diff > 0.3 ? 0.6 : diff > 0 ? 0.4 : 0,
      panel: { type: 'table', kicker: '공정별 불량', title: '오늘 06시 이후 · 목표 ' + f2(d.target) + '%', cols: ['공정', '불량', '불량률', ''],
        rows: d.byProcess.map(function (p, i) { return { cells: [p[0], String(p[1]), f2(p[1] / d.inspected * 100) + '%'], bar: p[1] / max, hot: p[0] === top[0] }; }) },
      actions: diff > 0 ? [{ t: top[0] + ' 공정 불량 ' + top[1] + '건 내역 확인', who: '공정' }, { t: '목표 초과 원인을 근무조 회의 안건으로 등록', who: '반장' }] : [{ t: '다음 정기 점검 시각까지 현재 상태 유지', who: '공정' }],
      feedback: share >= 30 ? '불량의 ' + share + '%가 ' + top[0] + ' 한 공정에서 나왔습니다. 라인 전체보다 이 공정을 먼저 보는 것이 빠릅니다.' : '불량이 여러 공정에 고르게 퍼져 있습니다. 공통 원인(자재, 환경)을 먼저 의심해 보세요.'
    };
  },
  issue: function (d) {
    var s = d.issue, ratio = Math.round(s.lastHour / s.usualHour), leaves = [];
    s.causes.forEach(function (c) { c.leaves.forEach(function (l) { leaves.push(l); }); });
    leaves.sort(function (x, y) { return y.p - x.p; });
    var top = s.causes.slice().sort(function (x, y) { return y.pct - x.pct; })[0];
    return {
      a: s.eq + '의 ' + s.type + '입니다. 최근 1시간 ' + s.lastHour + '건으로 평소의 ' + ratio + '배이고, ' + leaves[0].n + '가 가장 유력한 원인입니다.',
      facts: ['1시간 ' + s.lastHour + '건', '평소의 ' + ratio + '배', '원인 기여도 ' + leaves[0].p + '%'],
      alert: ratio >= 3 ? 1 : 0.6,
      panel: { type: 'map', kicker: '원인 마인드맵', title: s.eq + ' · ' + s.type, center: s.type,
        branches: s.causes.map(function (c, i) { return { label: c.label + ' ' + c.pct + '%', hot: c === top, leaves: c.leaves.map(function (l) { return l.n + ' ' + l.p + '%'; }) }; }) },
      actions: leaves.slice(0, 3).map(function (l) { return { t: l.act, who: l.who }; }),
      feedback: top.label + ' 요인이 ' + top.pct + '%로 가장 큽니다. ' + top.label + ' 쪽 ' + top.leaves.length + '개 항목만 확인해도 원인 후보의 ' + top.pct + '%를 점검하게 됩니다.' + (ratio >= 3 ? ' 평소 대비 ' + ratio + '배는 이상 판정 기준(3배)을 넘었습니다.' : '')
    };
  },
  detect: function (d) {
    var s = d.detection, cnt = {}, max = 0, strings = {};
    s.cells.forEach(function (c) { cnt[c[1]] = (cnt[c[1]] || 0) + 1; max = Math.max(max, c[2]); var k = c[0].split('-')[0] + c[1]; strings[k] = (strings[k] || 0) + 1; });
    var parts = Object.keys(cnt).map(function (k) { return (k === '미접합' ? '솔더링 미접합' : k === '크랙' ? '마이크로크랙' : k) + ' ' + cnt[k] + '셀'; });
    var run3 = Object.keys(strings).filter(function (k) { return strings[k] >= 3; })[0];
    return {
      a: s.time + '에 검사한 모듈에서 ' + parts.join('과 ') + '을 찾았습니다. 판정은 ' + s.verdict + '입니다.',
      facts: ['판정 NG · ' + s.verdict, '검출 확신도 최대 ' + f1(max) + '%', s.eq],
      alert: 0.8,
      panel: { type: 'el', kicker: 'EL 검출 이미지', title: s.module + ' · ' + s.time + ' 검사 · 판정 ' + s.verdict, cols: 24, rows: 6, split: 12, module: s.module, time: s.time,
        cells: s.cells.map(function (c) { return { id: c[0], type: c[1], conf: c[2], c: c[3], r: c[4] }; }) },
      actions: [{ t: s.module + ' 재작업 라인으로 이동', who: '생산' }, { t: '같은 시간대 ' + s.eq + ' 생산 모듈 EL 재확인', who: '품질' }],
      feedback: run3 ? run3.slice(0, 2) + ' 스트링에서 연속 ' + strings[run3] + '셀이 같은 불량입니다. 셀 문제보다 리본·솔더링 문제일 가능성이 큽니다.' : '불량 셀이 흩어져 있습니다. 셀 자체 품질을 먼저 확인해 보세요.'
    };
  },
  compare: function (d) {
    var c = d.compare, gs = c.groups.map(function (g) { return g[1]; }), A = anova(gs), ms = gs.map(mean), worst = ms.indexOf(Math.max.apply(null, ms)), sig = A.p < 0.05;
    var rest = c.groups.filter(function (g, i) { return i !== worst; }), R = anova(rest.map(function (g) { return g[1]; }));
    var others = rest.map(function (g) { return g[0] + ' ' + f2(mean(g[1])) + '%'; }).join(', ');
    return {
      a: c.eq + ' ' + c.groups[worst][0] + '의 시간별 불량률 평균은 ' + f2(ms[worst]) + '%로 ' + others + '보다 높고, ' + (sig ? '이 차이는 우연으로 보기 어렵습니다' : '아직 우연한 차이일 수 있습니다') + ' (F ' + A.F.toFixed(2) + ', p ' + pTxt(A.p) + ').',
      facts: ['F ' + A.F.toFixed(2), 'p ' + pTxt(A.p), c.groups[worst][0] + ' 평균 ' + f2(ms[worst]) + '%'],
      alert: sig ? 0.5 : 0,
      panel: { type: 'anova', kicker: '설비 비교 · 분산분석', title: c.eq + ' ' + c.groups.map(function (g) { return g[0].replace('호기', ''); }).join('·') + '호기 · 시간별 불량률 ' + gs[0].length + '개씩', groups: c.groups, A: A, worst: worst, sig: sig },
      actions: sig ? [{ t: c.eq + ' ' + c.groups[worst][0] + ' 솔더링 온도·압착 압력 점검', who: '설비' }, { t: c.groups[worst][0] + ' 오늘 생산분 EL 샘플 재검', who: '품질' }] : [{ t: '다음 교대까지 같은 비교를 다시 보기', who: '공정' }],
      feedback: c.groups[worst][0] + '를 빼고 다시 비교하면 ' + rest.map(function (g) { return g[0]; }).join('·') + ' 차이는 F ' + R.F.toFixed(2) + ' (p ' + pTxt(R.p) + ')로 ' + (R.p < 0.05 ? '여전히 유의합니다. 라인 전체 조건도 함께 보세요.' : '우연 범위입니다. ' + c.groups[worst][0] + ' 한 대의 문제로 좁혀집니다.')
    };
  },
  stats: function (d) {
    var b = d.baseline, p0 = b.d / b.n, hc = d.hourlyCounts, pts = [], outs = [];
    hc.hours.forEach(function (h, i) {
      var n = hc.n[i], pi = hc.d[i] / n, sd = Math.sqrt(p0 * (1 - p0) / n), ucl = p0 + 3 * sd, lcl = Math.max(0, p0 - 3 * sd);
      pts.push({ h: h, n: n, d: hc.d[i], p: pi * 100, ucl: ucl * 100, lcl: lcl * 100, out: pi > ucl }); if (pi > ucl) { outs.push(h); }
    });
    var runAbove = 0, best = 0; pts.forEach(function (q) { runAbove = q.p > p0 * 100 ? runAbove + 1 : 0; best = Math.max(best, runAbove); });
    var p1 = d.defects / d.inspected, pp = (d.defects + b.d) / (d.inspected + b.n), se = Math.sqrt(pp * (1 - pp) * (1 / d.inspected + 1 / b.n)), z = (p1 - p0) / se, pv = 2 * (1 - ncdf(Math.abs(z)));
    var tot = d.defectTypes.reduce(function (a, x) { return a + x[1]; }, 0), cum = 0, top3 = 0;
    var pareto = d.defectTypes.slice().sort(function (x, y) { return y[1] - x[1]; }).map(function (x, i) { cum += x[1]; if (i < 3) { top3 = cum; } return { name: x[0], v: x[1], cum: cum / tot * 100 }; });
    var sig = pv < 0.05, pvTxt = pv < 0.001 ? 'p < 0.001' : 'p = ' + pv.toFixed(3);
    var fbs = [];
    if (outs.length) { fbs.push(outs.map(function (h) { return h + '시'; }).join(', ') + ' 구간이 관리 상한을 넘었습니다. 우연한 변동으로 보기 어려운 이상 신호입니다.'); }
    if (best >= 3) { fbs.push('기준선 위로 ' + best + '시간 연속입니다.'); }
    var sigTxt = ('오늘 불량률 ' + f2(p1 * 100) + '%는 ' + b.label + ' 평균 ' + f2(p0 * 100) + '%보다 ' + (sig ? '통계적으로 유의하게 높습니다' : '높지만 우연한 차이일 수 있습니다') + ' (' + pvTxt + ').');
    var focusTxt = '상위 3개 유형부터 잡으면 불량의 ' + Math.round(top3 / tot * 100) + '%를 다룹니다.';
    return {
      a: (outs.length ? outs.map(function (h) { return h + '시'; }).join(', ') + ' 구간이 관리 상한을 넘었습니다. ' : '관리 상한을 넘은 구간은 없습니다. ') + '오늘 불량률은 ' + b.label + ' 평균보다 ' + (sig ? '통계적으로 유의하게 높습니다.' : '높지만 유의한 차이는 아닙니다.'),
      facts: ['관리 상한 초과 ' + outs.length + '구간', (sig ? '유의함 · ' : '유의하지 않음 · ') + pvTxt, '상위 3유형 ' + Math.round(top3 / tot * 100) + '%'],
      alert: outs.length ? 0.8 : sig ? 0.5 : 0.2,
      panel: { type: 'stats', kicker: '통계 분석', title: 'p 관리도 · 파레토 · 비교 검정', p0: p0 * 100, pts: pts, pareto: pareto, base: b.label,
        test: { p1: p1 * 100, p0: p0 * 100, z: z, pv: pvTxt, sig: sig } },
      actions: (outs.length ? [{ t: outs.map(function (h) { return h + '시'; }).join(', ') + ' 생산분 원인 조사 (관리 상한 초과)', who: '품질' }] : []).concat([{ t: pareto.slice(0, 3).map(function (x) { return x.name; }).join(' · ') + ' 집중 관리', who: '공정' }]),
      feedback: (fbs.length ? fbs : [sigTxt]).concat([focusTxt]).join(' ')
    };
  },
  alarms: function (d) {
    var a = d.alarms.slice().sort(function (x, y) { return y.min - x.min; }), late = a.filter(function (x) { return x.min >= 30; }).length;
    return {
      a: a.length + '건이 열려 있습니다. 가장 오래된 것은 ' + a[0].eq + ' ' + a[0].what + '으로 ' + a[0].min + '분째입니다.',
      facts: ['미조치 ' + a.length + '건', '최장 ' + a[0].min + '분', '완료 ' + d.closedAlarms + '건'],
      alert: late ? 0.7 : 0.4,
      panel: { type: 'table', kicker: '미조치 알람', title: '열린 알람 ' + a.length + '건 · 경과 시간', cols: ['설비', '내용', '경과', ''],
        rows: a.map(function (x) { return { cells: [x.eq, x.what, x.min + '분'], bar: Math.min(1, x.min / 60), hot: x.min >= 30 }; }) },
      actions: a.map(function (x) { return { t: x.eq + ' · ' + x.what + ' 확인', who: /라미|스트링거|태버/.test(x.eq) ? '설비' : '공정' }; }),
      feedback: late ? '30분을 넘긴 알람이 ' + late + '건입니다. 담당자 재호출을 권합니다.' : '모든 알람이 30분 안에 있습니다.'
    };
  },
  event: function (e) {
    var sus = e.suspects.join('와 ');
    return {
      k: '새 ' + e.insp + ' 불량 · ' + e.date + ' ' + e.time, m: e.type + ' ' + e.qty + '매 · ' + e.suspects.join(' · '),
      a: e.date + ' ' + e.time.replace(':', '시 ') + '분, ' + e.insp + '에서 ' + e.type + ' ' + e.qty + '매가 발생했습니다. ' + sus + '를 거친 모듈입니다.',
      facts: [e.type + ' ' + e.qty + '매'].concat(e.suspects, [e.module]), alert: 1,
      panel: { type: 'route', kicker: '모듈 공정 경로', title: e.module + ' · ' + e.insp + ' ' + e.type,
        steps: e.route.map(function (r, i) { var last = i === e.route.length - 1, hot = e.suspects.indexOf(r[0]) >= 0; return { st: r[0], tm: r[1], sub: last ? e.type + ' ' + e.qty + '매 검출' : hot ? '거친 설비 · 확인 필요' : (r[2] || ''), hot: hot, bad: last }; }) },
      actions: e.suspects.map(function (s) { return { t: s + ' 최근 ' + e.type + ' 이력 확인', who: '설비' }; }).concat([{ t: '같은 시간대 생산 모듈 ' + e.insp + ' 재확인', who: '품질' }]),
      feedback: e.shiftCount >= 2 ? '이번 근무조 들어 ' + e.type + ' ' + e.shiftCount + '번째입니다. 앞선 건과 같은 설비를 거쳤는지 확인해 반복 여부를 판단하세요.' : '이번 근무조 첫 ' + e.type + '입니다. 같은 설비에서 다시 나오는지 지켜보세요.'
    };
  }
};
/* 질문 의도: 앞에서부터 키워드가 맞는 첫 의도로 답한다 */
var QA = [
  { q: '시간대별 불량률 보여줘', keys: ['그래프', '시간대', '시간별', '추이'], rule: 'trend' },
  { q: '통계 분석 보여줘', keys: ['통계', '관리도', '유의', '파레토', '검정'], rule: 'stats' },
  { q: '호기별 차이 진짜야?', keys: ['호기', '설비 비교', '차이', '분산', 'ANOVA', 'anova'], rule: 'compare' },
  { q: '지금 불량률 어때?', keys: ['불량률', '어때', '현황'], rule: 'rate' },
  { q: '가장 큰 문제가 뭐야?', keys: ['문제', '원인', '왜'], rule: 'issue' },
  { q: '방금 검출된 모듈 알려줘', keys: ['검출', '모듈', '방금'], rule: 'detect' },
  { q: '미조치 알람 있어?', keys: ['알람', '미조치', '조치'], rule: 'alarms' }
];
var FALLBACK = { a: '아직 이 질문은 이해하지 못해요. 불량률, 시간대별 추이, 가장 큰 문제, 방금 검출, 미조치 알람을 물어볼 수 있어요.', facts: [], alert: 0 };
var LABEL = { idle: '무엇이든 물어보세요', listening: '듣고 있어요', thinking: '확인하는 중', speaking: '', alert: '새 불량 감지' };
