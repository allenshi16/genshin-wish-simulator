// Countdown timer for /countdown/ page
(function () {
  var el = document.getElementById('countdown');
  var bar = document.getElementById('progressBar');
  var sub = document.getElementById('countdownSub');
  var grid = document.getElementById('tzGrid');
  if (!el) return;
  var end = new Date(el.getAttribute('data-end')).getTime();
  var start = new Date(el.getAttribute('data-start')).getTime();
  var zones = [
    { name: 'North America', tz: 'America/New_York' },
    { name: 'Europe', tz: 'Europe/Berlin' },
    { name: 'Asia (CN)', tz: 'Asia/Shanghai' },
    { name: 'UTC', tz: 'UTC' }
  ];
  if (grid) {
    zones.forEach(function (z) {
      var card = document.createElement('div');
      card.className = 'tz-card';
      card.innerHTML = '<div class="tz-name">' + z.name + '</div><div class="tz-time" data-tz="' + z.tz + '">—</div><div class="tz-date" data-tz="' + z.tz + '"></div>';
      grid.appendChild(card);
    });
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var now = Date.now();
    var diff = end - now;
    if (diff <= 0) { el.textContent = 'Banner has ended'; if (bar) bar.style.width = '100%'; return; }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    el.textContent = d + 'd ' + pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
    if (bar) {
      var total = end - start;
      var elapsed = now - start;
      bar.style.width = Math.min(100, Math.max(0, (elapsed / total) * 100)).toFixed(2) + '%';
    }
    if (sub) {
      var endDate = new Date(end);
      sub.textContent = 'Ends ' + endDate.toUTCString().replace('GMT', 'UTC');
    }
    if (grid) {
      var endDate = new Date(end);
      var timeEls = grid.querySelectorAll('.tz-time');
      var dateEls = grid.querySelectorAll('.tz-date');
      timeEls.forEach(function (te) {
        var tz = te.getAttribute('data-tz');
        try {
          te.textContent = new Intl.DateTimeFormat('en', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(endDate);
        } catch (e) {}
      });
      dateEls.forEach(function (de) {
        var tz = de.getAttribute('data-tz');
        try {
          de.textContent = new Intl.DateTimeFormat('en', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(endDate);
        } catch (e) {}
      });
    }
  }
  tick();
  setInterval(tick, 1000);
})();
