<template>
  <div class="investments-wrapper animate-fade-in">
    <div class="flex-between header-section">
      <div>
        <h2>Carteira de Investimentos</h2>
        <p>Acompanhe e registre a distribuição de seus ativos nacionais e internacionais.</p>
        <button class="btn-markets" @click="$router.push('/markets')">📈 Mercados</button>
        <button class="btn-export" @click="exportCSV">📥 Exportar CSV</button>
      </div>
      <!-- PORTFOLIO GRAND TOTAL -->
      <div class="grand-total-card glass-panel">
        <small>Total Patrimônio Investido</small>
        <h3>R$ {{ formatCurrency(store.totalInvestments) }}</h3>
        <div class="exchange-rate-line" v-if="exchangeRate">
          <span class="pulse-dot-sm"></span>
          <small>US$ 1 = R$ {{ exchangeRate.toFixed(4) }}</small>
          <small class="rate-source">Dólar Comercial (BCB)</small>
        </div>
        <div class="exchange-rate-line" v-else>
          <small class="text-muted">Carregando câmbio...</small>
        </div>
      </div>
    </div>

    <!-- PENALTY WARNING -->
    <div v-if="store.exceededValue > 0 || store.penaltyValue > 0" class="penalty-warning-box animate-fade-in">
      ⚠️ <strong>Penitência por Excesso de Consumo:</strong> R$ {{ formatCurrency(Number((store.exceededValue + store.penaltyValue).toFixed(2))) }} deduzidos dos investimentos (Excesso: R$ {{ formatCurrency(store.exceededValue) }} + Penalidade 50%: R$ {{ formatCurrency(store.penaltyValue) }}).
    </div>

    <!-- ALLOCATION OVERVIEW BAR -->
    <div class="allocation-overview glass-panel text-left">
      <div class="flex-between allocation-labels">
        <span>Distribuição de Moeda</span>
        <div class="label-values">
          <span class="text-blue text-bold">Nacional: {{ percentNational.toFixed(1) }}%</span>
          <span class="divider-dot">•</span>
          <span class="text-purple text-bold">Internacional: {{ percentInternational.toFixed(1) }}%</span>
        </div>
      </div>
      <div class="allocation-progress-bar">
        <div class="alloc-bar national" :style="{ width: percentNational + '%' }"></div>
        <div class="alloc-bar international" :style="{ width: percentInternational + '%' }"></div>
      </div>
      <div class="flex-between allocation-totals">
        <span class="text-blue">R$ {{ formatCurrency(store.nationalInvestmentsTotal) }}</span>
        <span class="text-purple">
          US$ {{ formatUsd(store.internationalInvestmentsTotal) }}
          <small class="text-muted"> ≈ R$ {{ formatCurrency(store.internationalInvestmentsTotalBrl) }}</small>
        </span>
      </div>
    </div>

    <div class="grid-2">
      <!-- FORM TO ADD INVESTMENT -->
      <div class="form-card glass-panel">
        <h3>Registrar Novo Aporte</h3>
        <p class="form-subtitle">Adicione ativos da sua carteira para gerenciar sua alocação.</p>

        <form @submit.prevent="handleSubmit" class="invest-form">
          <div class="form-group">
            <label for="name">Ticket - Ativo</label>
            <input
              type="text"
              id="name"
              v-model="name"
              class="input-field"
              required
            />
            <small class="field-hint">Ex: PETR4, AAPL, Selic 2029</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="amount">
                Valor Investido
                <span class="currency-hint">{{ type === 'international' ? '(US$)' : '(R$)' }}</span>
              </label>
              <div class="amount-input-group">
                <span class="currency-prefix-tag" :class="type === 'international' ? 'usd-tag' : 'brl-tag'">
                  {{ type === 'international' ? 'US$' : 'R$' }}
                </span>
                <input
                  type="number"
                  id="amount"
                  v-model.number="amount"
                  step="0.01"
                  placeholder="0.00"
                  class="input-field-no-left"
                  required
                />
              </div>
              <small v-if="type === 'international' && amount && exchangeRate" class="brl-equiv-hint">
                ≈ R$ {{ formatCurrency(amount * exchangeRate) }} ao câmbio atual
              </small>
            </div>
            <div class="form-group">
              <label for="type">Origem do Ativo</label>
              <select id="type" v-model="type" class="select-field" required>
                <option value="national">Nacional</option>
                <option value="international">Internacional</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="category">Classe de Ativo</label>
            <select id="category" v-model="category" class="select-field" required>
              <option value="Ações">Ações</option>
              <option value="FIIs">FIIs (Fundos Imobiliários)</option>
              <option value="Renda Fixa">Renda Fixa / Tesouro</option>
              <option value="ETFs">ETFs</option>
              <option value="Stocks">Stocks (Ações EUA)</option>
              <option value="REITs">REITs (Imobiliário EUA)</option>
              <option value="Crypto">Criptomoedas</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <button type="submit" class="btn-primary btn-block">Registrar Ativo</button>
        </form>
      </div>

      <!-- ASSET LOGS WITH TABS -->
      <div class="list-card glass-panel">
        <div class="tabs-header">
          <button
            class="tab-btn"
            :class="{ 'active': activeTab === 'national' }"
            @click="activeTab = 'national'"
          >
            Nacionais ({{ nationalAssets.length }})
          </button>
          <button
            class="tab-btn"
            :class="{ 'active': activeTab === 'international' }"
            @click="activeTab = 'international'"
          >
            Internacionais ({{ internationalAssets.length }})
          </button>
        </div>

        <!-- NATIONAL ASSETS -->
        <div v-if="activeTab === 'national'" class="tab-content animate-fade-in">
          <div class="tab-search-row">
            🔍 <input type="text" v-model="nationalSearch" placeholder="Filtrar..." class="tab-search-input" />
          </div>
          <div v-if="filteredNational.length === 0" class="empty-state">
            <p>Nenhum ativo nacional encontrado.</p>
          </div>
          <table v-else class="assets-table">
            <thead>
              <tr>
                <th class="text-nowrap">Ticker</th>
                <th class="text-nowrap">Classe</th>
                <th class="text-right text-nowrap">Valor (R$)</th>
                <th class="text-center"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in filteredNational" :key="i.id">
                <td class="text-bold">{{ i.name }}</td>
                <td><span class="badge badge-national">{{ i.category }}</span></td>
                <td class="text-right text-bold">R$ {{ formatCurrency(i.amount) }}</td>
                <td class="text-center">
                  <button class="btn-edit-sm" @click="startEdit(i)" title="Editar">✏️</button>
                  <button class="btn-delete-sm" @click="store.deleteInvestment(i.id)" title="Excluir">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- INTERNATIONAL ASSETS -->
        <div v-if="activeTab === 'international'" class="tab-content animate-fade-in">
          <div class="tab-search-row">
            🔍 <input type="text" v-model="intlSearch" placeholder="Filtrar..." class="tab-search-input" />
          </div>
          <div v-if="filteredInternational.length === 0" class="empty-state">
            <p>Nenhum ativo internacional encontrado.</p>
          </div>
          <table v-else class="assets-table">
              <thead>
                <tr>
                  <th class="text-nowrap">Ticker</th>
                  <th class="text-nowrap">Classe</th>
                  <th class="text-right text-nowrap">Equiv. (R$)</th>
                  <th class="text-right text-nowrap">Valor (US$)</th>
                  <th class="text-center"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in filteredInternational" :key="i.id">
                  <td class="text-bold">{{ i.name }}</td>
                  <td><span class="badge badge-international">{{ i.category }}</span></td>
                  <td class="text-right text-muted">R$ {{ formatCurrency(i.amount * (exchangeRate || 5.70)) }}</td>
                  <td class="text-right text-bold">US$ {{ formatUsd(i.amount) }}</td>
                  <td class="text-center">
                    <button class="btn-edit-sm" @click="startEdit(i)" title="Editar">✏️</button>
                    <button class="btn-delete-sm" @click="store.deleteInvestment(i.id)" title="Excluir">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>
      </div>
    </div>

    <!-- DONUT CHART -->
    <div class="pie-chart-card glass-panel">
      <div class="pie-chart-header">
        <h3 class="breakdown-title">Distribuição por Classe</h3>
      </div>
      <div class="pie-body">
        <div class="pie-svg-wrap">
          <svg viewBox="0 0 200 200" class="pie-svg">
            <g transform="rotate(-90 100 100)">
              <circle
                v-for="seg in pieSegments"
                :key="seg.label"
                cx="100" cy="100" r="78"
                fill="none"
                :stroke="seg.color"
                stroke-width="38"
                :stroke-dasharray="`${seg.dashLen} ${circumference}`"
                :stroke-dashoffset="seg.dashOffset"
                class="pie-segment"
                :class="{ dim: hoveredCat && hoveredCat.label !== seg.label }"
                @mouseenter="hoveredCat = seg"
                @mouseleave="hoveredCat = null"
                @click="hoveredCat = hoveredCat === seg ? null : seg"
              />
            </g>
            <circle cx="100" cy="100" r="55" fill="var(--bg-color, #f5f0e6)" class="pie-hole" />
            <text x="100" y="96" text-anchor="middle" class="pie-center-label" v-if="!hoveredCat">Total</text>
            <text x="100" y="116" text-anchor="middle" class="pie-center-value" v-if="!hoveredCat">R$ {{ formatCurrency(pieGrandTotal) }}</text>
            <text x="100" y="96" text-anchor="middle" class="pie-center-label" v-if="hoveredCat">{{ hoveredCat.label }}</text>
            <text x="100" y="114" text-anchor="middle" class="pie-center-value" v-if="hoveredCat">R$ {{ formatCurrency(hoveredCat.total) }}</text>
            <text x="100" y="132" text-anchor="middle" class="pie-center-pct" v-if="hoveredCat">{{ hoveredCat.pct.toFixed(1) }}%</text>
          </svg>
        </div>
        <div class="pie-legend">
          <div
            v-for="seg in categoryTotals"
            :key="seg.label"
            class="legend-item"
            :class="{ active: hoveredCat && hoveredCat.label === seg.label }"
            @mouseenter="hoveredCat = seg"
            @mouseleave="hoveredCat = null"
            @click="hoveredCat = hoveredCat === seg ? null : seg"
          >
            <span class="legend-dot" :style="{ background: seg.color }"></span>
            <span class="legend-label">{{ seg.label }}</span>
            <span class="legend-value">R$ {{ formatCurrency(seg.total) }}</span>
            <span class="legend-pct">{{ seg.pct.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT MODAL -->
    <div v-if="editingAsset" class="edit-modal-overlay" @click.self="cancelEdit">
      <div class="edit-modal glass-panel">
        <button class="edit-modal-close" @click="cancelEdit">✕</button>
        <h3 class="edit-modal-title">Editar Aporte</h3>
        <div class="edit-modal-body">
          <div class="edit-modal-field">
            <label class="edit-modal-label">Ticket</label>
            <span class="edit-modal-ticket">{{ editingAsset.name }}</span>
          </div>
          <div class="edit-modal-field">
            <label class="edit-modal-label">Valor</label>
            <div class="edit-modal-amount-wrap">
              <span class="edit-modal-currency-tag">{{ editingAsset.type === 'international' ? 'US$' : 'R$' }}</span>
              <input type="number" v-model.number="editAmount" step="0.01" class="edit-modal-input" />
            </div>
          </div>
          <div class="edit-modal-field">
            <label class="edit-modal-label">Classe</label>
            <select v-model="editCategory" class="edit-modal-select">
              <option v-for="opt in editCategoryOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </div>
        <div class="edit-modal-actions">
          <button class="btn-cancel-modal" @click="cancelEdit">Cancelar</button>
          <button class="btn-save-modal" @click="saveEdit">Salvar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWalletStore } from '../stores/walletStore'

const store = useWalletStore()

const name = ref('')
const amount = ref(null)
const type = ref('national')
const category = ref('Ações')
const activeTab = ref('national')
const exchangeRate = ref(null)

// Edit state (modal)
const editingAsset = ref(null)
const editAmount = ref(null)
const editCategory = ref('')

const editCategoryOptions = computed(() => {
  if (!editingAsset.value) return []
  if (editingAsset.value.type === 'national') {
    return ['Ações', 'FIIs', 'Renda Fixa', 'ETFs', 'Outros']
  }
  return ['Stocks', 'REITs', 'Crypto', 'ETFs', 'Outros']
})

function startEdit(asset) {
  editingAsset.value = asset
  editAmount.value = asset.amount
  editCategory.value = asset.category
}
async function saveEdit() {
  if (!editingAsset.value) return
  if (editAmount.value === null || editAmount.value <= 0) return
  await store.updateInvestment(editingAsset.value.id, {
    amount: Number(editAmount.value),
    category: editCategory.value
  })
  editingAsset.value = null
}
function cancelEdit() {
  editingAsset.value = null
}

// Search on both tabs
const nationalSearch = ref('')
const intlSearch = ref('')

// Pie chart state
const hoveredCat = ref(null)

const circumference = 2 * Math.PI * 78 // ≈ 490.09

const pieGrandTotal = computed(() =>
  store.investments.reduce((sum, i) => {
    const totalBrl = i.type === 'international'
      ? Number(i.amount) * (exchangeRate.value || 5.70)
      : Number(i.amount)
    return sum + totalBrl
  }, 0)
)

const pieSegments = computed(() => {
  let offset = 0
  const total = pieGrandTotal.value || 1
  return categoryTotals.value.map(seg => {
    const dashLen = (seg.pct / 100) * circumference
    const segData = { ...seg, dashLen, dashOffset: -offset }
    offset += dashLen
    return segData
  })
})

// Category totals for the breakdown block
const categoryTotals = computed(() => {
  const map = {}
  store.investments.forEach(inv => {
    const cat = inv.category
    if (!map[cat]) map[cat] = 0
    const totalBrl = inv.type === 'international'
      ? Number(inv.amount) * (exchangeRate.value || 5.70)
      : Number(inv.amount)
    map[cat] += totalBrl
  })
  const grandTotal = Object.values(map).reduce((a, b) => a + b, 0) || 1
  const colors = {
    'Ações': '#0054a0', 'FIIs': '#06c167', 'Renda Fixa': '#cc7a00',
    'ETFs': '#7b2d8e', 'Stocks': '#1a6b3c', 'REITs': '#e60014',
    'Crypto': '#f0b90b', 'Outros': '#888'
  }
  return Object.entries(map).map(([label, total]) => ({
    label,
    total,
    pct: (total / grandTotal) * 100,
    color: colors[label] || '#888'
  })).sort((a, b) => b.total - a.total)
})

// -------------------------------------------------------
// Fetch live dólar comercial from BCB AwesomeAPI
// -------------------------------------------------------
const fetchExchangeRate = async () => {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL')
    if (res.ok) {
      const data = await res.json()
      const rate = Number(data?.USDBRL?.bid)
      if (rate && !isNaN(rate)) {
        exchangeRate.value = rate
        store.usdToBrl = rate
        return rate
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar câmbio USD-BRL:', err)
  }
  // Fallback
  exchangeRate.value = store.usdToBrl || 5.70
  return exchangeRate.value
}

// -------------------------------------------------------
// Opção A: converter ativos internacionais existentes em BRL → USD
// Detectado pelo campo currency ausente (legado = BRL)
// -------------------------------------------------------
const convertLegacyInternationalAssets = (rate) => {
  store.investments.forEach(inv => {
    if (inv.type === 'international' && !inv.currency) {
      inv.amount = Number((inv.amount / rate).toFixed(2))
      inv.currency = 'USD'
    }
  })
  store.saveToLocalStorage()
}

onMounted(async () => {
  await store.loadFromLocalStorage()
  const rate = await fetchExchangeRate()
  convertLegacyInternationalAssets(rate)
})

const nationalAssets = computed(() =>
  store.investments.filter(i => i.type === 'national')
)

const internationalAssets = computed(() =>
  store.investments.filter(i => i.type === 'international')
)

const filteredNational = computed(() => {
  if (!nationalSearch.value) return nationalAssets.value
  const q = nationalSearch.value.toLowerCase()
  return nationalAssets.value.filter(i =>
    i.name.toLowerCase().includes(q)
  )
})

const filteredInternational = computed(() => {
  if (!intlSearch.value) return internationalAssets.value
  const q = intlSearch.value.toLowerCase()
  return internationalAssets.value.filter(i =>
    i.name.toLowerCase().includes(q)
  )
})

// Porcentagens de alocação — baseadas em BRL para comparação justa
const totalInvestedBrl = computed(() =>
  store.nationalInvestmentsTotal + store.internationalInvestmentsTotalBrl || 1
)
const percentNational = computed(() =>
  (store.nationalInvestmentsTotal / totalInvestedBrl.value) * 100
)
const percentInternational = computed(() =>
  (store.internationalInvestmentsTotalBrl / totalInvestedBrl.value) * 100
)

const formatCurrency = (val) =>
  Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatUsd = (val) =>
  Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const handleSubmit = async () => {
  if (!name.value || !amount.value || amount.value <= 0) return

  const inv = {
    id: Date.now(),
    name: name.value,
    amount: Number(amount.value),
    type: type.value,
    category: category.value,
    currency: type.value === 'international' ? 'USD' : 'BRL'
  }

  // Usa a action do store que já persiste
  await store.addInvestment(inv.name, inv.amount, inv.type, inv.category)

  // Marca currency após addInvestment (o store usa um objeto simples)
  const added = store.investments.find(i => i.name === inv.name && i.amount === inv.amount && !i.currency)
  if (added) {
    added.currency = inv.currency
    store.saveToLocalStorage()
  }

  name.value = ''
  amount.value = null
  type.value = 'national'
  category.value = 'Ações'
}

function exportCSV() {
  const header = 'Ticket,Origem,Classe,Valor,Moeda'
  const rows = store.investments.map(i => {
    const currency = i.type === 'international' ? 'USD' : 'BRL'
    const value = Number(i.amount).toFixed(2)
    return `"${i.name}",${i.type},${i.category},${value},${currency}`
  }).join('\n')
  const csv = header + '\n' + rows
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'carteira_breyne.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.investments-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.header-section {
  text-align: left;
}

.header-section h2 {
  font-size: 1.6rem;
  margin-bottom: 0.25rem;
}

.grand-total-card {
  text-align: right;
  padding: 0.75rem 1.5rem;
}

.grand-total-card small {
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: bold;
}

.grand-total-card h3 {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--success-color);
  margin-top: 0.15rem;
}

.exchange-rate-line {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.rate-source {
  color: var(--text-secondary);
  font-size: 0.65rem;
}

.pulse-dot-sm {
  width: 6px;
  height: 6px;
  background: var(--success-color);
  border-radius: 50%;
  display: inline-block;
  animation: pulse-green 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse-green {
  0%   { box-shadow: 0 0 0 0 rgba(30,70,37,0.7); transform: scale(0.95); }
  70%  { box-shadow: 0 0 0 5px rgba(30,70,37,0); transform: scale(1); }
  100% { box-shadow: 0 0 0 0 rgba(30,70,37,0); transform: scale(0.95); }
}

/* Allocation details bar */
.allocation-overview {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.allocation-labels {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: bold;
  text-transform: uppercase;
}

.label-values {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.divider-dot { color: var(--border-color); }

.allocation-progress-bar {
  display: flex;
  height: 14px;
  background: #cdc7b1;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.alloc-bar { height: 100%; }
.alloc-bar.national     { background: var(--text-primary); }
.alloc-bar.international{ background: var(--accent-color); }

.allocation-totals {
  font-size: 0.85rem;
  font-weight: bold;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.allocation-totals .text-blue   { color: var(--text-primary) !important; }
.allocation-totals .text-purple { color: var(--accent-color) !important; }
.allocation-totals .text-muted  { font-weight: normal; }

.form-card, .list-card { text-align: left; }

.form-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.invest-form { display: flex; flex-direction: column; }

.invest-form .form-row {
  grid-template-columns: 0.9fr 1fr;
}

.invest-form .form-row .select-field {
  height: 44px;
  margin-bottom: 0;
  box-sizing: border-box;
}

.invest-form .form-row .form-group {
  margin-bottom: 0;
}

.invest-form .form-row .form-group label {
  white-space: nowrap;
}

.currency-hint {
  font-size: 0.75rem;
  color: var(--accent-color);
  font-weight: normal;
  margin-left: 0.3rem;
}

.amount-input-group {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  overflow: hidden;
  height: 44px;
  box-sizing: border-box;
  max-width: 210px;
}

.currency-prefix-tag {
  padding: 0 0.75rem;
  font-size: 0.85rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--border-color);
  background: #f5f0e6;
  height: 100%;
  box-sizing: border-box;
}

.currency-prefix-tag.brl-tag { color: var(--success-color); }
.currency-prefix-tag.usd-tag { color: #1a6b3c; }

.input-field-no-left {
  border: none;
  outline: none;
  padding: 0 0.75rem;
  flex: 1;
  font-family: "Times New Roman", Times, Georgia, serif;
  font-size: 1rem;
  background: #fff;
  color: var(--text-primary);
  height: 100%;
  box-sizing: border-box;
  text-align: left;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.field-hint,
.brl-equiv-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
  display: block;
}

.btn-markets {
  border: 1px solid var(--accent-color);
  color: var(--accent-color);
  background: transparent;
  border-radius: 3px;
  padding: 0.35rem 1rem;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  margin-top: 0.5rem;
  transition: all 0.15s;
}
.btn-markets:hover {
  background: var(--accent-color);
  color: #fff;
}

.btn-block {
  width: 100%;
  padding: 0.85rem;
  margin-top: 0.5rem;
}

/* Tabs */
.tabs-header {
  display: flex;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 1.25rem;
  gap: 0.5rem;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.75rem 1rem;
  font-weight: bold;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.tab-btn:hover  { color: var(--text-primary); }
.tab-btn.active { color: var(--text-primary); border-bottom-color: var(--accent-color); }

.tab-content {
  min-height: 240px;
  max-height: 480px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.intl-rate-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--success-color);
  font-weight: bold;
  margin-bottom: 0.75rem;
  padding: 0.4rem 0.6rem;
  background: rgba(30,70,37,0.06);
  border-radius: 3px;
  border: 1px solid rgba(30,70,37,0.15);
}

.empty-state {
  padding: 3rem 0;
  text-align: center;
  color: var(--text-secondary);
}

/* Assets table */
.assets-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.assets-table th {
  text-align: left;
  color: var(--text-primary);
  padding: 0.65rem 0.5rem;
  border-bottom: 2px solid var(--border-color);
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.assets-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.assets-table tr:last-child td { border-bottom: none; }

.text-right  { text-align: right; }
.text-center { text-align: center; }
.text-nowrap { white-space: nowrap; }
.text-muted  { color: var(--text-secondary); font-weight: normal !important; }

.btn-delete-sm {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 2px;
  transition: all 0.2s;
}

.btn-delete-sm:hover {
  background: var(--danger-color);
  color: #fff;
  border-color: var(--danger-color);
}

.penalty-warning-box {
  background: #fdf2f2;
  border: 1px solid #f8b4b4;
  color: var(--danger-color);
  padding: 0.75rem 1.25rem;
  border-radius: 3px;
  text-align: left;
  font-size: 0.88rem;
  line-height: 1.4;
}

.btn-export {
  border: 1px solid var(--success-color);
  color: var(--success-color);
  background: transparent;
  border-radius: 3px;
  padding: 0.35rem 1rem;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  margin-top: 0.5rem;
  margin-left: 0.5rem;
  transition: all 0.15s;
}
.btn-export:hover {
  background: var(--success-color);
  color: #fff;
}

/* Edit button */
.btn-edit-sm {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.3rem;
  font-size: 0.85rem;
  line-height: 1;
  transition: transform 0.15s;
}
.btn-edit-sm:hover { transform: scale(1.2); }

/* Edit modal */
.edit-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.edit-modal {
  max-width: 380px;
  width: 100%;
  padding: 1.75rem 1.5rem 1.25rem;
  position: relative;
  text-align: left;
  animation: scaleIn 0.2s ease;
}
.edit-modal-close {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 0.95rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-family: inherit;
  line-height: 1;
  border-radius: 50%;
  transition: all 0.15s;
}
.edit-modal-close:hover {
  background: rgba(0,0,0,0.06);
  color: var(--text-primary);
}
.edit-modal-title {
  font-size: 1.15rem;
  margin: 0 0 1.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.edit-modal-title::before {
  content: "✏️";
  font-size: 1rem;
}
.edit-modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}
.edit-modal-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.edit-modal-label {
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-secondary);
}
.edit-modal-ticket {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--accent-color);
  background: rgba(0,84,160,0.06);
  padding: 0.45rem 0.75rem;
  border-radius: 4px;
  border: 1px solid rgba(0,84,160,0.12);
  letter-spacing: 0.5px;
}
.edit-modal-amount-wrap {
  display: flex;
  align-items: stretch;
  border: 1.5px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  height: 44px;
  transition: border-color 0.15s;
}
.edit-modal-amount-wrap:focus-within {
  border-color: var(--accent-color);
}
.edit-modal-currency-tag {
  padding: 0 0.85rem;
  font-size: 0.85rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  background: #f5f0e6;
  border-right: 1.5px solid var(--border-color);
  color: var(--text-primary);
  min-width: 40px;
  justify-content: center;
}
.edit-modal-input {
  border: none;
  outline: none;
  padding: 0 0.85rem;
  flex: 1;
  font-family: "Times New Roman", Times, Georgia, serif;
  font-size: 1.05rem;
  background: #fff;
  color: var(--text-primary);
}
.edit-modal-select {
  border: 1.5px solid var(--border-color);
  border-radius: 4px;
  padding: 0 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  background: #fff;
  color: var(--text-primary);
  outline: none;
  height: 44px;
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 0.15s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
  padding-right: 2rem;
}
.edit-modal-select:focus { border-color: var(--accent-color); }
.edit-modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}
.btn-cancel-modal {
  border: 1.5px solid var(--border-color);
  background: transparent;
  border-radius: 4px;
  padding: 0.55rem 1.25rem;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-secondary);
  transition: all 0.15s;
  min-width: 90px;
}
.btn-cancel-modal:hover {
  border-color: #bbb;
  color: var(--text-primary);
  background: rgba(0,0,0,0.02);
}
.btn-save-modal {
  border: none;
  background: var(--text-primary);
  color: #fff;
  border-radius: 4px;
  padding: 0.55rem 1.25rem;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, transform 0.1s;
  min-width: 90px;
}
.btn-save-modal:hover { background: #0f2740; transform: translateY(-1px); }
.btn-save-modal:active { transform: translateY(0); }

/* Pie chart card */
.pie-chart-card {
  padding: 1.25rem;
  text-align: left;
}
.pie-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.breakdown-title {
  font-size: 0.95rem;
  margin: 0;
}
.pie-body {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.5rem;
}
.pie-svg-wrap {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
}
.pie-svg {
  width: 100%;
  height: 100%;
  display: block;
}
.pie-segment {
  cursor: pointer;
  transition: opacity 0.2s;
}
.pie-segment.dim { opacity: 0.25; }
.pie-hole { pointer-events: none; }
.pie-center-label {
  font-size: 0.8rem;
  font-weight: bold;
  fill: var(--text-secondary, #666);
  pointer-events: none;
}
.pie-center-value {
  font-size: 0.9rem;
  font-weight: bold;
  fill: var(--text-primary, #1e3a5f);
  font-family: "Courier New", monospace;
  pointer-events: none;
}
.pie-center-pct {
  font-size: 0.75rem;
  fill: var(--text-secondary, #666);
  pointer-events: none;
}
.pie-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  transition: background 0.15s;
}
.legend-item:hover,
.legend-item.active {
  background: rgba(0,0,0,0.04);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label {
  font-weight: bold;
  min-width: 70px;
  flex-shrink: 0;
}
.legend-value {
  font-family: "Courier New", monospace;
  font-weight: bold;
  text-align: right;
  flex: 1;
  min-width: 80px;
}
.legend-pct {
  color: var(--text-secondary);
  min-width: 45px;
  text-align: right;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .pie-body {
    flex-direction: column;
    align-items: stretch;
  }
  .pie-svg-wrap {
    align-self: center;
    width: 180px;
    height: 180px;
  }
}

/* Tab search */
.tab-search-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.75rem;
}
.tab-search-input {
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  font-family: inherit;
  color: var(--text-primary);
  background: #fff;
  outline: none;
  width: 160px;
  max-width: 100%;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.tab-search-input:focus { border-color: var(--accent-color); }
.tab-search-input::placeholder { color: var(--text-secondary); }

@media (max-width: 768px) {
  .form-card, .list-card {
    min-width: 0;
    overflow-x: hidden;
  }
  .invest-form .form-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .tab-content {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .assets-table {
    min-width: 480px;
  }
}

@media (max-width: 600px) {
  .header-section { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .grand-total-card { width: 100%; box-sizing: border-box; }
  .grand-total-card h3 { font-size: 1.3rem; }
  .assets-table { font-size: 0.78rem; }
  .assets-table th,
  .assets-table td { padding: 0.4rem 0.35rem; }
  .tabs-header { gap: 0.25rem; }
  .tab-btn { padding: 0.5rem 0.6rem; font-size: 0.75rem; }
  .invest-form .form-row .select-field {
    height: 44px;
  }
  .investments-wrapper {
    gap: 1.25rem;
  }
  .form-card, .list-card {
    padding: 1rem;
  }
}
</style>
