/* 51-data-source.js · DB 연결 자리
   CONFIG.dataUrl(또는 주소 뒤 ?data=)에서 JSON을 읽어 DATA를 바꾼다. 실패하거나 모양이 틀리면 예시 데이터를 그대로 두고
   오른쪽 위 배지에 이유를 표시한다. 화면 코드는 DATA만 읽으므로 DB 연결은 이 파일과 서버만 고치면 된다. */
var DATA_URL = (function () { try { return new URLSearchParams(location.search).get('data') || CONFIG.dataUrl; } catch (e) { return CONFIG.dataUrl; } })();
function setDataBadge(text, detail, bad) { var b = $('data-badge'); if (!b) { return; } b.textContent = text; b.title = detail || ''; b.classList.toggle('bad', !!bad); }
function applyData(next) {
  var errs = validateData(next);
  if (errs.length) { setDataBadge('데이터 형식 오류 ' + errs.length + '건', '틀린 곳: ' + errs.slice(0, 8).join(', '), true); if (window.console) { console.warn('[QVIS] 데이터 형식 오류', errs); } return false; }
  Object.keys(DATA).forEach(function (k) { delete DATA[k]; });
  Object.keys(next).forEach(function (k) { DATA[k] = next[k]; });
  ALERTS = DATA.events.map(RULES.event); renderKPI();
  return true;
}
function pullData() {
  if (!DATA_URL) { return Promise.resolve(false); }
  return fetch(DATA_URL, { cache: 'no-store' }).then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.json(); })
    .then(function (j) { var ok = applyData(j); if (ok) { var n = new Date(); setDataBadge('DB 연결 · ' + (n.getHours() < 10 ? '0' : '') + n.getHours() + ':' + (n.getMinutes() < 10 ? '0' : '') + n.getMinutes(), DATA_URL, false); } return ok; })
    .catch(function (err) { setDataBadge('DB 연결 실패 · 예시 데이터', String(err && err.message || err) + ' · ' + DATA_URL, true); return false; });
}
pullData(); if (DATA_URL) { setInterval(pullData, CONFIG.refreshSec * 1000); }
