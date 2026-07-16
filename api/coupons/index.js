import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

const STORES = [
  {
    id: 'shopee',
    name: 'Shopee',
    logo: 'https://www.google.com/s2/favicons?domain=shopee.com.br&sz=64',
    fallbackIcon: '🛒',
    color: '#ee4d2d',
    categories: ['Moda', 'Eletrônicos', 'Casa']
  },
  {
    id: 'magalu',
    name: 'Magazine Luiza',
    logo: 'https://www.google.com/s2/favicons?domain=magazineluiza.com.br&sz=64',
    fallbackIcon: '📱',
    color: '#0054a0',
    categories: ['Eletrônicos', 'Eletrodomésticos', 'Celulares']
  },
  {
    id: 'amazon',
    name: 'Amazon Brasil',
    logo: 'https://www.google.com/s2/favicons?domain=amazon.com.br&sz=64',
    fallbackIcon: '📦',
    color: '#ff9900',
    categories: ['Livros', 'Eletrônicos', 'Casa']
  },
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    logo: 'https://www.google.com/s2/favicons?domain=mercadolivre.com.br&sz=64',
    fallbackIcon: '🟡',
    color: '#ffe600',
    categories: ['Variados', 'Tecnologia', 'Moda']
  },
  {
    id: 'americanas',
    name: 'Americanas',
    logo: 'https://www.google.com/s2/favicons?domain=americanas.com.br&sz=64',
    fallbackIcon: '🔴',
    color: '#cc0000',
    categories: ['Variados', 'Casa', 'Eletrônicos']
  },
  {
    id: 'ifood',
    name: 'iFood',
    logo: 'https://www.google.com/s2/favicons?domain=ifood.com.br&sz=64',
    fallbackIcon: '🍔',
    color: '#ea1d2c',
    categories: ['Alimentação', 'Restaurantes']
  },
  {
    id: 'uber-eats',
    name: 'Uber Eats',
    logo: 'https://www.google.com/s2/favicons?domain=ubereats.com&sz=64',
    fallbackIcon: '🛵',
    color: '#06c167',
    categories: ['Alimentação', 'Restaurantes']
  },
  {
    id: 'netshoes',
    name: 'Netshoes',
    logo: 'https://www.google.com/s2/favicons?domain=netshoes.com.br&sz=64',
    fallbackIcon: '👟',
    color: '#005b9e',
    categories: ['Esportes', 'Moda']
  },
  {
    id: 'submarino',
    name: 'Submarino',
    logo: 'https://www.google.com/s2/favicons?domain=submarino.com.br&sz=64',
    fallbackIcon: '🔵',
    color: '#003c8f',
    categories: ['Eletrônicos', 'Casa', 'Livros']
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    logo: 'https://www.google.com/s2/favicons?domain=aliexpress.com&sz=64',
    fallbackIcon: '🌍',
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
