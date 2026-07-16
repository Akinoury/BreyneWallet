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
  },
  {
    id: 'casasbahia',
    name: 'Casas Bahia',
    logo: FAV + 'casasbahia.com.br&size=128',
    fallbackIcon: '🏠',
    color: '#e60014',
    url: 'https://casasbahia.com.br',
    categories: ['Eletrodomésticos', 'Móveis', 'Eletrônicos']
  },
  {
    id: 'pontofrio',
    name: 'Ponto Frio',
    logo: FAV + 'pontofrio.com.br&size=128',
    fallbackIcon: '❄️',
    color: '#003087',
    url: 'https://pontofrio.com.br',
    categories: ['Eletrônicos', 'Eletrodomésticos', 'Informática']
  },
  {
    id: 'carrefour',
    name: 'Carrefour',
    logo: FAV + 'carrefour.com.br&size=128',
    fallbackIcon: '🛒',
    color: '#004691',
    url: 'https://carrefour.com.br',
    categories: ['Alimentos', 'Casa', 'Eletrônicos']
  },
  {
    id: 'dafiti',
    name: 'Dafiti',
    logo: FAV + 'dafiti.com.br&size=128',
    fallbackIcon: '👗',
    color: '#ff0a78',
    url: 'https://dafiti.com.br',
    categories: ['Moda', 'Calçados', 'Acessórios']
  },
  {
    id: 'centauro',
    name: 'Centauro',
    logo: FAV + 'centauro.com.br&size=128',
    fallbackIcon: '⚽',
    color: '#004b87',
    url: 'https://centauro.com.br',
    categories: ['Esportes', 'Calçados', 'Vestuário']
  },
  {
    id: 'renner',
    name: 'Renner',
    logo: FAV + 'renner.com.br&size=128',
    fallbackIcon: '👔',
    color: '#003366',
    url: 'https://renner.com.br',
    categories: ['Moda', 'Vestuário', 'Acessórios']
  },
  {
    id: 'marisa',
    name: 'Marisa',
    logo: FAV + 'marisa.com.br&size=128',
    fallbackIcon: '👚',
    color: '#c71585',
    url: 'https://marisa.com.br',
    categories: ['Moda Feminina', 'Vestuário', 'Acessórios']
  },
  {
    id: 'kabum',
    name: 'KaBuM!',
    logo: FAV + 'kabum.com.br&size=128',
    fallbackIcon: '💻',
    color: '#003366',
    url: 'https://kabum.com.br',
    categories: ['Informática', 'Hardware', 'Periféricos']
  },
  {
    id: 'terabyteshop',
    name: 'Terabyte Shop',
    logo: FAV + 'terabyteshop.com.br&size=128',
    fallbackIcon: '🖥️',
    color: '#1a1a2e',
    url: 'https://terabyteshop.com.br',
    categories: ['Hardware', 'Informática', 'Gamer']
  },
  {
    id: 'petz',
    name: 'Petz',
    logo: FAV + 'petz.com.br&size=128',
    fallbackIcon: '🐾',
    color: '#ff6b35',
    url: 'https://petz.com.br',
    categories: ['Pet', 'Animais', 'Alimentação']
  },
  {
    id: 'epocacosmeticos',
    name: 'Época Cosméticos',
    logo: FAV + 'epocacosmeticos.com.br&size=128',
    fallbackIcon: '💄',
    color: '#e91e63',
    url: 'https://epocacosmeticos.com.br',
    categories: ['Cosméticos', 'Perfumes', 'Cuidados']
  },
  {
    id: 'zattini',
    name: 'Zattini',
    logo: FAV + 'zattini.com.br&size=128',
    fallbackIcon: '👠',
    color: '#c0a062',
    url: 'https://zattini.com.br',
    categories: ['Calçados', 'Moda', 'Acessórios']
  },
  {
    id: 'fastshop',
    name: 'Fast Shop',
    logo: FAV + 'fastshop.com.br&size=128',
    fallbackIcon: '⚡',
    color: '#ff6600',
    url: 'https://fastshop.com.br',
    categories: ['Eletrônicos', 'Eletrodomésticos', 'Informática']
  }
]

export { STORES }

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildCouponUrl(store, category) {
  const cat = encodeURIComponent(category.toLowerCase())
  const map = {
    shopee:     `https://shopee.com.br/search?keyword=${cat}&sortType=sales`,
    magalu:     `https://magazineluiza.com.br/ofertas/`,
    amazon:     `https://amazon.com.br/deals?k=${cat}`,
    mercadolivre: `https://mercadolivre.com.br/ofertas/`,
    americanas: `https://americanas.com.br/busca/${cat}-promocao`,
    ifood:      `https://ifood.com.br/`,
    'uber-eats': `https://ubereats.com/br`,
    netshoes:   `https://netshoes.com.br/ofertas`,
    submarino:  `https://submarino.com.br/busca/${cat}`,
    aliexpress: `https://aliexpress.com/wholesale?catId=0&SearchText=${cat}`,
    casasbahia: `https://casasbahia.com.br/ofertas/`,
    pontofrio:  `https://pontofrio.com.br/ofertas/`,
    carrefour:  `https://carrefour.com.br/busca/${cat}`,
    dafiti:     `https://dafiti.com.br/catalogsearch/result/?q=${cat}`,
    centauro:   `https://centauro.com.br/busca?q=${cat}`,
    renner:     `https://lojasrenner.com.br/busca?q=${cat}`,
    marisa:     `https://marisa.com.br/busca?q=${cat}`,
    kabum:      `https://kabum.com.br/ofertas`,
    terabyteshop: `https://terabyteshop.com.br/busca?q=${cat}`,
    petz:       `https://petz.com.br/busca?q=${cat}`,
    epocacosmeticos: `https://epocacosmeticos.com.br/busca?q=${cat}`,
    zattini:    `https://zattini.com.br/busca?q=${cat}`,
    fastshop:   `https://fastshop.com.br/busca?q=${cat}`
  }
  return map[store.id] || store.url
}

export function generateCoupons(store, count) {
  const pcts = [5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 50]
  const now = Date.now()
  const coupons = []
  for (let i = 0; i < count; i++) {
    const pct = pcts[randomBetween(0, pcts.length - 1)]
    const category = store.categories[randomBetween(0, store.categories.length - 1)]
    const minPurchase = randomBetween(5, 30) * 10
    coupons.push({
      id: `static-${store.id}-${i}`,
      storeId: store.id,
      title: `Confira ofertas em ${category}`,
      description: `Encontre os melhores preços em ${category} na ${store.name}. Aproveite descontos de até ${pct}% em produtos selecionados.`,
      code: null,
      couponUrl: buildCouponUrl(store, category),
      discount: `até ${pct}%`,
      discountType: 'percent',
      minPurchase,
      expiresAt: new Date(now + randomBetween(15, 60) * 86400000).toISOString(),
      createdAt: new Date(now - randomBetween(0, 7) * 86400000).toISOString(),
      usedCount: randomBetween(100, 8000),
      active: true
    })
  }
  return coupons
}

export function getStaticData() {
  const now = Date.now()
  const coupons = STORES.flatMap(store => generateCoupons(store, randomBetween(4, 7)))
  return { stores: STORES, coupons }
}
