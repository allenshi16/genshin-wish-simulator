import { describe, expect, it } from 'vitest'
import { initialStoredData, normalizeStoredData, readStoredData, writeStoredData } from './storage'

describe('v2 wish storage', () => {
  it('falls back for malformed data', () => expect(normalizeStoredData({})).toEqual(initialStoredData))

  it('migrates legacy character pity', () => {
    const storage = { getItem: (key: string) => key.endsWith(':v1') ? JSON.stringify({ state: { pity5: 42, pity4: 6, guaranteed: true }, total: 77 }) : null }
    const migrated = readStoredData(storage)
    expect(migrated.states.character.pity5).toBe(42)
    expect(migrated.states.character.guaranteed5).toBe(true)
    expect(migrated.total).toBe(77)
  })

  it('normalizes inventory and concrete history', () => {
    const data = normalizeStoredData({ ...initialStoredData, inventory: [{ itemId: 'solenne', count: 2 }, { itemId: 'solenne', count: 3 }], history: [{ id: 'x', number: 1, banner: 'character', itemId: 'solenne', featured: true, pity: 1, ownershipCount: 2 }] })
    expect(data.inventory).toEqual([{ itemId: 'solenne', count: 5 }])
    expect(data.history[0].itemName).toBe('Solenne')
    expect(data.history[0].ownershipCount).toBe(2)
  })

  it('rejects off-banner weapon path targets', () => {
    const data = normalizeStoredData({ ...initialStoredData, states: { ...initialStoredData.states, weapon: { ...initialStoredData.states.weapon, pathItemId: 'verdant-oath' } } })
    expect(data.states.weapon.pathItemId).toBe('astral-codex')
  })

  it('survives denied storage', () => {
    expect(readStoredData({ getItem: () => { throw new Error('denied') } })).toEqual(initialStoredData)
    expect(writeStoredData(initialStoredData, { setItem: () => { throw new Error('denied') } })).toBe(false)
  })
})
