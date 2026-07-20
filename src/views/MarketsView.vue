<template>
  <div class="markets-wrapper animate-fade-in">
    <div class="markets-header flex-between">
      <div>
        <div class="markets-title-row">
          <h2>📈 Mercados</h2>
          <span v-if="activeAlerts.length" class="alerts-badge" title="Alertas ativos">🔔 {{ activeAlerts.length }}</span>
        </div>
        <p>Cotações ao vivo das principais bolsas, FIIs, ETFs e moedas.</p>
      </div>
      <button class="btn-back" @click="$router.push('/investments')">← Voltar</button>
    </div>

    <div class="ticker-bar glass-panel">
      <div class="ticker-item" v-for="t in tickers" :key="t.label">
        <span class="ticker-label">{{ t.label }}</span>
        <span class="ticker-value" :class="t.change >= 0 ? 'up' : 'down'">{{ t.value }}</span>
        <span class="ticker-change" :class="t.change >= 0 ? 'up' : 'down'">{{ t.change >= 0 ? '+' : '' }}{{ t.change }}%</span>
      </div>
      <div v-if="tickers.length === 0 && loaded" class="ticker-empty">Sem dados</div>
    </div>

    <div class="filter-section">
      <div class="filter-blocks">
        <div class="filter-group">
          <span class="filter-label">Bolsa</span>
          <div class="chip-row">
            <button v-for="ex in exchanges" :key="ex.key" class="chip" :class="{ active: selectedExchanges.includes(ex.key) }" @click="toggleExchange(ex.key)">{{ ex.label }}</button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">Tipo</span>
          <div class="chip-row">
            <button v-for="t in assetTypes" :key="t.key" class="chip" :class="{ active: selectedTypes.includes(t.key) }" @click="toggleType(t.key)">{{ t.label }}</button>
          </div>
        </div>
      </div>
      <div class="search-group">
        <input v-model="searchQuery" placeholder="Buscar ativo…" class="search-input" @keyup.enter="lookupTicker" />
        <button class="search-btn" @click="lookupTicker" title="Procurar ticker">🔍</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Carregando mercados...</div>
    <div v-else-if="error" class="alert-box alert-error">{{ error }}</div>

    <template v-else>
      <div class="result-info">
        <strong>{{ displayStocks.length }}</strong> ativo{{ displayStocks.length !== 1 ? 's' : '' }} encontrado{{ displayStocks.length !== 1 ? 's' : '' }}
        <span v-if="isPreview" class="preview-note">— preview de 50</span>
      </div>

      <div v-if="displayStocks.length === 0" class="empty-state glass-panel">
        <span class="empty-icon">📊</span>
        <p>Nenhum ativo encontrado para este filtro.</p>
      </div>

      <div v-else class="stocks-grid">
        <button
          v-for="s in displayStocks"
          :key="s.symbol"
          class="stock-card glass-panel"
          @click="openDetail(s)"
        >
          <div class="stock-top">
            <div class="stock-symbol">{{ s.symbol.replace('.SA','').replace('.IR','').replace('.L','').replace('^','') }}</div>
            <div class="stock-top-right">
              <button class="card-bell" @click.stop="toggleCardAlert(s)" :title="'Alerta de preço'">
                <span :class="stockHasAlert(s) ? 'bell-active' : 'bell-inactive'">🔔</span>
              </button>
              <div class="stock-type-badge" :class="s.assetType.toLowerCase()">{{ s.assetType }}</div>
            </div>
          </div>
          <div class="stock-name">{{ s.shortName || s.symbol }}</div>
          <div class="stock-price-row">
            <span class="stock-price" :class="s.change >= 0 ? 'up' : 'down'">
              {{ s.currency === 'BRL' ? 'R$' : s.currency === 'EUR' ? '€' : '$' }} {{ formatPrice(s.price) }}
            </span>
            <span class="stock-change" :class="s.change >= 0 ? 'up' : 'down'">
              {{ s.changePercent >= 0 ? '+' : '' }}{{ s.changePercent?.toFixed(2) }}%
            </span>
          </div>
          <div class="stock-meta">
            <span class="stock-exchange-label">{{ getExchangeLabel(s.exchange) }}</span>
            <span class="stock-vol">{{ formatVolume(s.volume) }}</span>
          </div>
        </button>
      </div>

      <div v-if="showIndexCharts" class="index-charts-section">
        <h3 class="index-charts-title">📊 Comparativo IBOV vs S&P 500</h3>
        <div class="index-charts-grid">
          <div class="index-chart-card" v-for="ch in indexChartData" :key="ch.label">
            <div class="index-chart-header">
              <span class="index-chart-label">{{ ch.label }}</span>
              <span class="index-chart-price" :class="ch.change >= 0 ? 'up' : 'down'">
                {{ ch.currency === 'BRL' ? 'R$' : '$' }} {{ formatPrice(ch.price) }}
              </span>
              <span class="index-chart-change" :class="ch.change >= 0 ? 'up' : 'down'">
                {{ ch.change >= 0 ? '+' : '' }}{{ ch.change?.toFixed(2) }}%
              </span>
            </div>
            <div class="index-chart-canvas-wrap">
              <canvas :id="'idx-chart-' + ch.label.replace(/[^a-zA-Z0-9]/g,'')"></canvas>
              <div v-if="ch.loading" class="chart-loading">Carregando...</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="detail" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content glass-panel">
          <button class="modal-close" @click="closeDetail">✕</button>

          <div class="modal-header">
            <div>
              <div class="modal-title-row">
                <h2>{{ detail.symbol.replace('.SA','').replace('.IR','').replace('.L','').replace('^','') }}</h2>
                <button class="btn-alert" @click.stop="toggleAlertForm" :title="hasAlert ? 'Remover alerta' : 'Criar alerta de preço'">
                  <span v-if="hasAlert" class="bell-active">🔔</span>
                  <span v-else class="bell-inactive">🔕</span>
                </button>
              </div>
              <span class="modal-subtitle">{{ detail.longName || detail.shortName }}</span>
            </div>
            <div class="modal-badges">
              <span class="badge-exchange">{{ getExchangeLabel(detail.exchange) }}</span>
              <span class="badge-type" :class="detail.assetType.toLowerCase()">{{ detail.assetType }}</span>
            </div>
          </div>
          <div v-if="showAlertForm" class="alert-form">
            <label class="alert-label">Alerta de preço:</label>
            <div class="alert-movement" v-if="detail">
              <span>Atual: {{ detail.currency === 'BRL' ? 'R$' : detail.currency === 'EUR' ? '€' : '$' }} {{ formatPrice(detail.price) }}</span>
              <span :class="detail.change >= 0 ? 'up' : 'down'">
                {{ detail.changePercent >= 0 ? '+' : '' }}{{ detail.changePercent?.toFixed(2) }}%
              </span>
            </div>
            <div class="alert-input-row">
              <select v-model="alertDirection" class="alert-select">
                <option value="above">≥</option>
                <option value="below">≤</option>
              </select>
              <input v-model.number="alertTargetPrice" type="number" step="any" class="alert-input" placeholder="Preço alvo" />
              <button class="alert-save-btn" @click="saveAlert">Salvar</button>
              <button class="alert-cancel-btn" @click="showAlertForm = false">✕</button>
            </div>
            <span v-if="alertError" class="alert-error">{{ alertError }}</span>
          </div>

          <div class="modal-price-row">
            <span class="modal-price" :class="detail.change >= 0 ? 'up' : 'down'">
              {{ detail.currency === 'BRL' ? 'R$' : detail.currency === 'EUR' ? '€' : '$' }} {{ formatPrice(detail.price) }}
            </span>
            <span class="modal-change" :class="detail.change >= 0 ? 'up' : 'down'">
              {{ detail.changePercent >= 0 ? '+' : '' }}{{ detail.changePercent?.toFixed(2) }}%
            </span>
          </div>

          <div class="chart-bar">
            <button v-for="r in chartRanges" :key="r.key" class="range-chip" :class="{ active: chartRange === r.key }" @click="setChartRange(r.key)">{{ r.label }}</button>
          </div>

          <div class="chart-container" :class="{ 'chart-split': isIndex }">
            <div class="chart-single" v-for="(ch, i) in chartInstances" :key="i">
              <span class="chart-label">{{ ch.label }}</span>
              <canvas :ref="el => setChartRef(i, el)" v-show="ch.ready"></canvas>
              <div v-if="!ch.ready && !chartLoading" class="chart-loading">Gráfico indisponível</div>
            </div>
            <div v-if="chartLoading" class="chart-loading chart-loading-full">Carregando gráfico...</div>
            <div v-if="chartError && !isIndex" class="chart-loading chart-loading-full">{{ chartError }}</div>
          </div>

          <div class="metrics-grid">
            <div class="metric">
              <span class="metric-label">Abertura</span>
              <span class="metric-value">{{ formatPrice(detail.open) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Fech. Anterior</span>
              <span class="metric-value">{{ formatPrice(detail.prevClose) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Máxima Dia</span>
              <span class="metric-value">{{ formatPrice(detail.high) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Mínima Dia</span>
              <span class="metric-value">{{ formatPrice(detail.low) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Volume</span>
              <span class="metric-value">{{ formatVolume(detail.volume) }}</span>
            </div>
            <div class="metric" v-if="detail.marketCap">
              <span class="metric-label">Valor de Mercado</span>
              <span class="metric-value">{{ formatMarketCap(detail.marketCap) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Status</span>
              <span class="metric-value">{{ detail.marketState === 'REGULAR' ? 'Aberto' : 'Fechado' }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Moeda</span>
              <span class="metric-value">{{ detail.currency }}</span>
            </div>
          </div>

          <div class="fundamentals-grid" v-if="detail.priceToBook != null || detail.trailingPE != null || detail.returnOnEquity != null || detail.dividendYield != null || detail.profitMargins != null">
            <h4 class="fundamentals-title">Fundamentos</h4>
            <div class="metric" v-if="detail.priceToBook != null">
              <span class="metric-label">P/VP</span>
              <span class="metric-value">{{ detail.priceToBook.toFixed(2) }}</span>
            </div>
            <div class="metric" v-if="detail.trailingPE != null">
              <span class="metric-label">P/L</span>
              <span class="metric-value">{{ detail.trailingPE.toFixed(2) }}</span>
            </div>
            <div class="metric" v-if="detail.returnOnEquity != null">
              <span class="metric-label">ROE</span>
              <span class="metric-value">{{ (detail.returnOnEquity * 100).toFixed(2) }}%</span>
            </div>
            <div class="metric" v-if="detail.dividendYield != null">
              <span class="metric-label">DY Médio</span>
              <span class="metric-value">{{ (detail.dividendYield * 100).toFixed(2) }}%</span>
            </div>
            <div class="metric" v-if="detail.profitMargins != null">
              <span class="metric-label">Rentabilidade</span>
              <span class="metric-value">{{ (detail.profitMargins * 100).toFixed(2) }}%</span>
            </div>
          </div>

          <a :href="`https://finance.yahoo.com/quote/${detail.symbol}`" target="_blank" rel="noopener noreferrer" class="btn-yahoo">
            Ver no Yahoo Finance →
          </a>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { priceAlertService } from '../services/PriceAlertService.js'
import {
  Chart, LineElement, PointElement, LineController,
  LinearScale, CategoryScale, Filler, Tooltip
} from 'chart.js'

Chart.register(LineElement, PointElement, LineController, LinearScale, CategoryScale, Filler, Tooltip)

const API_BASE = import.meta.env.VITE_API_URL || ''

const exchanges = [
  { key: 'NASDAQ', label: 'NASDAQ' },
  { key: 'NYSE', label: 'NYSE' },
  { key: 'B3', label: 'B3 (Brasil)' },
  { key: 'IRL', label: 'Irlanda' }
]

const assetTypes = [
  { key: 'Ações', label: 'Ações' },
  { key: 'FIIs', label: 'FIIs' },
  { key: 'ETFs', label: 'ETFs' },
  { key: 'REITs', label: 'REITs' },
  { key: 'Índices', label: 'Índices' }
]

const chartRanges = [
  { key: '5d', label: '1S' },
  { key: '1mo', label: '1M' },
  { key: '1y', label: '1A' },
  { key: '10y', label: '10A' }
]

const stocks = ref([])
const tickers = ref([])
const loading = ref(true)
const loaded = ref(false)
const error = ref('')
const selectedExchanges = ref([])
const selectedTypes = ref([])
const searchQuery = ref('')

const detail = ref(null)
const chartCanvas = ref(null)
const chartLoading = ref(false)
const chartReady = ref(false)
const chartError = ref('')
const chartRange = ref('1mo')
let chartInstance = null
let chartRequestId = 0
let alertCheckTimer = null

const chartInstances = ref([])
const chartRefs = {}
function setChartRef(i, el) { if (el) chartRefs[i] = el }

const isIndex = computed(() => detail.value?.assetType === 'Índices')

const showIndexCharts = computed(() =>
  selectedTypes.value.includes('Índices')
)

const indexChartData = ref([])
let indexCharts = []

async function loadIndexCharts() {
  for (const c of indexCharts) c.destroy()
  indexCharts = []
  if (!showIndexCharts.value) {
    indexChartData.value = []
    return
  }
  const symbols = ['^BVSP', '^GSPC']
  const names = ['IBOVESPA', 'S&P 500']
  const currencies = ['BRL', 'USD']
  indexChartData.value = symbols.map((sym, i) => ({
    label: names[i],
    price: 0,
    change: 0,
    currency: currencies[i],
    loading: true,
    closes: []
  }))
  const results = await Promise.all(symbols.map(sym =>
    fetch(`${API_BASE}/api/markets?chart=${sym}&range=1y&interval=1d`)
      .then(r => r.ok ? r.json() : null)
  ))
  for (let i = 0; i < results.length; i++) {
    const data = results[i]
    const meta = data?.chart?.result?.[0]?.meta
    const quotes = data?.chart?.result?.[0]?.indicators?.quote?.[0]
    const closes = quotes?.close?.filter(c => c != null) || []
    if (closes.length < 2) continue
    const item = indexChartData.value[i]
    const p = meta?.regularMarketPrice ?? closes[closes.length - 1]
    const prev = meta?.chartPreviousClose ?? closes[0]
    item.price = p
    item.change = prev > 0 ? ((p - prev) / prev) * 100 : 0
    item.loading = false
    item.closes = closes
    indexChartData.value = [...indexChartData.value]
  }
  await nextTick()
  await new Promise(r => setTimeout(r, 100))
  for (const item of indexChartData.value) {
    if (!item.closes.length) continue
    const id = 'idx-chart-' + item.label.replace(/[^a-zA-Z0-9]/g, '')
    const el = document.getElementById(id)
    if (!el) continue
    const color = item.closes[0] <= item.closes[item.closes.length - 1] ? '#06c167' : '#e60014'
    const ch = new Chart(el, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          data: item.closes,
          borderColor: color,
          backgroundColor: color + '22',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        elements: { point: { radius: 0 } }
      }
    })
    indexCharts.push(ch)
  }
}

const showAlertForm = ref(false)
const alertTargetPrice = ref(0)
const alertDirection = ref('above')
const alertError = ref('')

const activeAlerts = ref(priceAlertService.getActive())

const hasAlert = computed(() =>
  detail.value && activeAlerts.value.some(a => a.symbol === detail.value.symbol)
)

function toggleAlertForm() {
  if (hasAlert.value && detail.value) {
    priceAlertService.removeBySymbol(detail.value.symbol)
    activeAlerts.value = priceAlertService.getActive()
    showAlertForm.value = false
    return
  }
  const existing = activeAlerts.value.find(a => detail.value && a.symbol === detail.value.symbol)
  if (existing) {
    alertTargetPrice.value = existing.targetPrice
    alertDirection.value = existing.direction
  } else {
    alertTargetPrice.value = detail.value?.price || 0
    alertDirection.value = 'above'
  }
  alertError.value = ''
  showAlertForm.value = true
}

function stockHasAlert(s) {
  return activeAlerts.value.some(a => a.symbol === s.symbol)
}

function toggleCardAlert(s) {
  if (stockHasAlert(s)) {
    priceAlertService.removeBySymbol(s.symbol)
  } else {
    const levels = [1.05, 1.10, 1.20]
    for (const mult of levels) {
      priceAlertService.add(s.symbol, s.price * mult, 'above')
      priceAlertService.add(s.symbol, s.price / mult, 'below')
    }
  }
  activeAlerts.value = priceAlertService.getActive()
}

function saveAlert() {
  if (!detail.value) return
  const price = alertTargetPrice.value
  if (!price || price <= 0) {
    alertError.value = 'Digite um preço válido'
    return
  }
  priceAlertService.add(detail.value.symbol, price, alertDirection.value)
  activeAlerts.value = priceAlertService.getActive()
  showAlertForm.value = false
  alertError.value = ''
}

function checkAlerts() {
  const triggered = priceAlertService.checkPrices(stocks.value)
  for (const t of triggered) {
    const dir = t.direction === 'above' ? 'atingiu' : 'caiu para'
    const title = `🔔 Alerta: ${t.symbol}`
    const body = `${t.symbol} ${dir} R$ ${t.currentPrice.toFixed(2)} (meta: R$ ${t.targetPrice.toFixed(2)})`
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }
  activeAlerts.value = priceAlertService.getActive()
}

const filteredStocks = computed(() => {
  let result = stocks.value
  if (selectedExchanges.value.length) {
    result = result.filter(s => selectedExchanges.value.includes(s.exchange))
  }
  if (selectedTypes.value.length) {
    result = result.filter(s => selectedTypes.value.includes(s.assetType))
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toUpperCase()
    result = result.filter(s =>
      s.symbol.toUpperCase().includes(q) ||
      (s.shortName && s.shortName.toUpperCase().includes(q))
    )
  }
  return result
})

const isPreview = computed(() =>
  !selectedExchanges.value.length && !selectedTypes.value.length && !searchQuery.value
)

const displayStocks = computed(() => {
  const list = filteredStocks.value
  // Hide index cards from grid when index charts are showing
  const filtered = showIndexCharts.value ? list.filter(s => s.assetType !== 'Índices') : list
  if (isPreview.value && !showIndexCharts.value) return filtered.slice(0, 50)
  return filtered
})

function getExchangeLabel(key) {
  return exchanges.find(e => e.key === key)?.label || key
}

function toggleExchange(key) {
  const idx = selectedExchanges.value.indexOf(key)
  if (idx >= 0) selectedExchanges.value.splice(idx, 1)
  else if (selectedExchanges.value.length < 3) selectedExchanges.value.push(key)
}

function toggleType(key) {
  const idx = selectedTypes.value.indexOf(key)
  if (idx >= 0) selectedTypes.value.splice(idx, 1)
  else if (selectedTypes.value.length < 3) selectedTypes.value.push(key)
}

function formatPrice(v) {
  if (v == null || isNaN(v)) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
}

function formatVolume(v) {
  if (!v) return '—'
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toLocaleString('pt-BR')
}

function formatMarketCap(v) {
  if (!v) return '—'
  if (v >= 1e12) return 'US$ ' + (v / 1e12).toFixed(2) + 'T'
  if (v >= 1e9) return 'US$ ' + (v / 1e9).toFixed(2) + 'B'
  if (v >= 1e6) return 'US$ ' + (v / 1e6).toFixed(2) + 'M'
  return 'US$ ' + v.toLocaleString('pt-BR')
}

function closeDetail() {
  detail.value = null
}

async function fetchAll() {
  loading.value = true
  error.value = ''
  loaded.value = false
  try {
    const res = await fetch(`${API_BASE}/api/markets`)
    if (!res.ok) throw new Error('Erro ao carregar dados')
    const data = await res.json()
    stocks.value = data.stocks || []
    const items = []
    const f = data.forex || {}
    if (f.USDBRL) items.push({ label: 'USD/BRL', value: `R$ ${parseFloat(f.USDBRL.bid).toFixed(4)}`, change: parseFloat(f.USDBRL.pctChange || 0).toFixed(2) })
    if (f.EURBRL) items.push({ label: 'EUR/BRL', value: `R$ ${parseFloat(f.EURBRL.bid).toFixed(4)}`, change: parseFloat(f.EURBRL.pctChange || 0).toFixed(2) })
    if (f.GBPBRL) items.push({ label: 'GBP/BRL', value: `R$ ${parseFloat(f.GBPBRL.bid).toFixed(4)}`, change: parseFloat(f.GBPBRL.pctChange || 0).toFixed(2) })
    if (f.JPYBRL) items.push({ label: 'JPY/BRL', value: `R$ ${parseFloat(f.JPYBRL.bid).toFixed(4)}`, change: parseFloat(f.JPYBRL.pctChange || 0).toFixed(2) })
    if (f.CHFBRL) items.push({ label: 'CHF/BRL', value: `R$ ${parseFloat(f.CHFBRL.bid).toFixed(4)}`, change: parseFloat(f.CHFBRL.pctChange || 0).toFixed(2) })
    if (f.USDBRL) {
      const brlUsd = 1 / parseFloat(f.USDBRL.bid)
      items.push({ label: 'BRL/USD', value: `$ ${brlUsd.toFixed(6)}`, change: 0 })
    }
    const c = data.crypto || {}
    if (c.bitcoin) items.push({ label: 'BTC/USD', value: `$ ${c.bitcoin.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.bitcoin.usd_24h_change || 0).toFixed(2) })
    if (c.ethereum) items.push({ label: 'ETH/USD', value: `$ ${c.ethereum.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.ethereum.usd_24h_change || 0).toFixed(2) })
    if (c.binancecoin) items.push({ label: 'BNB/USD', value: `$ ${c.binancecoin.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.binancecoin.usd_24h_change || 0).toFixed(2) })

    tickers.value = items
    checkAlerts()
    loadIndexCharts()
  } catch {
    error.value = 'Erro ao carregar dados dos mercados. Tente novamente.'
  } finally {
    loading.value = false
    loaded.value = true
  }
}

async function loadChart() {
  if (!detail.value) return
  const id = ++chartRequestId
  chartLoading.value = true
  chartReady.value = false
  chartError.value = ''
  chartInstances.value = []
  try {
    const symbols = isIndex.value ? ['^BVSP', '^GSPC'] : [detail.value.symbol]
    const results = await Promise.all(symbols.map(sym =>
      fetch(`${API_BASE}/api/markets?chart=${sym}&range=${chartRange.value}`).then(r => r.ok ? r.json() : null)
    ))
    if (id !== chartRequestId) return
    const valid = results.filter(Boolean)
    if (!valid.length) throw new Error('Falha')
    await nextTick()
    if (isIndex.value) {
      renderSplitCharts(results, symbols)
    } else {
      renderChart(results[0])
    }
  } catch {
    if (id === chartRequestId) {
      chartError.value = 'Gráfico indisponível'
      chartLoading.value = false
    }
  }
}

function makeChart(el, closes, label, color) {
  if (!el) return null
  const timestamps = []
  const labels = []
  for (let i = 0; i < closes.length; i++) {
    timestamps.push(i)
    labels.push('')
  }
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const padding = (max - min) * 0.1 || max * 0.05
  return new Chart(el, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label,
        data: closes,
        borderColor: color,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 180)
          g.addColorStop(0, color + '33')
          g.addColorStop(1, 'rgba(0,0,0,0)')
          return g
        },
        fill: true,
        tension: 0.3,
        pointRadius: 0.5,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { display: false },
        y: {
          min: Math.max(0, min - padding),
          max: max + padding,
          ticks: { font: { size: 8 }, callback: v => v.toFixed(0), maxTicksLimit: 4 }
        }
      }
    }
  })
}

const CHART_COLORS = ['#06c167', '#1e3a5f']

function renderChart(data) {
  if (!chartCanvas.value) return
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
  const timestamps = data?.chart?.result?.[0]?.timestamp || []
  const quotes = data?.chart?.result?.[0]?.indicators?.quote?.[0]
  const closes = quotes?.close?.filter(c => c != null) || []
  if (closes.length < 2) {
    chartError.value = 'Dados insuficientes para o gráfico'
    chartLoading.value = false
    return
  }
  const xLabels = timestamps.slice(-closes.length).map(t => {
    const d = new Date(t * 1000)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  })
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const padding = (max - min) * 0.1 || max * 0.05
  const up = closes[0] <= closes[closes.length - 1]
  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: xLabels,
      datasets: [{
        label: 'Fechamento',
        data: closes,
        borderColor: up ? '#06c167' : '#e60014',
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220)
          g.addColorStop(0, up ? 'rgba(6,193,103,0.2)' : 'rgba(230,0,20,0.2)')
          g.addColorStop(1, 'rgba(0,0,0,0)')
          return g
        },
        fill: true,
        tension: 0.3,
        pointRadius: 1,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { display: true, ticks: { maxTicksLimit: 6, font: { size: 9 } } },
        y: {
          min: Math.max(0, min - padding),
          max: max + padding,
          ticks: { font: { size: 9 }, callback: v => v.toFixed(2) }
        }
      }
    }
  })
  chartLoading.value = false
  chartReady.value = true
}

function renderSplitCharts(results, symbols) {
  const instances = []
  for (let i = 0; i < results.length; i++) {
    if (!results[i]) continue
    const quotes = results[i]?.chart?.result?.[0]?.indicators?.quote?.[0]
    const closes = quotes?.close?.filter(c => c != null) || []
    if (closes.length < 2) continue
    const label = symbols[i].replace('^', '')
    instances.push({ label, closes, color: CHART_COLORS[i % CHART_COLORS.length], ready: false })
  }
  chartInstances.value = instances
  chartLoading.value = false
  nextTick(() => {
    for (let i = 0; i < chartInstances.value.length; i++) {
      const inst = chartInstances.value[i]
      const el = chartRefs[i]
      if (!el) continue
      if (chartInstance) chartInstance.destroy()
      const ch = makeChart(el, inst.closes, inst.label, inst.color)
      if (ch) {
        inst.ready = true
        chartInstances.value = [...chartInstances.value]
      }
    }
  })
}

async function openDetail(stock) {
  detail.value = { ...stock }
  chartRange.value = '1mo'
  await Promise.all([loadChart(), loadFundamentals(stock.symbol)])
}

async function loadFundamentals(symbol) {
  try {
    const res = await fetch(`${API_BASE}/api/markets?fundamentals=${symbol}`)
    if (!res.ok) return
    const data = await res.json()
    if (data && !data.error && detail.value) {
      detail.value = { ...detail.value, ...data }
    }
  } catch {}
}

async function setChartRange(range) {
  chartRange.value = range
  if (detail.value) await loadChart()
}

async function lookupTicker() {
  const q = searchQuery.value.trim().toUpperCase()
  if (!q) return
  const idx = stocks.value.findIndex(s => s.symbol.toUpperCase() === q)
  if (idx >= 0) {
    const old = stocks.value[idx]
    stocks.value[idx] = { ...old, price: 0, change: 0, changePercent: 0 }
    try {
      const res = await fetch(`${API_BASE}/api/markets?symbols=${q}`)
      if (res.ok) {
        const data = await res.json()
        if (data.stocks?.length) stocks.value[idx] = data.stocks[0]
      }
    } catch {}
    return
  }
  try {
    const res = await fetch(`${API_BASE}/api/markets?symbols=${q}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.stocks?.length) {
      stocks.value.unshift(data.stocks[0])
      searchQuery.value = ''
    }
  } catch {}
}

watch(selectedTypes, () => { loadIndexCharts() }, { deep: true })

let searchTimer
watch(searchQuery, (val) => {
  clearTimeout(searchTimer)
  if (!val || val.trim().length < 2) return
  searchTimer = setTimeout(() => liveLookup(val.trim()), 600)
})

async function liveLookup(q) {
  const upper = q.toUpperCase()
  const exists = stocks.value.some(s => s.symbol.toUpperCase() === upper)
  if (exists) return
  try {
    const res = await fetch(`${API_BASE}/api/markets?symbols=${upper}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.stocks?.length) {
      const found = data.stocks[0]
      if (!stocks.value.some(s => s.symbol.toUpperCase() === found.symbol.toUpperCase())) {
        stocks.value.unshift(found)
      }
    }
  } catch {}
}

watch(detail, (val) => {
  if (!val) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null }
    chartInstances.value = []
    chartReady.value = false
    chartLoading.value = false
    chartError.value = ''
  }
})

onMounted(() => {
  fetchAll()
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
  alertCheckTimer = setInterval(checkAlerts, 30000)
})

onUnmounted(() => {
  if (alertCheckTimer) clearInterval(alertCheckTimer)
  for (const c of indexCharts) c.destroy()
  indexCharts = []
})
</script>

<style scoped>
.markets-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 3rem;
}

.markets-header {
  align-items: flex-start;
}
.markets-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.alerts-badge {
  font-size: 0.7rem;
  background: var(--border-color);
  color: var(--text-primary);
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  font-weight: bold;
  white-space: nowrap;
}

.btn-back {
  border: 1px solid var(--border-color);
  background: transparent;
  border-radius: 3px;
  padding: 0.35rem 1rem;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-primary);
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-back:hover {
  background: var(--text-primary);
  color: #fff;
}

.ticker-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  cursor: grab;
}
.ticker-bar::-webkit-scrollbar { height: 5px; }
.ticker-bar::-webkit-scrollbar-track { background: transparent; }
.ticker-bar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }

.ticker-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-right: 1px solid var(--border-color);
  min-width: 95px;
}
.ticker-item:last-child { border-right: none; }

.ticker-label {
  font-size: 0.68rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.ticker-value {
  font-size: 0.8rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
  margin-top: 0.15rem;
}
.ticker-change {
  font-size: 0.68rem;
  font-weight: bold;
}
.ticker-empty {
  color: var(--text-secondary);
  font-size: 0.82rem;
  padding: 0.25rem 0;
}

.filter-section {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-blocks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 1;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-label {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-primary);
  transition: all 0.15s;
}
.chip:hover { border-color: var(--accent-color); color: var(--accent-color); }
.chip.active { background: var(--text-primary); color: #fff; border-color: var(--text-primary); }

.search-group {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.search-input {
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
  font-family: inherit;
  color: var(--text-primary);
  background: #fff;
  outline: none;
  width: 160px;
  transition: border-color 0.15s;
}
.search-input:focus { border-color: var(--accent-color); }
.search-input::placeholder { color: var(--text-secondary); }

.search-btn {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.3rem 0.5rem;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
  line-height: 1;
  color: var(--text-primary);
  transition: all 0.15s;
}
.search-btn:hover { border-color: var(--accent-color); }

.loading-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.result-info {
  font-size: 0.78rem;
  color: var(--text-secondary);
}
.preview-note {
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
}
.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
}

.stocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.85rem;
}

@media (max-width: 480px) {
  .stocks-grid { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
}

.stock-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.85rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.stock-card:hover {
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.stock-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.35rem;
}

.stock-top-right {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.card-bell {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
  line-height: 1;
  font-family: inherit;
  transition: transform 0.15s;
}
.card-bell:hover { transform: scale(1.3); }

.stock-symbol {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-primary);
}

.stock-type-badge {
  font-size: 0.6rem;
  font-weight: bold;
  padding: 0.1rem 0.35rem;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.stock-type-badge.ações { background: rgba(0,84,160,0.1); color: #0054a0; }
.stock-type-badge.fiis { background: rgba(6,193,103,0.1); color: #06c167; }
.stock-type-badge.etfs { background: rgba(255,153,0,0.1); color: #cc7a00; }
.stock-type-badge.reits { background: rgba(230,0,20,0.1); color: #e60014; }
.stock-type-badge.índices { background: rgba(184,134,11,0.1); color: #b8860b; }

.stock-name {
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.15rem;
}

.stock-price {
  font-size: 0.9rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

.stock-change {
  font-size: 0.72rem;
  font-weight: bold;
}

.up { color: #06c167; }
.down { color: #e60014; }

.stock-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.62rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

/* Index charts on main page */
.index-charts-section {
  margin-top: 1rem;
}
.index-charts-title {
  font-size: 0.85rem;
  font-weight: bold;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-primary);
}
.index-charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}
@media (max-width: 600px) {
  .index-charts-grid { grid-template-columns: 1fr; }
}
.index-chart-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.75rem;
}
.index-chart-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}
.index-chart-label {
  font-size: 0.72rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
}
.index-chart-price {
  font-size: 0.9rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}
.index-chart-change {
  font-size: 0.72rem;
  font-weight: bold;
}
.index-chart-canvas-wrap {
  height: 180px;
  position: relative;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.modal-content {
  max-width: 480px;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  padding: 1.5rem;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-family: inherit;
  line-height: 1;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.modal-header h2 { font-size: 1.3rem; margin: 0; }
.modal-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-alert {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem;
  line-height: 1;
  font-family: inherit;
  transition: transform 0.15s;
}
.btn-alert:hover { transform: scale(1.2); }
.bell-active { filter: none; }
.bell-inactive { opacity: 0.4; filter: grayscale(1); }

.alert-form {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.5rem;
}
.alert-label {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: block;
  margin-bottom: 0.3rem;
}
.alert-input-row {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
.alert-select {
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.25rem 0.4rem;
  font-size: 0.8rem;
  font-family: inherit;
  background: #fff;
  color: var(--text-primary);
  width: 50px;
}
.alert-input {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  font-family: inherit;
  color: var(--text-primary);
  background: #fff;
  outline: none;
  min-width: 0;
}
.alert-input:focus { border-color: var(--accent-color); }
.alert-movement {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
}

.alert-save-btn {
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.alert-cancel-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.25rem 0.4rem;
  font-size: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-secondary);
  line-height: 1;
}
.alert-error {
  font-size: 0.7rem;
  color: #c62828;
  display: block;
  margin-top: 0.25rem;
}

.modal-subtitle { font-size: 0.78rem; color: var(--text-secondary); display: block; margin-top: 0.1rem; }

.modal-badges {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}
.badge-exchange {
  font-size: 0.62rem;
  font-weight: bold;
  color: var(--text-secondary);
  background: #f5f0e6;
  padding: 0.1rem 0.4rem;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.badge-type {
  font-size: 0.62rem;
  font-weight: bold;
  padding: 0.1rem 0.4rem;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.badge-type.ações { background: rgba(0,84,160,0.1); color: #0054a0; }
.badge-type.fiis { background: rgba(6,193,103,0.1); color: #06c167; }
.badge-type.etfs { background: rgba(255,153,0,0.1); color: #cc7a00; }
.badge-type.reits { background: rgba(230,0,20,0.1); color: #e60014; }
.badge-type.índices { background: rgba(184,134,11,0.1); color: #b8860b; }

.modal-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.modal-price {
  font-size: 1.5rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

.modal-change {
  font-size: 0.85rem;
  font-weight: bold;
}

.chart-bar {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.range-chip {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-primary);
  transition: all 0.15s;
}
.range-chip:hover { border-color: var(--accent-color); color: var(--accent-color); }
.range-chip.active { background: var(--text-primary); color: #fff; border-color: var(--text-primary); }

.chart-container {
  height: 200px;
  margin-bottom: 1rem;
  position: relative;
}

.chart-container.chart-split {
  height: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.chart-single {
  height: 200px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5rem;
  position: relative;
}

.chart-label {
  font-size: 0.72rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
  display: block;
  text-align: center;
  margin-bottom: 0.25rem;
}

.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.chart-loading-full {
  position: absolute;
  inset: 0;
}

@media (max-width: 480px) {
  .chart-container.chart-split {
    grid-template-columns: 1fr;
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.metric-label {
  font-size: 0.65rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.metric-value {
  font-size: 0.82rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

.fundamentals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.fundamentals-title {
  grid-column: 1 / -1;
  font-size: 0.8rem;
  font-weight: bold;
  margin: 0 0 0.2rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.trade-section {
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
  margin-bottom: 1rem;
}

.trade-title {
  font-size: 0.82rem;
  margin: 0 0 0.4rem;
  font-weight: bold;
}

.trade-row {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
}

.trade-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: bold;
}

.trade-value {
  font-size: 0.82rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}
.trade-value.dim { color: var(--text-secondary); }

.btn-yahoo {
  display: block;
  text-align: center;
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
  transition: background 0.15s;
}
.btn-yahoo:hover { background: #0f2740; }

@media (max-width: 600px) {
  .markets-header { flex-direction: column; gap: 0.75rem; }
  .markets-header h2 { font-size: 1.3rem; margin: 0; }
  .markets-header p { font-size: 0.82rem; }

  .filter-section { flex-direction: column; align-items: stretch; }
  .search-group { width: 100%; }
  .search-input { width: 100%; flex: 1; font-size: 0.82rem; padding: 0.4rem 0.6rem; }

  .stock-card { padding: 0.65rem; gap: 0.2rem; }
  .stock-symbol { font-size: 0.85rem; }
  .stock-price { font-size: 0.8rem; }
  .stock-change { font-size: 0.65rem; }
  .stock-name { font-size: 0.62rem; }
  .stock-meta { font-size: 0.58rem; }
  .stock-type-badge { font-size: 0.55rem; padding: 0.08rem 0.3rem; }
  .stock-vol { display: none; }

  .stocks-grid { gap: 0.6rem; }

  .modal-content { padding: 1rem; max-width: 100%; margin: 0.5rem; border-radius: 4px; }
  .modal-price { font-size: 1.2rem; }
  .modal-header h2 { font-size: 1.1rem; }
  .modal-subtitle { font-size: 0.7rem; }
  .modal-price-row { margin-bottom: 0.5rem; }
  .chart-container { height: 160px; }
  .metrics-grid { gap: 0.3rem; }
  .trade-section { padding-top: 0.5rem; }
  .trade-label { font-size: 0.7rem; }
  .trade-value { font-size: 0.75rem; }
}
</style>
