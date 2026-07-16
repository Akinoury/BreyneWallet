import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

const STORES = [
  {
    id: 'shopee',
    name: 'Shopee',
    icon: '🛒',
    color: '#ee4d2d',
    categories: ['Moda', 'Eletrônicos', 'Casa']
  },
  {
    id: 'magalu',
    name: 'Magazine Luiza',
    icon: '📱',
    color: '#0054a0',
    categories: ['Eletrônicos', 'Eletrodomésticos', 'Celulares']
  },
  {
    id: 'amazon',
    name: 'Amazon Brasil',
    icon: '📦',
    color: '#ff9900',
    categories: ['Livros', 'Eletrônicos', 'Casa']
  },
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    icon: '🟡',
    color: '#ffe600',
    categories: ['Variados', 'Tecnologia', 'Moda']
  },
  {
    id: 'americanas',
    name: 'Americanas',
    icon: '🔴',
    color: '#cc0000',
    categories: ['Variados', 'Casa', 'Eletrônicos']
  },
  {
    id: 'ifood',
    name: 'iFood',
    icon: '🍔',
    color: '#ea1d2c',
    categories: ['Alimentação', 'Restaurantes']
  },
  {
    id: 'uber-eats',
    name: 'Uber Eats',
    icon: '🛵',
    color: '#06c167',
    categories: ['Alimentação', 'Restaurantes']
  },
  {
    id: 'netshoes',
    name: 'Netshoes',
    icon: '👟',
    color: '#005b9e',
    categories: ['Esportes', 'Moda']
  },
  {
    id: 'submarino',
    name: 'Submarino',
    icon: '🔵',
    color: '#003c8f',
    categories: ['Eletrônicos', 'Casa', 'Livros']
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    icon: '🌍',
    color: '#ff4747',
    categories: ['Variados', 'Eletrônicos', 'Moda']
  }
]

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateCoupons(store, count) {
  const verbs = ['FRETE', 'DESCONTO', 'PIX', 'CUPOM', 'OFERTA', 'SUPER']
  const pcts = [5, 10, 15, 20, 25, 30, 40, 50]
  const now = Date.now()
  const coupons = []
  for (let i = 0; i < count; i++) {
    const pct = pcts[randomBetween(0, pcts.length - 1)]
    const daysAgo = randomBetween(0, 30)
    const validDays = randomBetween(7, 60)
    const code = `${verbs[randomBetween(0, verbs.length - 1)]}${pct}${store.id.toUpperCase().slice(0, 3)}`
    coupons.push({
      id: `${store.id}-${i}`,
      storeId: store.id,
      title: `${pct}% OFF em ${store.categories[randomBetween(0, store.categories.length - 1)]}`,
      description: `Ganhe ${pct}% de desconto em produtos selecionados da ${store.name}. Válido para compras acima de R$ ${randomBetween(50, 300)},00.`,
      code,
      discount: `${pct}%`,
      discountType: 'percent',
      minPurchase: randomBetween(0, 200) * 10,
      expiresAt: new Date(now + validDays * 86400000).toISOString(),
      createdAt: new Date(now - daysAgo * 86400000).toISOString(),
      usedCount: randomBetween(0, 5000),
      active: true
    })
  }
  return coupons
}

const NOW = Date.now()
const coupons = STORES.flatMap(store => generateCoupons(store, randomBetween(2, 4)))

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { store: storeFilter, sort } = req.query
  let result = [...coupons]

  if (storeFilter) {
    const ids = storeFilter.split(',').map(s => s.trim().toLowerCase())
    result = result.filter(c => ids.includes(c.storeId))
  }

  if (sort === 'recent') {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else {
    result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }

  return res.json({
    stores: STORES,
    coupons: result.slice(0, 50),
    total: result.length
  })
}
