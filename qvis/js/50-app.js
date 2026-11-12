/* 50-app.js · 답 보여주기, 읽어주기, 새 불량 알림, 자동 브리핑, 마이크, 좌우 숫자, 시계, 전체화면, 추천 질문 칩 */
function setState(n) { S.name = n; stateEl.textContent = LABEL[n]; S.spinT = n === 'alert' ? 2.6 : n === 'thinking' ? 1.9 : n === 'listening' ? 0.5 : 0.25; if (n === 'idle') { S.alertT = 0; } if (n === 'alert') { S.alertT = 1; } mic.setAttribute('aria-pressed', n === 'listening' ? 'true' : 'false'); if (n === 'speaking' && M.phase === 'free') { M.phase = 'in'; M.time = 0; } if (reduce) { draw(performance.now()); } }
function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 60) : ms); }); }
function find(text) { var hit = null; QA.forEach(function (x) { if (!hit && x.keys.some(function (k) { return text.indexOf(k) >= 0; })) { hit = x; } }); return hit ? RULES[hit.rule](DATA) : FALLBACK; }

/* ---------- 읽어주기 (브라우저 음성 합성) ---------- */
var voiceOn = false, voiceBtn = $('voice');
voiceBtn.addEventListener('click', function () {
  voiceOn = !voiceOn; voiceBtn.setAttribute('aria-pressed', voiceOn ? 'true' : 'false'); voiceBtn.textContent = voiceOn ? '읽어주기 켜짐' : '읽어주기 꺼짐';
  if (!voiceOn) { try { window.speechSynthesis.cancel(); } catch (e) {} }
});
function say(text) {
  if (!voiceOn) { return; }
  try { var u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 1.05; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
}

/* 답을 화면에 내보내기: 한 글자씩 → 수치 칩 → 근거 패널 */
function present(res, mine) {
  setState('speaking'); S.alertT = res.alert; say(res.a);
  var i = 0;
  return new Promise(function (done) {
    (function type() {
      if (mine !== run) { return done(); }
      i = reduce ? res.a.length : i + 1; aEl.textContent = res.a.slice(0, i);
      if (i < res.a.length) { setTimeout(type, 34); } else { done(); }
    })();
  }).then(function () {
    if (mine !== run) { return; }
    res.facts.forEach(function (f, k) { var c = document.createElement('span'); c.className = 'fact' + (k === 0 && res.alert >= 0.7 ? ' alert' : ''); c.textContent = f; factsEl.appendChild(c); setTimeout(function () { c.classList.add('on'); }, 60 + k * 90); });
    if (res.panel) { res.panel.actions = res.actions; res.panel.feedback = res.feedback; more.hidden = false; setTimeout(function () { if (mine === run) { openPanel(res.panel); } }, reduce ? 0 : 450); }
    return wait(900).then(function () { if (mine === run) { setState('idle'); } });
  });
}
function reset() { qEl.textContent = ''; aEl.textContent = ''; factsEl.textContent = ''; closePanel(); more.hidden = true; lastPanel = null; }
function answer(text) {
  var mine = ++run, res = find(text); touch(); hideAlert();
  reset(); qEl.textContent = '“' + text + '”';
  setState('thinking');
  return wait(1100).then(function () { if (mine === run) { return present(res, mine); } });
}

/* ---------- 새 불량 알림 (예시 데이터: 실제로는 DB에서 새 FQC 불량을 읽어 옴) ---------- */
var ALERTS = DATA.events.map(RULES.event);
var alertIdx = 0, alertbar = $('alertbar'), lastTouch = performance.now() - 15000, hideT = 0;
function touch() { lastTouch = performance.now(); }
function hideAlert() { clearTimeout(hideT); alertbar.classList.remove('on'); }
function fireAlert(auto) {
  var ev = ALERTS[alertIdx++ % ALERTS.length], mine = ++run; if (auto !== true) { touch(); }
  reset(); $('ab-k').textContent = ev.k; $('ab-m').textContent = ev.m; alertbar.classList.add('on');
  qEl.textContent = '새 불량이 등록됐어요';
  setState('alert');
  return wait(1600).then(function () {
    if (mine !== run) { return; }
    return present(ev, mine).then(function () { if (mine === run) { clearTimeout(hideT); hideT = setTimeout(hideAlert, 8000); if (auto === true) { holdThenNext(mine); } } });
  });
}
$('ab-x').addEventListener('click', hideAlert);
['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, touch); });

/* ---------- 자동 브리핑: 사람이 없으면 Q.V.I.S가 스스로 묻고 답한다 (AI 없이 규칙만으로) ----------
   순서대로 한 항목씩 점검하고, 근거 패널을 10초 보여준 뒤 다음으로 넘어간다.
   화면을 누르거나 키를 치면 15초 동안 멈춘다. 실제로는 'event' 자리에 DB의 새 불량이 끼어든다. */
var AUTO = CONFIG.autoOrder.slice(), autoIdx = 0, autoOn = true, autoNext = performance.now() + 6000, autoBtn = $('auto');
var ASK = {}; QA.forEach(function (x) { ASK[x.rule] = x.q; });
function holdThenNext(mine) {
  autoNext = performance.now() + 12000;
  setTimeout(function () { if (mine === run && autoOn) { closePanel(); } }, 10000);
}
function autoAsk(rule) {
  var mine = ++run, res = RULES[rule](DATA);
  hideAlert(); reset(); qEl.textContent = '자동 점검 · “' + ASK[rule] + '”';
  setState('thinking');
  return wait(1000).then(function () { if (mine === run) { return present(res, mine).then(function () { if (mine === run) { holdThenNext(mine); } }); } });
}
autoBtn.addEventListener('click', function () {
  autoOn = !autoOn; autoBtn.setAttribute('aria-pressed', autoOn ? 'true' : 'false'); autoBtn.textContent = autoOn ? '자동 브리핑 켜짐' : '자동 브리핑 꺼짐';
  if (autoOn) { autoNext = performance.now() + 2000; lastTouch = performance.now() - 15000; }
});
setInterval(function () {
  var now = performance.now();
  if (!autoOn || reduce || S.name !== 'idle' || now < autoNext || now - lastTouch < 15000) { return; }
  autoNext = now + 60000;
  var step = AUTO[autoIdx++ % AUTO.length];
  if (step === 'event') { fireAlert(true); } else { autoAsk(step); }
}, 500);
function listen() {
  var mine = ++run; touch(); hideAlert(); reset(); setState('listening');
  var said = QA[micIdx++ % QA.length].q;
  wait(2400).then(function () { if (mine === run && S.name === 'listening') { answer(said); } });
}
mic.addEventListener('click', function () { if (S.name === 'listening') { run++; setState('idle'); aEl.textContent = '불량률, 호기별 차이, 가장 큰 문제, 방금 검출된 모듈, 미조치 알람을 물어볼 수 있어요.'; } else { listen(); } });
$('form').addEventListener('submit', function (ev) { ev.preventDefault(); var v = input.value.trim(); if (v) { input.value = ''; answer(v); } });
/* ---------- 대형 화면 좌우 숫자 (DATA에서 바로 계산) ---------- */
function renderKPI() {
  var d = DATA, r = d.defects / d.inspected * 100, diff = r - d.target, a = d.alarms.slice().sort(function (x, y) { return y.min - x.min; });
  var L = [{ k: '오늘 불량률', v: r, dg: 2, u: '%', s: '목표 ' + f2(d.target) + '% · ' + (diff > 0 ? '+' : '') + f2(diff) + '%p', hot: diff > 0 },
           { k: '검사', v: d.inspected, dg: 0, u: '매', s: '불량 ' + num(d.defects) + '매' }];
  var R = [{ k: '미조치 알람', v: a.length, dg: 0, u: '건', s: a.length ? '최장 ' + a[0].min + '분 · ' + a[0].eq : '없음', hot: a.length && a[0].min >= 30 },
           { k: '오늘 조치 완료', v: d.closedAlarms, dg: 0, u: '건', s: '알람 ' + (d.closedAlarms + a.length) + '건 중' }];
  [[$('kpi-l'), L], [$('kpi-r'), R]].forEach(function (pair) {
    pair[0].textContent = '';
    pair[1].forEach(function (x, i) {
      var box = el('div', 'kp' + (x.hot ? ' hot' : '')), b = el('b'), n = el('span', 'kn', reduce ? (x.dg ? x.v.toFixed(x.dg) : num(x.v)) : (x.dg ? (0).toFixed(x.dg) : '0'));
      box.style.setProperty('--i', i); box.appendChild(el('span', 'kl', x.k)); b.appendChild(n); b.appendChild(el('span', 'ku', x.u)); box.appendChild(b); box.appendChild(el('span', 'ks', x.s)); pair[0].appendChild(box);
      if (!reduce) { var t0 = performance.now() + 300 + i * 150; (function tick(now) { var k = Math.max(0, Math.min(1, (now - t0) / 1100)), e = 1 - Math.pow(1 - k, 3), v = x.v * e; n.textContent = x.dg ? v.toFixed(x.dg) : num(v); if (k < 1) { requestAnimationFrame(tick); } })(performance.now()); }
    });
  });
}
renderKPI();
/* ---------- 시계 ---------- */
(function () { var c = $('clock'), W = '일월화수목금토'; function t() { var n = new Date(), p = function (v) { return (v < 10 ? '0' : '') + v; }; c.textContent = (n.getMonth() + 1) + '.' + p(n.getDate()) + ' (' + W[n.getDay()] + ') ' + p(n.getHours()) + ':' + p(n.getMinutes()); } t(); setInterval(t, 10000); })();
/* ---------- 전체화면 + 화면 꺼짐 방지 (현장 모니터용) ---------- */
(function () {
  var b = $('fs'), lock = null;
  function wake() { if (navigator.wakeLock && document.visibilityState === 'visible') { navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {}); } }
  function sync() { var on = !!document.fullscreenElement; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? '전체화면 끄기' : '전체화면'; }
  b.addEventListener('click', function () {
    if (document.fullscreenElement) { document.exitFullscreen().catch(function () {}); return; }
    var r = document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : null;
    if (r && r.then) { r.then(wake).catch(function () { b.textContent = '이 창에선 전체화면 불가'; setTimeout(sync, 2200); }); }
    wake();
  });
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('visibilitychange', function () { if (lock !== null && document.visibilityState === 'visible') { wake(); } });
})();
QA.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = x.q; b.addEventListener('click', function () { answer(x.q); }); $('chips').appendChild(b); });
(function () { var b = document.createElement('button'); b.type = 'button'; b.className = 'chip alert-chip'; b.textContent = '새 불량 알림 예시'; b.addEventListener('click', fireAlert); $('chips').appendChild(b); })();
