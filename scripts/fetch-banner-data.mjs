#!/usr/bin/env node
/**
 * fetch-banner-data.mjs
 * -----------------------------------------
 * Attempts to fetch current Genshin Impact banner data from community sources
 * and updates scripts/banner-schedule.json.
 *
 * Strategy:
 *   1. Try fetching from a configurable URL (env BANNER_DATA_URL)
 *   2. If no URL set or fetch fails, try the Genshin Impact Fandom wiki API
 *   3. If all sources fail, keep existing data unchanged
 *
 * The script is designed to run in CI (GitHub Actions) where network access
 * is available. It exits 0 even on fetch failure (non-blocking).
 *
 * Env:
 *   BANNER_DATA_URL  - direct JSON URL to fetch banner data from
 *   BANNER_WIKI_PAGE - wiki page to scrape (default: "Wish/Event_Wish")
 *   DRY_RUN          - if "true", don't write the file
 *
 * Run:  node scripts/fetch-banner-data.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = join(ROOT, 'scripts', 'banner-schedule.json')
const BANNER_DATA_URL = process.env.BANNER_DATA_URL || ''
const DRY_RUN = process.env.DRY_RUN === 'true'

const existing = JSON.parse(readFileSync(DATA_FILE, 'utf8'))

// ── Helpers ────────────────────────────────────────────
function log(msg) { console.log(`[fetch-banner] ${msg}`) }
function warn(msg) { console.warn(`[fetch-banner] WARN: ${msg}`) }

/**
 * Validate that a parsed banner schedule object has the expected shape.
 * Returns true if valid, false otherwise.
 */
function validate(data) {
  if (!data || !Array.isArray(data.phases) || data.phases.length < 1) return false
  for (const phase of data.phases) {
    if (!phase.id || !phase.character?.name || !phase.endUtc) return false
  }
  return true
}

/**
 * Try to fetch JSON from a direct URL.
 * The URL should return a JSON object matching the banner-schedule.json schema.
 */
async function fetchDirectUrl(url) {
  log(`Trying direct URL: ${url}`)
  const resp = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'AstralWishLab/1.0' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  if (!validate(data)) throw new Error('Invalid data shape')
  return data
}

/**
 * Try to parse banner data from the Genshin Impact Fandom wiki API.
 * Uses the MediaWiki parse action to get wikitext, then extracts banner info.
 */
async function fetchFromWiki() {
  const page = process.env.BANNER_WIKI_PAGE || 'Wish/Event_Wish'
  const apiUrl = `https://genshin-impact.fandom.com/api.php?action=parse&page=${encodeURIComponent(page)}&format=json&prop=wikitext`
  log(`Trying Fandom wiki API: ${page}`)

  const resp = await fetch(apiUrl, {
    headers: { 'User-Agent': 'AstralWishLab/1.0 (banner-bot)' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const json = await resp.json()
  const wikitext = json?.parse?.wikitext?.['*']
  if (!wikitext) throw new Error('No wikitext returned')

  // Attempt to extract banner data from wikitext tables.
  // This is a best-effort parser — wiki format may change.
  const phases = []
  // Look for version headers like "== 7.1 ==" or "=== Phase 1 ==="
  const versionMatch = wikitext.match(/=\s*v?(\d+\.\d+)\s*=/)
  const version = versionMatch ? versionMatch[1] : existing.version

  // Look for character names in banner table rows
  // Pattern: [[Name]] or {{ICON|Name}} followed by element/weapon info
  const charPattern = /\[\[([A-Z][a-zA-Z\s]+)\]\]/g
  const chars = []
  let m
  while ((m = charPattern.exec(wikitext)) !== null) {
    const name = m[1].trim()
    // Filter out common non-character wiki links
    if (!['Wish', 'Event', 'Phase', 'Version', 'Primogem', 'Intertwined Fate', 'Acquaint Fate', 'Standard', 'Chronicled'].some(w => name.includes(w))) {
      chars.push(name)
    }
  }

  if (chars.length < 1) throw new Error('No character names found in wikitext')

  // Look for date patterns like "2026-10-28 18:00"
  const datePattern = /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/g
  const dates = []
  while ((m = datePattern.exec(wikitext)) !== null) {
    dates.push(`${m[1]}T${m[2]}:00Z`)
  }

  // Build phases from extracted data (best effort)
  const uniqueChars = [...new Set(chars)].slice(0, 4) // Take first few unique chars
  if (uniqueChars.length >= 1 && dates.length >= 2) {
    const now = new Date()
    // Find the phase that's currently active
    for (let i = 0; i < Math.min(uniqueChars.length, 2); i++) {
      const startIdx = i * 2
      const endIdx = i * 2 + 1
      phases.push({
        id: `${version}-${i + 1}`,
        label: `Phase ${i + 1}`,
        version,
        startUtc: dates[startIdx] || dates[0],
        endUtc: dates[endIdx] || dates[1],
        character: { name: uniqueChars[i], rarity: 5, element: 'TBA', weapon: 'TBA', role: 'TBA' },
        fourStars: [],
        next: { speculated: true, character: uniqueChars[i + 2] || 'TBA', rarity: 5, element: 'TBA', weapon: 'TBA', role: 'TBA' },
      })
    }
  }

  if (phases.length === 0) throw new Error('Could not parse phases from wikitext')

  return {
    version,
    updated: new Date().toISOString().split('T')[0],
    phases,
  }
}

// ── Main ───────────────────────────────────────────────
async function main() {
  let newData = null
  let source = 'none'

  // Strategy 1: Direct URL
  if (BANNER_DATA_URL) {
    try {
      newData = await fetchDirectUrl(BANNER_DATA_URL)
      source = 'direct-url'
    } catch (err) {
      warn(`Direct URL failed: ${err.message}`)
    }
  }

  // Strategy 2: Fandom wiki
  if (!newData) {
    try {
      newData = await fetchFromWiki()
      source = 'fandom-wiki'
    } catch (err) {
      warn(`Wiki fetch failed: ${err.message}`)
    }
  }

  // Result
  if (!newData) {
    log('No data source succeeded. Keeping existing banner data unchanged.')
    log(`Existing data: version ${existing.version}, ${existing.phases.length} phase(s)`)
    console.log('CHANGED=false')
    return
  }

  // Check if data actually changed
  const oldStr = JSON.stringify(existing.phases.map(p => ({ id: p.id, char: p.character.name, end: p.endUtc })))
  const newStr = JSON.stringify(newData.phases.map(p => ({ id: p.id, char: p.character.name, end: p.endUtc })))

  if (oldStr === newStr) {
    log(`Data from ${source} is identical to existing data. No update needed.`)
    console.log('CHANGED=false')
    return
  }

  log(`New data from ${source}: version ${newData.version}, ${newData.phases.length} phase(s)`)
  newData.phases.forEach(p => log(`  ${p.label}: ${p.character.name} → ${p.endUtc}`))

  if (DRY_RUN) {
    log('DRY_RUN=true — not writing file')
    console.log('CHANGED=true')
    return
  }

  writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2) + '\n')
  log(`Updated ${DATA_FILE}`)
  console.log('CHANGED=true')
}

main().catch((err) => {
  warn(`Unexpected error: ${err.message}`)
  console.log('CHANGED=false')
})
