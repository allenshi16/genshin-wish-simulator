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
// AdSense publisher id (e.g. ca-pub-1234567890123456). Empty = ads disabled.
const ADSENSE_CLIENT = (process.env.ADSENSE_CLIENT || '').trim()
// GA4 measurement id (e.g. G-XXXXXXXXXX). Empty = analytics disabled.
const GA_ID = 'G-HGMKQ47FZK'

const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
const characters = data.characters

const HISTORY_FILE = join(ROOT, 'scripts', 'banner-history.json')
let bannerHistory = { versions: [] }
try { bannerHistory = JSON.parse(readFileSync(HISTORY_FILE, 'utf8')) } catch {}

// Same-version banner-mates first, then same-element characters, capped at 5.
function relatedFor(c, all) {
  const byName = new Map(all.map((o) => [o.name, o]))
  const picked = []
  for (const v of bannerHistory.versions) {
    if (!v.phases.some((p) => p.character === c.name)) continue
    for (const p of v.phases) {
      const o = byName.get(p.character)
      if (o && o.slug !== c.slug && !picked.includes(o)) picked.push(o)
    }
  }
  for (const o of all) {
    if (picked.length >= 5) break
    if (o.slug !== c.slug && o.element === c.element && !picked.includes(o)) picked.push(o)
  }
  return picked.slice(0, 5)
}

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
    [`How many pulls until hard pity for ${t}?`, `Hard pity is 90 pulls. If you haven't pulled a five-star by your 89th wish, the 90th is guaranteed to be a five-star. <a href="/guides/pity-system/">Soft pity</a> starts around pull 74, where the rate rises sharply — see the full probability table in our pity guide.`],
    [`Is ${t} guaranteed after losing the 50/50?`, `Yes. If you lose the 50/50 on a featured character banner, your next five-star is guaranteed to be the featured character, and the guarantee carries into the next banner. The <a href="/guides/pity-system/">pity system guide</a> breaks down the full math.`],
    [`What are the odds of pulling ${t}?`, `The base five-star rate is 0.6%, rising from pull 74 onward. When a five-star drops, you have a 50% chance it is the featured character (${t}) and a 50% chance of a standard five-star. Our <a href="/guides/pity-system/">soft pity calculator</a> shows the exact cumulative odds.`],
    [`Is ${t} a ${c.role.toLowerCase()}?`, `${t} is a ${c.rarity}-star ${c.element} ${c.weapon} user that plays a ${c.role} role. Whether they are worth pulling depends on your roster and team archetypes. Check our <a href="/guides/primogem-planning/">primogem planning guide</a> to budget your pulls.`],
  ]

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]*>/g, '') } })),
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
    author: {
      '@type': 'Organization',
      name: 'Astral Wish Lab',
      url: CANONICAL_BASE,
    },
    datePublished: '2026-08-20',
    dateModified: '2026-11-13',
  }

  const nav = [
    prev ? `<a href="/characters/${prev.slug}/">← ${esc(prev.name)}</a>` : '<span></span>',
    next ? `<a href="/characters/${next.slug}/">${esc(next.name)} →</a>` : '<span></span>',
  ].join('')

  const othersList = others
    .map((o) => `<li><a href="/characters/${o.slug}/">${esc(o.name)} wish simulator</a></li>`)
    .join('')

  const related = relatedFor(c, all)
  const relatedList = related
    .map((o) => `<li><a href="/characters/${o.slug}/">${esc(o.name)} wish simulator</a> — ${esc(o.element)} ${esc(o.weapon)}, ${esc(o.role)}</li>`)
    .join('')

  const faqList = faq
    .map(([q, a]) => `<li><h3>${esc(q)}</h3><p>${a}</p></li>`)
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
<meta name="adsense-client" content="${ADSENSE_CLIENT}">
<meta name="ga-measurement" content="${GA_ID}">
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
.ad-slot{margin-top:18px;min-height:0}.ad-slot:empty{display:none}
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
<h2>Related ${esc(c.element)} characters &amp; banner-mates</h2>
<p>Planning around ${esc(t)}? These characters share ${esc(t)}'s element or ran in the same version banner — useful for team planning and deciding where your primogems go next:</p>
<ul>${relatedList}</ul>
<p>See the <a href="/characters/">full character index</a> or check the <a href="/next-banner/">next banner countdown</a> before you spend.</p>
</div>

<div class="card">
<h2>More wish simulators</h2>
<ul>${othersList}</ul>
</div>

<div class="card">
<h2>Learn the pull math</h2>
<ul><li><a href="/guides/pity-system/">Pity system math: exact soft pity, hard pity &amp; 50/50 odds</a></li><li><a href="/guides/primogem-planning/">How many primogems per patch? F2P, Welkin &amp; BP breakdown</a></li></ul>
</div>

<div class="nav">${nav}</div>
<div class="ad-slot" aria-hidden="true"></div>
<footer>
<p><a href="/">Wish Simulator</a> · <a href="/guides/pity-system/">Pity Calculator</a> · <a href="/next-banner/">Next Banner</a> · <a href="/characters/">All Characters</a></p>
<p>Astral Wish Lab is an unofficial fan tool and is not affiliated with or endorsed by HoYoverse. Character names are used for identification only; all original content and tools are ours. <a href="/privacy/">Privacy</a></p>
</footer>
</div>
<script src="/characters/simulator.js" defer></script>
<script src="/ads.js" defer></script>
<script src="/ga.js" defer></script>
</body>
</html>
`
}

function indexHtml(all) {
  const elementOrder = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro']
  const groups = elementOrder
    .map((el) => ({ el, chars: all.filter((c) => c.element === el) }))
    .filter((g) => g.chars.length > 0)

  const groupHtml = groups.map((g) => `
<div class="card">
<h2>${esc(g.el)} characters (${g.chars.length})</h2>
<ul class="char-grid">
${g.chars.map((c) => `<li><a href="/characters/${c.slug}/"><b>${esc(c.name)}</b><span>${'★'.repeat(c.rarity)} · ${esc(c.weapon)} · ${esc(c.role)}</span></a></li>`).join('\n')}
</ul>
</div>`).join('\n')

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Genshin Character Wish Simulators',
    url: `${CANONICAL_BASE}/characters/`,
    description: `Free wish simulator and pity calculator for all ${all.length} Genshin Impact 5-star characters, grouped by element.`,
    author: { '@type': 'Organization', name: 'Astral Wish Lab', url: CANONICAL_BASE },
    datePublished: '2026-08-20',
    dateModified: '2026-11-13',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: all.length,
      itemListElement: all.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${CANONICAL_BASE}/characters/${c.slug}/`,
        name: `${c.name} Wish Simulator`,
      })),
    },
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Genshin Character Wish Simulators — All ${all.length} Characters</title>
<meta name="description" content="Free wish simulator and pity calculator for every Genshin Impact 5-star character — all ${all.length} characters grouped by element. Test pulls, 50/50 odds and soft pity before you spend primogems.">
<link rel="canonical" href="${CANONICAL_BASE}/characters/">
<meta name="robots" content="index,follow">
<meta name="adsense-client" content="${ADSENSE_CLIENT}">
<meta name="ga-measurement" content="${GA_ID}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="website">
<meta property="og:title" content="Genshin Character Wish Simulators — All ${all.length} Characters">
<meta property="og:description" content="Test pulls for any Genshin 5-star: pity, 50/50 odds and primogem budget. All ${all.length} character simulators in one index.">
<meta property="og:url" content="${CANONICAL_BASE}/characters/">
<meta property="og:image" content="${CANONICAL_BASE}/og-card.svg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Genshin Character Wish Simulators — All ${all.length} Characters">
<script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
<style>
:root{--bg:#0a0f1e;--card:#131a2f;--line:#26304f;--text:#e8ecf7;--dim:#9aa4c4;--accent:#e8a0bf;--gold:#ffd166;--cyan:#83e4df}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}
.wrap{max-width:900px;margin:0 auto;padding:28px 20px}
a{color:#ffd6e8}h1{font-size:1.85rem;line-height:1.25;margin:0 0 8px}
h2{font-size:1.25rem;margin:0 0 12px;color:var(--cyan)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin:18px 0}
.char-grid{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.char-grid a{display:block;padding:10px 12px;border:1px solid var(--line);border-radius:8px;text-decoration:none}
.char-grid a:hover{border-color:var(--accent)}
.char-grid b{display:block;color:var(--text);font-size:14px}
.char-grid span{font-size:12px;color:var(--dim)}
.sim-cta{display:inline-block;margin-top:14px;padding:10px 20px;background:var(--accent);color:#1a2035;font-weight:700;border-radius:8px;text-decoration:none}
footer{margin-top:34px;color:var(--dim);font-size:.85rem}
.ad-slot{margin-top:18px;min-height:0}.ad-slot:empty{display:none}
</style>
</head>
<body>
<div class="wrap">
<p><a href="/">← Back to Astral Wish Lab — Genshin Wish Simulator</a></p>
<h1>Genshin Character Wish Simulators</h1>
<p>Every one of the <strong>${all.length} Genshin Impact 5-star characters</strong> below has a dedicated wish simulator: set your pity, simulate pulls, and check your 50/50 odds and primogem budget before spending in the real game. All simulations run locally in your browser using the documented character-event model — 0.6% base rate, soft pity from pull 74, hard pity at 90.</p>
<a class="sim-cta" href="/">Open the main wish simulator →</a>

${groupHtml}

<div class="card">
<h2>Plan before you pull</h2>
<ul>
<li><a href="/guides/pity-system/">Pity calculator: exact soft pity, hard pity &amp; 50/50 odds</a></li>
<li><a href="/guides/primogem-planning/">How many wishes per patch? F2P, Welkin &amp; BP primogem income</a></li>
<li><a href="/next-banner/">Next banner: current phase, end date &amp; prediction</a></li>
<li><a href="/genshin-wish-tracker/">Genshin wish tracker: log pulls and track pity</a></li>
</ul>
</div>

<div class="ad-slot" aria-hidden="true"></div>
<footer>
<p><a href="/">Wish Simulator</a> · <a href="/guides/pity-system/">Pity Calculator</a> · <a href="/next-banner/">Next Banner</a> · <a href="/characters/">All Characters</a></p>
<p>Astral Wish Lab is an unofficial fan tool and is not affiliated with or endorsed by HoYoverse. Character names are used for identification only; all original content and tools are ours. <a href="/privacy/">Privacy</a></p>
</footer>
</div>
<script src="/ads.js" defer></script>
<script src="/ga.js" defer></script>
</body>
</html>
`
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'simulator.js'), SIMULATOR_JS, 'utf8')
  writeFileSync(join(OUT_DIR, 'index.html'), indexHtml(characters), 'utf8')
  characters.forEach((c, i) => {
    const dir = join(OUT_DIR, c.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), pageHtml(c, i, characters), 'utf8')
  })

  // Regenerate sitemap.xml so it always stays in sync with character-data.json.
  // This script owns the full sitemap, including the static guide entries below —
  // rerunning generate-pity-guide.mjs afterwards stays a no-op because its
  // remove-and-reappend is idempotent against identical entries.
  const guideEntries = [
    { loc: 'characters/', lastmod: '2026-11-13' },
    { loc: 'characters/noy/', lastmod: '2026-11-03' },
    { loc: 'guides/pity-system/', lastmod: '2026-08-16' },
    { loc: 'guides/primogem-planning/', lastmod: '2026-11-13' },
    { loc: 'genshin-wish-tracker/', lastmod: '2026-10-19' },
    { loc: 'next-banner/', lastmod: '2026-11-13' },
    { loc: 'countdown/', lastmod: '2026-11-13' },
    { loc: 'about/', lastmod: '2026-11-05' },
    { loc: 'contact/', lastmod: '2026-11-05' },
    { loc: 'privacy/', lastmod: '2026-09-18' },
    { loc: 'terms/', lastmod: '2026-11-05' },
    { loc: 'wuthering-waves/', lastmod: '2026-11-03' },
    { loc: 'wuthering-waves/characters/', lastmod: '2026-11-03' },
    { loc: 'wuthering-waves/hsin/', lastmod: '2026-11-03' },
    { loc: 'wuthering-waves/codes/', lastmod: '2026-11-03' },
    { loc: 'wuthering-waves/next-banner/', lastmod: '2026-11-03' },
    { loc: 'wuthering-waves/wish-simulator/', lastmod: '2026-11-03' },
    { loc: 'guides/wuthering-waves-camera-settings/', lastmod: '2026-11-03' },
  ]
    .map((g) => `  <url>\n    <loc>%VITE_SITE_URL%${g.loc}</loc>\n    <lastmod>${g.lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>`)
    .join('\n')
  const urlEntries = characters
    .map((c) => `  <url>\n    <loc>%VITE_SITE_URL%characters/${c.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`)
    .join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>%VITE_SITE_URL%</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n${urlEntries}\n${guideEntries}\n</urlset>\n`
  writeFileSync(join(ROOT, 'public', 'sitemap.xml'), sitemap, 'utf8')

  const total = characters.reduce((sum, c) => sum + Buffer.byteLength(pageHtml(c, characters.indexOf(c), characters)), 0)
  console.log(`Generated ${characters.length} character pages + simulator.js + sitemap.xml`)
  console.log(`Output: ${OUT_DIR}`)
  console.log(`Total page bytes: ${total.toLocaleString()}`)
}

main()