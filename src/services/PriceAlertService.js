const STORAGE_KEY = 'breyne_price_alerts'
let nextId = 1

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const alerts = raw ? JSON.parse(raw) : []
    nextId = alerts.reduce((max, a) => Math.max(max, a.id + 1), 1)
    return alerts
  } catch { return [] }
}

function save(alerts) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)) } catch {}
}

export const priceAlertService = {
  getAll() {
    return load()
  },

  getActive() {
    return load().filter(a => a.active)
  },

  add(symbol, targetPrice, direction = 'above') {
    const alerts = load()
    const existing = alerts.find(a => a.symbol === symbol && a.active)
    if (existing) {
      existing.targetPrice = targetPrice
      existing.direction = direction
      save(alerts)
      return existing
    }
    const alert = { id: nextId++, symbol, targetPrice, direction, active: true }
    alerts.push(alert)
    save(alerts)
    return alert
  },

  remove(id) {
    const alerts = load()
    const idx = alerts.findIndex(a => a.id === id)
    if (idx >= 0) {
      alerts.splice(idx, 1)
      save(alerts)
    }
  },

  toggle(id) {
    const alerts = load()
    const alert = alerts.find(a => a.id === id)
    if (alert) {
      alert.active = !alert.active
      save(alerts)
    }
    return alert
  },

  removeBySymbol(symbol) {
    const alerts = load().filter(a => a.symbol !== symbol)
    save(alerts)
  },

  checkPrices(stocks) {
    const triggered = []
    const alerts = load()
    for (const alert of alerts) {
      if (!alert.active) continue
      const stock = stocks.find(s => s.symbol === alert.symbol)
      if (!stock || stock.price == null) continue
      const price = stock.price
      if (alert.direction === 'above' && price >= alert.targetPrice) {
        triggered.push({ ...alert, currentPrice: price })
        alert.active = false
      } else if (alert.direction === 'below' && price <= alert.targetPrice) {
        triggered.push({ ...alert, currentPrice: price })
        alert.active = false
      }
    }
    save(alerts)
    return triggered
  }
}
