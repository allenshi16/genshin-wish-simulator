import { getBanner, getItem, type BannerType, type CatalogItem } from './bannerCatalog'

export type Rarity = 3 | 4 | 5

export interface BannerState {
  pity5: number
  pity4: number
  guaranteed5: boolean
  guaranteed4: boolean
  fatePoint: number
  pathItemId: string | null
}

export interface WishResult {
  item: CatalogItem
  rarity: Rarity
  featured: boolean
  pity: number
}

export const initialBannerState: BannerState = {
  pity5: 0, pity4: 0, guaranteed5: false, guaranteed4: false, fatePoint: 0, pathItemId: null,
}

export function fiveStarRate(pity: number, type: BannerType = 'character'): number {
  const hardPity = type === 'weapon' ? 80 : 90
  const baseRate = type === 'weapon' ? 0.007 : 0.006
  const softStart = type === 'weapon' ? 62 : 73
  const increase = type === 'weapon' ? 0.07 : 0.06
  if (pity >= hardPity - 1) return 1
  if (pity < softStart) return baseRate
  return Math.min(1, baseRate + (pity - softStart + 1) * increase)
}

export function fourStarRate(pity: number): number {
  return pity >= 9 ? 1 : 0.051
}

function choose<T>(items: T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]
}

function pool(type: BannerType, rarity: Rarity, featured: boolean): CatalogItem[] {
  const banner = getBanner(type)
  const featuredSet = new Set(banner.featuredIds)
  return banner.poolIds.map(getItem).filter((item) => item.rarity === rarity && (featured ? featuredSet.has(item.id) : !featuredSet.has(item.id)))
}

export function makeBannerWish(
  type: BannerType,
  state: BannerState,
  random = Math.random,
): { state: BannerState; result: WishResult } {
  const nextPity5 = state.pity5 + 1
  const nextPity4 = state.pity4 + 1

  if (random() < fiveStarRate(state.pity5, type)) {
    let featured = false
    let item: CatalogItem
    let guaranteed5 = false
    let fatePoint = state.fatePoint

    if (type === 'character') {
      featured = state.guaranteed5 || random() < 0.5
      item = choose(pool(type, 5, featured), random)
      guaranteed5 = !featured
    } else if (type === 'weapon') {
      const forcedPath = state.fatePoint >= 1 && state.pathItemId
      if (forcedPath) {
        item = getItem(forcedPath)
        featured = true
      } else {
        featured = state.guaranteed5 || random() < 0.75
        item = choose(pool(type, 5, featured), random)
      }
      guaranteed5 = !featured
      fatePoint = state.pathItemId && item.id !== state.pathItemId ? 1 : 0
    } else {
      item = choose(pool(type, 5, false), random)
    }

    return {
      state: { ...state, pity5: 0, pity4: nextPity4 >= 10 ? 0 : nextPity4, guaranteed5, fatePoint },
      result: { item, rarity: 5, featured, pity: nextPity5 },
    }
  }

  if (random() < fourStarRate(state.pity4)) {
    const hasFeaturedFour = type !== 'standard'
    const featured = hasFeaturedFour && (state.guaranteed4 || random() < (type === 'weapon' ? 0.75 : 0.5))
    const featuredPool = pool(type, 4, featured)
    const fallbackPool = pool(type, 4, false)
    const item = choose(featuredPool.length ? featuredPool : fallbackPool, random)
    return {
      state: { ...state, pity5: nextPity5, pity4: 0, guaranteed4: hasFeaturedFour && !featured },
      result: { item, rarity: 4, featured, pity: nextPity4 },
    }
  }

  return {
    state: { ...state, pity5: nextPity5, pity4: nextPity4 },
    result: { item: choose(pool(type, 3, false), random), rarity: 3, featured: false, pity: nextPity5 },
  }
}

export function chanceForFeaturedCopies(wishes: number, copies: number, state: Pick<BannerState, 'pity5' | 'guaranteed5'>): number {
  const target = Math.max(1, Math.floor(copies))
  const worstCase = (state.guaranteed5 ? 90 : 180) - state.pity5 + (target - 1) * 180
  if (wishes >= worstCase) return 1
  let branches = new Map<string, number>([[`${state.pity5}:${state.guaranteed5 ? 1 : 0}:0`, 1]])
  for (let index = 0; index < wishes; index += 1) {
    const next = new Map<string, number>()
    for (const [key, weight] of branches) {
      const [pityText, guaranteeText, copiesText] = key.split(':')
      const pity = Number(pityText), guaranteed = guaranteeText === '1', acquired = Number(copiesText)
      const rate = fiveStarRate(pity, 'character')
      const missKey = `${pity + 1}:${guaranteed ? 1 : 0}:${acquired}`
      next.set(missKey, (next.get(missKey) ?? 0) + weight * (1 - rate))
      if (guaranteed) {
        const hit = `0:0:${Math.min(target, acquired + 1)}`
        next.set(hit, (next.get(hit) ?? 0) + weight * rate)
      } else {
        const lost = `0:1:${acquired}`, hit = `0:0:${Math.min(target, acquired + 1)}`
        next.set(lost, (next.get(lost) ?? 0) + weight * rate * 0.5)
        next.set(hit, (next.get(hit) ?? 0) + weight * rate * 0.5)
      }
    }
    branches = next
  }
  return Math.max(0, Math.min(1, [...branches].reduce((sum, [key, weight]) => Number(key.split(':')[2]) >= target ? sum + weight : sum, 0)))
}

export const primogemsToWishes = (primogems: number) => Math.floor(Math.max(0, primogems) / 160)
