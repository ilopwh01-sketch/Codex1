/* 90-boot.js · 시작: 그리기 반복 시작. 항상 마지막에 읽힌다 */
var skyLast = 0;
function loop(now) { drawSky(now, skyLast ? Math.min(0.05, (now - skyLast) / 1000) : 0); skyLast = now; draw(now); requestAnimationFrame(loop); }
new ResizeObserver(resize).observe(cv); resize();
if (reduce) { draw(performance.now()); } else { requestAnimationFrame(loop); }
