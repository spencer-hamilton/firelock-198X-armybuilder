import { useState, useCallback, useMemo } from 'react'
import './App.css'
import generics from './data/unitLibrary.js'
import fedlist from './data/federalLibrary.js'
import luplist from './data/luparLibrary.js'
import rygolist from './data/rygolicLibrary.js'
import santalist from './data/santagriLibrary.js'
import peoplenames from './data/characterNames.js'

const ALL_UNITS = fedlist.concat(luplist, rygolist, santalist, generics)

const FACTIONS = [
  { id: 'federal', label: 'Intermarine Federation' },
  { id: 'lupar', label: 'Kingdom of the Ebon Forest' },
  { id: 'rygolic', label: 'New Rygolic Host' },
  { id: 'santagri', label: 'Atom Baronies of Santagria' },
]

const UNIT_TYPES = [
  { id: 'Infantry', label: 'Infantry' },
  { id: 'Vehicle', label: 'Vehicle' },
  { id: 'Helicopter', label: 'Helicopter' },
  { id: 'Aircraft', label: 'Aircraft' },
]

const TRAITS = [
  { id: 'TACOM', label: 'TACOM', filter: u => u.tags.some(t => t.rule === 'TACOM') },
  { id: 'PC', label: 'Personnel Carrier', filter: u => u.tags.some(t => t.rule === 'PC') },
  { id: 'Tow', label: 'Tow', filter: u => u.tags.some(t => t.rule === 'Tow') },
  { id: 'Resupply', label: 'Resupply', filter: u => u.tags.some(t => t.rule === 'Resupply') },
  { id: 'Amphibious', label: 'Amphibious / Watercraft', filter: u => u.type.sub.some(s => s.includes('Watercraft')) || u.tags.some(t => t.rule === 'Amphibious') },
  { id: 'Paradrop', label: 'Paradrop / Infiltrator', filter: u => u.tags.some(t => t.rule === 'Paradrop' || t.rule === 'Infiltrator') },
  { id: 'Assault', label: 'Assault Specialist', filter: u => u.tags.some(t => t.rule === 'Assault Specialist' || t.rule === 'Assault Dismount') },
]

let nextId = 1

function App() {
  const [workingList, setArmyList] = useState([])
  const [factionFilters, setFactionFilters] = useState(() => new Set(FACTIONS.map(f => f.id)))
  const [typeFilters, setTypeFilters] = useState(() => new Set(UNIT_TYPES.map(t => t.id)))
  const [traitFilters, setTraitFilters] = useState(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [detailUnit, setDetailUnit] = useState(null)

  const toggleFilter = useCallback((set, setFn, id) => {
    setFn(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const filteredLibrary = useMemo(() => {
    let units = ALL_UNITS
    units = units.filter(u => u.faction.some(f => factionFilters.has(f)))
    units = units.filter(u => u.type.super.some(s => typeFilters.has(s)))
    for (const trait of TRAITS) {
      if (traitFilters.has(trait.id)) {
        units = units.filter(trait.filter)
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      units = units.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.type.super.some(s => s.toLowerCase().includes(q)) ||
        u.type.sub.some(s => s.toLowerCase().includes(q)) ||
        u.tags.some(t => t.rule.toLowerCase().includes(q)) ||
        u.weapons.some(w => w.weaponName.toLowerCase().includes(q))
      )
    }
    return units
  }, [factionFilters, typeFilters, traitFilters, searchQuery])

  const totals = useMemo(() => {
    let points = 0, tacom = 0, command = 0
    for (const entry of workingList) {
      points += entry.unitData.value
      command += entry.unitData.command
      if (entry.unitData.tags.some(t => t.rule === 'TACOM') &&
          !entry.unitData.tags.some(t => t.params === 'Additional')) {
        tacom++
      }
    }
    return { points, tacom, command }
  }, [workingList])

  const addUnit = useCallback((unit) => {
    setArmyList(prev => [...prev, {
      unitNum: nextId++,
      unitData: unit,
      unitCallsign: generateCallsign(),
      unitLeader: generateName(unit.faction),
      unitTransport: null,
    }])
  }, [])

  const removeUnit = useCallback((index) => {
    setArmyList(prev => prev.filter((_, i) => i !== index))
  }, [])

  const editCallsign = useCallback((index) => {
    setArmyList(prev => {
      const entry = prev[index]
      const newCallsign = prompt("What is this unit's callsign?", entry.unitCallsign)
      if (newCallsign == null) return prev
      const next = [...prev]
      next[index] = { ...entry, unitCallsign: newCallsign }
      return next
    })
  }, [])

  const clearList = useCallback(() => setArmyList([]), [])

  const handleExport = useCallback(() => {
    let text = ''
    let cost = 0
    for (const u of workingList) {
      const leader = u.unitData.tags.some(t => t.rule === 'TACOM') ? `, ${u.unitLeader}` : ''
      text += `\r\n ${u.unitData.name} (${u.unitCallsign}${leader}) [${u.unitData.value} pts]`
      cost += u.unitData.value
    }
    text += `\r\nTotal Point Value: ${cost}`
    navigator.clipboard.writeText(text).then(
      () => alert('Copied to clipboard!'),
      () => alert('Failed to copy.')
    )
  }, [workingList])

  const generateAllNames = useCallback(() => {
    setArmyList(prev => prev.map(entry => ({
      ...entry,
      unitCallsign: entry.unitCallsign || generateCallsign(),
      unitLeader: entry.unitLeader || generateName(entry.unitData.faction),
    })))
  }, [])

  return (
    <>
      <header className="app-header">
        <h1>Firelock 198X</h1>
        <p>Army List Builder &middot; Edition 0.9.6</p>
      </header>

      {/* ── Filters ── */}
      <section className="filters-section">
        <div className="filter-group">
          <span className="filter-label">Faction</span>
          <div className="filter-pills">
            {FACTIONS.map(f => (
              <label
                key={f.id}
                className={`filter-pill pill-${f.id} ${factionFilters.has(f.id) ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={factionFilters.has(f.id)}
                  onChange={() => toggleFilter(factionFilters, setFactionFilters, f.id)}
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Unit Type</span>
          <div className="filter-pills">
            {UNIT_TYPES.map(t => (
              <label
                key={t.id}
                className={`filter-pill ${typeFilters.has(t.id) ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={typeFilters.has(t.id)}
                  onChange={() => toggleFilter(typeFilters, setTypeFilters, t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Must Have</span>
          <div className="filter-pills">
            {TRAITS.map(t => (
              <label
                key={t.id}
                className={`filter-pill ${traitFilters.has(t.id) ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={traitFilters.has(t.id)}
                  onChange={() => toggleFilter(traitFilters, setTraitFilters, t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main two-panel layout ── */}
      <div className="main-layout">
        {/* Library Panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Unit Library</span>
            <span className="panel-count">{filteredLibrary.length} units</span>
          </div>
          <div className="search-bar">
            <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search units, weapons, traits..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>&times;</button>
            )}
          </div>
          <div className="panel-body">
            {filteredLibrary.map((unit, index) => (
              <div className="unit-card" key={index}>
                <span className={`faction-dot ${unit.faction[0]}`} />
                <div className="unit-card-info" onClick={() => setDetailUnit(unit)}>
                  <div className="unit-name">{unit.name}</div>
                  <div className="unit-meta">
                    {unit.type.super.join(', ')} ({unit.type.sub.join(', ')})
                  </div>
                </div>
                <span className="unit-points">{unit.value} pts</span>
                <button className="add-btn" onClick={() => addUnit(unit)}>+</button>
              </div>
            ))}
          </div>
        </div>

        {/* Army List Panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Army List</span>
            {workingList.length > 0 && (
              <span className="panel-count">{workingList.length} units</span>
            )}
          </div>
          <div className="panel-body">
            {workingList.length === 0 ? (
              <div className="army-empty">
                <div className="army-empty-icon">+</div>
                <p>Add units from the library to build your army.</p>
              </div>
            ) : (
              workingList.map((entry, index) => (
                <div className="army-card" key={entry.unitNum}>
                  <span className={`faction-dot ${entry.unitData.faction[0]}`} />
                  <div className="army-card-info" onClick={() => editCallsign(index)}>
                    <div className="unit-name">{entry.unitData.name}</div>
                    <div className="army-callsign">
                      {entry.unitCallsign} {entry.unitLeader}
                    </div>
                  </div>
                  <span className="army-points">{entry.unitData.value} pts</span>
                  <button className="remove-btn" onClick={() => removeUnit(index)}>&#x2715;</button>
                </div>
              ))
            )}
          </div>
          {workingList.length > 0 && (
            <div className="panel-footer">
              <div className="army-stats">
                <div className="stat">
                  <span className="stat-value">{totals.points}</span>
                  <span className="stat-label">Points</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{totals.tacom}</span>
                  <span className="stat-label">TACOM</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{totals.command}</span>
                  <span className="stat-label">Cmd / Turn</span>
                </div>
              </div>
              <div className="army-actions">
                <button className="action-btn primary" onClick={handleExport}>
                  Export to Clipboard
                </button>
                <button className="action-btn" onClick={generateAllNames}>
                  Generate Names
                </button>
                <button className="action-btn destructive" onClick={clearList}>
                  Clear List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="app-footer">
        Source: <a href="https://github.com/nullAurelian/firelock-198X-armybuilder" target="_blank" rel="noreferrer">
          nullAurelian/firelock-198X-armybuilder
        </a>
      </footer>

      {/* ── Unit Detail Modal ── */}
      {detailUnit && (
        <div className="modal-overlay" onClick={() => setDetailUnit(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{detailUnit.name}</h2>
                <div className="modal-subtitle">
                  <span className={`faction-dot ${detailUnit.faction[0]}`} />
                  <span className="modal-faction">{FACTIONS.find(f => f.id === detailUnit.faction[0])?.label ?? detailUnit.faction[0]}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetailUnit(null)}>&times;</button>
            </div>

            <div className="modal-overview">
              <div className="overview-item">
                <span className="overview-value">{detailUnit.value}</span>
                <span className="overview-label">Points</span>
              </div>
              <div className="overview-item">
                <span className="overview-value">{detailUnit.command}</span>
                <span className="overview-label">Command</span>
              </div>
              <div className="overview-item">
                <span className="overview-value">{detailUnit.type.super.join(', ')}</span>
                <span className="overview-label">Type</span>
              </div>
              <div className="overview-item">
                <span className="overview-value">{detailUnit.type.sub.join(', ')}</span>
                <span className="overview-label">Subtype</span>
              </div>
            </div>

            {Array.isArray(detailUnit.stats) && (
              <div className="modal-section">
                <div className="modal-section-title">Stats</div>
                <div className="stat-grid">
                  {detailUnit.stats.map((s, i) => (
                    <div className="stat-chip" key={i}>{s}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-section">
              <div className="modal-section-title">Traits</div>
              <div className="trait-list">
                {detailUnit.tags.map((tag, i) => (
                  <span className="modal-tag" key={i}>
                    {tag.rule}{tag.params ? ` (${tag.params})` : ''}
                  </span>
                ))}
              </div>
            </div>

            {detailUnit.weapons.some(w => w.weaponName) && (
              <div className="modal-section">
                <div className="modal-section-title">Weapons</div>
                {detailUnit.weapons.filter(w => w.weaponName).map((weapon, wi) => (
                  <div className="weapon-block" key={wi}>
                    <div className="weapon-header">
                      <span className="weapon-name">{weapon.weaponName}</span>
                      {weapon.weaponAmmo && <span className="weapon-ammo">Ammo: {weapon.weaponAmmo}</span>}
                    </div>
                    {weapon.attacks.map((atk, ai) => (
                      <div className="attack-entry" key={ai}>
                        {atk.attackName && <div className="attack-name">{atk.attackName}</div>}
                        <div className="attack-stats">
                          {atk.attackRange && <span className="attack-stat"><b>Range</b> {atk.attackRange}</span>}
                          {atk.attackAccuracy && <span className="attack-stat"><b>Acc</b> {atk.attackAccuracy}</span>}
                          {atk.attackStrength && <span className="attack-stat"><b>Str</b> {atk.attackStrength}</span>}
                          {atk.attackDice && <span className="attack-stat"><b>Dice</b> {atk.attackDice}</span>}
                        </div>
                        {atk.attackTags?.length > 0 && atk.attackTags[0] && (
                          <div className="attack-tag-list">
                            {(Array.isArray(atk.attackTags) ? atk.attackTags : [atk.attackTags]).map((t, ti) => (
                              t && <span className="attack-tag-chip" key={ti}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-action-row">
              <button className="action-btn primary" onClick={() => { addUnit(detailUnit); setDetailUnit(null) }}>
                Add to Army
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function generateCallsign() {
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ'.split('')
  const vowels = 'AEIOUY'.split('')
  const c = () => consonants[Math.floor(Math.random() * consonants.length)]
  const v = () => vowels[Math.floor(Math.random() * vowels.length)]
  return `${c()}${v()}${c()}-${Math.round(Math.random() * 10)}`
}

function generateName(faction) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  switch (faction[0]) {
    case 'federal':
      return pick(peoplenames.federal.firstNames) + pick(peoplenames.federal.lastNames)
    case 'lupar':
      return pick(peoplenames.lupar.firstNames) + pick(peoplenames.lupar.lastNames)
    case 'santagri':
      return pick(peoplenames.santagri.firstNames) + pick(peoplenames.santagri.lastNames)
    default:
      return ''
  }
}

export default App
