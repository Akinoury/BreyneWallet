<template>
  <div class="markets-wrapper animate-fade-in">
    <div class="markets-header flex-between">
      <div>
        <h2>📈 Mercados</h2>
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
      <div class="filter-group">
        <span class="filter-label">Bolsa</span>
        <div class="chip-row">
          <button class="chip" :class="{ active: filterExchange === null }" @click="filterExchange = null">Todas</button>
          <button v-for="ex in exchanges" :key="ex.key" class="chip" :class="{ active: filterExchange === ex.key }" @click="filterExchange = ex.key">{{ ex.label }}</button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">Tipo</span>
        <div class="chip-row">
          <button class="chip" :class="{ active: filterType === null }" @click="filterType = null">Todos</button>
          <button v-for="t in assetTypes" :key="t.key" class="chip" :class="{ active: filterType === t.key }" @click="filterType = t.key">{{ t.label }}</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Carregando mercados...</div>
    <div v-else-if="error" class="alert-box alert-error">{{ error }}</div>

    <template v-else>
      <div class="result-info">
        <strong>{{ filteredStocks.length }}</strong> ativo{{ filteredStocks.length !== 1 ? 's' : '' }} encontrado{{ filteredStocks.length !== 1 ? 's' : '' }}
      </div>

      <div v-if="filteredStocks.length === 0" class="empty-state glass-panel">
        <span class="empty-icon">📊</span>
        <p>Nenhum ativo encontrado para este filtro.</p>
      </div>

      <div v-else class="stocks-grid">
        <button
          v-for="s in filteredStocks"
          :key="s.symbol"
          class="stock-card glass-panel"
          @click="openDetail(s)"
        >
          <div class="stock-top">
            <div class="stock-symbol">{{ s.symbol.replace('.SA','').replace('.IR','').replace('.L','') }}</div>
            <div class="stock-type-badge" :class="s.assetType.toLowerCase()">{{ s.assetType }}</div>
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
    </template>

    <Teleport to="body">
      <div v-if="detail" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content glass-panel">
          <button class="modal-close" @click="closeDetail">✕</button>

          <div class="modal-header">
            <div>
              <h2>{{ detail.symbol.replace('.SA','').replace('.IR','').replace('.L','') }}</h2>
              <span class="modal-subtitle">{{ detail.longName || detail.shortName }}</span>
            </div>
            <div class="modal-badges">
              <span class="badge-exchange">{{ getExchangeLabel(detail.exchange) }}</span>
              <span class="badge-type" :class="detail.assetType.toLowerCase()">{{ detail.assetType }}</span>
            </div>
          </div>

          <div class="modal-price-row">
            <span class="modal-price" :class="detail.change >= 0 ? 'up' : 'down'">
              {{ detail.currency === 'BRL' ? 'R$' : detail.currency === 'EUR' ? '€' : '$' }} {{ formatPrice(detail.price) }}
            </span>
            <span class="modal-change" :class="detail.change >= 0 ? 'up' : 'down'">
              {{ detail.changePercent >= 0 ? '+' : '' }}{{ detail.changePercent?.toFixed(2) }}%
            </span>
          </div>

          <div class="chart-container">
            <canvas ref="chartCanvas" v-show="chartReady"></canvas>
            <div v-if="chartLoading" class="chart-loading">Carregando gráfico...</div>
            <div v-if="chartError" class="chart-loading">{{ chartError }}</div>
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

          <div class="trade-section">
            <h4 class="trade-title">Compra / Venda</h4>
            <div class="trade-row">
              <span class="trade-label">Compra (Bid)</span>
              <span class="trade-value up" v-if="detail.bid">{{ detail.currency === 'BRL' ? 'R$' : detail.currency === 'EUR' ? '€' : '$' }} {{ formatPrice(detail.bid) }}</span>
              <span class="trade-value dim" v-else>—</span>
            </div>
            <div class="trade-row">
              <span class="trade-label">Venda (Ask)</span>
              <span class="trade-value down" v-if="detail.ask">{{ detail.currency === 'BRL' ? 'R$' : detail.currency === 'EUR' ? '€' : '$' }} {{ formatPrice(detail.ask) }}</span>
              <span class="trade-value dim" v-else>—</span>
            </div>
            <div class="trade-row">
              <span class="trade-label">Spread</span>
              <span class="trade-value" v-if="detail.bid && detail.ask">{{ formatPrice(detail.ask - detail.bid) }}</span>
              <span class="trade-value dim" v-else>—</span>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
  { key: 'REITs', label: 'REITs' }
]

const stocks = ref([])
const tickers = ref([])
const loading = ref(true)
const loaded = ref(false)
const error = ref('')
const filterExchange = ref(null)
const filterType = ref(null)
const detail = ref(null)
const chartCanvas = ref(null)
const chartLoading = ref(false)
const chartReady = ref(false)
const chartError = ref('')
let chartInstance = null

const filteredStocks = computed(() => {
  let result = stocks.value
  if (filterExchange.value) {
    result = result.filter(s => s.exchange === filterExchange.value)
  }
  if (filterType.value) {
    result = result.filter(s => s.assetType === filterType.value)
  }
  return result
})

function getExchangeLabel(key) {
  return exchanges.find(e => e.key === key)?.label || key
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
    if (f.USDBRL) {
      const brlUsd = 1 / parseFloat(f.USDBRL.bid)
      items.push({ label: 'BRL/USD', value: `$ ${brlUsd.toFixed(6)}`, change: 0 })
    }

    const c = data.crypto || {}
    if (c.bitcoin) items.push({ label: 'BTC/USD', value: `$ ${c.bitcoin.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.bitcoin.usd_24h_change || 0).toFixed(2) })
    if (c.ethereum) items.push({ label: 'ETH/USD', value: `$ ${c.ethereum.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.ethereum.usd_24h_change || 0).toFixed(2) })
    if (c.binancecoin) items.push({ label: 'BNB/USD', value: `$ ${c.binancecoin.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.binancecoin.usd_24h_change || 0).toFixed(2) })
    if (c.solana) items.push({ label: 'SOL/USD', value: `$ ${c.solana.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.solana.usd_24h_change || 0).toFixed(2) })
    if (c.ripple) items.push({ label: 'XRP/USD', value: `$ ${c.ripple.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.ripple.usd_24h_change || 0).toFixed(2) })
    if (c.cardano) items.push({ label: 'ADA/USD', value: `$ ${c.cardano.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.cardano.usd_24h_change || 0).toFixed(2) })
    if (c.dogecoin) items.push({ label: 'DOGE/USD', value: `$ ${c.dogecoin.usd?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: (c.dogecoin.usd_24h_change || 0).toFixed(2) })

    tickers.value = items
  } catch (e) {
    error.value = 'Erro ao carregar dados dos mercados. Tente novamente.'
  } finally {
    loading.value = false
    loaded.value = true
  }
}

async function fetchChart(symbol) {
  chartLoading.value = true
  chartReady.value = false
  chartError.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/markets?chart=${symbol}&range=1mo`)
    if (!res.ok) throw new Error('Falha ao carregar')
    return await res.json()
  } catch {
    chartError.value = 'Gráfico indisponível'
    chartLoading.value = false
    return null
  }
}

function renderChart(data) {
  if (!chartCanvas.value) return
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }

  const timestamps = data.chart?.result?.[0]?.timestamp || []
  const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0]
  const closes = quotes?.close?.filter(c => c != null) || []

  if (closes.length < 2) {
    chartError.value = 'Dados insuficientes para o gráfico'
    chartLoading.value = false
    return
  }

  const labels = timestamps.slice(-closes.length).map(t => {
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
      labels,
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

async function openDetail(stock) {
  detail.value = { ...stock }
  const data = await fetchChart(stock.symbol)
  if (data) {
    await nextTick()
    renderChart(data)
  }
}

watch(detail, (val) => {
  if (!val) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null }
    chartReady.value = false
    chartLoading.value = false
    chartError.value = ''
  }
})

onMounted(() => {
  fetchAll()
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
  scrollbar-width: none;
}
.ticker-bar::-webkit-scrollbar { display: none; }

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
  flex-direction: column;
  gap: 0.75rem;
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

.modal-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1rem;
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

.chart-container {
  height: 200px;
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
</style>
