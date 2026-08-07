export type Rarity = 3 | 4 | 5

export interface WishState {
  pity5: number
  pity4: number
  guaranteed: boolean
}

export interface WishResult {
  rarity: Rarity
  featured: boolean
  pity: number
}

export function fiveStarRate(pity: number): number {
  if (pity >= 89) return 1
  if (pity < 73) return 0.006
  return Math.min(1, 0.006 + (pity - 72) * 0.06)
}

export function fourStarRate(pity: number): number {
  if (pity >= 9) return 1
  return 0.051
}

export function makeWish(state: WishState, random = Math.random): { state: WishState; result: WishResult } {
  const nextPity5 = state.pity5 + 1
  const nextPity4 = state.pity4 + 1

  if (random() < fiveStarRate(state.pity5)) {
    const featured = state.guaranteed || random() < 0.5
    return {
      state: { pity5: 0, pity4: nextPity4 >= 10 ? 0 : nextPity4, guaranteed: !featured },
      result: { rarity: 5, featured, pity: nextPity5 },
    }
  }

  if (random() < fourStarRate(state.pity4)) {
    return {
      state: { pity5: nextPity5, pity4: 0, guaranteed: state.guaranteed },
      result: { rarity: 4, featured: random() < 0.5, pity: nextPity4 },
    }
  }

  return {
    state: { pity5: nextPity5, pity4: nextPity4, guaranteed: state.guaranteed },
    result: { rarity: 3, featured: false, pity: nextPity5 },
  }
}

export function chanceForFeatured(wishes: number, state: Pick<WishState, 'pity5' | 'guaranteed'>): number {
  return chanceForFeaturedCopies(wishes, 1, state)
}

export function chanceForFeaturedCopies(
  wishes: number,
  copies: number,
  state: Pick<WishState, 'pity5' | 'guaranteed'>,
): number {
  const target = Math.max(1, Math.floor(copies))
  const firstCopyWorstCase = (state.guaranteed ? 90 : 180) - state.pity5
  const worstCaseWishes = firstCopyWorstCase + (target - 1) * 180
  if (wishes >= worstCaseWishes) return 1

  let branches = new Map<string, number>([[`${state.pity5}:${state.guaranteed ? 1 : 0}:0`, 1]])

  for (let index = 0; index < wishes; index += 1) {
    const nextBranches = new Map<string, number>()

    for (const [key, weight] of branches) {
      const [pityText, guaranteedText, copiesText] = key.split(':')
      const pity = Number(pityText)
      const guaranteed = guaranteedText === '1'
      const featuredCopies = Number(copiesText)
      const rate = fiveStarRate(pity)
      const missKey = `${pity + 1}:${guaranteed ? 1 : 0}:${featuredCopies}`
      nextBranches.set(missKey, (nextBranches.get(missKey) ?? 0) + weight * (1 - rate))

      if (guaranteed) {
        const featuredKey = `0:0:${Math.min(target, featuredCopies + 1)}`
        nextBranches.set(featuredKey, (nextBranches.get(featuredKey) ?? 0) + weight * rate)
      } else {
        const lostKey = `0:1:${featuredCopies}`
        nextBranches.set(lostKey, (nextBranches.get(lostKey) ?? 0) + weight * rate * 0.5)
        const featuredKey = `0:0:${Math.min(target, featuredCopies + 1)}`
        nextBranches.set(featuredKey, (nextBranches.get(featuredKey) ?? 0) + weight * rate * 0.5)
      }
    }

    branches = nextBranches
  }

  const success = [...branches.entries()].reduce((sum, [key, weight]) => {
    const featuredCopies = Number(key.split(':')[2])
    return featuredCopies >= target ? sum + weight : sum
  }, 0)
  return Math.max(0, Math.min(1, success))
}

export function wishesToPrimogems(wishes: number): number {
  return wishes * 160
}

export function primogemsToWishes(primogems: number): number {
  return Math.floor(Math.max(0, primogems) / 160)
}
