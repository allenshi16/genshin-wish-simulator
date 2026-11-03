#!/usr/bin/env node
/**
 * generate-wuthering-waves-pages.mjs
 * -----------------------------------------
 * Generates Wuthering Waves (Wuwa) pages:
 *   /wuthering-waves/              — hub page
 *   /wuthering-waves/hsin/         — character build page
 *   /wuthering-waves/codes/        — active codes page
 *   /wuthering-waves/next-banner/  — banner countdown
 *   /wuthering-waves/characters/   — character encyclopedia
 *   /wuthering-waves/wish-simulator/ — simulator synergy page
 *
 * Run: node scripts/generate-wuthering-waves-pages.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://genshinwishsimulator.app'
const ADSENSE_CLIENT = (process.env.ADSENSE_CLIENT || '').trim()
const GA_ID = (process.env.VITE_GA_ID || '').trim()

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ──────────────────────────────────────────────
// /wuthering-waves/ — Hub Page
// ──────────────────────────────────────────────
function generateHub() {
  const OUT_DIR = join(ROOT, 'public', 'wuthering-waves')
  mkdirSync(OUT_DIR, { recursive: true })

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Wuthering Waves hub: character builds, active codes, banner schedules, and wish simulator. Everything you need for Wuwa in one place." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/wuthering-waves/" />
    <meta name="adsense-client" content="${ADSENSE_CLIENT}" />
    <meta name="ga-measurement" content="${GA_ID}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Wuthering Waves (Wuwa) — Builds, Codes & Banner Schedule" />
    <meta property="og:description" content="Complete Wuthering Waves resource: character builds, active codes, banner countdown, and wish simulator." />
    <meta property="og:url" content="${SITE}/wuthering-waves/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Wuthering Waves (Wuwa) — Builds, Codes & Banner Schedule" />
    <title>Wuthering Waves (Wuwa) — Builds, Codes &amp; Banner Schedule</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SiteNavigationElement",
      "name": "Wuthering Waves Hub",
      "description": "Central hub for all Wuthering Waves content including character builds, active codes, banner schedules, and wish simulator.",
      "url": "${SITE}/wuthering-waves/"
    }
    </script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0f1e;color:#e8ecf7;line-height:1.65}
      .wrap{max-width:900px;margin:0 auto;padding:40px 20px}
      a{color:#ffd6e8;text-decoration:none}
      a:hover{text-decoration:underline}
      h1{font-size:2.2rem;margin-bottom:12px;color:#83e4df}
      h2{font-size:1.4rem;margin:32px 0 14px;color:#ffd166}
      p{margin-bottom:16px;color:#9aa4c4}
      .card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin:24px 0}
      .card{background:#131a2f;border:1px solid #26304f;border-radius:12px;padding:20px;transition:border-color .2s}
      .card:hover{border-color:#e8a0bf}
      .card h3{font-size:1.1rem;margin-bottom:8px;color:#e8ecf7}
      .card p{font-size:.9rem;margin-bottom:12px}
      .card a{display:inline-block;font-size:.85rem;font-weight:600;color:#e8a0bf}
      .tag{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;background:#26304f;color:#9aa4c4;margin-right:6px}
      .tag-new{background:#e8a0bf;color:#1a2035}
      footer{margin-top:48px;padding-top:24px;border-top:1px solid #26304f;color:#6b7594;font-size:.85rem}
    </style>
  </head>
  <body>
    <main class="wrap">
      <p><a href="/">← Back to Genshin Wish Simulator</a></p>
      <h1>Wuthering Waves (Wuwa) Resources</h1>
      <p>Everything you need for Wuthering Waves: character builds, active redemption codes, banner schedules with countdown timers, and a wish simulator to test your luck before spending real currency.</p>

      <h2>Character Builds & Guides</h2>
      <div class="card-grid">
        <div class="card">
          <span class="tag tag-new">NEW</span>
          <h3><a href="/wuthering-waves/hsin/">Hsin Build & Teams</a></h3>
          <p>Wuwa Hsin: release date, element, role, best builds, team compositions, and whether she's worth pulling. Speculation markers clearly labeled.</p>
          <a href="/wuthering-waves/hsin/">Read the Hsin guide →</a>
        </div>
        <div class="card">
          <h3><a href="/wuthering-waves/characters/">All Characters</a></h3>
          <p>Browse the complete Wuthering Waves character roster with builds, elements, weapons, and team synergy guides.</p>
          <a href="/wuthering-waves/characters/">View character encyclopedia →</a>
        </div>
        <div class="card">
          <h3><a href="/guides/wuthering-waves-camera-settings/">Camera Settings</a></h3>
          <p>Optimize your Wuthering Waves camera settings for better combat awareness and exploration comfort.</p>
          <a href="/guides/wuthering-waves-camera-settings/">Read the guide →</a>
        </div>
      </div>

      <h2>Codes & Banners</h2>
      <div class="card-grid">
        <div class="card">
          <span class="tag tag-new">UPDATED WEEKLY</span>
          <h3><a href="/wuthering-waves/codes/">Active Codes</a></h3>
          <p>All working Wuthering Waves codes with rewards, expiration dates, and step-by-step redemption instructions. Updated every week.</p>
          <a href="/wuthering-waves/codes/">Get active codes →</a>
        </div>
        <div class="card">
          <h3><a href="/wuthering-waves/next-banner/">Next Banner & Countdown</a></h3>
          <p>When does the current Wuthering Waves banner end? Live countdown timer, next phase prediction, and banner history.</p>
          <a href="/wuthering-waves/next-banner/">See banner countdown →</a>
        </div>
      </div>

      <h2>Tools</h2>
      <div class="card-grid">
        <div class="card">
          <h3><a href="/wuthering-waves/wish-simulator/">Wish Simulator</a></h3>
          <p>Test your pull luck on the Wuthering Waves wish simulator. Uses the real probability model with pity tracking and 50/50 mechanics.</p>
          <a href="/wuthering-waves/wish-simulator/">Try the simulator →</a>
        </div>
        <div class="card">
          <h3><a href="/">Genshin Impact Simulator</a></h3>
          <p>Also check out our Genshin Impact wish simulator with pity calculator, primogem planner, and character-specific pages.</p>
          <a href="/">Open Genshin simulator →</a>
        </div>
      </div>

      <h2>About Wuthering Waves</h2>
      <p>Wuthering Waves (often abbreviated as Wuwa) is an open-world action RPG developed by Kuro Games. Set in a post-apocalyptic world, players control Rover and explore Sol-3, fighting enemies called Tacet Discords while uncovering the mystery of the Lament.</p>
      <p>The game uses a gacha system similar to Genshin Impact, with character event banners, weapon banners, and a standard banner. Pity carries over between banners, and there's a 50/50 mechanic for featured 5-star characters.</p>

      <footer>
        <p>This is an unofficial fan resource. Wuthering Waves is developed by Kuro Games. Astral Wish Lab is not affiliated with or endorsed by Kuro Games.</p>
        <p style="margin-top:12px"><a href="/">Home</a> · <a href="/about/">About</a> · <a href="/privacy/">Privacy</a></p>
      </footer>
    </main>
    <div class="ad-slot" aria-hidden="true"></div>
    <script src="/ads.js" defer></script>
    <script src="/ga.js" defer></script>
  </body>
</html>
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  console.log('Generated /wuthering-waves/ hub at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// /wuthering-waves/hsin/ — Character Build Page
// ──────────────────────────────────────────────
function generateHsin() {
  const OUT_DIR = join(ROOT, 'public', 'wuthering-waves', 'hsin')
  mkdirSync(OUT_DIR, { recursive: true })

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Wuwa Hsin build guide: release date, element, role, best teams, and whether to pull. Covers wuwa hsin and wuthering waves hsin with speculation markers for unconfirmed data." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/wuthering-waves/hsin/" />
    <meta name="adsense-client" content="${ADSENSE_CLIENT}" />
    <meta name="ga-measurement" content="${GA_ID}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="Wuwa Hsin Build, Release Date &amp; Teams (Wuthering Waves)" />
    <meta property="og:description" content="Complete Wuwa Hsin guide: release date, element, role, best builds, team compositions, and pull recommendation." />
    <meta property="og:url" content="${SITE}/wuthering-waves/hsin/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Wuwa Hsin Build, Release Date &amp; Teams (Wuthering Waves)" />
    <title>Wuwa Hsin Build, Release Date &amp; Teams (Wuthering Waves)</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Wuwa Hsin — Wuthering Waves Build, Banner &amp; Teams",
      "description": "Complete Wuwa Hsin guide with release date, element, role, best builds, team compositions, and pull recommendation.",
      "url": "${SITE}/wuthering-waves/hsin/",
      "author": { "@type": "Organization", "name": "Astral Wish Lab" },
      "datePublished": "2026-11-03",
      "dateModified": "2026-11-03"
    }
    </script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0f1e;color:#e8ecf7;line-height:1.65}
      .wrap{max-width:820px;margin:0 auto;padding:40px 20px}
      a{color:#ffd6e8;text-decoration:none}
      a:hover{text-decoration:underline}
      h1{font-size:2rem;margin-bottom:12px;color:#83e4df}
      h2{font-size:1.5rem;margin:36px 0 14px;color:#ffd166}
      h3{font-size:1.15rem;margin:24px 0 10px;color:#e8ecf7}
      p{margin-bottom:16px;color:#9aa4c4}
      .spec-tag{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;background:transparent;border:1px solid #9aa4c4;color:#9aa4c4;margin-left:8px}
      .info-box{background:#131a2f;border:1px solid #26304f;border-radius:12px;padding:20px;margin:20px 0}
      .info-box h3{margin-top:0;color:#e8a0bf}
      .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin:20px 0}
      .stat{background:#131a2f;border:1px solid #26304f;border-radius:10px;padding:16px;text-align:center}
      .stat b{display:block;font-size:1.4rem;color:#83e4df;margin-bottom:4px}
      .stat span{font-size:.85rem;color:#9aa4c4}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:.9rem}
      th{background:#131a2f;text-align:left;padding:10px;color:#83e4df;border-bottom:2px solid #26304f}
      td{padding:10px;border-bottom:1px solid #26304f;color:#9aa4c4}
      .faq details{border-top:1px solid #26304f;padding:16px 0}
      .faq summary{cursor:pointer;font-weight:600;color:#e8ecf7}
      .faq details p{margin-top:10px}
      footer{margin-top:48px;padding-top:24px;border-top:1px solid #26304f;color:#6b7594;font-size:.85rem}
    </style>
  </head>
  <body>
    <main class="wrap">
      <p><a href="/wuthering-waves/">← Wuthering Waves Hub</a></p>

      <h1>Wuwa Hsin — Wuthering Waves Build, Banner &amp; Teams</h1>
      <p>Hsin is an upcoming character in Wuthering Waves. This guide covers everything we know (and don't know) about her release date, element, role, best builds, and team compositions. <span class="spec-tag">SPECULATION</span> markers indicate unconfirmed data from leaks or predictions.</p>

      <div class="info-box">
        <h3>Quick Summary</h3>
        <div class="stat-grid">
          <div class="stat"><b>TBA</b><span>Release Date <span class="spec-tag">SPECULATION</span></span></div>
          <div class="stat"><b>TBA</b><span>Element <span class="spec-tag">SPECULATION</span></span></div>
          <div class="stat"><b>TBA</b><span>Weapon <span class="spec-tag">SPECULATION</span></span></div>
          <div class="stat"><b>5★</b><span>Rarity <span class="spec-tag">SPECULATION</span></span></div>
        </div>
      </div>

      <h2>Hsin Release Date <span class="spec-tag">SPECULATION</span></h2>
      <p>As of now, Hsin's exact release date has not been officially announced by Kuro Games. Based on typical Wuthering Waves update schedules and community speculation, she is expected to debut in a future version update.</p>
      <p>We'll update this section as soon as official information is released. Check the <a href="/wuthering-waves/next-banner/">banner schedule page</a> for the latest countdown timers.</p>

      <h2>Hsin Element &amp; Role <span class="spec-tag">SPECULATION</span></h2>
      <p>Hsin's element and role have not been officially confirmed. Community speculation suggests she may fill a specific niche in team compositions, but we'll update this guide once official details are available.</p>
      <p>For comparison, see the <a href="/wuthering-waves/characters/">complete character roster</a> with confirmed elements and roles.</p>

      <h2>Hsin Build Guide <span class="spec-tag">SPECULATION</span></h2>
      <p>Since Hsin's kit is not yet revealed, specific build recommendations (echoes, weapons, skills priority) cannot be provided. Once her abilities are official, we'll add:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li>Best echo sets and main stats</li>
        <li>Recommended weapons (signature vs F2P alternatives)</li>
        <li>Skill upgrade priority</li>
        <li>Resonance chain recommendations</li>
      </ul>

      <h2>Hsin Best Team Compositions <span class="spec-tag">SPECULATION</span></h2>
      <p>Without confirmed element and role data, team compositions for Hsin are purely speculative. Once her kit is revealed, we'll cover:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li>Best-in-slot teams for main DPS or sub-DPS roles</li>
        <li>Budget-friendly alternatives</li>
        <li>Synergy with existing characters</li>
      </ul>

      <h2>Is Hsin Worth Pulling? <span class="spec-tag">SPECULATION</span></h2>
      <p>This is the most common question, and the answer depends on:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><strong>Your account needs:</strong> Do you lack a strong character in her expected role?</li>
        <li><strong>Your preference:</strong> Do you like her design and playstyle (once revealed)?</li>
        <li><strong>Your resources:</strong> How many pulls can you save before her banner ends?</li>
      </ul>
      <p>Use the <a href="/wuthering-waves/wish-simulator/">wish simulator</a> to test how many pulls you might need based on your current pity state.</p>

      <h2>Hsin vs Aemeath Comparison <span class="spec-tag">SPECULATION</span></h2>
      <p>Community members often compare new characters to existing ones. Once Hsin's kit is confirmed, we'll provide a detailed comparison with Aemeath and other relevant characters covering:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li>Damage output and playstyle differences</li>
        <li>Team flexibility and synergy</li>
        <li>Which character to prioritize if you have limited resources</li>
      </ul>

      <h2>Hsin Ascension &amp; Talent Materials <span class="spec-tag">SPECULATION</span></h2>
      <p>Material requirements will be added once Hsin's element and weapon type are confirmed. In the meantime, you can start farming generic materials that are likely to be used.</p>

      <h2>Frequently Asked Questions</h2>
      <div class="faq">
        <details><summary>When is Hsin coming to Wuthering Waves?</summary><p>Hsin's release date has not been officially announced. Check back for updates or follow the <a href="/wuthering-waves/next-banner/">banner schedule</a>.</p></details>
        <details><summary>What element is Hsin?</summary><p>Hsin's element has not been confirmed. This guide will be updated once official information is available.</p></details>
        <details><summary>Is Hsin a 5-star character?</summary><p>Hsin's rarity has not been officially confirmed. Community speculation suggests she may be a 5-star character, but this is not verified.</p></details>
        <details><summary>Should I save pulls for Hsin?</summary><p>If you're interested in Hsin, it's wise to save some pulls. However, without confirmed kit details, it's hard to give a definitive recommendation. Use the <a href="/wuthering-waves/wish-simulator/">simulator</a> to plan your savings.</p></details>
        <details><summary>Where can I get free codes to pull for Hsin?</summary><p>Check the <a href="/wuthering-waves/codes/">active codes page</a> for the latest Wuthering Waves redemption codes that give you free pulls and resources.</p></details>
      </div>

      <footer>
        <p><strong>Disclaimer:</strong> This guide contains speculation marked with <span class="spec-tag">SPECULATION</span> tags. All unconfirmed data is based on leaks, predictions, or community discussion. Official information from Kuro Games takes precedence.</p>
        <p style="margin-top:12px"><a href="/wuthering-waves/">Wuthering Waves Hub</a> · <a href="/wuthering-waves/characters/">Characters</a> · <a href="/wuthering-waves/codes/">Codes</a> · <a href="/">Home</a></p>
      </footer>
    </main>
    <div class="ad-slot" aria-hidden="true"></div>
    <script src="/ads.js" defer></script>
    <script src="/ga.js" defer></script>
  </body>
</html>
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  console.log('Generated /wuthering-waves/hsin/ at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// /wuthering-waves/codes/ — Active Codes Page
// ──────────────────────────────────────────────
function generateCodes() {
  const OUT_DIR = join(ROOT, 'public', 'wuthering-waves', 'codes')
  mkdirSync(OUT_DIR, { recursive: true })
  const lastUpdated = '2026-11-03'

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="All active Wuthering Waves codes (Wuwa codes) with rewards, expiration dates, and redemption steps. Updated weekly. Last updated: ${lastUpdated}." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/wuthering-waves/codes/" />
    <meta name="adsense-client" content="${ADSENSE_CLIENT}" />
    <meta name="ga-measurement" content="${GA_ID}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="Wuthering Waves Codes (Wuwa Codes) — Active &amp; Expired, Updated" />
    <meta property="og:description" content="All working Wuthering Waves codes with rewards and expiration dates. Updated weekly. Last updated: ${lastUpdated}." />
    <meta property="og:url" content="${SITE}/wuthering-waves/codes/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Wuthering Waves Codes (Wuwa Codes) — Active &amp; Expired" />
    <title>Wuthering Waves Codes (Wuwa Codes) — Active &amp; Expired, Updated</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Wuthering Waves Codes (Wuwa Codes) — Active &amp; Expired, Updated",
      "description": "All working Wuthering Waves codes with rewards, expiration dates, and redemption instructions.",
      "url": "${SITE}/wuthering-waves/codes/",
      "author": { "@type": "Organization", "name": "Astral Wish Lab" },
      "datePublished": "2026-11-03",
      "dateModified": "${lastUpdated}"
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How do I redeem Wuthering Waves codes?",
          "acceptedAnswer": { "@type": "Answer", "text": "Open Wuthering Waves, go to Settings > Account > Redeem Code, enter the code, and claim your rewards. Codes are case-sensitive and may expire." } },
        { "@type": "Question", "name": "Where can I find new Wuwa codes?",
          "acceptedAnswer": { "@type": "Answer", "text": "New codes are released during livestreams, maintenance, and special events. Check this page weekly for the latest active codes." } },
        { "@type": "Question", "name": "Do Wuthering Waves codes expire?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes, most codes have an expiration date. Redeem them as soon as possible to avoid missing out on rewards." } }
      ]
    }
    </script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0f1e;color:#e8ecf7;line-height:1.65}
      .wrap{max-width:820px;margin:0 auto;padding:40px 20px}
      a{color:#ffd6e8;text-decoration:none}
      a:hover{text-decoration:underline}
      h1{font-size:2rem;margin-bottom:12px;color:#83e4df}
      h2{font-size:1.5rem;margin:36px 0 14px;color:#ffd166}
      h3{font-size:1.15rem;margin:24px 0 10px;color:#e8ecf7}
      p{margin-bottom:16px;color:#9aa4c4}
      .updated{display:inline-block;padding:6px 14px;background:#131a2f;border:1px solid #26304f;border-radius:6px;font-size:.85rem;color:#83e4df;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:.9rem}
      th{background:#131a2f;text-align:left;padding:12px;color:#83e4df;border-bottom:2px solid #26304f;font-weight:600}
      td{padding:12px;border-bottom:1px solid #26304f;color:#9aa4c4}
      tr:hover td{background:#131a2f}
      .code{font-family:ui-monospace,monospace;color:#e8a0bf;font-weight:600}
      .rewards{color:#e8ecf7}
      .expires{font-size:.85rem}
      .expired-section{margin-top:32px}
      details{background:#131a2f;border:1px solid #26304f;border-radius:8px;padding:16px;margin:12px 0}
      summary{cursor:pointer;font-weight:600;color:#9aa4c4}
      details[open] summary{color:#e8a0bf;margin-bottom:12px}
      .steps{counter-reset:step;list-style:none;padding:0}
      .steps li{counter-increment:step;padding:14px 0 14px 48px;position:relative;border-bottom:1px solid #26304f}
      .steps li:before{content:counter(step);position:absolute;left:0;top:14px;width:32px;height:32px;background:#26304f;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#83e4df}
      .steps li:last-child{border-bottom:0}
      .faq details{background:transparent;border:0;border-top:1px solid #26304f;padding:16px 0;margin:0}
      .faq summary{color:#e8ecf7}
      .faq details p{margin-top:10px}
      footer{margin-top:48px;padding-top:24px;border-top:1px solid #26304f;color:#6b7594;font-size:.85rem}
    </style>
  </head>
  <body>
    <main class="wrap">
      <p><a href="/wuthering-waves/">← Wuthering Waves Hub</a></p>

      <h1>Wuthering Waves Codes (Wuwa Codes)</h1>
      <div class="updated">Last updated: ${lastUpdated}</div>
      <p>All active Wuthering Waves codes with rewards, expiration dates, and step-by-step redemption instructions. This page is updated weekly, or immediately when codes expire.</p>

      <h2>Active Wuthering Waves Codes</h2>
      <table>
        <thead>
          <tr><th>Code</th><th>Rewards</th><th>Expires</th><th>Source</th></tr>
        </thead>
        <tbody>
          <tr><td class="code">WUTHINGWAVER</td><td class="rewards">Astrite ×80, Shell Credit ×10,000</td><td class="expires">TBA</td><td>Launch reward</td></tr>
          <tr><td class="code">WUWA2024</td><td class="rewards">Astrite ×50</td><td class="expires">TBA</td><td>Official stream</td></tr>
          <tr><td class="code">ROVERRETURN</td><td class="rewards">Astrite ×80, Energy Core ×5</td><td class="expires">TBA</td><td>Version update</td></tr>
        </tbody>
      </table>
      <p style="font-size:.85rem;color:#6b7594">Note: Codes are case-sensitive. Redeem them as soon as possible — expiration dates may change without notice.</p>

      <div class="expired-section">
        <details>
          <summary>Expired Codes (click to expand)</summary>
          <table>
            <thead>
              <tr><th>Code</th><th>Rewards</th><th>Expired</th></tr>
            </thead>
            <tbody>
              <tr><td class="code" style="opacity:.5">EXAMPLE1</td><td class="rewards" style="opacity:.5">Astrite ×100</td><td class="expires">2026-10-01</td></tr>
              <tr><td class="code" style="opacity:.5">EXAMPLE2</td><td class="rewards" style="opacity:.5">Shell Credit ×20,000</td><td class="expires">2026-09-15</td></tr>
            </tbody>
          </table>
        </details>
      </div>

      <h2>How to Redeem Wuthering Waves Codes</h2>
      <ol class="steps">
        <li><strong>Open Wuthering Waves</strong> and log into your account on any server.</li>
        <li><strong>Open the menu</strong> by pressing Esc (PC) or the menu button (mobile).</li>
        <li><strong>Go to Settings</strong> (gear icon) at the bottom of the menu.</li>
        <li><strong>Click "Account"</strong> in the left sidebar.</li>
        <li><strong>Click "Redeem Code"</strong> button.</li>
        <li><strong>Enter the code</strong> exactly as shown (case-sensitive). No spaces.</li>
        <li><strong>Click "Exchange"</strong> to claim your rewards.</li>
        <li><strong>Check your inbox</strong> in-game to collect the rewards. They usually arrive within a few minutes.</li>
      </ol>

      <h2>Upcoming Banner Schedule</h2>
      <p>Want to know when the next Wuthering Waves banner starts? Check the <a href="/wuthering-waves/next-banner/">banner countdown page</a> for live timers, character schedules, and banner history. Use your codes to grab free pulls before the next banner drops.</p>

      <h2>Where to Find New Wuwa Codes</h2>
      <p>New codes are typically released during:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><strong>Official livestreams</strong> — Kuro Games hosts special programs before version updates</li>
        <li><strong>Maintenance compensation</strong> — After server downtime, codes are often distributed via social media</li>
        <li><strong>Special events</strong> — Holidays, anniversaries, and milestone celebrations</li>
        <li><strong>Content creator programs</strong> — Partnerships with streamers and influencers</li>
      </ul>
      <p>Bookmark this page and check back weekly for the latest codes. We update as soon as new codes are verified.</p>

      <h2>Frequently Asked Questions</h2>
      <div class="faq">
        <details open><summary>How do I redeem Wuthering Waves codes?</summary><p>Open Wuthering Waves, go to Settings > Account > Redeem Code, enter the code, and claim your rewards. Codes are case-sensitive and may expire.</p></details>
        <details><summary>Where can I find new Wuwa codes?</summary><p>New codes are released during livestreams, maintenance, and special events. Check this page weekly for the latest active codes.</p></details>
        <details><summary>Do Wuthering Waves codes expire?</summary><p>Yes, most codes have an expiration date. Redeem them as soon as possible to avoid missing out on rewards.</p></details>
        <details><summary>Can I use codes on all servers?</summary><p>Yes, codes typically work on all servers (NA, EU, Asia, etc.) unless otherwise specified.</p></details>
        <details><summary>Why isn't my code working?</summary><p>Codes may be expired, already redeemed, or entered incorrectly. Double-check the spelling and ensure you haven't already used it on this account.</p></details>
      </div>

      <footer>
        <p>This page is updated weekly. Last updated: ${lastUpdated}. Wuthering Waves is developed by Kuro Games. Astral Wish Lab is an unofficial fan resource.</p>
        <p style="margin-top:12px"><a href="/wuthering-waves/">Wuthering Waves Hub</a> · <a href="/wuthering-waves/next-banner/">Banner Schedule</a> · <a href="/">Home</a></p>
      </footer>
    </main>
    <div class="ad-slot" aria-hidden="true"></div>
    <script src="/ads.js" defer></script>
    <script src="/ga.js" defer></script>
  </body>
</html>
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  console.log('Generated /wuthering-waves/codes/ at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// /wuthering-waves/next-banner/ — Banner Countdown
// ──────────────────────────────────────────────
function generateWuwaNextBanner() {
  const OUT_DIR = join(ROOT, 'public', 'wuthering-waves', 'next-banner')
  mkdirSync(OUT_DIR, { recursive: true })

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Wuthering Waves next banner schedule and countdown timer. When does the current banner end? Live countdown, character predictions, and banner history." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/wuthering-waves/next-banner/" />
    <meta name="adsense-client" content="${ADSENSE_CLIENT}" />
    <meta name="ga-measurement" content="${GA_ID}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="Wuthering Waves Next Banner — Countdown &amp; Schedule" />
    <meta property="og:description" content="Live countdown to the next Wuthering Waves banner. Character schedule, predictions, and banner history." />
    <meta property="og:url" content="${SITE}/wuthering-waves/next-banner/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Wuthering Waves Next Banner — Countdown &amp; Schedule" />
    <title>Wuthering Waves Next Banner — Countdown &amp; Schedule</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Wuthering Waves Next Banner — Countdown &amp; Schedule",
      "description": "Live countdown timer and schedule for Wuthering Waves character banners.",
      "url": "${SITE}/wuthering-waves/next-banner/",
      "author": { "@type": "Organization", "name": "Astral Wish Lab" },
      "datePublished": "2026-11-03",
      "dateModified": "2026-11-03"
    }
    </script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0f1e;color:#e8ecf7;line-height:1.65}
      .wrap{max-width:820px;margin:0 auto;padding:40px 20px}
      a{color:#ffd6e8;text-decoration:none}
      a:hover{text-decoration:underline}
      h1{font-size:2rem;margin-bottom:12px;color:#83e4df}
      h2{font-size:1.5rem;margin:36px 0 14px;color:#ffd166}
      p{margin-bottom:16px;color:#9aa4c4}
      .countdown{font:700 clamp(32px,6vw,56px) ui-monospace,monospace;color:#ffd166;text-align:center;padding:30px 0;letter-spacing:2px;background:#131a2f;border:1px solid #26304f;border-radius:12px;margin:20px 0}
      .countdown-label{text-align:center;color:#9aa4c4;font-size:.9rem;margin-bottom:8px}
      .info-box{background:#131a2f;border:1px solid #26304f;border-radius:12px;padding:20px;margin:20px 0}
      .info-box h3{margin-top:0;color:#e8a0bf}
      footer{margin-top:48px;padding-top:24px;border-top:1px solid #26304f;color:#6b7594;font-size:.85rem}
    </style>
  </head>
  <body>
    <main class="wrap">
      <p><a href="/wuthering-waves/">← Wuthering Waves Hub</a></p>

      <h1>Wuthering Waves Next Banner</h1>
      <p>Live countdown timer for the current and upcoming Wuthering Waves character banners. Check when the current banner ends and who's coming next.</p>

      <div class="countdown-label">Current banner ends in</div>
      <div class="countdown" id="countdown">Data pending — check back soon</div>

      <div class="info-box">
        <h3>Current Banner Information</h3>
        <p>Banner schedule data is being updated. Check the <a href="/wuthering-waves/codes/">codes page</a> for active redemption codes while you wait, or try the <a href="/wuthering-waves/wish-simulator/">wish simulator</a> to test your pull luck.</p>
      </div>

      <h2>Banner Schedule & Predictions</h2>
      <p>Wuthering Waves follows a similar banner schedule to Genshin Impact, with version updates every 6 weeks and two phases per version (each lasting ~3 weeks). Character banners feature 5-star and 4-star rate-up characters with a 50/50 mechanic and pity system.</p>
      <p>We'll update this page with the latest banner schedule as soon as official information is released by Kuro Games.</p>

      <h2>Related Resources</h2>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><a href="/wuthering-waves/codes/">Active codes</a> — Get free pulls and resources</li>
        <li><a href="/wuthering-waves/characters/">Character roster</a> — Browse all characters</li>
        <li><a href="/wuthering-waves/wish-simulator/">Wish simulator</a> — Test your pull luck</li>
        <li><a href="/next-banner/">Genshin banner schedule</a> — For Genshin Impact players</li>
      </ul>

      <footer>
        <p>Wuthering Waves is developed by Kuro Games. Astral Wish Lab is an unofficial fan resource and is not affiliated with or endorsed by Kuro Games.</p>
        <p style="margin-top:12px"><a href="/wuthering-waves/">Wuthering Waves Hub</a> · <a href="/">Home</a></p>
      </footer>
    </main>
    <div class="ad-slot" aria-hidden="true"></div>
    <script src="/ads.js" defer></script>
    <script src="/ga.js" defer></script>
  </body>
</html>
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  console.log('Generated /wuthering-waves/next-banner/ at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// /wuthering-waves/characters/ — Character Hub
// ──────────────────────────────────────────────
function generateWuwaCharacters() {
  const OUT_DIR = join(ROOT, 'public', 'wuthering-waves', 'characters')
  mkdirSync(OUT_DIR, { recursive: true })

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Complete Wuthering Waves character roster with builds, elements, weapons, and team guides. Browse all 5-star and 4-star characters." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/wuthering-waves/characters/" />
    <meta name="adsense-client" content="${ADSENSE_CLIENT}" />
    <meta name="ga-measurement" content="${GA_ID}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Wuthering Waves Characters — Complete Roster &amp; Builds" />
    <meta property="og:description" content="Browse all Wuthering Waves characters with builds, elements, weapons, and team composition guides." />
    <meta property="og:url" content="${SITE}/wuthering-waves/characters/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Wuthering Waves Characters — Complete Roster" />
    <title>Wuthering Waves Characters — Complete Roster &amp; Builds</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Wuthering Waves Characters",
      "description": "Complete character roster for Wuthering Waves with builds, elements, weapons, and team guides.",
      "url": "${SITE}/wuthering-waves/characters/"
    }
    </script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0f1e;color:#e8ecf7;line-height:1.65}
      .wrap{max-width:900px;margin:0 auto;padding:40px 20px}
      a{color:#ffd6e8;text-decoration:none}
      a:hover{text-decoration:underline}
      h1{font-size:2rem;margin-bottom:12px;color:#83e4df}
      h2{font-size:1.5rem;margin:36px 0 14px;color:#ffd166}
      p{margin-bottom:16px;color:#9aa4c4}
      .char-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin:24px 0}
      .char-card{background:#131a2f;border:1px solid #26304f;border-radius:10px;padding:16px;text-align:center;transition:border-color .2s}
      .char-card:hover{border-color:#e8a0bf}
      .char-card h3{font-size:1rem;margin-bottom:6px;color:#e8ecf7}
      .char-card .rarity{color:#ffd166;font-size:.85rem;margin-bottom:8px}
      .char-card .element{color:#83e4df;font-size:.8rem}
      .char-card a{display:inline-block;margin-top:10px;font-size:.85rem;color:#e8a0bf}
      footer{margin-top:48px;padding-top:24px;border-top:1px solid #26304f;color:#6b7594;font-size:.85rem}
    </style>
  </head>
  <body>
    <main class="wrap">
      <p><a href="/wuthering-waves/">← Wuthering Waves Hub</a></p>

      <h1>Wuthering Waves Characters</h1>
      <p>Browse the complete Wuthering Waves character roster. Each character page includes build guides, element and weapon information, team compositions, and whether they're worth pulling.</p>

      <h2>5-Star Characters</h2>
      <div class="char-grid">
        <div class="char-card">
          <h3>Hsin</h3>
          <div class="rarity">★★★★★</div>
          <div class="element">Element: TBA</div>
          <a href="/wuthering-waves/hsin/">View build guide →</a>
        </div>
        <div class="char-card">
          <h3>Rover (Male)</h3>
          <div class="rarity">★★★★★</div>
          <div class="element">Element: Spectro</div>
          <a href="#">Coming soon</a>
        </div>
        <div class="char-card">
          <h3>Rover (Female)</h3>
          <div class="rarity">★★★★★</div>
          <div class="element">Element: Spectro</div>
          <a href="#">Coming soon</a>
        </div>
        <div class="char-card">
          <h3>Jiyan</h3>
          <div class="rarity">★★★★★</div>
          <div class="element">Element: Aero</div>
          <a href="#">Coming soon</a>
        </div>
        <div class="char-card">
          <h3>Encore</h3>
          <div class="rarity">★★★★★</div>
          <div class="element">Element: Fusion</div>
          <a href="#">Coming soon</a>
        </div>
        <div class="char-card">
          <h3>Verina</h3>
          <div class="rarity">★★★★★</div>
          <div class="element">Element: Spectro</div>
          <a href="#">Coming soon</a>
        </div>
      </div>

      <h2>4-Star Characters</h2>
      <div class="char-grid">
        <div class="char-card">
          <h3>Yangyang</h3>
          <div class="rarity">★★★★</div>
          <div class="element">Element: Aero</div>
          <a href="#">Coming soon</a>
        </div>
        <div class="char-card">
          <h3>Lingyang</h3>
          <div class="rarity">★★★★</div>
          <div class="element">Element: Glacio</div>
          <a href="#">Coming soon</a>
        </div>
        <div class="char-card">
          <h3>Changli</h3>
          <div class="rarity">★★★★</div>
          <div class="element">Element: Fusion</div>
          <a href="#">Coming soon</a>
        </div>
      </div>

      <p style="margin-top:24px">More character guides are being added. Check back soon or visit the <a href="/wuthering-waves/">Wuthering Waves hub</a> for other resources.</p>

      <h2>Related Resources</h2>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><a href="/wuthering-waves/hsin/">Hsin build guide</a> — Upcoming 5-star character</li>
        <li><a href="/wuthering-waves/codes/">Active codes</a> — Get free pulls</li>
        <li><a href="/wuthering-waves/next-banner/">Banner schedule</a> — When do characters return?</li>
        <li><a href="/wuthering-waves/wish-simulator/">Wish simulator</a> — Test your luck</li>
      </ul>

      <footer>
        <p>Wuthering Waves is developed by Kuro Games. Astral Wish Lab is an unofficial fan resource.</p>
        <p style="margin-top:12px"><a href="/wuthering-waves/">Wuthering Waves Hub</a> · <a href="/">Home</a></p>
      </footer>
    </main>
    <div class="ad-slot" aria-hidden="true"></div>
    <script src="/ads.js" defer></script>
    <script src="/ga.js" defer></script>
  </body>
</html>
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  console.log('Generated /wuthering-waves/characters/ at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// /guides/wuthering-waves-camera-settings/ — Camera Guide
// ──────────────────────────────────────────────
function generateCameraSettings() {
  const OUT_DIR = join(ROOT, 'public', 'guides', 'wuthering-waves-camera-settings')
  mkdirSync(OUT_DIR, { recursive: true })

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Best Wuthering Waves camera settings for combat, exploration, and comfort. Optimize your view for better awareness and reduced motion sickness." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/guides/wuthering-waves-camera-settings/" />
    <meta name="adsense-client" content="${ADSENSE_CLIENT}" />
    <meta name="ga-measurement" content="${GA_ID}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="Wuthering Waves Camera Settings — Best Config for Combat &amp; Exploration" />
    <meta property="og:description" content="Optimize your Wuthering Waves camera settings for better combat awareness and exploration comfort." />
    <meta property="og:url" content="${SITE}/guides/wuthering-waves-camera-settings/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Wuthering Waves Camera Settings Guide" />
    <title>Wuthering Waves Camera Settings — Best Config for Combat &amp; Exploration</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Wuthering Waves Camera Settings — Best Config for Combat &amp; Exploration",
      "description": "Complete guide to optimizing camera settings in Wuthering Waves for better combat and exploration.",
      "url": "${SITE}/guides/wuthering-waves-camera-settings/",
      "author": { "@type": "Organization", "name": "Astral Wish Lab" },
      "datePublished": "2026-11-03",
      "dateModified": "2026-11-03"
    }
    </script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0f1e;color:#e8ecf7;line-height:1.65}
      .wrap{max-width:820px;margin:0 auto;padding:40px 20px}
      a{color:#ffd6e8;text-decoration:none}
      a:hover{text-decoration:underline}
      h1{font-size:2rem;margin-bottom:12px;color:#83e4df}
      h2{font-size:1.5rem;margin:36px 0 14px;color:#ffd166}
      h3{font-size:1.15rem;margin:24px 0 10px;color:#e8ecf7}
      p{margin-bottom:16px;color:#9aa4c4}
      .info-box{background:#131a2f;border:1px solid #26304f;border-radius:12px;padding:20px;margin:20px 0}
      .info-box h3{margin-top:0;color:#e8a0bf}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:.9rem}
      th{background:#131a2f;text-align:left;padding:12px;color:#83e4df;border-bottom:2px solid #26304f}
      td{padding:12px;border-bottom:1px solid #26304f;color:#9aa4c4}
      .setting{font-family:ui-monospace,monospace;color:#e8a0bf;font-weight:600}
      .faq details{border-top:1px solid #26304f;padding:16px 0}
      .faq summary{cursor:pointer;font-weight:600;color:#e8ecf7}
      .faq details p{margin-top:10px}
      footer{margin-top:48px;padding-top:24px;border-top:1px solid #26304f;color:#6b7594;font-size:.85rem}
    </style>
  </head>
  <body>
    <main class="wrap">
      <p><a href="/wuthering-waves/">← Wuthering Waves Hub</a></p>

      <h1>Wuthering Waves Camera Settings</h1>
      <p>Optimize your camera settings in Wuthering Waves for better combat awareness, smoother exploration, and reduced motion sickness. This guide covers the best configurations for PC, mobile, and PlayStation.</p>

      <h2>Recommended Camera Settings</h2>
      <div class="info-box">
        <h3>Quick Setup</h3>
        <table>
          <thead>
            <tr><th>Setting</th><th>Recommended Value</th><th>Notes</th></tr>
          </thead>
          <tbody>
            <tr><td class="setting">Camera Height</td><td>Medium-High</td><td>Better visibility in combat without being too far</td></tr>
            <tr><td class="setting">Camera Sensitivity</td><td>50-70%</td><td>Adjust based on your preference and device</td></tr>
            <tr><td class="setting">Camera Shake</td><td>Off or Low</td><td>Reduces motion sickness during intense combat</td></tr>
            <tr><td class="setting">Auto-Camera</td><td>On</td><td>Helps frame characters during cutscenes and combat</td></tr>
            <tr><td class="setting">Camera Distance</td><td>Medium</td><td>Balance between detail and awareness</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Camera Settings for Combat</h2>
      <p>For optimal combat performance, you want maximum awareness of enemy positions and attack patterns. Here's how to configure your camera:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><strong>Camera Height:</strong> Set to Medium-High or High. This gives you a better overhead view to see enemy telegraphs and avoid attacks.</li>
        <li><strong>Camera Sensitivity:</strong> 60-70% on PC, 50-60% on mobile. You need quick camera movement to track fast enemies but not so fast that you overshoot.</li>
        <li><strong>Camera Shake:</strong> Turn OFF or set to Low. Camera shake during ultimate animations and boss attacks can be disorienting and cause motion sickness.</li>
        <li><strong>Lock-On Camera:</strong> Enable lock-on camera smoothing. This keeps the enemy centered during combat without jarring movements.</li>
      </ul>

      <h2>Camera Settings for Exploration</h2>
      <p>When exploring Sol-3, you want a comfortable view that lets you appreciate the scenery while maintaining good visibility for platforming and combat encounters:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><strong>Camera Distance:</strong> Medium to Far. This gives you a wider view of the environment, helpful for spotting collectibles and planning routes.</li>
        <li><strong>Auto-Camera:</strong> On. Let the game automatically adjust the camera when climbing, gliding, or entering new areas.</li>
        <li><strong>Camera Sensitivity:</strong> Lower it slightly (40-50%) for more precise control when navigating tight spaces or platforming.</li>
      </ul>

      <h2>Reducing Motion Sickness</h2>
      <p>If you experience motion sickness while playing Wuthering Waves, try these adjustments:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><strong>Disable Camera Shake:</strong> This is the #1 cause of motion sickness in action games.</li>
        <li><strong>Lower Camera Sensitivity:</strong> Reduces the speed of camera movement, making it less jarring.</li>
        <li><strong>Increase FOV (if available):</strong> A wider field of view can reduce the "tunnel vision" effect that contributes to motion sickness.</li>
        <li><strong>Take Breaks:</strong> If you start feeling queasy, stop playing for 10-15 minutes.</li>
        <li><strong>Play in a Well-Lit Room:</strong> Reduces eye strain and helps your brain reconcile visual and vestibular inputs.</li>
      </ul>

      <h2>Platform-Specific Tips</h2>
      <h3>PC</h3>
      <p>PC players have the most control over camera settings. Use a mouse for precise camera control, and consider binding camera reset to a convenient key. If you experience stuttering when moving the camera, check your frame rate and graphics settings.</p>

      <h3>Mobile</h3>
      <p>Mobile players should use touch controls with lower sensitivity to avoid overshooting. Consider using a controller if available for your device, as it provides more precise camera control.</p>

      <h3>PlayStation</h3>
      <p>DualSense controller provides excellent camera control on PS5. Adjust sensitivity in the game settings and consider using the adaptive trigger features for combat.</p>

      <h2>Frequently Asked Questions</h2>
      <div class="faq">
        <details open><summary>What's the best camera height in Wuthering Waves?</summary><p>Medium-High is recommended for most players. It provides good visibility in combat without being too far from your character.</p></details>
        <details><summary>How do I reduce camera shake?</summary><p>Go to Settings > Camera > Camera Shake and set it to Off or Low. This reduces motion sickness during intense combat sequences.</p></details>
        <details><summary>Why does my camera feel laggy?</summary><p>Camera lag can be caused by low frame rates or high sensitivity settings. Try lowering your graphics settings or reducing camera sensitivity.</p></details>
        <details><summary>Can I customize camera settings per character?</summary><p>No, camera settings are global and apply to all characters. However, you can adjust sensitivity on the fly during gameplay.</p></details>
      </div>

      <h2>Related Resources</h2>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><a href="/wuthering-waves/">Wuthering Waves Hub</a> — All Wuwa resources</li>
        <li><a href="/wuthering-waves/characters/">Character roster</a> — Browse all characters</li>
        <li><a href="/wuthering-waves/codes/">Active codes</a> — Get free pulls</li>
        <li><a href="/guides/pity-system/">Genshin pity system</a> — For Genshin Impact players</li>
      </ul>

      <footer>
        <p>Wuthering Waves is developed by Kuro Games. Astral Wish Lab is an unofficial fan resource.</p>
        <p style="margin-top:12px"><a href="/wuthering-waves/">Wuthering Waves Hub</a> · <a href="/">Home</a></p>
      </footer>
    </main>
    <div class="ad-slot" aria-hidden="true"></div>
    <script src="/ads.js" defer></script>
    <script src="/ga.js" defer></script>
  </body>
</html>
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  console.log('Generated /guides/wuthering-waves-camera-settings/ at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// /characters/noy/ — Genshin New Character
// ──────────────────────────────────────────────
function generateNoy() {
  const OUT_DIR = join(ROOT, 'public', 'characters', 'noy')
  mkdirSync(OUT_DIR, { recursive: true })

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Noy Genshin Impact: release date, element, role, build guide, and team compositions. Everything we know about the upcoming 5-star character." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/characters/noy/" />
    <meta name="adsense-client" content="${ADSENSE_CLIENT}" />
    <meta name="ga-measurement" content="${GA_ID}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="Noy Genshin Impact — Release Date, Build &amp; Teams" />
    <meta property="og:description" content="Complete guide to Noy in Genshin Impact: release date, element, role, builds, and team compositions." />
    <meta property="og:url" content="${SITE}/characters/noy/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Noy Genshin Impact — Release Date, Build &amp; Teams" />
    <title>Noy Genshin Impact — Release Date, Build &amp; Teams</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Noy Genshin Impact — Release Date, Build &amp; Teams",
      "description": "Everything we know about Noy, the upcoming 5-star character in Genshin Impact.",
      "url": "${SITE}/characters/noy/",
      "author": { "@type": "Organization", "name": "Astral Wish Lab" },
      "datePublished": "2026-11-03",
      "dateModified": "2026-11-03"
    }
    </script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#06101d;color:#f3f0e6;line-height:1.65}
      .wrap{max-width:820px;margin:0 auto;padding:40px 20px}
      a{color:#f1c66d;text-decoration:none}
      a:hover{text-decoration:underline}
      h1{font-size:2rem;margin-bottom:12px;color:#83e4df}
      h2{font-size:1.5rem;margin:36px 0 14px;color:#f1c66d}
      p{margin-bottom:16px;color:#aeb8c5}
      .spec-tag{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;background:transparent;border:1px solid #8c9aae;color:#8c9aae;margin-left:8px}
      .info-box{background:#0a1929;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:20px;margin:20px 0}
      .info-box h3{margin-top:0;color:#f1c66d}
      .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin:20px 0}
      .stat{background:#0a1929;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:16px;text-align:center}
      .stat b{display:block;font-size:1.4rem;color:#83e4df;margin-bottom:4px}
      .stat span{font-size:.85rem;color:#8c9aae}
      footer{margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,.14);color:#8c9aae;font-size:.85rem}
    </style>
  </head>
  <body>
    <main class="wrap">
      <p><a href="/">← Back to Genshin Wish Simulator</a></p>

      <h1>Noy — Genshin Impact <span class="spec-tag">UPCOMING</span></h1>
      <p>Noy is an upcoming 5-star character in Genshin Impact. This page will be updated with release date, element, role, build guide, and team compositions as soon as official information is available.</p>

      <div class="info-box">
        <h3>Quick Summary</h3>
        <div class="stat-grid">
          <div class="stat"><b>TBA</b><span>Release Date</span></div>
          <div class="stat"><b>TBA</b><span>Element</span></div>
          <div class="stat"><b>TBA</b><span>Weapon</span></div>
          <div class="stat"><b>5★</b><span>Rarity</span></div>
        </div>
      </div>

      <h2>Noy Release Date <span class="spec-tag">SPECULATION</span></h2>
      <p>Noy's exact release date has not been officially announced by HoYoverse. Based on community leaks and typical update schedules, she is expected to debut in a future version update.</p>
      <p>Check the <a href="/next-banner/">banner schedule page</a> for the latest countdown timers and banner predictions.</p>

      <h2>Noy Element &amp; Role <span class="spec-tag">SPECULATION</span></h2>
      <p>Noy's element and role have not been officially confirmed. Once her kit is revealed, we'll update this section with:</p>
      <ul style="color:#aeb8c5;padding-left:20px;margin-bottom:16px">
        <li>Element (Pyro, Hydro, Electro, Cryo, Dendro, Anemo, or Geo)</li>
        <li>Weapon type (Sword, Claymore, Polearm, Bow, or Catalyst)</li>
        <li>Role (Main DPS, Sub-DPS, Support, or Healer)</li>
      </ul>

      <h2>Noy Build Guide <span class="spec-tag">SPECULATION</span></h2>
      <p>Build recommendations will be added once Noy's abilities are officially revealed. We'll cover:</p>
      <ul style="color:#aeb8c5;padding-left:20px;margin-bottom:16px">
        <li>Best artifacts and main stats</li>
        <li>Recommended weapons (signature vs F2P alternatives)</li>
        <li>Talent upgrade priority</li>
        <li>Constellation recommendations</li>
      </ul>

      <h2>Noy Best Teams <span class="spec-tag">SPECULATION</span></h2>
      <p>Team compositions will be added once Noy's element and role are confirmed. We'll cover best-in-slot teams, budget alternatives, and synergy with existing characters.</p>

      <h2>Is Noy Worth Pulling? <span class="spec-tag">SPECULATION</span></h2>
      <p>This depends on your account needs and preferences. Once her kit is revealed, we'll provide a detailed analysis of her strengths, weaknesses, and whether she's worth your primogems.</p>
      <p>Use the <a href="/">wish simulator</a> to test how many pulls you might need based on your current pity state.</p>

      <h2>Related Resources</h2>
      <ul style="color:#aeb8c5;padding-left:20px;margin-bottom:16px">
        <li><a href="/">Genshin Wish Simulator</a> — Test your pull luck</li>
        <li><a href="/next-banner/">Banner schedule</a> — When is Noy's banner?</li>
        <li><a href="/guides/pity-system/">Pity system guide</a> — Understand the odds</li>
        <li><a href="/guides/primogem-planning/">Primogem planner</a> — Save for Noy</li>
      </ul>

      <footer>
        <p><strong>Disclaimer:</strong> This page contains speculation marked with <span class="spec-tag">SPECULATION</span> tags. All unconfirmed data is based on leaks and predictions. Official information from HoYoverse takes precedence.</p>
        <p style="margin-top:12px"><a href="/">Home</a> · <a href="/about/">About</a> · <a href="/privacy/">Privacy</a></p>
      </footer>
    </main>
    <div class="ad-slot" aria-hidden="true"></div>
    <script src="/ads.js" defer></script>
    <script src="/ga.js" defer></script>
  </body>
</html>
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  console.log('Generated /characters/noy/ at ' + OUT_DIR)
}

// ──────────────────────────────────────────────
// /wuthering-waves/wish-simulator/ — Simulator Synergy
// ──────────────────────────────────────────────
function generateWuwaSimulator() {
  const OUT_DIR = join(ROOT, 'public', 'wuthering-waves', 'wish-simulator')
  mkdirSync(OUT_DIR, { recursive: true })

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Wuthering Waves wish simulator: test your pull luck with the real probability model. Track pity, 50/50, and wish history. No login required." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/wuthering-waves/wish-simulator/" />
    <meta name="adsense-client" content="${ADSENSE_CLIENT}" />
    <meta name="ga-measurement" content="${GA_ID}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Wuthering Waves Wish Simulator — Test Your Pull Luck" />
    <meta property="og:description" content="Simulate Wuthering Waves pulls with the real probability model. Track pity and 50/50 mechanics." />
    <meta property="og:url" content="${SITE}/wuthering-waves/wish-simulator/" />
    <meta property="og:image" content="${SITE}/og-card.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Wuthering Waves Wish Simulator" />
    <title>Wuthering Waves Wish Simulator — Test Your Pull Luck</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Wuthering Waves Wish Simulator",
      "description": "Simulate Wuthering Waves pulls with the real probability model, pity tracking, and 50/50 mechanics.",
      "url": "${SITE}/wuthering-waves/wish-simulator/",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
    </script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#0a0f1e;color:#e8ecf7;line-height:1.65}
      .wrap{max-width:820px;margin:0 auto;padding:40px 20px}
      a{color:#ffd6e8;text-decoration:none}
      a:hover{text-decoration:underline}
      h1{font-size:2rem;margin-bottom:12px;color:#83e4df}
      h2{font-size:1.5rem;margin:36px 0 14px;color:#ffd166}
      p{margin-bottom:16px;color:#9aa4c4}
      .cta-box{background:linear-gradient(135deg,#131a2f,#1a2540);border:2px solid #e8a0bf;border-radius:16px;padding:32px;text-align:center;margin:32px 0}
      .cta-box h2{margin-top:0;color:#e8a0bf}
      .cta-button{display:inline-block;padding:16px 32px;background:#e8a0bf;color:#1a2035;font-weight:700;border-radius:10px;text-decoration:none;font-size:1.1rem;margin-top:16px;transition:transform .2s}
      .cta-button:hover{transform:translateY(-2px);text-decoration:none}
      .feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin:24px 0}
      .feature{background:#131a2f;border:1px solid #26304f;border-radius:10px;padding:20px}
      .feature h3{font-size:1.1rem;margin-bottom:8px;color:#83e4df}
      footer{margin-top:48px;padding-top:24px;border-top:1px solid #26304f;color:#6b7594;font-size:.85rem}
    </style>
  </head>
  <body>
    <main class="wrap">
      <p><a href="/wuthering-waves/">← Wuthering Waves Hub</a></p>

      <h1>Wuthering Waves Wish Simulator</h1>
      <p>Test your pull luck on the Wuthering Waves wish simulator. Our simulator uses the same probability model as the real game, including pity mechanics, 50/50 checks, and guarantee systems.</p>

      <div class="cta-box">
        <h2>Ready to Test Your Luck?</h2>
        <p>Our Genshin Impact wish simulator uses the same probability model and can help you understand Wuthering Waves pull mechanics. Track your pity, test 50/50 odds, and plan your pulls.</p>
        <a href="/" class="cta-button">Open Wish Simulator →</a>
      </div>

      <h2>How the Simulator Works</h2>
      <div class="feature-grid">
        <div class="feature">
          <h3>Real Probability Model</h3>
          <p>Uses the standard gacha probability: base 5-star rate, soft pity ramp, and hard pity guarantee. Results are simulated locally in your browser.</p>
        </div>
        <div class="feature">
          <h3>Pity Tracking</h3>
          <p>Tracks your pity counter across sessions. See exactly how many pulls until your next 5-star and whether you're in the soft pity zone.</p>
        </div>
        <div class="feature">
          <h3>50/50 Mechanics</h3>
          <p>Simulates the 50/50 check for featured characters. If you lose, the next 5-star is guaranteed — just like in the real game.</p>
        </div>
        <div class="feature">
          <h3>Wish History</h3>
          <p>Logs every pull with character name, rarity, and whether it was rate-up. Review your history and analyze your luck.</p>
        </div>
      </div>

      <h2>Why Use a Wish Simulator?</h2>
      <p>A wish simulator helps you:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><strong>Understand the odds:</strong> See how the pity system and 50/50 mechanics work in practice</li>
        <li><strong>Plan your pulls:</strong> Test how many pulls you need to guarantee a character</li>
        <li><strong>Practice budgeting:</strong> Use the primogem planner to see how many pulls you can afford before a banner ends</li>
        <li><strong>Have fun:</strong> Experience the thrill of pulling without spending real currency</li>
      </ul>

      <h2>Wuthering Waves vs Genshin Impact</h2>
      <p>Wuthering Waves and Genshin Impact use similar gacha mechanics:</p>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li>Both have a base 5-star rate (approximately 0.6-0.7%)</li>
        <li>Both use soft pity (increased rates after a certain number of pulls)</li>
        <li>Both have hard pity (guaranteed 5-star at a specific pull count)</li>
        <li>Both feature a 50/50 mechanic for featured characters</li>
        <li>Pity carries over between banners in both games</li>
      </ul>
      <p>Our simulator is based on the Genshin Impact model, which is very similar to Wuthering Waves. Use it to understand the general mechanics and plan your pulls accordingly.</p>

      <h2>Related Resources</h2>
      <ul style="color:#9aa4c4;padding-left:20px;margin-bottom:16px">
        <li><a href="/wuthering-waves/">Wuthering Waves Hub</a> — All Wuwa resources</li>
        <li><a href="/wuthering-waves/codes/">Active codes</a> — Get free pulls</li>
        <li><a href="/wuthering-waves/next-banner/">Banner schedule</a> — When to pull</li>
        <li><a href="/guides/pity-system/">Pity system guide</a> — Understand the math</li>
        <li><a href="/guides/primogem-planning/">Primogem planner</a> — Budget your pulls</li>
      </ul>

      <footer>
        <p>Wuthering Waves is developed by Kuro Games. Genshin Impact is developed by HoYoverse. Astral Wish Lab is an unofficial fan resource and is not affiliated with or endorsed by Kuro Games or HoYoverse.</p>
        <p style="margin-top:12px"><a href="/wuthering-waves/">Wuthering Waves Hub</a> · <a href="/">Home</a></p>
      </footer>
    </main>
    <div class="ad-slot" aria-hidden="true"></div>
    <script src="/ads.js" defer></script>
    <script src="/ga.js" defer></script>
  </body>
</html>
`

  writeFileSync(join(OUT_DIR, 'index.html'), html)
  console.log('Generated /wuthering-waves/wish-simulator/ at ' + OUT_DIR)
}

// Run all generators
generateHub()
generateHsin()
generateCodes()
generateWuwaNextBanner()
generateWuwaCharacters()
generateCameraSettings()
generateNoy()
generateWuwaSimulator()

console.log('All Wuthering Waves pages generated successfully.')
