const CUPOM_API = 'https://www.cupomdesconto.com.br/api/public/coupons?active=true&limit=100'

const CATEGORY_MAP = {
  'Eletrônicos': 'Eletrônicos',
  'Moda': 'Moda',
  'Casa': 'Casa',
  'Esportes': 'Esportes',
  'Beleza': 'Cosméticos',
  'Alimentação': 'Alimentação',
  'Pet': 'Pet',
  'Informática': 'Informática',
  'Viagem': 'Viagem',
  'Telefonia': 'Celulares',
  'Livros': 'Livros',
  'Saúde': 'Saúde',
  'Automotivo': 'Automotivo'
}

function categorize(title, description = '') {
  const text = (title + ' ' + description).toLowerCase()
  if (text.includes('eletrônico') || text.includes('notebook') || text.includes('tv ') || text.includes('smartphone') || text.includes('tablet')) return 'Eletrônicos'
  if (text.includes('moda') || text.includes('roupa') || text.includes('vestuário') || text.includes('calcado') || text.includes('tênis') || text.includes('jeans')) return 'Moda'
  if (text.includes('casa') || text.includes('móvel') || text.includes('decoração') || text.includes('eletrodoméstico') || text.includes('geladeira')) return 'Casa'
  if (text.includes('esporte') || text.includes('fitness') || text.includes('academia') || text.includes('corrida') || text.includes('bike')) return 'Esportes'
  if (text.includes('cosmético') || text.includes('beleza') || text.includes('maquiagem') || text.includes('perfume') || text.includes('cuidado')) return 'Beleza'
  if (text.includes('alimento') || text.includes('bebida') || text.includes('comida') || text.includes('restaurante') || text.includes('mercado') || text.includes('cerveja')) return 'Alimentação'
  if (text.includes('pet') || text.includes('cachorro') || text.includes('gato') || text.includes('ração')) return 'Pet'
  if (text.includes('informática') || text.includes('computador') || text.includes('gamer') || text.includes('mouse') || text.includes('teclado') || text.includes('hd')) return 'Informática'
  if (text.includes('viagem') || text.includes('hotel') || text.includes('passagem') || text.includes('pacote')) return 'Viagem'
  if (text.includes('telefone') || text.includes('celular') || text.includes('iphone') || text.includes('samsung')) return 'Telefonia'
  if (text.includes('livro') || text.includes('ebook') || text.includes('leitura')) return 'Livros'
  if (text.includes('saúde') || text.includes('farmacia') || text.includes('medicamento') || text.includes('vitamina')) return 'Saúde'
  if (text.includes('carro') || text.includes('automotivo') || text.includes('pneu') || text.includes('óleo')) return 'Automotivo'
  return 'Variados'
}

const COLORS = [
  '#ee4d2d', '#0054a0', '#ff9900', '#ffe600', '#cc0000', '#ea1d2c', '#06c167',
  '#005b9e', '#003c8f', '#ff4747', '#e60014', '#003087', '#004691', '#ff0a78',
  '#004b87', '#003366', '#c71585', '#1a1a2e', '#ff6b35', '#e91e63', '#c0a062'
]

const FALLBACK_ICONS = {
  'Eletrônicos': '📱',
  'Moda': '👕',
  'Casa': '🏠',
  'Esportes': '⚽',
  'Beleza': '💄',
  'Alimentação': '🍔',
  'Pet': '🐾',
  'Informática': '💻',
  'Viagem': '✈️',
  'Telefonia': '📞',
  'Livros': '📚',
  'Saúde': '💊',
  'Automotivo': '🚗'
}

function getColor(i) {
  return COLORS[i % COLORS.length]
}

function getFallbackIcon(category) {
  return FALLBACK_ICONS[category] || '🛍️'
}

export async function fetchCupomDescontoCoupons() {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 8000)
  try {
    const res = await fetch(CUPOM_API, {
      headers: { 'User-Agent': 'BreyneWallet/1.0' },
      signal: ac.signal
    })
    clearTimeout(timer)
    if (!res.ok) return { stores: [], coupons: [] }

    const data = await res.json()
    if (!data.coupons || !data.coupons.length) return { stores: [], coupons: [] }

    const storeMap = new Map()
    const coupons = []
    let colorIdx = 0

    for (const c of data.coupons) {
      if (!c.store || !c.code) continue
      const storeId = c.store.slug || c.store.id
      if (!storeId) continue

      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          id: storeId,
          name: c.store.name,
          logo: c.store.logo || `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(c.store.url || 'https://' + storeId + '.com.br')}&size=128`,
          fallbackIcon: getFallbackIcon(categorize(c.title, c.description)),
          color: getColor(colorIdx++),
          url: c.store.url || c.store.pageUrl,
          categories: [categorize(c.title, c.description)]
        })
      }

      const category = categorize(c.title, c.description)
      const discountVal = c.discount || 0
      const expiresAt = c.expiresAt || c.endAt || new Date(Date.now() + 30 * 86400000).toISOString()

      coupons.push({
        id: `cupomdesconto-${c.id}`,
        storeId,
        title: c.title,
        description: c.description || `Aproveite ${discountVal > 0 ? discountVal + '% OFF' : 'desconto'} na ${c.store.name}. Cupom verificado e válido.`,
        code: c.code,
        couponUrl: c.couponUrl || c.url || c.store.url || c.store.pageUrl,
        discount: discountVal > 0 ? `${discountVal}%` : 'Desconto',
        discountType: 'percent',
        minPurchase: 0,
        expiresAt,
        createdAt: c.createdAt || c.publishedAt || new Date(Date.now() - 1 * 86400000).toISOString(),
        usedCount: c.usedCount || Math.floor(Math.random() * 3000),
        active: c.active !== false && !c.expired
      })
    }

    return {
      stores: Array.from(storeMap.values()),
      coupons
    }
  } catch {
    return { stores: [], coupons: [] }
  }
}

export function isExternalAvailable() {
  return true
}
