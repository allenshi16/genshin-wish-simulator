#!/usr/bin/env node
/**
 * generate-pity-guide.mjs
 * -----------------------------------------
 * Generates a data-driven guide page: "Genshin Pity System Math".
 * Pure math derived from the simulator's own wishMath (0.6% base, soft pity
 * from pull 74, hard pity 90, 50/50 + guarantee). The page includes:
 *   - an exact probability table (computed here, not hand-written)
 *   - a chart-friendly JSON dataset (drives the external chart JS)
 *   - FAQ + Article JSON-LD
 * CSP-safe: no inline JS (chart script is external), inline JSON-LD/style OK.
 *
 * Run: node scripts/generate-pity-guide.mjs   (idempotent)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'guides', 'pity-system')
const SITE = 'https://genshinwishsimulator.app'
mkdirSync(OUT_DIR, { recursive: true })

// --- exact math (mirrors src/wishMath.ts fiveStarRate) ---
const BASE = 0.006
const SOFT_START = 73            // pity index where rate starts climbing
const HARD_PITY = 90
const INCREASE = 0.06
function rateAt(pity) {
  if (pity >= HARD_PITY - 1) return 1
  if (pity < SOFT_START) return BASE
  return Math.min(1, BASE + (pity - SOFT_START + 1) * INCREASE)
}

// Probability of getting a 5★ by pull N (cumulative), computed exactly.
const cum = []
let miss = 1
for (let n = 1; n <= 90; n += 1) {
  miss *= 1 - rateAt(n - 1)
  cum.push({ pull: n, rate: +(rateAt(n - 1) * 100).toFixed(3), cumulative: +((1 - miss) * 100).toFixed(2) })
}
const p80 = cum.find((c) => c.pull === 80)?.cumulative
const p90 = 100

// Expected pulls (median = 50th percentile) via cumulative distribution
function percentile(pct) {
  for (const c of cum) if (c.cumulative >= pct) return c.pull
  return 90
}
const median = percentile(50)
const p75 = percentile(75)
const p90pull = percentile(90)

// Expected value of pulls for 1 five-star
let ev = 0
for (let n = 1; n <= 90; n += 1) {
  const pAtN = (n === 1 ? 1 : cum[n - 2].cumulative / 100)
  ev += n * (cum[n - 1].cumulative / 100 - pAtN)
}
const evPulls = ev.toFixed(1)

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="The exact math behind Genshin Impact's pity system: 0.6% base rate, soft pity from pull 74, hard pity at 90, 50/50 odds, and guarantee carry-over — with a computed probability table." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/guides/pity-system/" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="Genshin Pity System Math: Exact Soft Pity, Hard Pity & 50/50 Odds" />
    <meta property="og:description" content="Computed probability table for Genshin's wish system: 74 soft pity, 90 hard pity, 50/50 and guarantee — plus median pulls and expected value." />
    <meta property="og:url" content="${SITE}/guides/pity-system/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Genshin Pity System Math" />
    <title>Genshin Pity System Math: Soft Pity, Hard Pity &amp; 50/50 — Exact Odds</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Genshin Pity System Math: Soft Pity, Hard Pity & 50/50 Explained",
      "description": "Exact computed probabilities for the Genshin wish system: base 0.6%, soft pity from 74, hard pity 90, 50/50 and guarantee.",
      "url": "${SITE}/guides/pity-system/",
      "author": { "@type": "Organization", "name": "Astral Wish Lab" },
      "datePublished": "2026-08-16"
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "When does soft pity start in Genshin?",
          "acceptedAnswer": { "@type": "Answer", "text": "Soft pity begins at pull 74 on character banners. From pull 74 onward the 5-star rate climbs ~6% per pull until it reaches 100% at hard pity (pull 90)." } },
        { "@type": "Question", "name": "What is the exact chance of a 5-star by pull 80?",
          "acceptedAnswer": { "@type": "Answer", "text": "By pull 80 the cumulative probability of having gotten a 5-star is ${p80}%. By pull 90 it is 100% (hard pity)." } },
        { "@type": "Question", "name": "How does the 50/50 work?",
          "acceptedAnswer": { "@type": "Answer", "text": "Your first 5-star on a character banner has a 50% chance to be the featured character. If you lose the 50/50, the next 5-star is guaranteed to be the featured character." } },
        { "@type": "Question", "name": "What is the median number of pulls for a 5-star?",
          "acceptedAnswer": { "@type": "Answer", "text": "The median is ${median} pulls — half of all players get their 5-star by then. 75% of players have one by pull ${p75}, and 90% by pull ${p90pull}." } },
        { "@type": "Question", "name": "Does pity carry over between banners?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. Pity count and the 50/50 guarantee both carry over between character event banners. A guaranteed featured character stays guaranteed until used." } }
      ]
    }
    </script>
    <style>
      .guide{max-width:900px;margin:0 auto;padding:56px 24px 90px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1e293b;line-height:1.7}
      .guide h1{font-size:clamp(28px,4vw,44px);line-height:1.15;letter-spacing:-.03em;margin:10px 0 14px}
      .guide .kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6366f1;font-weight:600}
      .guide .lede{font-size:17px;color:#475569;max-width:660px;margin-bottom:34px}
      .guide h2{font-size:24px;margin:44px 0 14px;letter-spacing:-.02em}
      .guide p{font-size:15px;color:#334155;max-width:700px}
      .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:26px 0}
      .stat{border:1px solid #e2e8f0;border-radius:12px;padding:18px;background:#fff}
      .stat b{display:block;font-size:26px;color:#6366f1;letter-spacing:-.02em}
      .stat span{font-size:12px;color:#64748b}
      .table-wrap{overflow-x:auto;border:1px solid #e2e8f0;border-radius:12px;margin:22px 0}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#f8fafc;text-align:left;padding:10px 14px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0}
      td{padding:9px 14px;border-bottom:1px solid #f1f5f9}
      tr:nth-child(even) td{background:#fafbfc}
      #pityChart{width:100%;height:320px;margin:20px 0}
      .chart-note{font-size:12px;color:#94a3b8}
      .faq details{border-bottom:1px solid #e2e8f0;padding:16px 0}
      .faq summary{cursor:pointer;font-weight:600;font-size:15px}
      .faq details p{font-size:14px;color:#475569;margin:12px 0 0;max-width:640px}
      .back{display:inline-block;margin-bottom:22px;font-size:13px;color:#6366f1;text-decoration:none}
      a{color:#6366f1}
    </style>
  </head>
  <body>
    <main class="guide">
      <a class="back" href="/">← Back to Wish Simulator</a>
      <div class="kicker">Data · Wish Mechanics</div>
      <h1>Genshin Pity System Math: Exact Odds, Soft &amp; Hard Pity</h1>
      <p class="lede">Every number below is computed from the standard character-banner model — 0.6% base rate, soft pity from pull 74, hard pity at pull 90, and the 50/50 with guarantee. No hand-waving, no "about" figures.</p>

      <div class="stat-grid">
        <div class="stat"><b>${median}</b><span>Median pulls to a 5★</span></div>
        <div class="stat"><b>${p80}%</b><span>Chance by pull 80</span></div>
        <div class="stat"><b>90</b><span>Hard pity (guaranteed)</span></div>
        <div class="stat"><b>${evPulls}</b><span>Expected pulls per 5★</span></div>
      </div>

      <h2>The soft pity ramp</h2>
      <p>Before pull 74, every pull has a flat 0.6% chance. From pull 74 onward, the rate increases by roughly 6% per pull — pull 74 is ~6.6%, pull 80 is ~42.6%, and by pull 90 it is 100%. That ramp is why most 5-stars arrive between pulls 74 and 82, and why "pity at 90" is technically correct but practically rare.</p>

      <h2>Cumulative probability table</h2>
      <p>Here is the exact computed chance of having obtained a 5-star by each milestone (cumulative, assuming you start at 0 pity):</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Pull #</th><th>Rate this pull</th><th>Cumulative chance</th></tr></thead>
        <tbody>
${cum.filter((c) => c.pull <= 10 || (c.pull >= 70 && c.pull <= 90)).map((c) =>
  `          <tr><td>${c.pull}</td><td>${c.rate}%</td><td>${c.cumulative}%</td></tr>`).join('\n')}
        </tbody>
      </table></div>
      <p class="chart-note">Full table: pulls 1-90. The jump between pulls 74 and 90 is the soft pity ramp.</p>

      <div class="chart-wrap"><canvas id="pityChart"></canvas><p class="chart-note">Cumulative 5★ probability by pull (computed).</p></div>

      <h2>50/50 and guarantee</h2>
      <p>Your first 5-star on a character banner is a 50/50: half the time it's the featured character, half the time a standard character. If you lose, the <strong>next 5-star is guaranteed</strong> to be the featured character. Both pity and the guarantee carry over between banners. Worst case for one featured character is therefore 180 pulls (90 hard pity + 90 guaranteed).</p>

      <h2>Try the math live</h2>
      <p>You can simulate these odds yourself with the <a href="/">free wish simulator</a> — it implements this exact model, tracks your 50/50 state, and shows your live pity. There are also <a href="/characters/venti/">per-character pages</a> with the same simulator embedded.</p>

      <section class="faq">
        <h2>Frequently asked questions</h2>
        <details open><summary>When does soft pity start in Genshin?</summary><p>Soft pity begins at pull 74 on character banners. From pull 74 onward the 5-star rate climbs ~6% per pull until it reaches 100% at hard pity (pull 90).</p></details>
        <details><summary>What is the exact chance of a 5-star by pull 80?</summary><p>By pull 80 the cumulative probability of having gotten a 5-star is ${p80}%. By pull 90 it is 100% (hard pity).</p></details>
        <details><summary>How does the 50/50 work?</summary><p>Your first 5-star on a character banner has a 50% chance to be the featured character. If you lose the 50/50, the next 5-star is guaranteed to be the featured character.</p></details>
        <details><summary>What is the median number of pulls for a 5-star?</summary><p>The median is ${median} pulls — half of all players get their 5-star by then. 75% of players have one by pull ${p75}, and 90% by pull ${p90pull}.</p></details>
        <details><summary>Does pity carry over between banners?</summary><p>Yes. Pity count and the 50/50 guarantee both carry over between character event banners. A guaranteed featured character stays guaranteed until used.</p></details>
      </section>
    </main>
    <script type="application/json" id="pityData">${JSON.stringify(cum)}</script>
    <script src="/guides/pity-system/chart.js"></script>
  </body>
</html>
`

// --- external chart JS (CSP-safe: script-src 'self') ---
const chartJs = `(function () {
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
`

writeFileSync(join(OUT_DIR, 'index.html'), html)
writeFileSync(join(OUT_DIR, 'chart.js'), chartJs)

// --- update sitemap (idempotent: remove old guide entry, re-add) ---
const SITEMAP = join(ROOT, 'public', 'sitemap.xml')
let sitemap = readFileSync(SITEMAP, 'utf8')
sitemap = sitemap.replace(/  <url>\n    <loc>%VITE_SITE_URL%\/guides\/pity-system\/<\/loc>[\s\S]*?<\/url>\n/g, '')
const guideEntry = `  <url>\n    <loc>%VITE_SITE_URL%guides/pity-system/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`
const idx = sitemap.indexOf('</urlset>')
sitemap = sitemap.slice(0, idx) + guideEntry + sitemap.slice(idx)
writeFileSync(SITEMAP, sitemap, 'utf8')

console.log(`Generated pity-system guide at ${OUT_DIR}`)
console.log(`Median ${median} pulls · P80 ${p80}% · EV ${evPulls} pulls · P75 ${p75} · P90 ${p90pull}`)
