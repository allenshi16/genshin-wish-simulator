// Astral Wish Lab — shared pull simulator for character landing pages.
// Respects the documented character-event model: 0.6% base 5★, 90 hard pity,
// soft pity from 74, 50/50 with post-loss guarantee, 10-wish 4★ hard pity.
(function () {
  function simulatePulls(pity, budget, guaranteed) {
    var hard = 90, softStart = 74;
    var pulls = 0, fiveStars = 0, featured = 0, lost5050 = 0;
    var curPity = Math.max(0, Math.min(parseInt(pity, 10) || 0, hard));
    var isGuaranteed = !!guaranteed;
    var cap = 2000;
    while (pulls < budget && pulls < cap) {
      pulls++;
      curPity++;
      var rate = 0.006;
      if (curPity >= softStart) rate = Math.min(0.006 + (curPity - softStart + 1) * 0.06, 1);
      if (Math.random() < rate) {
        fiveStars++;
        if (isGuaranteed || Math.random() < 0.5) { featured++; isGuaranteed = false; }
        else { lost5050++; isGuaranteed = true; }
        curPity = 0;
      }
    }
    return { pulls: pulls, fiveStars: fiveStars, featured: featured, lost5050: lost5050, pityLeft: curPity };
  }
  window.runPullSimulation = function () {
    var pity = document.getElementById('sim-pity');
    var budget = document.getElementById('sim-budget');
    var guarantee = document.getElementById('sim-guarantee');
    var result = document.getElementById('sim-result');
    if (!pity || !budget || !result) return;
    var r = simulatePulls(pity.value, budget.value, guarantee.checked);
    result.textContent = 'Over ' + r.pulls + ' pulls: ' + r.fiveStars + ' five-stars (' +
      Math.round((r.fiveStars / r.pulls) * 1000) / 10 + '% rate), ' + r.featured +
      ' featured (' + Math.round((r.featured / r.pulls) * 1000) / 10 + '% featured rate), ' +
      r.lost5050 + ' lost 50/50s. Pity is now at ' + r.pityLeft + '.';
  };
})();
