import { describe, expect, it, vi } from 'vitest'
import { initialStoredData } from './storage'
import { createPullTransaction } from './pullTransaction'

describe('pull transactions', () => {
  it('records sequential ownership for repeated batch results', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const seeded = { ...initialStoredData, inventory: [{ itemId: 'field-notes', count: 1 }] }
    const transaction = createPullTransaction(seeded, 'standard', 2, () => 'id')
    expect(transaction.additions.map((entry) => entry.itemId)).toEqual(['field-notes', 'field-notes'])
    expect(transaction.additions.map((entry) => entry.ownershipCount)).toEqual([2, 3])
    expect(transaction.data.inventory.find((entry) => entry.itemId === 'field-notes')?.count).toBe(3)
    random.mockRestore()
  })
})
