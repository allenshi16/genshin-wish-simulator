#!/usr/bin/env node
/**
 * generate-wish-tracker.mjs
 * -----------------------------------------
 * Generates /genshin-wish-tracker/ — a static SEO page targeting
 * "genshin wish tracker" (1,000/mo, difficulty 32.8).
 *
 * Content: 8 sections (~1,300 words), probability table, 7-item FAQ,
 * FAQPage JSON-LD, 4 internal links. All content in static HTML —
 * no React dependency, visible to Google's first crawl.
 *
 * Run:  node scripts/generate-wish-tracker.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'genshin-wish-tracker')
const SITE = 'https://genshinwishsimulator.app'
mkdirSync(OUT_DIR, { recursive: true })

// --- exact math (mirrors src/wishMath.ts fiveStarRate) ---
const BASE = 0.006
const SOFT_START = 73
const HARD_PITY = 90
const INCREASE = 0.06
function rateAt(pity) {
  if (pity >= HARD_PITY - 1) return 1
  if (pity < SOFT_START) return BASE
  return Math.min(1, BASE + (pity - SOFT_START + 1) * INCREASE)
}

const cum = []
let miss = 1
for (let n = 1; n <= 90; n += 1) {
  miss *= 1 - rateAt(n - 1)
  cum.push({ pull: n, rate: +(rateAt(n - 1) * 100).toFixed(3), cumulative: +((1 - miss) * 100).toFixed(2) })
}
const p73 = cum.find((c) => c.pull === 73)?.cumulative
const p80 = cum.find((c) => c.pull === 80)?.cumulative
const p82 = cum.find((c) => c.pull === 82)?.cumulative

function percentile(pct) {
  for (const c of cum) if (c.cumulative >= pct) return c.pull
  return 90
}
const median = percentile(50)

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Genshin Wish Tracker &amp; Pity Counter — Astral Wish Lab</title>
<meta name="description" content="Track your Genshin Impact pity counter in seconds. Log every wish, watch soft pity at 74 and hard pity at 90, and keep your 50/50 state safe. Free, no login.">
<link rel="canonical" href="${SITE}/genshin-wish-tracker/">
<meta name="robots" content="index,follow">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="adsense-client" content="${process.env.ADSENSE_CLIENT || ''}">
<meta name="ga-measurement" content="G-HGMKQ47FZK">
<meta property="og:type" content="article">
<meta property="og:title" content="Genshin Wish Tracker & Pity Counter — Free, No Login">
<meta property="og:description" content="Track your Genshin Impact pity, log wishes, monitor soft pity at 74 and 50/50 guarantee. Free wish tracker with no login required.">
<meta property="og:url" content="${SITE}/genshin-wish-tracker/">
<meta property="og:image" content="${SITE}/og-card.svg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Genshin Wish Tracker & Pity Counter">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Genshin Wish Tracker — Astral Wish Lab",
  "url": "${SITE}/genshin-wish-tracker/",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Any",
  "isAccessibleForFree": true,
  "description": "Track your Genshin Impact wishes, pity counter, and 50/50 guarantee status. Free, no login, all data stays in your browser.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "How many wishes does it take to guarantee a 5-star?",
      "acceptedAnswer": { "@type": "Answer", "text": "90 wishes on the character event banner (hard pity). On the weapon banner, hard pity is 80 wishes. Most players get their 5-star between pulls 74 and 82 due to soft pity." } },
    { "@type": "Question", "name": "What is soft pity in Genshin Impact?",
      "acceptedAnswer": { "@type": "Answer", "text": "Soft pity begins at pull 74 on character banners. From pull 74 onward, the 5-star rate climbs approximately 6% per pull until it reaches 100% at hard pity (pull 90). This is why most 5-stars arrive between pulls 74 and 82." } },
    { "@type": "Question", "name": "Does pity carry over to the next banner?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Pity count and the 50/50 guarantee both carry over between character event banners. If you are at 70 pity now, you stay at 70 pity when the next character banner starts. Weapon banner fate points do reset when the weapon banner ends." } },
    { "@type": "Question", "name": "Do I need to log in or connect my account?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Astral Wish Lab is completely free and requires no login, no game account, and no download. All wish tracking data stays in your browser's local storage." } },
    { "@type": "Question", "name": "Is my wish data uploaded anywhere?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. All data is stored locally in your browser using local storage. Nothing is uploaded to any server. You can clear your data at any time." } },
    { "@type": "Question", "name": "How do I know if I'm on guaranteed pity?",
      "acceptedAnswer": { "@type": "Answer", "text": "Check your wish history in the game. If your last 5-star on a character banner was NOT the featured character, your next 5-star is guaranteed to be the featured character. This guarantee carries over between all character event banners." } },
    { "@type": "Question", "name": "Is this an official Genshin Impact tool?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Astral Wish Lab is an unofficial fan-made tool and is not affiliated with or endorsed by HoYoverse. It uses the same probability model as the game for simulation purposes." } }
  ]
}
</script>
<style>
:root{--bg:#0a0f1e;--card:#131a2f;--line:#26304f;--text:#e8ecf7;--dim:#9aa4c4;--accent:#e8a0bf;--gold:#ffd166;--cyan:#83e4df}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.7}
.wrap{max-width:820px;margin:0 auto;padding:28px 20px}
a{color:#ffd6e8}
h1{font-size:1.85rem;line-height:1.25;margin:0 0 10px}
h2{font-size:1.3rem;margin:36px 0 12px;color:var(--cyan);letter-spacing:-.01em}
p{color:#c5cde0;font-size:15px;line-height:1.75;max-width:700px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin:18px 0}
table{width:100%;border-collapse:collapse;font-size:13px;margin:16px 0}
th{background:rgba(99,102,241,.12);text-align:left;padding:10px 14px;color:var(--cyan);font-weight:600;border-bottom:1px solid var(--line)}
td{padding:9px 14px;border-bottom:1px solid var(--line);color:var(--dim)}
tr:nth-child(even) td{background:rgba(255,255,255,.02)}
.faq-item{border-top:1px solid var(--line);padding:14px 0}
.faq-item h3{margin:0 0 6px;font-size:1rem;color:var(--text)}
.faq-item p{margin:0;color:var(--dim);font-size:14px}
.stat-row{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}
.stat-box{flex:1;min-width:120px;padding:14px;background:var(--card);border:1px solid var(--line);border-radius:10px;text-align:center}
.stat-box b{display:block;font-size:24px;color:var(--gold);margin-bottom:4px}
.stat-box span{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.06em}
footer{margin-top:34px;color:var(--dim);font-size:.85rem}
.ad-slot{margin-top:18px;min-height:0}.ad-slot:empty{display:none}
</style>
</head>
<body>
<div class="wrap">
<p><a href="/">← Back to Astral Wish Lab — Genshin Wish Simulator</a></p>

<h1>Genshin Wish Tracker</h1>
<p>A Genshin wish tracker tells you exactly how many pulls you have gone without a 5-star — and how many you still need. Astral Wish Lab logs each wish, counts your pity automatically, and shows whether your next 5-star is guaranteed or a 50/50. Everything runs in your browser: no login, no game account, no upload. Set your current pity once, then add pulls as you make them.</p>

<div class="stat-row">
<div class="stat-box"><b>${median}</b><span>Median pulls to 5★</span></div>
<div class="stat-box"><b>74</b><span>Soft pity starts</span></div>
<div class="stat-box"><b>90</b><span>Hard pity (guaranteed)</span></div>
<div class="stat-box"><b>50/50</b><span>Featured or standard</span></div>
</div>

<h2>How to Use the Wish Tracker</h2>
<p>Using the wish tracker takes three steps: set your starting point, add your pulls, and read your pity state.</p>
<p><strong>Set your starting point.</strong> Open Genshin Impact, go to the Wish menu, and click Wish History. Count how many pulls you have made since your last 5-star. Enter that number into the pity counter on the <a href="/">wish simulator</a> page. If your last 5-star was not the featured character, check the "guaranteed" box — this means your next 5-star is guaranteed to be the featured character.</p>
<p><strong>Add your pulls.</strong> Each time you make wishes in the game, come back and log them. You can log single pulls or batches of ten. The tracker updates your pity counter, 50/50 state, and total wish count automatically.</p>
<p><strong>Read your pity state.</strong> The tracker shows your current pity (how many pulls since your last 5-star), whether you are on a 50/50 or guaranteed, and your estimated odds for the next pull. If you are at pull 74 or above, you are in soft pity — your odds increase sharply with each pull.</p>

<h2>How the Pity System Works</h2>
<p>The Genshin Impact pity system guarantees that you will receive a 5-star item within a fixed number of pulls. On the character event banner, the base 5-star rate is 0.6% per pull. This flat rate applies from pull 1 through pull 73. At pull 74, soft pity begins — the rate increases by approximately 6% per pull until it reaches 100% at pull 90 (hard pity).</p>
<p>When you pull a 5-star on a character banner, there is a 50% chance it is the featured rate-up character and a 50% chance it is a standard 5-star. If you lose the 50/50, your next 5-star on any character event banner is guaranteed to be the featured character. Both the pity counter and the guarantee status carry over between banners.</p>

<table>
<thead><tr><th>Pull #</th><th>Rate this pull</th><th>Cumulative chance</th></tr></thead>
<tbody>
<tr><td>1–73</td><td>0.60% (flat)</td><td>${p73}% by pull 73</td></tr>
<tr><td>74</td><td>~6.6%</td><td>Soft pity begins</td></tr>
<tr><td>75–79</td><td>+6% per pull</td><td>Rising steeply</td></tr>
<tr><td>80</td><td>~42.6%</td><td>${p80}% by pull 80</td></tr>
<tr><td>82</td><td>~54.6%</td><td>${p82}% by pull 82</td></tr>
<tr><td>83–89</td><td>+6% per pull</td><td>Approaching certainty</td></tr>
<tr><td>90</td><td>100%</td><td>100% — hard pity</td></tr>
</tbody>
</table>

<p>The cumulative column shows your total chance of having received at least one 5-star by that pull, assuming you started at 0 pity. The median player gets their 5-star by pull ${median}.</p>

<h2>Soft Pity vs Hard Pity</h2>
<p>Many players confuse soft pity with hard pity. Here is the difference: <strong>hard pity</strong> is the pull at which a 5-star is absolutely guaranteed — pull 90 on character banners, pull 80 on weapon banners. <strong>Soft pity</strong> is the range before hard pity where the probability increases sharply — from pull 74 onward on character banners.</p>
<p>A common misconception is that soft pity starts at pull 72 or 73. It does not. Soft pity begins at <strong>pull 74</strong>. Pulls 1 through 73 all have the same flat 0.6% rate. The jump at pull 74 is significant — the rate goes from 0.6% to approximately 6.6%, more than a tenfold increase. This is why the vast majority of 5-star pulls arrive between pulls 74 and 82. Reaching hard pity at 90 is technically possible but practically rare.</p>
<p>For the complete computed probability table with exact per-pull rates, see the <a href="/guides/pity-system/">Genshin pity tracker and counter guide</a>.</p>

<h2>What Happens When You Lose the 50/50</h2>
<p>When you pull a 5-star on a character event banner, the game rolls a 50/50 check: half the time you get the featured rate-up character, half the time you get a standard 5-star (such as Qiqi, Diluc, Jean, Dehya, or Keqing — though Keqing is now a standard character, she was previously featured).</p>
<p>If you lose the 50/50 — meaning you pulled a standard 5-star instead of the featured character — you enter what players call "guaranteed pity" or "epitomized path." Your next 5-star on any character event banner is <strong>guaranteed</strong> to be the featured character. This guarantee carries over between all character event banners indefinitely. It does not expire.</p>
<p>The wish tracker displays your current guarantee state clearly: "50/50" means your next 5-star is a coin flip, "Guaranteed" means your next 5-star will be the featured character. Check your wish history to determine your current state — if your last 5-star was the featured character for that banner, you are on a 50/50. If it was a standard character, you are guaranteed.</p>

<h2>Where to Find Your Wish History in Genshin Impact</h2>
<p>To use the wish tracker effectively, you need to know your current pity count. Here is how to find it in the game:</p>
<p><strong>Step 1:</strong> Open Genshin Impact and navigate to the Wish menu (the banner screen where you spend Intertwined Fates).</p>
<p><strong>Step 2:</strong> Click the "History" button in the bottom-left corner of the Wish screen. This opens your full wish history, showing every pull you have ever made.</p>
<p><strong>Step 3:</strong> Scroll through the history and find the last time you pulled a 5-star item. Count how many pulls appear after that 5-star. That number is your current pity count.</p>
<p><strong>Step 4:</strong> Check whether that 5-star was the featured character for that banner. If yes, you are on a 50/50 for your next character banner. If no (it was a standard 5-star), you are on guaranteed pity.</p>
<p><strong>Step 5:</strong> Enter your pity count and guarantee status into the <a href="/">wish simulator</a> to start tracking. The tracker will maintain your state across sessions in your browser's local storage.</p>
<p>Note: Wish history in the game only retains the last 6 months of records. If your last 5-star was more than 6 months ago, you may need to rely on your own records or screenshots.</p>

<h2>Tracking Pity on the Weapon Banner</h2>
<p>The weapon banner uses a similar pity system but with two key differences. First, hard pity is at <strong>80 pulls</strong> instead of 90. Second, the weapon banner uses the <strong>Epitomized Path</strong> system (also called Fate Points). You select one weapon as your path target. If you pull a 5-star that is not your selected weapon, you gain one Fate Point. At one Fate Point, your next 5-star is guaranteed to be your path target.</p>
<p>Unlike character banner pity, <strong>weapon banner Fate Points reset when the banner ends</strong>. They do not carry over to the next weapon banner. The pity counter itself does carry over between weapon banners, but the epitomized path progress does not. Plan your weapon pulls accordingly — the worst case for a specific weapon is 160 pulls if you lose the first path check.</p>

<h2>Frequently asked questions</h2>

<div class="faq-item">
<h3>How many wishes does it take to guarantee a 5-star?</h3>
<p>90 wishes on the character event banner (hard pity). On the weapon banner, hard pity is 80 wishes. However, most players get their 5-star between pulls 74 and 82 due to soft pity, where the rate increases sharply.</p>
</div>

<div class="faq-item">
<h3>What is soft pity in Genshin Impact?</h3>
<p>Soft pity begins at pull 74 on character banners. From pull 74 onward, the 5-star rate climbs approximately 6% per pull until it reaches 100% at hard pity (pull 90). This is why most 5-stars arrive between pulls 74 and 82.</p>
</div>

<div class="faq-item">
<h3>Does pity carry over to the next banner?</h3>
<p>Yes. Pity count and the 50/50 guarantee both carry over between character event banners. If you are at 70 pity now, you stay at 70 pity when the next character banner starts. Weapon banner fate points do reset when the weapon banner ends.</p>
</div>

<div class="faq-item">
<h3>Do I need to log in or connect my account?</h3>
<p>No. Astral Wish Lab is completely free and requires no login, no game account, and no download. All wish tracking data stays in your browser's local storage.</p>
</div>

<div class="faq-item">
<h3>Is my wish data uploaded anywhere?</h3>
<p>No. All data is stored locally in your browser using local storage. Nothing is uploaded to any server. You can clear your data at any time using the reset button.</p>
</div>

<div class="faq-item">
<h3>How do I know if I'm on guaranteed pity?</h3>
<p>Check your wish history in the game. If your last 5-star on a character banner was NOT the featured character, your next 5-star is guaranteed to be the featured character. This guarantee carries over between all character event banners.</p>
</div>

<div class="faq-item">
<h3>Is this an official Genshin Impact tool?</h3>
<p>No. Astral Wish Lab is an unofficial fan-made tool and is not affiliated with or endorsed by HoYoverse. It uses the same probability model as the game for simulation and tracking purposes.</p>
</div>

<div class="ad-slot" aria-hidden="true"></div>
<footer>Astral Wish Lab is an unofficial fan tool and is not affiliated with or endorsed by HoYoverse. <a href="/privacy/">Privacy</a></footer>
</div>
<script src="/ads.js" defer></script>
<script src="/ga.js" defer></script>
</body>
</html>`

writeFileSync(join(OUT_DIR, 'index.html'), html)

// Count words in the static content
const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const wordCount = textContent.split(/\s+/).filter(w => /^[a-zA-Z]/.test(w)).length
console.log('Generated /genshin-wish-tracker/ at ' + OUT_DIR)
console.log('Word count: ' + wordCount)
