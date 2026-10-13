// Countdown timer for banner pages
(function () {
  var el = document.getElementById('countdown');
  if (!el) return;
  var end = new Date(el.getAttribute('data-end')).getTime();
  var tzRow = document.getElementById('tzRow');
  var zones = [
    { label: 'UTC', tz: 'UTC' },
    { label: 'NA', tz: 'America/New_York' },
    { label: 'EU', tz: 'Europe/Berlin' },
    { label: 'Asia', tz: 'Asia/Shanghai' }
  ];
  if (tzRow) {
    zones.forEach(function (z) {
      var chip = document.createElement('span');
      chip.className = 'tz-chip';
      chip.textContent = z.label;
      chip.setAttribute('data-tz', z.tz);
      tzRow.appendChild(chip);
    });
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var now = Date.now();
    var diff = end - now;
    if (diff <= 0) { el.textContent = 'Banner has ended'; return; }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    el.textContent = d + 'd ' + pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
    if (tzRow) {
      var chips = tzRow.querySelectorAll('.tz-chip');
      var endDate = new Date(end);
      chips.forEach(function (chip) {
        var tz = chip.getAttribute('data-tz');
        try {
          var opts = { timeZone: tz, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
          chip.textContent = chip.textContent.split(' · ')[0] + ' · Ends ' + new Intl.DateTimeFormat('en', opts).format(endDate);
        } catch (e) {}
      });
    }
  }
  tick();
  setInterval(tick, 1000);
})();
