import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

const FAV = 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://'

const STORES = [
  {
    id: 'shopee',
    name: 'Shopee',
    logo: FAV + 'shopee.com.br&size=128',
    fallbackIcon: '🛒',
    color: '#ee4d2d',
    url: 'https://shopee.com.br',
    categories: ['Moda', 'Eletrônicos', 'Casa']
  },
  {
    id: 'magalu',
    name: 'Magazine Luiza',
    logo: FAV + 'magazineluiza.com.br&size=128',
    fallbackIcon: '📱',
    color: '#0054a0',
    url: 'https://magazineluiza.com.br',
    categories: ['Eletrônicos', 'Eletrodomésticos', 'Celulares']
  },
  {
    id: 'amazon',
    name: 'Amazon Brasil',
    logo: FAV + 'amazon.com.br&size=128',
    fallbackIcon: '📦',
    color: '#ff9900',
    url: 'https://amazon.com.br',
    categories: ['Livros', 'Eletrônicos', 'Casa']
  },
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    logo: FAV + 'mercadolivre.com.br&size=128',
    fallbackIcon: '🟡',
    color: '#ffe600',
    url: 'https://mercadolivre.com.br',
    categories: ['Variados', 'Tecnologia', 'Moda']
  },
  {
    id: 'americanas',
    name: 'Americanas',
    logo: FAV + 'americanas.com.br&size=128',
    fallbackIcon: '🔴',
    color: '#cc0000',
    url: 'https://americanas.com.br',
    categories: ['Variados', 'Casa', 'Eletrônicos']
  },
  {
    id: 'ifood',
    name: 'iFood',
    logo: FAV + 'ifood.com.br&size=128',
    fallbackIcon: '🍔',
    color: '#ea1d2c',
    url: 'https://ifood.com.br',
    categories: ['Alimentação', 'Restaurantes']
  },
  {
    id: 'uber-eats',
    name: 'Uber Eats',
    logo: FAV + 'ubereats.com&size=128',
    fallbackIcon: '🛵',
    color: '#06c167',
    url: 'https://ubereats.com',
    categories: ['Alimentação', 'Restaurantes']
  },
  {
    id: 'netshoes',
    name: 'Netshoes',
    logo: FAV + 'netshoes.com.br&size=128',
    fallbackIcon: '👟',
    color: '#005b9e',
    url: 'https://netshoes.com.br',
    categories: ['Esportes', 'Moda']
  },
  {
    id: 'submarino',
    name: 'Submarino',
    logo: FAV + 'submarino.com.br&size=128',
    fallbackIcon: '🔵',
    color: '#003c8f',
    url: 'https://submarino.com.br',
    categories: ['Eletrônicos', 'Casa', 'Livros']
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    logo: FAV + 'aliexpress.com&size=128',
    fallbackIcon: '🌍',
    color: '#ff4747',
    url: 'https://aliexpress.com',
    categories: ['Variados', 'Eletrônicos', 'Moda']
  }
]

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildCouponUrl(store, category) {
  const cat = encodeURIComponent(category.toLowerCase())
  const map = {
    shopee:     `https://shopee.com.br/search?keyword=${cat}+promocao`,
    magalu:     `https://magazineluiza.com.br/busca/${cat}/`,
    amazon:     `https://amazon.com.br/s?k=${cat}+oferta`,
    mercadolivre: `https://mercadolivre.com.br/ofertas?q=${cat}`,
    americanas: `https://americanas.com.br/busca/${cat}`,
    ifood:      `https://ifood.com.br/`,
    'uber-eats': `https://ubereats.com/`,
    netshoes:   `https://netshoes.com.br/busca?q=${cat}`,
    submarino:  `https://submarino.com.br/busca/${cat}`,
    aliexpress: `https://aliexpress.com/wholesale?catId=0&SearchText=${cat}+promocao`
  }
  return map[store.id] || store.url
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
    const category = store.categories[randomBetween(0, store.categories.length - 1)]
    coupons.push({
      id: `${store.id}-${i}`,
      storeId: store.id,
      title: `${pct}% OFF em ${category}`,
      description: `Ganhe ${pct}% de desconto em produtos selecionados da ${store.name}. Válido para compras acima de R$ ${randomBetween(50, 300)},00.`,
      code,
      couponUrl: buildCouponUrl(store, category),
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
