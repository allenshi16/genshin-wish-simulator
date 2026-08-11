#!/usr/bin/env node
/**
 * generate-character-pages.mjs
 * -----------------------------------------
 * Generates SEO landing pages for real Genshin Impact characters into
 * `public/characters/<slug>/index.html` plus a shared simulator JS at
 * `public/characters/simulator.js`.
 *
 * Design rules (do not regress):
 *  - CSP in public/_headers is `script-src 'self' '<sha256>'` — NO inline JS.
 *    The simulator must live in an external file (script-src 'self' allows it).
 *  - Inline JSON-LD is fine: crawlers parse raw HTML and are not CSP-bound.
 *  - style-src allows 'unsafe-inline', so inline <style> is fine.
 *  - Text + factual data only. No official artwork, UI, logos, or copied assets.
 *
 * Run:  node scripts/generate-character-pages.mjs
 * Re-run whenever scripts/character-data.json changes.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = join(ROOT, 'scripts', 'character-data.json')
const OUT_DIR = join(ROOT, 'public', 'characters')
const CANONICAL_BASE = 'https://genshinwishsimulator.app'

const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
const characters = data.characters

const SIMULATOR_JS = `// Astral Wish Lab — shared pull simulator for character landing pages.
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
`

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function pageHtml(c, index, all) {
  const t = c.name
  const slug = c.slug
  const stars = '★'.repeat(c.rarity)
  const title = `${t} Wish Simulator & Pity Calculator`
  const shortName = t.split(' ').pop()
  const desc = `Test pulls for ${t} (${c.element}, ${c.weapon}) with this free Genshin wish simulator. Check ${shortName}'s pity, 50/50 odds, soft and hard pity, then plan your primogems.`

  const prev = index > 0 ? all[index - 1] : null
  const next = index < all.length - 1 ? all[index + 1] : null
  const others = all.filter((o) => o.slug !== slug)

  const faq = [
    [`How many pulls until hard pity for ${t}?`, `Hard pity is 90 pulls. If you haven't pulled a five-star by your 89th wish, the 90th is guaranteed to be a five-star. Soft pity starts around pull 74, where the rate rises sharply.`],
    [`Is ${t} guaranteed after losing the 50/50?`, `Yes. If you lose the 50/50 on a featured character banner, your next five-star is guaranteed to be the featured character, and the guarantee carries into the next banner.`],
    [`What are the odds of pulling ${t}?`, `The base five-star rate is 0.6%, rising from pull 74 onward. When a five-star drops, you have a 50% chance it is the featured character (${t}) and a 50% chance of a standard five-star.`],
    [`Is ${t} a ${c.role.toLowerCase()}?`, `${t} is a ${c.rarity}-star ${c.element} ${c.weapon} user that plays a ${c.role} role. Whether they are worth pulling depends on your roster and team archetypes.`],
  ]

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
  const appLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${t} Wish Simulator`,
    url: `${CANONICAL_BASE}/characters/${slug}/`,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    description: desc,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  const nav = [
    prev ? `<a href="/characters/${prev.slug}/">← ${esc(prev.name)}</a>` : '<span></span>',
    next ? `<a href="/characters/${next.slug}/">${esc(next.name)} →</a>` : '<span></span>',
  ].join('')

  const othersList = others
    .map((o) => `<li><a href="/characters/${o.slug}/">${esc(o.name)} wish simulator</a></li>`)
    .join('')

  const faqList = faq
    .map(([q, a]) => `<li><h3>${esc(q)}</h3><p>${esc(a)}</p></li>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${CANONICAL_BASE}/characters/${slug}/">
<meta name="robots" content="index,follow">
<script type="application/ld+json">${JSON.stringify(appLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<style>
:root{--bg:#0a0f1e;--card:#131a2f;--line:#26304f;--text:#e8ecf7;--dim:#9aa4c4;--accent:#e8a0bf}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}
.wrap{max-width:780px;margin:0 auto;padding:28px 20px}
a{color:#ffd6e8}h1{font-size:1.85rem;line-height:1.25}.star{color:#ffd166;letter-spacing:2px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin:18px 0}
.card h2{margin-top:0}
table{width:100%;border-collapse:collapse}td,th{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left}
input[type=number]{width:90px;padding:6px;background:#0b1020;color:#fff;border:1px solid #3a4668;border-radius:6px}
button{padding:9px 16px;background:var(--accent);color:#1a2035;font-weight:700;border:0;border-radius:8px;cursor:pointer;font-size:1rem}
#sim-result{margin-top:12px;font-weight:600;color:#aef0c9}
.nav{display:flex;justify-content:space-between;margin-top:30px;font-weight:600}
ul.faq{list-style:none;padding:0}ul.faq li{border-top:1px solid var(--line);padding:10px 0}
footer{margin-top:34px;color:var(--dim);font-size:.85rem}
</style>
</head>
<body>
<div class="wrap">
<p><a href="/">← Back to Astral Wish Lab — Genshin Wish Simulator</a></p>
<h1>${esc(t)} Wish Simulator <span class="star">${stars}</span></h1>
<p>Test your luck pulling for <strong>${esc(t)}</strong> — a ${c.rarity}-star <strong>${esc(c.element)}</strong> ${esc(c.weapon)} user that plays a <strong>${esc(c.role)}</strong> role. Use the simulator below to check pity, 50/50 odds, soft and hard pity, and your primogem budget before you spend anything in the real game.</p>

<div class="card">
<h2>${esc(t)} pull simulator</h2>
<p>Set your current pity (0–90), how many pulls to simulate, and whether you're on a guaranteed pity. The simulation respects the real character-event model: 0.6% base five-star rate, soft pity from pull 74, hard pity at 90, and the 50/50 with post-loss guarantee.</p>
<label>Current pity: <input type="number" id="sim-pity" value="0" min="0" max="90"></label><br>
<label>Pulls to simulate: <input type="number" id="sim-budget" value="100" min="1" max="2000"></label><br>
<label><input type="checkbox" id="sim-guarantee"> I'm on guaranteed pity</label><br><br>
<button type="button" onclick="runPullSimulation()">Simulate pulls</button>
<div id="sim-result">Enter your numbers and hit Simulate pulls.</div>
</div>

<div class="card">
<h2>${esc(t)} at a glance</h2>
<table>
<tr><th>Rarity</th><td>${stars} (${c.rarity}-star)</td></tr>
<tr><th>Element</th><td>${esc(c.element)}</td></tr>
<tr><th>Weapon</th><td>${esc(c.weapon)}</td></tr>
<tr><th>Role</th><td>${esc(c.role)}</td></tr>
</table>
</div>

<div class="card">
<h2>How ${esc(t)}'s banner pity works</h2>
<p>Every featured character banner uses the same wish mechanics:</p>
<ul>
<li><strong>Hard pity:</strong> a five-star is guaranteed within 90 pulls.</li>
<li><strong>Soft pity:</strong> the five-star rate rises sharply from pull 74.</li>
<li><strong>50/50:</strong> when a five-star drops, it's a 50% chance to be the featured character (${esc(t)}).</li>
<li><strong>Guarantee carries over:</strong> pity and the guarantee carry into the next featured banner, so pulls now still count toward a future ${esc(t)} banner.</li>
</ul>
</div>

<div class="card">
<h2>Frequently asked questions about pulling for ${esc(t)}</h2>
<ul class="faq">${faqList}</ul>
</div>

<div class="card">
<h2>More wish simulators</h2>
<ul>${othersList}</ul>
</div>

<div class="nav">${nav}</div>
<footer>Astral Wish Lab is an unofficial fan tool and is not affiliated with or endorsed by HoYoverse. Character names are used for identification only; all original content and tools are ours.</footer>
</div>
<script src="/characters/simulator.js" defer></script>
</body>
</html>
`
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'simulator.js'), SIMULATOR_JS, 'utf8')
  characters.forEach((c, i) => {
    const dir = join(OUT_DIR, c.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), pageHtml(c, i, characters), 'utf8')
  })

  // Regenerate sitemap.xml so it always stays in sync with character-data.json.
  const urlEntries = characters
    .map((c) => `  <url>\n    <loc>%VITE_SITE_URL%characters/${c.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`)
    .join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>%VITE_SITE_URL%</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n${urlEntries}\n</urlset>\n`
  writeFileSync(join(ROOT, 'public', 'sitemap.xml'), sitemap, 'utf8')

  const total = characters.reduce((sum, c) => sum + Buffer.byteLength(pageHtml(c, characters.indexOf(c), characters)), 0)
  console.log(`Generated ${characters.length} character pages + simulator.js + sitemap.xml`)
  console.log(`Output: ${OUT_DIR}`)
  console.log(`Total page bytes: ${total.toLocaleString()}`)
}

main()