/* 61-sky.js · 별 배경 */
/* ---------- 별 배경: 아주 느리게 흐르고 반짝임. 가끔 별똥별 하나 ---------- */
var sky = $('sky'), sg = sky.getContext('2d'), stars = [], SW = 0, SH = 0, sdpr = 1, meteor = null, nextMeteor = 14;
function makeStars() {
  var r = sky.getBoundingClientRect(); sdpr = Math.min(2, window.devicePixelRatio || 1); SW = r.width; SH = r.height;
  sky.width = Math.round(SW * sdpr); sky.height = Math.round(SH * sdpr);
  var n = Math.round(SW * SH / 2600); stars = [];
  for (var i = 0; i < n; i++) {
    var z = Math.random(), tint = Math.random();
    stars.push({ x: Math.random() * SW, y: Math.random() * SH, r: 0.35 + z * z * 1.2, a: 0.18 + 0.6 * z * Math.random(), v: 1.5 + 6 * z, tw: 0.6 + Math.random() * 2.2, ph: Math.random() * 6.28,
      c: tint < 0.12 ? [255, 214, 170] : tint < 0.45 ? [190, 220, 255] : [235, 242, 250] });
  }
  if (reduce) { drawSky(performance.now(), 0); }
}
function drawSky(now, dt) {
  var t = now / 1000; sg.setTransform(sdpr, 0, 0, sdpr, 0, 0); sg.clearRect(0, 0, SW, SH);
  for (var i = 0; i < stars.length; i++) {
    var st = stars[i]; st.x -= st.v * dt; if (st.x < -2) { st.x = SW + 2; st.y = Math.random() * SH; }
    var a = st.a * (0.65 + 0.35 * Math.sin(t * st.tw + st.ph));
    sg.fillStyle = 'rgba(' + st.c[0] + ',' + st.c[1] + ',' + st.c[2] + ',' + a.toFixed(3) + ')';
    sg.beginPath(); sg.arc(st.x, st.y, st.r, 0, 6.2832); sg.fill();
  }
  if (reduce) { return; }
  nextMeteor -= dt;
  if (!meteor && nextMeteor <= 0) { meteor = { x: SW * (0.35 + Math.random() * 0.6), y: SH * Math.random() * 0.35, life: 0 }; nextMeteor = 18 + Math.random() * 14; }
  if (meteor) {
    meteor.life += dt; var k = meteor.life / 0.9, hx = meteor.x - 420 * meteor.life, hy = meteor.y + 160 * meteor.life;
    if (k >= 1) { meteor = null; } else {
      var tl = sg.createLinearGradient(hx, hy, hx + 90, hy - 34); tl.addColorStop(0, 'rgba(235,245,255,' + (0.7 * Math.sin(k * 3.1416)).toFixed(3) + ')'); tl.addColorStop(1, 'rgba(235,245,255,0)');
      sg.strokeStyle = tl; sg.lineWidth = 1.3; sg.beginPath(); sg.moveTo(hx, hy); sg.lineTo(hx + 90, hy - 34); sg.stroke();
    }
  }
}
new ResizeObserver(makeStars).observe(sky); makeStars();
