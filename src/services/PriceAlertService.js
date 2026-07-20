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

function today() {
  return new Date().toISOString().slice(0, 10)
}

export const priceAlertService = {
  getAll() {
    return load()
  },

  getActive() {
    return load().filter(a => a.active)
  },

  add(symbol, targetPrice, direction = 'above', basisPrice = 0) {
    const alerts = load()
    const alert = { id: nextId++, symbol, targetPrice, direction, active: true, basisPrice, basisDate: today() }
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

  rebaseAlerts(stocks) {
    const alerts = load()
    let changed = false
    const td = today()
    for (const alert of alerts) {
      if (!alert.active) continue
      if (alert.basisDate === td) continue
      const stock = stocks.find(s => s.symbol === alert.symbol)
      if (!stock || !stock.open) continue
      const levels = [1.05, 1.10, 1.20]
      const newPrice = stock.open
      const dir = alert.direction
      const idx = levels.findIndex(l =>
        dir === 'above'
          ? Math.abs(alert.targetPrice - alert.basisPrice * l) < 0.01
          : Math.abs(alert.targetPrice - alert.basisPrice / l) < 0.01
      )
      if (idx >= 0) {
        alert.targetPrice = dir === 'above' ? newPrice * levels[idx] : newPrice / levels[idx]
        alert.basisPrice = newPrice
        alert.basisDate = td
        changed = true
      }
    }
    if (changed) save(alerts)
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
