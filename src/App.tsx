import { useEffect, useMemo, useRef, useState } from 'react'
import { chanceForFeaturedCopies, makeWish, primogemsToWishes, type WishState } from './wishMath'
import { initialStoredData, readStoredData, writeStoredData, type HistoryItem, type StoredData } from './storage'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

function App() {
  const [stored, setStored] = useState<StoredData>(readStoredData)
  const storedRef = useRef(stored)
  const [latest, setLatest] = useState<HistoryItem[]>([])
  const [primogems, setPrimogems] = useState(14400)
  const [dailyIncome, setDailyIncome] = useState(120)
  const [daysLeft, setDaysLeft] = useState(21)
  const [copies, setCopies] = useState(1)
  const [copied, setCopied] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    writeStoredData(stored)
  }, [stored])

  const averagePity = stored.fiveStarCount
    ? Math.round(stored.fiveStarPityTotal / stored.fiveStarCount)
    : 0

  const projectedPrimogems = primogems + dailyIncome * daysLeft
  const projectedWishes = primogemsToWishes(projectedPrimogems)
  const chance = chanceForFeaturedCopies(projectedWishes, copies, stored.state)
  const worstCase = Math.max(0, copies * 180 - stored.state.pity5 - (stored.state.guaranteed ? 90 : 0))
  const status = chance >= 0.9 ? 'High confidence' : chance >= 0.6 ? 'Within reach' : 'Risk remains'

  const constellation = useMemo(
    () => Array.from({ length: 18 }, (_, index) => ({
      left: `${(index * 37) % 96}%`,
      top: `${(index * 61) % 88}%`,
      delay: `${(index % 6) * 0.7}s`,
    })),
    [],
  )

  function updateState(patch: Partial<WishState>) {
    const next = { ...storedRef.current, state: { ...storedRef.current.state, ...patch } }
    storedRef.current = next
    setStored(next)
  }

  function pull(count: number) {
    const current = storedRef.current
    let state = current.state
    const additions: HistoryItem[] = []
    for (let index = 0; index < count; index += 1) {
      const outcome = makeWish(state)
      state = outcome.state
      additions.push({ ...outcome.result, id: crypto.randomUUID(), number: current.total + index + 1 })
    }
    const newFiveStars = additions.filter((item) => item.rarity === 5)
    setLatest(additions)
    const notable = additions.filter((item) => item.rarity >= 4)
    setAnnouncement(`Completed ${count} ${count === 1 ? 'wish' : 'wishes'}. ${notable.length} result${notable.length === 1 ? '' : 's'} were 4-star or higher.`)
    const next = {
      state,
      total: current.total + count,
      history: [...[...additions].reverse(), ...current.history].slice(0, 120),
      fiveStarCount: current.fiveStarCount + newFiveStars.length,
      fiveStarPityTotal: current.fiveStarPityTotal + newFiveStars.reduce((sum, item) => sum + item.pity, 0),
    }
    storedRef.current = next
    setStored(next)
  }

  function reset() {
    storedRef.current = initialStoredData
    setStored(initialStoredData)
    setLatest([])
  }

  async function sharePlan() {
    const targetLabel = copies === 1 ? 'one featured 5★' : `${copies} featured copies`
    const text = `Astral Wish Lab plan: ${projectedWishes} wishes, ${Math.round(chance * 100)}% estimated chance for ${targetLabel}, current pity ${stored.state.pity5}.`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setAnnouncement('Planning summary copied to the clipboard.')
      window.setTimeout(() => setCopied(false), 1800)
    } catch (error) {
      console.warn('Could not copy plan.', error)
      setAnnouncement('The planning summary could not be copied.')
    }
  }

  return (
    <div className="site-shell">
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <div className="stars" aria-hidden="true">
        {constellation.map((star, index) => <i key={index} style={{ ...star, animationDelay: star.delay }} />)}
      </div>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Astral Wish Lab home">
          <span className="brand-mark">✦</span>
          <span>ASTRAL <b>WISH LAB</b></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#simulator">Simulator</a>
          <a href="#planner">Planner</a>
          <a href="#method">Method</a>
        </nav>
        <span className="status-dot">Local data only</span>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span>01</span> UNOFFICIAL FAN TOOL</p>
            <h1><span className="seo-title">Genshin Wish Simulator</span>Turn hope into<br /><em>a plan.</em></h1>
            <p className="lede">Run a character-event wish simulation, calculate your pity and 50/50 odds, and see whether your primogem budget can carry you to the featured 5★.</p>
            <div className="hero-actions">
              <a className="button primary" href="#simulator">Open simulator <span>↘</span></a>
              <a className="text-link" href="#planner">Plan before you pull →</a>
            </div>
          </div>
          <div className="orbital" aria-label="Current planning snapshot">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="planet">
              <span>EST. CHANCE</span>
              <strong>{Math.round(chance * 100)}%</strong>
              <small>with projected wishes</small>
            </div>
            <span className="orbit-label label-a">PITY {stored.state.pity5}/90</span>
            <span className="orbit-label label-b">{projectedWishes} WISHES</span>
          </div>
        </section>

        <section className="ticker" aria-label="Tool highlights">
          <span>NO LOGIN</span><b>✦</b><span>LOCAL HISTORY</span><b>✦</b><span>PITY PLANNING</span><b>✦</b><span>FAN-MADE TOOL</span>
        </section>

        <section className="workspace" id="simulator">
          <div className="section-heading">
            <p className="eyebrow"><span>02</span> SIMULATION DECK</p>
            <h2>Test your character wishes.</h2>
            <p>Set your real pity and guarantee, then run a single or ten-pull rehearsal. Nothing here connects to a game account.</p>
          </div>

          <div className="sim-grid">
            <aside className="control-panel">
              <div className="panel-label">STARTING CONDITIONS</div>
              <label>
                <span>5★ pity <output>{stored.state.pity5}</output></span>
                <input type="range" min="0" max="89" value={stored.state.pity5} onChange={(event) => updateState({ pity5: Number(event.target.value) })} />
              </label>
              <label>
                <span>4★ pity <output>{stored.state.pity4}</output></span>
                <input type="range" min="0" max="9" value={stored.state.pity4} onChange={(event) => updateState({ pity4: Number(event.target.value) })} />
              </label>
              <button className={`guarantee ${stored.state.guaranteed ? 'active' : ''}`} onClick={() => updateState({ guaranteed: !stored.state.guaranteed })} aria-pressed={stored.state.guaranteed}>
                <span className="toggle"><i /></span>
                <span><b>Featured guarantee</b><small>{stored.state.guaranteed ? 'Your next 5★ is featured' : 'Next 5★ starts at 50/50'}</small></span>
              </button>
              <div className="meter-copy"><span>NEXT 5★ HARD PITY</span><strong>{90 - stored.state.pity5} pulls</strong></div>
              <div className="meter"><i style={{ width: `${(stored.state.pity5 / 90) * 100}%` }} /></div>
            </aside>

            <div className="wish-stage">
              <div className="stage-top">
                <span>CHARACTER EVENT · MODEL A</span>
                <span>SESSION {String(stored.total).padStart(3, '0')}</span>
              </div>
              <div className="result-field">
                {latest.length === 0 ? (
                  <div className="empty-result"><span>✦</span><h3>Your next constellation<br />is unwritten.</h3><p>Run a single or ten-wish rehearsal.</p></div>
                ) : (
                  <div className={`result-row count-${latest.length}`}>
                    {latest.map((item) => (
                      <article className={`wish-card rarity-${item.rarity}`} key={item.id}>
                        <span className="rarity-stars">{'★'.repeat(item.rarity)}</span>
                        <div className="sigil">{item.rarity === 5 ? '✦' : item.rarity === 4 ? '✧' : '◇'}</div>
                        <strong>{item.rarity}★ {item.rarity === 5 && item.featured ? 'Featured' : 'Result'}</strong>
                        <small>{item.rarity === 5 ? `Arrived at pity ${item.pity}` : `Wish #${item.number}`}</small>
                      </article>
                    ))}
                  </div>
                )}
              </div>
              <div className="pull-actions">
                <button onClick={() => pull(1)}><small>SINGLE REHEARSAL</small><strong>Make 1 wish</strong><span>160 ◈</span></button>
                <button className="ten-pull" onClick={() => pull(10)}><small>FULL CONSTELLATION</small><strong>Make 10 wishes</strong><span>1,600 ◈</span></button>
              </div>
            </div>
          </div>
        </section>

        <section className="planner-section" id="planner">
          <div className="section-heading light">
            <p className="eyebrow"><span>03</span> PRIMOGEM FLIGHT PLAN</p>
            <h2>Calculate pity and primogems.</h2>
          </div>
          <div className="planner-grid">
            <div className="planner-form">
              <label><span>Primogems on hand</span><input type="number" min="0" value={primogems} onChange={(event) => setPrimogems(clamp(Number(event.target.value), 0, 9999999))} /></label>
              <label><span>Estimated daily income</span><input type="number" min="0" value={dailyIncome} onChange={(event) => setDailyIncome(clamp(Number(event.target.value), 0, 10000))} /></label>
              <label><span>Days remaining</span><input type="number" min="0" value={daysLeft} onChange={(event) => setDaysLeft(clamp(Number(event.target.value), 0, 365))} /></label>
              <label><span>Target copies</span><select value={copies} onChange={(event) => setCopies(Number(event.target.value))}><option value="1">C0 · one copy</option><option value="2">C1 · two copies</option><option value="3">C2 · three copies</option></select></label>
              <p className="form-note">Uses your simulator pity and guarantee above. Income is a personal estimate—not a promise of future rewards.</p>
            </div>
            <div className="forecast">
              <div className="forecast-ring" style={{ '--chance': `${Math.round(chance * 100) * 3.6}deg` } as React.CSSProperties}>
                <div><strong>{Math.round(chance * 100)}%</strong><span>estimated chance</span></div>
              </div>
              <div className="forecast-copy">
                <span className="forecast-status">{status}</span>
                <h3>{projectedWishes} projected wishes</h3>
                <p>{projectedPrimogems.toLocaleString()} primogems by the end of your plan. The simplified model estimates your chance of reaching {copies === 1 ? 'one featured 5★' : `${copies} featured copies`}.</p>
                <div className="forecast-facts"><span><small>WORST-CASE GAP</small><b>{Math.max(0, worstCase - projectedWishes)} wishes</b></span><span><small>GUARANTEE</small><b>{stored.state.guaranteed ? 'Active' : '50/50'}</b></span></div>
                <button className="copy-button" onClick={sharePlan}>{copied ? 'Plan copied ✓' : 'Copy planning summary'}</button>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="section-heading">
            <p className="eyebrow"><span>04</span> OBSERVATION LOG</p>
            <h2>Your session, decoded.</h2>
          </div>
          <div className="stat-strip">
            <article><span>TOTAL WISHES</span><strong>{stored.total}</strong><small>This browser</small></article>
            <article><span>5★ SIGHTINGS</span><strong>{stored.fiveStarCount}</strong><small>{stored.total ? `${((stored.fiveStarCount / stored.total) * 100).toFixed(1)}% observed` : 'No sample yet'}</small></article>
            <article><span>AVERAGE PITY</span><strong>{averagePity || '—'}</strong><small>Across 5★ results</small></article>
            <article><span>CURRENT STREAK</span><strong>{stored.state.pity5}</strong><small>Since last 5★</small></article>
          </div>
          <div className="history-table">
            <div className="history-head"><span>RECENT SIGNALS</span><button onClick={reset}>Reset local session</button></div>
            {stored.history.length === 0 ? <p className="empty-history">Your latest 4★ and 5★ observations will appear here.</p> : stored.history.filter((item) => item.rarity >= 4).slice(0, 8).map((item) => (
              <div className="history-row" key={item.id}><span className={`history-icon rarity-${item.rarity}`}>{item.rarity === 5 ? '✦' : '✧'}</span><b>{item.rarity}★ {item.featured ? 'Featured signal' : 'Standard signal'}</b><span>Wish #{item.number}</span><span>{item.rarity === 5 ? `Pity ${item.pity}` : '4★ result'}</span></div>
            ))}
          </div>
        </section>

        <section className="method" id="method">
          <div>
            <p className="eyebrow"><span>05</span> READ THE INSTRUMENTS</p>
            <h2>How the wish probability calculator works.</h2>
          </div>
          <div className="method-copy">
            <p>This Genshin pity calculator models a character event banner with a 0.6% base 5★ rate, 90-wish hard pity, a 50/50 featured check, and a guarantee after losing that check. A 4★ or higher is forced by the tenth wish.</p>
            <p><strong>Soft pity is intentionally labelled approximate.</strong> The curve used here begins after wish 73 and rises by six percentage points per wish. It is a transparent planning model, not a claim about unpublished server code.</p>
            <div className="method-cards"><span><b>01</b> Set your real pity</span><span><b>02</b> Estimate future income</span><span><b>03</b> Compare chance and worst case</span></div>
          </div>
        </section>

        <section className="guide" aria-labelledby="wish-guide-title">
          <div className="section-heading">
            <p className="eyebrow"><span>06</span> QUICK ANSWERS</p>
            <h2 id="wish-guide-title">Plan a character guarantee.</h2>
            <p>Use these answers to interpret the simulator before deciding how many wishes to reserve.</p>
          </div>
          <div className="guide-grid">
            <article>
              <h3>How many pulls guarantee a character?</h3>
              <p>From zero pity and without an active guarantee, the worst case is 180 wishes: one 90-wish hard pity to lose the 50/50, then another to secure the featured character. An active guarantee reduces that ceiling to 90, and your current pity lowers it further.</p>
            </article>
            <article>
              <h3>What does the 50/50 simulator calculate?</h3>
              <p>When a 5★ arrives without a guarantee, the model gives the featured character a 50% chance. Losing that check marks the next 5★ as guaranteed. The planner follows both possible paths when estimating your overall chance.</p>
            </article>
            <article>
              <h3>How are primogems converted to wishes?</h3>
              <p>One wish costs 160 primogems. The planner combines your current balance with your estimated daily income, converts only complete wishes, and compares the result with your pity, guarantee, and target copies.</p>
            </article>
            <article>
              <h3>Does this include the weapon banner?</h3>
              <p>No. This release models the character event banner only. Weapon banner rules and fate-point mechanics are different, so they should not be estimated with this character probability model.</p>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <div className="brand"><span className="brand-mark">✦</span><span>ASTRAL <b>WISH LAB</b></span></div>
        <p>Unofficial fan-made planning tool. Not affiliated with, endorsed by, or sponsored by HoYoverse. No official logos, character art, account credentials, or game data are used.</p>
        <a href="#top">Back to orbit ↑</a>
      </footer>
    </div>
  )
}

export default App
