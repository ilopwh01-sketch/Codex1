/* 30-dom.js · 화면 상태와 자주 쓰는 요소 */
/* ---------- 상태 ---------- */
var S = { name: 'idle', level: 0.12, target: 0.12, spin: 0.25, spinT: 0.25, alert: 0, alertT: 0, t0: performance.now() }, run = 0, micIdx = 0;
var stateEl = $('state'), qEl = $('q'), aEl = $('a'), factsEl = $('facts'), mic = $('mic'), input = $('ask');

var app = document.querySelector('.app'), panel = $('panel'), pBody = $('p-body'), pKick = $('p-kick'), pTitle = $('p-title'), more = $('more'), lastPanel = null;
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text != null) { e.textContent = text; } return e; }
