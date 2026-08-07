import { describe, expect, it } from 'vitest'
import { initialStoredData, normalizeStoredData, readStoredData, writeStoredData } from './storage'

describe('wish storage', () => {
  it('falls back when saved JSON has the wrong shape', () => {
    expect(normalizeStoredData({})).toEqual(initialStoredData)
  })

  it('migrates retained history into aggregate statistics', () => {
    const normalized = normalizeStoredData({
      state: { pity5: 2, pity4: 3, guaranteed: false },
      total: 10,
      history: [{ id: 'five', number: 8, rarity: 5, featured: true, pity: 8 }],
    })
    expect(normalized.fiveStarCount).toBe(1)
    expect(normalized.fiveStarPityTotal).toBe(8)
  })

  it('survives denied reads and writes', () => {
    const deniedRead = { getItem: () => { throw new Error('denied') } }
    const deniedWrite = { setItem: () => { throw new Error('denied') } }
    expect(readStoredData(deniedRead)).toEqual(initialStoredData)
    expect(writeStoredData(initialStoredData, deniedWrite)).toBe(false)
  })
})
