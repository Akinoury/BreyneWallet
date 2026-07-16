<template>
  <div class="markets-wrapper animate-fade-in">
    <div class="markets-header flex-between">
      <div>
        <h2>📈 Mercados</h2>
        <p>Cotações ao vivo das principais bolsas e moedas.</p>
      </div>
      <button class="btn-back" @click="$router.push('/investments')">← Voltar</button>
    </div>

    <div class="ticker-bar glass-panel">
      <div class="ticker-item" v-for="t in tickers" :key="t.label">
        <span class="ticker-label">{{ t.label }}</span>
        <span class="ticker-value" :class="t.change >= 0 ? 'up' : 'down'">{{ t.value }}</span>
        <span class="ticker-change" :class="t.change >= 0 ? 'up' : 'down'">{{ t.change >= 0 ? '+' : '' }}{{ t.change }}%</span>
      </div>
    </div>

    <div class="exchange-chips">
      <button
        class="chip"
        :class="{ active: selectedExchange === null }"
        @click="selectedExchange = null"
      >Todas</button>
      <button
        v-for="ex in exchanges"
        :key="ex.key"
        class="chip"
        :class="{ active: selectedExchange === ex.key }"
        @click="selectedExchange = ex.key"
      >{{ ex.label }}</button>
    </div>

    <div v-if="loading" class="loading-state">Carregando mercados...</div>
    <div v-else-if="error" class="alert-box alert-error">{{ error }}</div>

    <div v-else class="stocks-grid">
      <button
        v-for="s in filteredStocks"
        :key="s.symbol"
        class="stock-card glass-panel"
        @click="openDetail(s)"
      >
        <div class="stock-symbol">{{ s.symbol.replace('.SA','').replace('.IR','') }}</div>
        <div class="stock-name">{{ s.shortName || s.symbol }}</div>
        <div class="stock-price" :class="s.change >= 0 ? 'up' : 'down'">
          {{ s.currency }} {{ formatPrice(s.price) }}
        </div>
        <div class="stock-change" :class="s.change >= 0 ? 'up' : 'down'">
          {{ s.change >= 0 ? '+' : '' }}{{ s.changePercent?.toFixed(2) }}%
        </div>
        <div class="stock-exchange">{{ getExchangeLabel(s.exchange) }}</div>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="detail" class="modal-overlay" @click.self="detail = null">
        <div class="modal-content glass-panel">
          <button class="modal-close" @click="detail = null">✕</button>
          <div class="modal-header">
            <h2>{{ detail.symbol.replace('.SA','').replace('.IR','') }}</h2>
            <span class="modal-exchange">{{ getExchangeLabel(detail.exchange) }}</span>
          </div>

          <div class="modal-price-row">
            <span class="modal-price" :class="detail.change >= 0 ? 'up' : 'down'">
              {{ detail.currency }} {{ formatPrice(detail.price) }}
            </span>
            <span class="modal-change" :class="detail.change >= 0 ? 'up' : 'down'">
              {{ detail.change >= 0 ? '+' : '' }}{{ detail.changePercent?.toFixed(2) }}%
            </span>
          </div>

          <div class="chart-container">
            <canvas ref="chartCanvas" v-show="chartReady"></canvas>
            <div v-if="chartLoading" class="chart-loading">Carregando gráfico...</div>
          </div>

          <div class="metrics-grid">
            <div class="metric">
              <span class="metric-label">Abertura</span>
              <span class="metric-value">{{ detail.currency }} {{ formatPrice(detail.open) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Fechamento Anterior</span>
              <span class="metric-value">{{ detail.currency }} {{ formatPrice(detail.prevClose) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Máxima do Dia</span>
              <span class="metric-value">{{ detail.currency }} {{ formatPrice(detail.high) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Mínima do Dia</span>
              <span class="metric-value">{{ detail.currency }} {{ formatPrice(detail.low) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Volume</span>
              <span class="metric-value">{{ formatVolume(detail.volume) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Mercado</span>
              <span class="metric-value">{{ detail.marketState === 'REGULAR' ? 'Aberto' : 'Fechado' }}</span>
            </div>
          </div>

          <div class="trade-section">
            <div class="trade-row">
              <span class="trade-label">Compra (Bid)</span>
              <span class="trade-value up" v-if="detail.bid">{{ detail.currency }} {{ formatPrice(detail.bid) }}</span>
              <span class="trade-value" v-else>—</span>
            </div>
            <div class="trade-row">
              <span class="trade-label">Venda (Ask)</span>
              <span class="trade-value down" v-if="detail.ask">{{ detail.currency }} {{ formatPrice(detail.ask) }}</span>
              <span class="trade-value" v-else>—</span>
            </div>
          </div>

          <a
            :href="`https://finance.yahoo.com/quote/${detail.symbol}`"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-yahoo"
          >Ver no Yahoo Finance →</a>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  Chart, LineElement, PointElement, LineController,
  LinearScale, CategoryScale, Filler, Tooltip
} from 'chart.js'

Chart.register(LineElement, PointElement, LineController, LinearScale, CategoryScale, Filler, Tooltip)

const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart'
const AWESOME_API = 'https://economia.awesomeapi.com.br/last'
const COINGECKO = 'https://api.coingecko.com/api/v3/simple/price'

const exchanges = [
  { key: 'NASDAQ', label: 'NASDAQ' },
  { key: 'NYSE', label: 'NYSE' },
  { key: 'B3', label: 'B3 (Brasil)' },
  { key: 'IRL', label: 'Irlanda' }
]

const SYMBOLS = {
  NASDAQ: ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','NFLX'],
  NYSE: ['BRK-B','JPM','V','JNJ','WMT','KO','DIS','BA'],
  B3: ['PETR4.SA','VALE3.SA','ITUB4.SA','BBAS3.SA','BBDC4.SA','ABEV3.SA','WEGE3.SA','ELET3.SA'],
  IRL: ['CRH','DCC','KRX','FLTR','IQQQ.IR','ISF.IR','JAM.L','RCP.L']
}

const tickers = ref([])
const stocks = ref([])
const loading = ref(true)
const error = ref('')
const selectedExchange = ref(null)
const detail = ref(null)
const chartCanvas = ref(null)
let chartInstance = null
const chartLoading = ref(false)
const chartReady = ref(false)

const filteredStocks = computed(() => {
  if (!selectedExchange.value) return stocks.value
  return stocks.value.filter(s => s.exchange === selectedExchange.value)
})

function getExchangeLabel(key) {
  return exchanges.find(e => e.key === key)?.label || key
}

function formatPrice(v) {
  if (v == null || isNaN(v)) return '—'
  if (v >= 100) return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (v >= 1) return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

function formatVolume(v) {
  if (!v) return '—'
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toLocaleString('pt-BR')
}

function getCurrency(exchange) {
  if (exchange === 'B3') return 'R$'
  if (exchange === 'IRL') return '€'
  return 'US$'
}

async function fetchTickers() {
  try {
    const [forexRes, cryptoRes] = await Promise.all([
      fetch(`${AWESOME_API}/USD-BRL,EUR-BRL,JPY-BRL`).then(r => r.json()),
      fetch(`${COINGECKO}?ids=bitcoin,ethereum,binancecoin&vs_currencies=brl&include_24hr_change=true`).then(r => r.json())
    ])

    const items = []
    const usdBrl = parseFloat(forexRes.USDBRL?.bid || 0)
    const eurBrl = parseFloat(forexRes.EURBRL?.bid || 0)
    const jpyBrl = parseFloat(forexRes.JPYBRL?.bid || 0)

    if (usdBrl) {
      items.push({ label: 'USD/BRL', value: `R$ ${usdBrl.toFixed(4)}`, change: parseFloat(forexRes.USDBRL?.pctChange || 0) })
    }
    if (eurBrl) {
      items.push({ label: 'EUR/BRL', value: `R$ ${eurBrl.toFixed(4)}`, change: parseFloat(forexRes.EURBRL?.pctChange || 0) })
    }
    if (jpyBrl) {
      items.push({ label: 'JPY/BRL', value: `R$ ${jpyBrl.toFixed(4)}`, change: parseFloat(forexRes.JPYBRL?.pctChange || 0) })
    }
    if (cryptoRes.bitcoin) {
      items.push({ label: 'BTC/BRL', value: `R$ ${cryptoRes.bitcoin.brl?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: cryptoRes.bitcoin.brl_24h_change?.toFixed(2) || 0 })
    }
    if (cryptoRes.ethereum) {
      items.push({ label: 'ETH/BRL', value: `R$ ${cryptoRes.ethereum.brl?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: cryptoRes.ethereum.brl_24h_change?.toFixed(2) || 0 })
    }
    if (cryptoRes.binancecoin) {
      items.push({ label: 'BNB/BRL', value: `R$ ${cryptoRes.binancecoin.brl?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: cryptoRes.binancecoin.brl_24h_change?.toFixed(2) || 0 })
    }

    tickers.value = items
  } catch {
    tickers.value = []
  }
}

async function fetchStockQuotes() {
  const allSymbols = Object.values(SYMBOLS).flat()
  const results = []

  const batchSize = 5
  for (let i = 0; i < allSymbols.length; i += batchSize) {
    const batch = allSymbols.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map(async (symbol) => {
        const url = `${YAHOO}/${symbol}?range=5d&interval=1d`
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
        if (!res.ok) return null
        const data = await res.json()
        const q = data.chart?.result?.[0]?.meta
        const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0]
        if (!q) return null

        const prices = q.regularMarketPrice != null ? [q.regularMarketPrice] : []
        const prevClose = q.chartPreviousClose || q.previousClose || 0
        const change = prices.length > 0 ? prices[0] - prevClose : 0
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

        let exchange = 'NASDAQ'
        if (symbol.endsWith('.SA')) exchange = 'B3'
        else if (symbol.endsWith('.IR')) exchange = 'IRL'
        else if (symbol.endsWith('.L')) exchange = 'IRL'
        else if (['BRK-B','JPM','V','JNJ','WMT','KO','DIS','BA'].includes(symbol)) exchange = 'NYSE'

        return {
          symbol,
          exchange,
          shortName: q.shortName || q.symbol,
          price: prices[0] || 0,
          change,
          changePercent,
          prevClose,
          open: q.regularMarketOpen || 0,
          high: q.regularMarketDayHigh || 0,
          low: q.regularMarketDayLow || 0,
          volume: q.regularMarketVolume || 0,
          bid: q.bid || null,
          ask: q.ask || null,
          marketState: q.marketState || 'CLOSED',
          currency: getCurrency(exchange),
          data: data.chart?.result?.[0]
        }
      })
    )
    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value)
    }
  }

  stocks.value = results
}

async function fetchChartData(symbol) {
  const url = `${YAHOO}/${symbol}?range=1mo&interval=1d`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error('Falha ao carregar gráfico')
  return res.json()
}

function renderChart(data) {
  if (!chartCanvas.value) return
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const timestamps = data.chart?.result?.[0]?.timestamp || []
  const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0]
  const closes = quotes?.close || []

  const labels = timestamps.map(t => {
    const d = new Date(t * 1000)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  })
  const prices = closes.filter(c => c != null)

  if (prices.length === 0) {
    chartLoading.value = false
    chartReady.value = false
    return
  }

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const padding = (max - min) * 0.1 || max * 0.05

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: labels.slice(-prices.length),
      datasets: [{
        label: 'Fechamento',
        data: prices,
        borderColor: prices[0] <= prices[prices.length - 1] ? '#06c167' : '#e60014',
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300)
          g.addColorStop(0, prices[0] <= prices[prices.length - 1] ? 'rgba(6,193,103,0.2)' : 'rgba(230,0,20,0.2)')
          g.addColorStop(1, 'rgba(0,0,0,0)')
          return g
        },
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { display: true, ticks: { maxTicksLimit: 8, font: { size: 10 } } },
        y: {
          min: min - padding,
          max: max + padding,
          ticks: { font: { size: 10 }, callback: v => v.toFixed(2) }
        }
      }
    }
  })

  chartLoading.value = false
  chartReady.value = true
}

async function openDetail(stock) {
  detail.value = { ...stock }
  chartLoading.value = true
  chartReady.value = false

  try {
    const data = await fetchChartData(stock.symbol)
    await nextTick()
    renderChart(data)
  } catch {
    chartLoading.value = false
    chartReady.value = false
  }
}

watch(detail, (val) => {
  if (!val) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null }
    chartReady.value = false
  }
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([fetchTickers(), fetchStockQuotes()])
  } catch (e) {
    error.value = 'Erro ao carregar dados dos mercados.'
  } finally {
    loading.value = false
  }
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
}
.btn-back:hover {
  background: var(--text-primary);
  color: #fff;
}

.ticker-bar {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
}

.ticker-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-right: 1px solid var(--border-color);
  min-width: 100px;
}
.ticker-item:last-child { border-right: none; }

.ticker-label {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ticker-value {
  font-size: 0.82rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
  margin-top: 0.15rem;
}

.ticker-change {
  font-size: 0.7rem;
  font-weight: bold;
}

.up { color: #06c167; }
.down { color: #e60014; }

.exchange-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.35rem 0.85rem;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-primary);
  transition: all 0.15s;
}
.chip:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}
.chip.active {
  background: var(--text-primary);
  color: #fff;
  border-color: var(--text-primary);
}

.loading-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.stocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

@media (max-width: 600px) {
  .stocks-grid { grid-template-columns: repeat(2, 1fr); }
}

.stock-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.stock-card:hover {
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.stock-symbol {
  font-size: 1.05rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
}

.stock-name {
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-price {
  font-size: 1rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

.stock-change {
  font-size: 0.78rem;
  font-weight: bold;
  margin-top: 0.15rem;
}

.stock-exchange {
  font-size: 0.65rem;
  color: var(--text-secondary);
  margin-top: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
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
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.modal-header h2 {
  font-size: 1.3rem;
  margin: 0;
}
.modal-exchange {
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: #f5f0e6;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.modal-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.modal-price {
  font-size: 1.6rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

.modal-change {
  font-size: 0.9rem;
  font-weight: bold;
}

.chart-container {
  height: 220px;
  margin-bottom: 1rem;
  position: relative;
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

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.metric-label {
  font-size: 0.68rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.metric-value {
  font-size: 0.85rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

.trade-section {
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
  margin-bottom: 1rem;
}

.trade-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.trade-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: bold;
}

.trade-value {
  font-size: 0.85rem;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

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
.btn-yahoo:hover {
  background: #0f2740;
}
</style>
