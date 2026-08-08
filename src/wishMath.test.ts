import { describe, expect, it } from 'vitest'
import { chanceForFeaturedCopies, fiveStarRate, initialBannerState, makeBannerWish, primogemsToWishes } from './wishMath'

describe('multi-banner wish mechanics', () => {
  it('forces character five star on wish 90', () => {
    const result = makeBannerWish('character', { ...initialBannerState, pity5: 89, guaranteed5: true }, () => 0.99)
    expect(result.result.rarity).toBe(5)
    expect(result.result.featured).toBe(true)
  })

  it('turns a lost character 50/50 into a guarantee', () => {
    const values = [0, 0.9, 0]
    const result = makeBannerWish('character', { ...initialBannerState, pity5: 89 }, () => values.shift() ?? 0)
    expect(result.result.featured).toBe(false)
    expect(result.state.guaranteed5).toBe(true)
  })

  it('forces weapon five star at 80 and chosen path after one miss', () => {
    const first = makeBannerWish('weapon', { ...initialBannerState, pity5: 79, pathItemId: 'astral-codex' }, () => 0.99)
    expect(first.result.rarity).toBe(5)
    expect(first.state.fatePoint).toBe(1)
    const second = makeBannerWish('weapon', { ...first.state, pity5: 79 }, () => 0.99)
    expect(second.result.item.id).toBe('astral-codex')
    expect(second.state.fatePoint).toBe(0)
  })

  it('standard wishes never use featured guarantees', () => {
    const result = makeBannerWish('standard', { ...initialBannerState, pity5: 89, guaranteed5: true }, () => 0.2)
    expect(result.result.featured).toBe(false)
    expect(result.state.guaranteed5).toBe(false)
  })

  it('carries a lost character four-star featured check into a guarantee', () => {
    const firstValues = [0.99, 0.99, 0.9, 0]
    const first = makeBannerWish('character', { ...initialBannerState, pity4: 9 }, () => firstValues.shift() ?? 0)
    expect(first.result.rarity).toBe(4)
    expect(first.result.featured).toBe(false)
    expect(first.state.guaranteed4).toBe(true)

    const secondValues = [0.99, 0.99, 0]
    const second = makeBannerWish('character', { ...first.state, pity4: 9 }, () => secondValues.shift() ?? 0)
    expect(second.result.rarity).toBe(4)
    expect(second.result.featured).toBe(true)
    expect(second.state.guaranteed4).toBe(false)
  })

  it('returns concrete items for every banner rarity path', () => {
    for (const type of ['character', 'weapon', 'standard'] as const) {
      const five = makeBannerWish(type, { ...initialBannerState, pity5: type === 'weapon' ? 79 : 89 }, () => 0)
      const four = makeBannerWish(type, { ...initialBannerState, pity4: 9 }, () => 0.99)
      const three = makeBannerWish(type, initialBannerState, () => 0.99)
      expect(five.result.item.rarity).toBe(5)
      expect(four.result.item.rarity).toBe(4)
      expect(three.result.item.rarity).toBe(3)
    }
  })

  it('supports planner conversion and certainty', () => {
    expect(primogemsToWishes(319)).toBe(1)
    expect(chanceForFeaturedCopies(180, 1, { pity5: 0, guaranteed5: false })).toBe(1)
    expect(fiveStarRate(79, 'weapon')).toBe(1)
  })
})
