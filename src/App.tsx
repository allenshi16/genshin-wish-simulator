import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { banners, catalog, getBanner, getItem, type BannerType, type CatalogItem } from './bannerCatalog'
import { chanceForFeaturedCopies, primogemsToWishes, type BannerState } from './wishMath'
import { initialStoredData, readStoredData, writeStoredData, type HistoryItem, type StoredData } from './storage'
import { createPullTransaction } from './pullTransaction'
import { startAmbientField } from './audioField'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

function ItemPortrait({ item, compact = false }: { item: CatalogItem; compact?: boolean }) {
  return <div className={`item-portrait accent-${item.accent} ${compact ? 'compact' : ''}`} aria-hidden="true"><span>{item.sigil}</span><i /></div>
}

function App() {
  const [stored, setStored] = useState<StoredData>(readStoredData)
  const storedRef = useRef(stored)
  const revealTimerRef = useRef<number | null>(null)
  const [activeBanner, setActiveBanner] = useState<BannerType>('character')
  const [latest, setLatest] = useState<HistoryItem[]>([])
  const [pulling, setPulling] = useState(false)
  const [primogems, setPrimogems] = useState(14400)
  const [dailyIncome, setDailyIncome] = useState(120)
  const [daysLeft, setDaysLeft] = useState(21)
  const [copies, setCopies] = useState(1)
  const [copied, setCopied] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [ambientOn, setAmbientOn] = useState(false)
  const ambientCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => { writeStoredData(stored) }, [stored])
  useEffect(() => () => ambientCleanupRef.current?.(), [])
  useEffect(() => () => { if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current) }, [])

  const banner = getBanner(activeBanner)
  const state = stored.states[activeBanner]
  const featured = banner.featuredIds.map(getItem)
  const inventory = useMemo(() => stored.inventory.map((entry) => ({ ...entry, item: getItem(entry.itemId) })).sort((a, b) => b.item.rarity - a.item.rarity || b.count - a.count), [stored.inventory])
  const bannerHistory = stored.history.filter((entry) => entry.banner === activeBanner)
  const projectedPrimogems = primogems + dailyIncome * daysLeft
  const projectedWishes = primogemsToWishes(projectedPrimogems)
  const characterState = stored.states.character
  const chance = chanceForFeaturedCopies(projectedWishes, copies, characterState)
  const worstCase = Math.max(0, copies * 180 - characterState.pity5 - (characterState.guaranteed5 ? 90 : 0))
  const averagePity = stored.fiveStarCount ? Math.round(stored.fiveStarPityTotal / stored.fiveStarCount) : 0

  function commit(next: StoredData) {
    storedRef.current = next
    setStored(next)
  }

  function updateBannerState(patch: Partial<BannerState>) {
    const current = storedRef.current
    commit({ ...current, states: { ...current.states, [activeBanner]: { ...current.states[activeBanner], ...patch } } })
  }

  function runPull(count: number) {
    if (pulling) return
    setPulling(true)
    setLatest([])
    const pullBanner = activeBanner
    const transaction = createPullTransaction(storedRef.current, pullBanner, count)
    const additions = transaction.additions
    commit(transaction.data)
    revealTimerRef.current = window.setTimeout(() => {
      setLatest(additions)
      setPulling(false)
      revealTimerRef.current = null
      const names = additions.filter((entry) => entry.rarity >= 4).map((entry) => entry.itemName).join(', ')
      setAnnouncement(`Completed ${count} ${count === 1 ? 'wish' : 'wishes'}. Notable results: ${names || 'none'}.`)
    }, 720)
  }

  function reset() {
    if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current)
    revealTimerRef.current = null
    setPulling(false)
    storedRef.current = initialStoredData
    setStored(initialStoredData)
    setLatest([])
  }

  function toggleAmbient() {
    if (ambientCleanupRef.current) {
      ambientCleanupRef.current()
      ambientCleanupRef.current = null
      setAmbientOn(false)
      setAnnouncement('Ambient field muted.')
      return
    }
    const cleanup = startAmbientField()
    if (!cleanup) {
      setAnnouncement('Ambient audio is not available in this browser.')
      return
    }
    ambientCleanupRef.current = cleanup
    setAmbientOn(true)
    setAnnouncement('Ambient field enabled.')
  }

  async function sharePlan() {
    const target = copies === 1 ? 'one featured character' : `${copies} featured character copies`
    const text = `Astral Wish Lab: ${projectedWishes} projected wishes and a ${Math.round(chance * 100)}% estimated chance for ${target}. Character pity: ${characterState.pity5}.`
    try {
      await navigator.clipboard.writeText(text); setCopied(true); setAnnouncement('Planning summary copied.'); window.setTimeout(() => setCopied(false), 1800)
    } catch (error) { console.warn('Could not copy plan.', error); setAnnouncement('The planning summary could not be copied.') }
  }

  return (
    <div className="site-shell">
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Astral Wish Lab home"><span className="brand-mark">✦</span><span>ASTRAL <b>WISH LAB</b></span></a>
        <nav aria-label="Primary navigation"><a href="#simulator">Wish</a><a href="#collection">Collection</a><a href="#planner">Planner</a><a href="#method">Rules</a></nav>
        <div className="topbar-tools"><button className={`audio-toggle ${ambientOn ? 'active' : ''}`} aria-label={ambientOn ? 'Mute ambient audio' : 'Enable ambient audio'} aria-pressed={ambientOn} onClick={toggleAmbient}><span aria-hidden="true">{ambientOn ? '◉' : '◌'}</span><span>{ambientOn ? 'Ambient on' : 'Ambient off'}</span></button><span className="status-dot">Local data only</span></div>
      </header>

      <main id="top">
        <section className="masthead">
          <div><p className="eyebrow">UNOFFICIAL · ORIGINAL EXAMPLE ROSTER</p><h1><span>Genshin Wish Simulator</span>Choose a signal.<br /><em>Meet the stars.</em></h1></div>
          <p>Rehearse character, weapon, and standard wishes with original fictional results—then use the pity and primogem planner before making real decisions.</p>
        </section>

        <section className="simulator" id="simulator">
          <div className="banner-tabs" aria-label="Wish banner type">
            {banners.map((entry) => <button key={entry.id} disabled={pulling} aria-pressed={activeBanner === entry.id} className={activeBanner === entry.id ? 'active' : ''} onClick={() => { setActiveBanner(entry.id); setLatest([]) }}><small>{entry.subtitle}</small><strong>{entry.name}</strong><span>{entry.hardPity} hard pity</span></button>)}
          </div>

          <div className={`banner-stage banner-${activeBanner}`}>
            <div className="banner-copy">
              <p className="eyebrow">{banner.subtitle}</p>
              <h2>{banner.name}</h2>
              <p>{banner.description}</p>
              <div className="featured-roster">
                {featured.length ? featured.map((item, index) => <article key={item.id} className={`featured-unit rarity-${item.rarity}`}><ItemPortrait item={item} /><span>{index === 0 ? 'Featured' : `${item.rarity}★ Rate Up`}</span><b>{item.name}</b><small>{item.title}</small></article>) : <p className="archive-note">Permanent mixed archive · no featured guarantee</p>}
              </div>
              {activeBanner === 'weapon' && <label className="path-select"><span>Charted instrument</span><select disabled={pulling} value={state.pathItemId ?? ''} onChange={(event) => updateBannerState({ pathItemId: event.target.value, fatePoint: 0 })}>{featured.filter((item) => item.rarity === 5).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            </div>

            <aside className="wish-console">
              <div className="console-stats">
                <span><small>5★ PITY</small><b>{state.pity5}/{banner.hardPity}</b></span>
                <span><small>4★ PITY</small><b>{state.pity4}/10</b></span>
                <span><small>{activeBanner === 'weapon' ? 'FATE POINT' : 'GUARANTEE'}</small><b>{activeBanner === 'weapon' ? `${state.fatePoint}/1` : activeBanner === 'standard' ? '—' : state.guaranteed5 ? 'Ready' : '50/50'}</b></span>
              </div>
              <div className={`reveal-chamber ${pulling ? 'is-pulling' : ''}`} aria-busy={pulling}>
                {pulling ? <div className="launch"><i /><i /><i /><strong>Tracing the signal…</strong></div> : latest.length ? <div className={`result-grid results-${latest.length}`}>{latest.map((entry) => { const item = getItem(entry.itemId); const owned = entry.ownershipCount; return <article className={`result-card rarity-${entry.rarity}`} key={entry.id}><ItemPortrait item={item} compact={latest.length > 1} /><span className="stars-label">{'★'.repeat(entry.rarity)}</span><b>{item.name}</b><small>{item.type === 'character' ? (owned > 1 ? `Constellation ${Math.min(6, owned - 1)}${owned > 7 ? '+' : ''}` : 'New character') : (owned > 1 ? `Refinement ${Math.min(5, owned)}${owned > 5 ? '+' : ''}` : 'New weapon')}</small>{entry.featured && <em>Featured</em>}</article> })}</div> : <div className="empty-result"><span>✦</span><h3>The next constellation<br />is unwritten.</h3><p>Choose a single observation or open ten signals at once.</p></div>}
              </div>
              <div className="wish-actions"><button aria-label="Make one wish" disabled={pulling} onClick={() => runPull(1)}><small>SINGLE SIGNAL</small><strong>Wish ×1</strong><span>160 ◈</span></button><button aria-label="Make ten wishes" disabled={pulling} className="primary-wish" onClick={() => runPull(10)}><small>CONSTELLATION SWEEP</small><strong>Wish ×10</strong><span>1,600 ◈</span></button></div>
              <p className="model-note">Original example roster · simulated currency only · no game account connection</p>
            </aside>
          </div>
        </section>

        <section className="collection" id="collection">
          <div className="section-heading"><p className="eyebrow">COLLECTION LOG</p><h2>Your observatory.</h2><p>{inventory.length} of {catalog.length} original entries discovered. Duplicates advance character constellations or weapon refinement.</p></div>
          <div className="collection-stats"><span><b>{stored.total}</b><small>Total wishes</small></span><span><b>{stored.fiveStarCount}</b><small>5★ signals</small></span><span><b>{averagePity || '—'}</b><small>Average 5★ pity</small></span><span><b>{Math.round((inventory.length / catalog.length) * 100)}%</b><small>Archive complete</small></span></div>
          {inventory.length ? <div className="inventory-grid">{inventory.map(({ item, count }) => <article key={item.id} className={`inventory-card rarity-${item.rarity}`}><ItemPortrait item={item} /><div><span>{item.type} · {item.rarity}★</span><h3>{item.name}</h3><p>{item.title}</p></div><strong>{item.type === 'character' ? `C${Math.min(6, Math.max(0, count - 1))}${count > 7 ? '+' : ''}` : `R${Math.min(5, count)}${count > 5 ? '+' : ''}`}</strong></article>)}</div> : <p className="empty-collection">Your first wish will begin the collection.</p>}
        </section>

        <section className="history-section">
          <div className="history-head"><span>{banner.name.toUpperCase()} · RECENT HISTORY</span><button onClick={reset}>Reset all local data</button></div>
          {bannerHistory.length ? bannerHistory.slice(0, 12).map((entry) => { const item = getItem(entry.itemId); return <div className="history-row" key={entry.id}><ItemPortrait item={item} compact /><b>{item.name}</b><span>{entry.rarity}★ {item.type}</span><span>{entry.rarity === 5 ? `Pity ${entry.pity}` : `Wish #${entry.number}`}</span></div> }) : <p className="empty-history">No signals recorded for this banner yet.</p>}
        </section>

        <section className="planner-section" id="planner">
          <div className="section-heading light"><p className="eyebrow">CHARACTER FLIGHT PLAN</p><h2>Know your runway.</h2><p>The planner uses your separate character-event pity and guarantee—not the currently selected banner.</p></div>
          <div className="planner-grid"><div className="planner-form"><label><span>Primogems on hand</span><input type="number" min="0" value={primogems} onChange={(event) => setPrimogems(clamp(Number(event.target.value), 0, 9999999))} /></label><label><span>Estimated daily income</span><input type="number" min="0" value={dailyIncome} onChange={(event) => setDailyIncome(clamp(Number(event.target.value), 0, 10000))} /></label><label><span>Days remaining</span><input type="number" min="0" value={daysLeft} onChange={(event) => setDaysLeft(clamp(Number(event.target.value), 0, 365))} /></label><label><span>Target copies</span><select value={copies} onChange={(event) => setCopies(Number(event.target.value))}><option value="1">C0 · one copy</option><option value="2">C1 · two copies</option><option value="3">C2 · three copies</option></select></label></div><div className="forecast"><div className="forecast-ring" style={{ '--chance': `${Math.round(chance * 100) * 3.6}deg` } as CSSProperties}><div><strong>{Math.round(chance * 100)}%</strong><span>estimated chance</span></div></div><div><p className="eyebrow">{projectedWishes} PROJECTED WISHES</p><h3>{Math.max(0, worstCase - projectedWishes)}-wish worst-case gap</h3><p>{projectedPrimogems.toLocaleString()} projected primogems. Current character pity is {characterState.pity5}; featured guarantee is {characterState.guaranteed5 ? 'active' : 'not active'}.</p><button className="copy-button" onClick={sharePlan}>{copied ? 'Plan copied ✓' : 'Copy planning summary'}</button></div></div></div>
        </section>

        <section className="method" id="method"><div><p className="eyebrow">TRANSPARENT MODELS</p><h2>Simulation,<br />not server prophecy.</h2></div><div className="method-copy"><p>The Genshin pity calculator for character and standard examples uses a 0.6% base 5★ rate and 90 hard pity. Character events add a 50/50 featured check with a post-loss guarantee.</p><p>The weapon banner simulator uses a 0.7% base 5★ rate, 80 hard pity, a simplified 75% featured check, and one fate point toward the selected instrument. Soft-pity curves are labelled approximations, not verified server behavior.</p><p>All names, portraits, banners, and instruments on this page are original fictional examples. This tool is not affiliated with or endorsed by HoYoverse.</p></div></section>
      </main>
      <footer><div className="brand"><span className="brand-mark">✦</span><span>ASTRAL <b>WISH LAB</b></span></div><p>Unofficial fan-made simulator with an original example roster. No official logos, character art, account credentials, or current game banner data are used.</p><a href="#top">Back to orbit ↑</a></footer>
    </div>
  )
}

export default App
