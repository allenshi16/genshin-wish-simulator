#!/usr/bin/env node
/**
 * generate-banner-pages.mjs
 * -----------------------------------------
 * Generates two banner-timing pages:
 *   /next-banner/   — current + next banner info, countdown, simulator links
 *   /countdown/     — pure countdown with multi-timezone switching
 *
 * Data source: scripts/banner-schedule.json (update manually when banners change)
 *
 * Both pages use external JS for countdown timers (CSP-safe: script-src 'self').
 *
 * Run:  node scripts/generate-banner-pages.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = join(ROOT, 'scripts', 'banner-schedule.json')
const CANONICAL_BASE = 'https://genshinwishsimulator.app'
const ADSENSE_CLIENT = (process.env.ADSENSE_CLIENT || '').trim()
const GA_ID = 'G-HGMKQ47FZK'

const schedule = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
const current = schedule.phases[0]
const next = schedule.phases[1]

// Load banner history for the history table
const HISTORY_FILE = join(ROOT, 'scripts', 'banner-history.json')
let bannerHistory = { versions: [] }
try { bannerHistory = JSON.parse(readFileSync(HISTORY_FILE, 'utf8')) } catch {}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatDate(iso) {
  return new Date(iso).toISOString().replace('T', ' ').replace(':00Z', ' UTC')
}

// ──────────────────────────────────────────────
// /next-banner/
// ──────────────────────────────────────────────
function generateNextBanner() {
  const OUT_DIR = join(ROOT, 'public', 'next-banner')
  mkdirSync(OUT_DIR, { recursive: true })

  const curChar = current.character
  const nxtChar = current.next
  const isCurTBA = curChar.name === 'TBA' || curChar.name === undefined
  const isNxtTBA = nxtChar.character === 'TBA' || nxtChar.character === undefined
  const now = new Date()
  const endUtc = new Date(current.endUtc)
  const isBannerEnded = now > endUtc
  const isBannerNotStarted = now < new Date(current.startUtc)

  // Determine page state
  let pageState = 'active' // 'active' | 'ended' | 'not-started'
  if (isBannerEnded) pageState = 'ended'
  else if (isBannerNotStarted) pageState = 'not-started'

  // Title format: "Genshin Next Banner: <character> + Countdown & Prediction"
  const charDisplay = isCurTBA ? '' : `: ${curChar.name}`
  const titleFull = `Genshin Next Banner${charDisplay} + Countdown & Prediction`

  // Helper for conditional text
  const charOrTBA = (val) => (val === 'TBA' || val === undefined ? 'To be announced' : val)
  const elementOrTBA = () => isCurTBA ? 'To be announced' : curChar.element
  const weaponOrTBA = () => isCurTBA ? 'To be announced' : curChar.weapon
  const roleOrTBA = () => isCurTBA ? 'To be announced' : curChar.role

  // Build stat row only if not TBA
  const statRowHtml = isCurTBA ? '' : `
    <div class="stat-row">
      <span><b>${esc(curChar.element)}</b> Element</span>
      <span><b>${esc(curChar.weapon)}</b> Weapon</span>
      <span><b>${esc(curChar.role)}</b> Role</span>
    </div>`

  // Build 4-star display, filter out TBA
  const fourStars = (current.fourStars || []).filter(s => s !== 'TBA' && s !== undefined)
  const fourStarsHtml = fourStars.length > 0
    ? `<p>4★ rate-up: ${fourStars.map(esc).join(', ')}</p>`
    : '<p>4★ rate-up: To be announced</p>'

  // H1 display
  const h1Html = isCurTBA
    ? '<h1>Genshin Next Banner</h1>'
    : `<h1>Genshin Next Banner: <span class="star">${'★'.repeat(curChar.rarity || 5)}</span> ${esc(curChar.name)}</h1>`

  // Intro paragraph
  const introHtml = isCurTBA
    ? '<p>The current Genshin Impact banner information is being updated. Check back soon for character details, countdown timer, and next phase prediction.</p>'
    : `<p>The current Genshin Impact banner features <strong>${esc(curChar.name)}</strong> — a ${curChar.rarity}-star <strong>${esc(curChar.element)}</strong> ${esc(curChar.weapon)} user (${esc(curChar.role)}). Banner ends <strong>${formatDate(current.endUtc)}</strong>. Countdown and next-phase prediction below.</p>`

  // Countdown card
  const countdownLabelHtml = pageState === 'ended'
    ? '<div class="countdown-label">This banner has ended</div>'
    : '<div class="countdown-label">Current banner ends in</div>'

  // Current banner card
  const currentCardHtml = isCurTBA
    ? `<div class="banner-card current">
    <span class="tag tag-now">NOW</span>
    <h2>Banner Details Pending</h2>
    <p>Character information to be announced. Check back soon or visit the <a href="/">wish simulator</a> while you wait.</p>
    <a class="sim-cta" href="/">Try the wish simulator →</a>
  </div>`
    : `<div class="banner-card current">
    <span class="tag tag-now">NOW</span>
    <h2>${esc(curChar.name)} <span class="star">${'★'.repeat(curChar.rarity || 5)}</span></h2>
    ${statRowHtml}
    ${fourStarsHtml}
    <p>Phase: ${esc(current.label)} · Version ${esc(current.version)}</p>
    <a class="sim-cta" href="/">Try the wish simulator →</a>
  </div>`

  // Next phase card
  const nextCardHtml = isNxtTBA
    ? `<div class="banner-card next-phase">
    <span class="tag tag-next">NEXT</span>
    <h2>To be announced</h2>
    <p>Next phase character to be announced. Expected start: ${formatDate(next.startUtc)}</p>
    <a class="sim-cta" href="/countdown/">See full countdown →</a>
  </div>`
    : `<div class="banner-card next-phase">
    <span class="tag tag-next">NEXT</span>
    ${nxtChar.speculated ? '<span class="tag tag-spec">SPECULATION</span>' : ''}
    <h2>${esc(nxtChar.character)} <span class="star">${'★'.repeat(nxtChar.rarity || 5)}</span></h2>
    <div class="stat-row">
      <span><b>${esc(nxtChar.element)}</b> Element</span>
      <span><b>${esc(nxtChar.weapon)}</b> Weapon</span>
      <span><b>${esc(nxtChar.role)}</b> Role</span>
    </div>
    <p>Expected start: ${formatDate(next.startUtc)}</p>
    <a class="sim-cta" href="/countdown/">See full countdown →</a>
  </div>`

  // "When does X banner end?" section
  const whenEndsTitleHtml = isCurTBA ? 'When does the current banner end?' : `When does the ${esc(curChar.name)} banner end?`
  const whenEndsBodyHtml = isCurTBA
    ? '<p>Banner dates are being updated. Check the <a href="/countdown/">countdown page</a> for live timer information.</p>'
    : `<p>The current character event banner featuring ${esc(curChar.name)} runs from ${formatDate(current.startUtc)} to <strong>${formatDate(current.endUtc)}</strong>. That gives you roughly ${Math.round((endUtc - new Date(current.startUtc)) / 86400000)} days. After this phase ends, the next phase (${next.label}) begins immediately with ${charOrTBA(nxtChar.character)}.</p>`

  // "Should you pull for X or save for Y?" section
  const pullOrSaveTitleHtml = isCurTBA && isNxtTBA
    ? 'Planning your pulls'
    : isCurTBA
    ? `Should you save for ${charOrTBA(nxtChar.character)}?`
    : isNxtTBA
    ? `Should you pull for ${esc(curChar.name)} or save?`
    : `Should you pull for ${esc(curChar.name)} or save for ${esc(nxtChar.character)}?`

  // FAQ answer for "When is the next Genshin banner?"
  const faqNextAnswer = isNxtTBA
    ? `The next phase begins ${formatDate(next.startUtc)}. Character details to be announced.`
    : `The next phase begins ${formatDate(next.startUtc)} with ${nxtChar.character}. Check the next banner page for live countdown and updates.`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titleFull}</title>
<meta name="description" content="When does the current Genshin Impact banner end? ${esc(curChar.name)} is up now until ${formatDate(current.endUtc)}. See the countdown, next banner prediction, and jump into the wish simulator.">
<link rel="canonical" href="${CANONICAL_BASE}/next-banner/">
<meta name="robots" content="index,follow">
<meta name="adsense-client" content="${ADSENSE_CLIENT}">
<meta name="ga-measurement" content="${GA_ID}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="${titleFull}">
<meta property="og:description" content="Current banner ends ${formatDate(current.endUtc)}. See the next Genshin banner prediction, countdown timer, and wish simulator.">
<meta property="og:url" content="${CANONICAL_BASE}/next-banner/">
<meta property="og:image" content="${CANONICAL_BASE}/og-card.svg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${titleFull}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${titleFull}",
  "description": "${isCurTBA ? 'Genshin Impact next banner information, countdown, and predictions.' : 'Current Genshin banner featuring ' + esc(curChar.name) + ' ends ' + formatDate(current.endUtc) + '. Includes countdown, next phase speculation, and wish simulator.'}",
  "url": "${CANONICAL_BASE}/next-banner/",
  "author": { "@type": "Organization", "name": "Astral Wish Lab" },
  "datePublished": "${schedule.updated}",
  "dateModified": "${schedule.updated}"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "How long does a Genshin banner last?",
      "acceptedAnswer": { "@type": "Answer", "text": "Each phase lasts about 3 weeks (21 days). A version typically has two phases, so a version lasts about 6 weeks." } },
    { "@type": "Question", "name": "Does pity reset between banners?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Pity carries over between all character event banners. If you are at 70 pity now, you stay at 70 pity when the next banner starts." } },
    { "@type": "Question", "name": "When is the next Genshin banner?",
      "acceptedAnswer": { "@type": "Answer", "text": "${faqNextAnswer}" } }
  ]
}
</script>
<style>
:root{--bg:#0a0f1e;--card:#131a2f;--line:#26304f;--text:#e8ecf7;--dim:#9aa4c4;--accent:#e8a0bf;--gold:#ffd166;--cyan:#83e4df}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}
.wrap{max-width:820px;margin:0 auto;padding:28px 20px}
a{color:#ffd6e8}
h1{font-size:1.85rem;line-height:1.25;margin:0 0 8px}
h2{font-size:1.35rem;margin:0 0 10px;color:var(--cyan)}
.star{color:var(--gold);letter-spacing:2px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin:18px 0}
.card h2{margin-top:0}
.countdown{font:700 clamp(28px,5vw,48px) ui-monospace,monospace;color:var(--gold);text-align:center;padding:20px 0;letter-spacing:2px}
.countdown-label{text-align:center;color:var(--dim);font-size:13px;margin-bottom:8px}
.tz-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:10px 0}
.tz-chip{padding:6px 14px;border:1px solid var(--line);border-radius:20px;font-size:12px;color:var(--dim);background:transparent}
.tz-chip.active{border-color:var(--cyan);color:var(--cyan)}
.banner-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:600px){.banner-grid{grid-template-columns:1fr}}
.banner-card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px}
.banner-card.current{border-color:var(--accent)}
.banner-card.next-phase{border-color:var(--cyan);border-style:dashed}
.tag{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.tag-now{background:var(--accent);color:#1a2035}
.tag-next{background:transparent;border:1px solid var(--cyan);color:var(--cyan)}
.tag-spec{background:transparent;border:1px solid var(--dim);color:var(--dim);font-size:10px}
.sim-cta{display:inline-block;margin-top:14px;padding:10px 20px;background:var(--accent);color:#1a2035;font-weight:700;border-radius:8px;text-decoration:none}
.sim-cta:hover{opacity:.9}
.stat-row{display:flex;gap:20px;flex-wrap:wrap;margin:10px 0}
.stat-row span{font-size:13px;color:var(--dim)}
.stat-row b{color:var(--text)}
.faq-list{list-style:none;padding:0}
.faq-list li{border-top:1px solid var(--line);padding:14px 0}
.faq-list h3{margin:0 0 6px;font-size:1rem;color:var(--text)}
.faq-list p{margin:0;color:var(--dim);font-size:14px;line-height:1.6}
footer{margin-top:34px;color:var(--dim);font-size:.85rem}
.ad-slot{margin-top:18px;min-height:0}.ad-slot:empty{display:none}
</style>
</head>
<body>
<div class="wrap">
<p><a href="/">← Back to Astral Wish Lab — Genshin Wish Simulator</a></p>

${h1Html}
${introHtml}

<div class="card">
${countdownLabelHtml}
<div class="countdown" id="countdown" data-end="${current.endUtc}">—</div>
<div class="tz-row" id="tzRow"></div>
</div>

<div class="banner-grid">
  ${currentCardHtml}
  ${nextCardHtml}
</div>

<div class="card">
<h2>${whenEndsTitleHtml}</h2>
${whenEndsBodyHtml}
<p>Both pity and the 50/50 guarantee carry over between phases and versions, so pulls spent now still count toward future banners.</p>
</div>

<div class="card">
<h2>${pullOrSaveTitleHtml}</h2>
<p>Use the <a href="/">wish simulator</a> to rehearse your pulls and see how your pity state affects the odds. If you're at soft pity (pull 74+), your next 5★ is likely imminent — check the <a href="/guides/pity-system/">soft pity math</a> for exact probabilities. For budgeting across multiple banners, the <a href="/guides/primogem-planning/">primogem planning guide</a> breaks down F2P, Welkin, and BP income per patch.</p>
</div>

<div class="card">
<h2>Genshin banner history: all character event banners by version</h2>
<p>Below is a record of every character event banner since version 6.3. Each version has two phases, each lasting approximately 3 weeks. Use this table to look up past banners, check rerun patterns, and plan ahead for future reruns.</p>
<div style="overflow-x:auto">
<table style="width:100%;border-collapse:collapse;font-size:13px;margin:14px 0">
<thead><tr><th style="text-align:left;padding:8px 10px;border-bottom:2px solid var(--line);color:var(--cyan)">Version</th><th style="text-align:left;padding:8px 10px;border-bottom:2px solid var(--line);color:var(--cyan)">Phase</th><th style="text-align:left;padding:8px 10px;border-bottom:2px solid var(--line);color:var(--cyan)">Character</th><th style="text-align:left;padding:8px 10px;border-bottom:2px solid var(--line);color:var(--cyan)">Element</th><th style="text-align:left;padding:8px 10px;border-bottom:2px solid var(--line);color:var(--cyan)">Dates</th></tr></thead>
<tbody>
${bannerHistory.versions.map(v => v.phases.map(p => `<tr><td style="padding:6px 10px;border-bottom:1px solid var(--line)">${esc(v.version)}</td><td style="padding:6px 10px;border-bottom:1px solid var(--line)">${esc(p.label)}</td><td style="padding:6px 10px;border-bottom:1px solid var(--line);color:var(--text)"><strong>${esc(p.character)}</strong></td><td style="padding:6px 10px;border-bottom:1px solid var(--line)">${esc(p.element)}</td><td style="padding:6px 10px;border-bottom:1px solid var(--line);color:var(--dim)">${esc(p.start)} → ${esc(p.end)}</td></tr>`).join('\n')).join('\n')}
</tbody>
</table>
</div>
<p>This history covers ${bannerHistory.versions.length} versions (${bannerHistory.versions[bannerHistory.versions.length - 1]?.version || 'N/A'}–${bannerHistory.versions[0]?.version || 'N/A'}). For the full banner schedule including weapon banners and 4-star rate-ups, check the official Genshin Impact wiki.</p>
</div>

<div class="card">
<h2>Frequently asked questions</h2>
<ul class="faq-list">
<li><h3>How long does a Genshin banner last?</h3><p>Each phase lasts about 3 weeks (21 days). A version typically has two phases, so a version lasts about 6 weeks.</p></li>
<li><h3>Does pity reset between banners?</h3><p>No. Pity carries over between all character event banners. If you're at 70 pity now, you stay at 70 pity when the next banner starts. See the <a href="/guides/pity-system/">full pity breakdown</a>.</p></li>
<li><h3>When is the next Genshin banner?</h3><p>${faqNextAnswer}</p></li>
</ul>
</div>

<div class="ad-slot" aria-hidden="true"></div>
<footer>Astral Wish Lab is an unofficial fan tool and is not affiliated with or endorsed by HoYoverse. Banner data is updated manually and may not reflect the latest official announcements. <a href="/privacy/">Privacy</a></footer>
</div>
<script src="/next-banner/countdown.js" defer></script>
<script src="/ads.js" defer></script>
<script src="/ga.js" defer></script>
</body>
</html>`

  const countdownJs = `// Countdown timer for banner pages
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
    if (diff <= 0) {
      el.textContent = 'Awaiting update';
      var label = document.querySelector('.countdown-label');
      if (label) label.textContent = 'This banner has ended. Data will be updated soon.';
      return;
    }
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
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  writeFileSync(join(OUT_DIR, 'countdown.js'), countdownJs)
  console.log('Generated /next-banner/ at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// /countdown/
// ──────────────────────────────────────────────
function generateCountdown() {
  const OUT_DIR = join(ROOT, 'public', 'countdown')
  mkdirSync(OUT_DIR, { recursive: true })

  const curChar = current.character

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Genshin Banner Countdown — ${esc(curChar.name)} Timer + All Server Times</title>
<meta name="description" content="Live Genshin Impact banner countdown timer. See exactly when the ${esc(curChar.name)} banner ends across NA, EU, Asia, and all servers. Multi-timezone display.">
<link rel="canonical" href="${CANONICAL_BASE}/countdown/">
<meta name="robots" content="index,follow">
<meta name="adsense-client" content="${ADSENSE_CLIENT}">
<meta name="ga-measurement" content="${GA_ID}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="Genshin Banner Countdown — ${esc(curChar.name)} Live Timer">
<meta property="og:description" content="Live countdown to the end of the ${esc(curChar.name)} banner. All server times included.">
<meta property="og:url" content="${CANONICAL_BASE}/countdown/">
<meta property="og:image" content="${CANONICAL_BASE}/og-card.svg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Genshin Banner Countdown — Live Timer">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Genshin Banner Countdown: ${esc(curChar.name)} Live Timer with All Server Times",
  "description": "Live countdown timer for the current Genshin Impact banner. Multi-timezone display covering NA, EU, Asia servers.",
  "url": "${CANONICAL_BASE}/countdown/",
  "author": { "@type": "Organization", "name": "Astral Wish Lab" },
  "datePublished": "${schedule.updated}",
  "dateModified": "${schedule.updated}"
}
</script>
<style>
:root{--bg:#0a0f1e;--card:#131a2f;--line:#26304f;--text:#e8ecf7;--dim:#9aa4c4;--accent:#e8a0bf;--gold:#ffd166;--cyan:#83e4df}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}
.wrap{max-width:720px;margin:0 auto;padding:28px 20px}
a{color:#ffd6e8}
h1{font-size:1.6rem;line-height:1.25;margin:0 0 8px}
h2{font-size:1.2rem;margin:0 0 10px;color:var(--cyan)}
.star{color:var(--gold);letter-spacing:2px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin:18px 0}
.countdown-main{font:700 clamp(36px,8vw,72px) ui-monospace,monospace;color:var(--gold);text-align:center;padding:30px 0;letter-spacing:3px;text-shadow:0 0 40px rgba(255,209,102,.3)}
.countdown-label{text-align:center;color:var(--dim);font-size:14px;margin-bottom:6px}
.countdown-sub{text-align:center;color:var(--dim);font-size:13px;margin-top:8px}
.tz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0}
.tz-card{padding:14px;border:1px solid var(--line);border-radius:10px;text-align:center}
.tz-card .tz-name{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);margin-bottom:6px}
.tz-card .tz-time{font:600 18px ui-monospace,monospace;color:var(--cyan)}
.tz-card .tz-date{font-size:12px;color:var(--dim);margin-top:4px}
.progress-bar{height:6px;background:var(--line);border-radius:3px;margin:20px 0;overflow:hidden}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--cyan),var(--gold));border-radius:3px;transition:width 1s linear}
.sim-cta{display:block;text-align:center;margin-top:18px;padding:14px 24px;background:var(--accent);color:#1a2035;font-weight:700;border-radius:8px;text-decoration:none;font-size:15px}
.sim-cta:hover{opacity:.9}
footer{margin-top:34px;color:var(--dim);font-size:.85rem}
.ad-slot{margin-top:18px;min-height:0}.ad-slot:empty{display:none}
</style>
</head>
<body>
<div class="wrap">
<p><a href="/">← Back to Astral Wish Lab — Genshin Wish Simulator</a></p>

<h1>Genshin Banner Countdown <span class="star">${'★'.repeat(curChar.rarity)}</span></h1>
<p>Live timer for the <strong>${esc(curChar.name)}</strong> character event banner. All times update every second.</p>

<div class="card">
<div class="countdown-label">${esc(curChar.name)} banner ends in</div>
<div class="countdown-main" id="countdown" data-end="${current.endUtc}" data-start="${current.startUtc}">—</div>
<div class="progress-bar"><div class="progress-fill" id="progressBar"></div></div>
<div class="countdown-sub" id="countdownSub"></div>
</div>

<div class="card">
<h2>End time in all servers</h2>
<div class="tz-grid" id="tzGrid"></div>
</div>

<div class="card">
<h2>What happens when this banner ends?</h2>
<p>When the ${esc(curChar.name)} banner ends, the next phase begins immediately. Your pity and 50/50 guarantee carry over — they never reset between banners. Use the <a href="/">wish simulator</a> to plan your pulls for the next phase.</p>
<p>For the full probability breakdown, see the <a href="/guides/pity-system/">soft pity calculator</a>. To budget your primogems across upcoming banners, check the <a href="/guides/primogem-planning/">primogem planning guide</a>.</p>
<a class="sim-cta" href="/">Open the wish simulator →</a>
</div>

<div class="ad-slot" aria-hidden="true"></div>
<footer>Astral Wish Lab is an unofficial fan tool and is not affiliated with or endorsed by HoYoverse. <a href="/privacy/">Privacy</a></footer>
</div>
<script src="/countdown/countdown.js" defer></script>
<script src="/ads.js" defer></script>
<script src="/ga.js" defer></script>
</body>
</html>`

  const countdownJs = `// Countdown timer for /countdown/ page
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
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  writeFileSync(join(OUT_DIR, 'countdown.js'), countdownJs)
  console.log('Generated /countdown/ at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// Update sitemap
// ──────────────────────────────────────────────
function updateSitemap() {
  const sitemapPath = join(ROOT, 'public', 'sitemap.xml')
  let sitemap = readFileSync(sitemapPath, 'utf8')

  const newEntries = [
    { loc: 'next-banner/', lastmod: schedule.updated, priority: '0.9' },
    { loc: 'countdown/', lastmod: schedule.updated, priority: '0.9' },
  ]

  newEntries.forEach((entry) => {
    const pattern = `<loc>%VITE_SITE_URL%${entry.loc}</loc>`
    if (sitemap.includes(pattern)) return // already present
    const urlBlock = `  <url>\n    <loc>%VITE_SITE_URL%${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    // Insert before closing </urlset>
    sitemap = sitemap.replace('</urlset>', urlBlock + '\n</urlset>')
  })

  writeFileSync(sitemapPath, sitemap, 'utf8')
  console.log('Sitemap updated with /next-banner/ and /countdown/')
}

generateNextBanner()
generateCountdown()
updateSitemap()
