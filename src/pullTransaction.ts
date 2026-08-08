import type { BannerType } from './bannerCatalog'
import { makeBannerWish } from './wishMath'
import type { HistoryItem, StoredData } from './storage'

export interface PullTransaction {
  data: StoredData
  additions: HistoryItem[]
}

export function createPullTransaction(
  current: StoredData,
  banner: BannerType,
  count: number,
  makeId: () => string = () => crypto.randomUUID(),
): PullTransaction {
  let nextState = current.states[banner]
  const additions: HistoryItem[] = []
  const inventoryMap = new Map(current.inventory.map((entry) => [entry.itemId, entry.count]))

  for (let index = 0; index < count; index += 1) {
    const outcome = makeBannerWish(banner, nextState)
    nextState = outcome.state
    const ownershipCount = (inventoryMap.get(outcome.result.item.id) ?? 0) + 1
    inventoryMap.set(outcome.result.item.id, ownershipCount)
    additions.push({
      id: makeId(), number: current.total + index + 1, banner,
      itemId: outcome.result.item.id, itemName: outcome.result.item.name, itemType: outcome.result.item.type,
      rarity: outcome.result.rarity, featured: outcome.result.featured, pity: outcome.result.pity, ownershipCount,
    })
  }

  const fiveStars = additions.filter((entry) => entry.rarity === 5)
  return {
    additions,
    data: {
      ...current,
      states: { ...current.states, [banner]: nextState },
      total: current.total + count,
      history: [...[...additions].reverse(), ...current.history].slice(0, 300),
      inventory: [...inventoryMap].map(([itemId, itemCount]) => ({ itemId, count: itemCount })),
      fiveStarCount: current.fiveStarCount + fiveStars.length,
      fiveStarPityTotal: current.fiveStarPityTotal + fiveStars.reduce((sum, entry) => sum + entry.pity, 0),
    },
  }
}
