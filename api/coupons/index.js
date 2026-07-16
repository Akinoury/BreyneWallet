import { handleOptions, setCorsHeaders } from '../_lib/cors.js'
import { getStaticData } from './static.js'
import { fetchCupomDescontoCoupons } from './cupomdesconto.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { store: storeFilter, sort } = req.query

  const [realResult, staticResult] = await Promise.allSettled([
    fetchCupomDescontoCoupons(),
    Promise.resolve(getStaticData())
  ])

  const real = realResult.status === 'fulfilled' ? realResult.value : { stores: [], coupons: [] }
  const staticData = staticResult.status === 'fulfilled' ? staticResult.value : { stores: [], coupons: [] }

  const realStoreIds = new Set(real.stores.map(s => s.id))

  const staticFiltered = {
    stores: staticData.stores.filter(s => !realStoreIds.has(s.id)),
    coupons: staticData.coupons.filter(c => !realStoreIds.has(c.storeId))
  }

  const storeMap = new Map()
  for (const s of real.stores) storeMap.set(s.id, s)
  for (const s of staticFiltered.stores) {
    if (!storeMap.has(s.id)) storeMap.set(s.id, s)
  }

  let allCoupons = [...real.coupons, ...staticFiltered.coupons]

  if (storeFilter) {
    const ids = storeFilter.split(',').map(s => s.trim().toLowerCase())
    allCoupons = allCoupons.filter(c => ids.includes(c.storeId))
  }

  if (sort === 'recent') {
    allCoupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else {
    allCoupons.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }

  const maxCoupons = Math.max(100, allCoupons.length)

  return res.json({
    stores: Array.from(storeMap.values()),
    coupons: allCoupons.slice(0, maxCoupons),
    total: allCoupons.length,
    sources: {
      static: staticFiltered.coupons.length,
      cupomdesconto: real.coupons.length
    }
  })
}
