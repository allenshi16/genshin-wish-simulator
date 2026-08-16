(function () {
  var canvas = document.getElementById('pityChart');
  if (!canvas) return;
  var data;
  try { data = JSON.parse(document.getElementById('pityData').textContent); }
  catch (e) { return; }
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  function size() {
    var w = canvas.clientWidth || 600;
    canvas.width = w * dpr; canvas.height = 320 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(w, 320);
  }
  function draw(W, H) {
    ctx.clearRect(0, 0, W, H);
    var pad = { l: 44, r: 14, t: 16, b: 30 };
    var maxY = 100, maxX = 90;
    var x = function (p) { return pad.l + (p / maxX) * (W - pad.l - pad.r); };
    var y = function (v) { return H - pad.b - (v / maxY) * (H - pad.t - pad.b); };
    ctx.strokeStyle = '#e2e8f0'; ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif';
    for (var g = 0; g <= 100; g += 25) {
      ctx.beginPath(); ctx.moveTo(pad.l, y(g)); ctx.lineTo(W - pad.r, y(g)); ctx.stroke();
      ctx.fillText(g + '%', 6, y(g) + 4);
    }
    ctx.beginPath();
    data.forEach(function (d, i) {
      var px = x(d.pull), py = y(d.cumulative);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('pull', W - pad.r - 28, H - 10);
    ctx.fillText('74', x(74) - 6, y(0) + 14);
    ctx.fillText('90', x(90) - 8, y(0) + 14);
  }
  window.addEventListener('resize', size);
  size();
})();
