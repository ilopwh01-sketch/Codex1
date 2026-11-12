/* 01-util.js · 공통 도구: DOM 찾기, 숫자 표기, 통계 계산(정규분포, F분포, 분산분석) */
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function (id) { return document.getElementById(id); };
var f2 = function (v) { return v.toFixed(2); }, f1 = function (v) { return v.toFixed(1); }, num = function (v) { return Math.round(v).toLocaleString('ko-KR'); };
function ncdf(z) { var t = 1 / (1 + 0.3275911 * z / Math.SQRT2), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2); return 0.5 * (1 + y); }
/* 분산분석(ANOVA)용: F분포 꼬리 확률 */
function lgam(x) { var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5], y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); var s = 1.000000000190015; for (var j = 0; j < 6; j++) { s += c[j] / ++y; } return -t + Math.log(2.5066282746310005 * s / x); }
function betacf(a, b, x) { var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap, T = 1e-30; if (Math.abs(d) < T) { d = T; } d = 1 / d; var h = d;
  for (var m = 1; m <= 200; m++) { var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < T) { d = T; } c = 1 + aa / c; if (Math.abs(c) < T) { c = T; } d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < T) { d = T; } c = 1 + aa / c; if (Math.abs(c) < T) { c = T; } d = 1 / d; var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-7) { break; } } return h; }
function ibeta(x, a, b) { if (x <= 0) { return 0; } if (x >= 1) { return 1; } var bt = Math.exp(lgam(a + b) - lgam(a) - lgam(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
function fsf(F, d1, d2) { return 1 - ibeta(d1 * F / (d1 * F + d2), d1 / 2, d2 / 2); }
function fpdf(x, d1, d2) { return Math.exp((d1 / 2) * Math.log(d1 * x) + (d2 / 2) * Math.log(d2) - ((d1 + d2) / 2) * Math.log(d1 * x + d2) - Math.log(x) - (lgam(d1 / 2) + lgam(d2 / 2) - lgam((d1 + d2) / 2))); }
function mean(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
function anova(groups) {
  var all = [].concat.apply([], groups), gm = mean(all), k = groups.length, n = all.length;
  var ssb = groups.reduce(function (s, g) { return s + g.length * Math.pow(mean(g) - gm, 2); }, 0), ssw = groups.reduce(function (s, g) { var m = mean(g); return s + g.reduce(function (t, v) { return t + (v - m) * (v - m); }, 0); }, 0);
  var d1 = k - 1, d2 = n - k, msb = ssb / d1, msw = ssw / d2, F = msb / msw; return { gm: gm, d1: d1, d2: d2, msb: msb, msw: msw, F: F, p: fsf(F, d1, d2) };
}
var pTxt = function (p) { return p < 0.001 ? '< 0.001' : p.toFixed(3); };
function hmTxt(h) { var H = Math.floor(h), M = Math.round((h - H) * 60); return H + '시' + (M ? ' ' + M + '분' : ''); }
function hmClock(h) { var H = Math.floor(h), M = Math.round((h - H) * 60); return (H < 10 ? '0' : '') + H + ':' + (M < 10 ? '0' : '') + M; }
