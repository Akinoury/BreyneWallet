import { handleOptions, setCorsHeaders } from '../_lib/cors.js'
import { getStaticData } from './static.js'
import { fetchCupomDescontoCoupons } from './cupomdesconto.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = await fetchCupomDescontoCoupons()

  return res.json({
    stores: result.stores,
    coupons: result.coupons,
    total: result.coupons.length
  })
}
