import { describe, expect, it } from 'vitest'
import { chanceForFeatured, chanceForFeaturedCopies, fiveStarRate, makeWish, primogemsToWishes } from './wishMath'

describe('wish mechanics', () => {
  it('forces a five star on the 90th wish', () => {
    expect(fiveStarRate(89)).toBe(1)
    const outcome = makeWish({ pity5: 89, pity4: 0, guaranteed: true }, () => 0.99)
    expect(outcome.result.rarity).toBe(5)
    expect(outcome.result.featured).toBe(true)
  })

  it('turns a lost featured check into a guarantee', () => {
    const values = [0, 0.9]
    const outcome = makeWish({ pity5: 89, pity4: 0, guaranteed: false }, () => values.shift() ?? 0)
    expect(outcome.result.featured).toBe(false)
    expect(outcome.state.guaranteed).toBe(true)
  })

  it('converts only complete wishes', () => {
    expect(primogemsToWishes(319)).toBe(1)
  })

  it('reaches certainty within two hard pities', () => {
    expect(chanceForFeatured(180, { pity5: 0, guaranteed: false })).toBeCloseTo(1, 8)
  })

  it('keeps lost 50/50 branches on their reset pity track', () => {
    const chance = chanceForFeatured(91, { pity5: 89, guaranteed: false })
    expect(chance).toBeCloseTo(1, 8)
  })

  it('models multiple target copies instead of reusing the one-copy chance', () => {
    const oneCopyChance = chanceForFeaturedCopies(90, 1, { pity5: 0, guaranteed: true })
    const twoCopyChance = chanceForFeaturedCopies(90, 2, { pity5: 0, guaranteed: true })
    expect(twoCopyChance).toBeGreaterThan(0)
    expect(twoCopyChance).toBeLessThan(oneCopyChance)
    expect(chanceForFeaturedCopies(270, 2, { pity5: 0, guaranteed: true })).toBeCloseTo(1, 8)
  })

  it('short-circuits planner inputs beyond the mathematical worst case', () => {
    expect(chanceForFeaturedCopies(85312, 3, { pity5: 0, guaranteed: false })).toBe(1)
  })
})
