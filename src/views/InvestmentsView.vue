<template>
  <div class="investments-wrapper animate-fade-in">
    <div class="flex-between header-section">
      <div>
        <h2>Carteira de Investimentos</h2>
        <p>Acompanhe e registre a distribuição de seus ativos nacionais e internacionais.</p>
        <button class="btn-markets" @click="$router.push('/markets')">📈 Mercados</button>
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
        <h3>Registrar Novo Ativo</h3>
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
          <div v-if="nationalAssets.length === 0" class="empty-state">
            <p>Nenhum ativo nacional cadastrado.</p>
          </div>
          <table v-else class="assets-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Classe</th>
                <th class="text-right">Valor (R$)</th>
                <th class="text-center"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in nationalAssets" :key="i.id">
                <td class="text-bold">{{ i.name }}</td>
                <td><span class="badge badge-national">{{ i.category }}</span></td>
                <td class="text-right text-bold">R$ {{ formatCurrency(i.amount) }}</td>
                <td class="text-center">
                  <button class="btn-delete-sm" @click="store.deleteInvestment(i.id)">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- INTERNATIONAL ASSETS -->
        <div v-if="activeTab === 'international'" class="tab-content animate-fade-in">
          <div v-if="internationalAssets.length === 0" class="empty-state">
            <p>Nenhum ativo internacional cadastrado.</p>
          </div>
          <div v-else>
            <div class="intl-rate-note">
              <span class="pulse-dot-sm"></span>
              Câmbio: US$ 1 = R$ {{ exchangeRate ? exchangeRate.toFixed(4) : '...' }} (Dólar Comercial)
            </div>
            <table class="assets-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Classe</th>
                  <th class="text-right">Valor (US$)</th>
                  <th class="text-right">Equiv. (R$)</th>
                  <th class="text-center"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in internationalAssets" :key="i.id">
                  <td class="text-bold">{{ i.name }}</td>
                  <td><span class="badge badge-international">{{ i.category }}</span></td>
                  <td class="text-right text-bold">US$ {{ formatUsd(i.amount) }}</td>
                  <td class="text-right text-muted">R$ {{ formatCurrency(i.amount * (exchangeRate || 5.70)) }}</td>
                  <td class="text-center">
                    <button class="btn-delete-sm" @click="store.deleteInvestment(i.id)">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
