<template>
  <div class="transactions-wrapper animate-fade-in">
    <div class="flex-between header-section">
      <div>
        <h2>Registro de Despesas</h2>
        <p>Cadastre e gerencie suas despesas correntes classificadas por tipo e categoria.</p>
      </div>
      <!-- QUICK COUNTERS -->
      <div class="quick-totals flex-between">
        <div class="total-badge badge-compra-lg">
          <small>Compras</small>
          <span>R$ {{ formatCurrency(store.totalCompras) }}</span>
        </div>
        <div class="total-badge badge-passivo-lg">
          <small>Passivos</small>
          <span>R$ {{ formatCurrency(store.totalPassivos) }}</span>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <!-- FORM TO ADD TRANSACTION -->
      <div class="form-card glass-panel">
        <h3>Nova Despesa</h3>
        <p class="form-subtitle">Lembre-se: Compras e Passivos recebem juros de {{ store.expenseTaxRate }}% sobre gastos correntes.</p>

        <form @submit.prevent="handleSubmit" class="expense-form">
          <div class="form-group">
            <label for="desc">Descrição da Despesa</label>
            <input 
              type="text" 
              id="desc" 
              v-model="desc" 
              placeholder="Ex: Assinatura Netflix, Conta de Luz" 
              class="input-field" 
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="amount">Valor (R$)</label>
              <input 
                type="number" 
                id="amount" 
                v-model.number="amount" 
                step="0.01" 
                placeholder="R$ 0,00" 
                class="input-field" 
                required 
              />
            </div>
            <div class="form-group">
              <label for="expense-type">Tipo de Despesa</label>
              <select id="expense-type" v-model="expenseType" class="select-field" required @focus="selectFocused = true" @blur="selectFocused = false">
                <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ selectFocused ? opt.full : opt.short }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="category">Categoria</label>
            <select id="category" v-model="category" class="select-field" required>
              <option value="Alimentação">Alimentação</option>
              <option value="Transporte">Transporte</option>
              <option value="Moradia">Moradia</option>
              <option value="Contas">Contas</option>
              <option value="Saúde">Saúde</option>
              <option value="Educação">Educação</option>
              <option value="Lazer">Lazer</option>
            </select>
          </div>

          <button type="submit" class="btn-primary btn-block">Adicionar Despesa</button>
        </form>
      </div>

      <!-- LIST OF TRANSACTIONS -->
      <div class="list-card glass-panel">
        <div class="flex-between" style="margin-bottom: 1.5rem;">
          <h3>Histórico de Despesas</h3>
          <div class="count-area">
            <span class="count-badge">{{ filteredTransactions.length }} Despesas</span>
            <button class="filter-toggle-btn" @click="showFilters = !showFilters" :title="showFilters ? 'Ocultar filtros' : 'Mostrar filtros'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div v-show="showFilters" class="filter-bar">
          <div class="filter-type-tabs">
            <button
              class="filter-tab"
              :class="{ active: filterType === 'all' }"
              @click="filterType = 'all'"
            >Todas</button>
            <button
              class="filter-tab"
              :class="{ active: filterType === 'compra' }"
              @click="filterType = 'compra'"
            >🛒 Compras</button>
            <button
              class="filter-tab"
              :class="{ active: filterType === 'passivo' }"
              @click="filterType = 'passivo'"
            >💸 Passivos</button>
          </div>
          <select class="select-field filter-category" v-model="filterCategory">
            <option value="all">Todas Categorias</option>
            <option v-for="cat in availableCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div v-if="filteredTransactions.length === 0" class="empty-state">
          <p>Nenhuma despesa encontrada para esse filtro.</p>
        </div>
        <ul v-else class="tx-list">
          <li v-for="t in filteredTransactions" :key="t.id" class="tx-item" :class="{ 'fixed-row': t.isFixed }">
            <div class="tx-main-info">
              <div class="tx-type-indicator" :class="t.expenseType">
                {{ t.isFixed ? '🎁' : (t.expenseType === 'compra' ? '🛒' : '💸') }}
              </div>
              <div class="tx-meta">
                <span class="tx-desc-text">{{ t.description }}</span>
                <div class="tx-labels">
                  <span class="badge" :class="'badge-' + t.expenseType">{{ t.expenseType }}</span>
                  <span class="cat-label-text">{{ t.category }}</span>
                  <span class="date-text" v-if="!t.isFixed">{{ formatDate(t.date) }}</span>
                  <span class="date-text" v-else>Fixo</span>
                </div>
              </div>
            </div>
            
            <div class="tx-actions">
              <div class="tx-val-group">
                <template v-if="t.isFixed && t.category === 'Investimentos'">
                  <span class="tx-val-counted tx-no-interest">R$ {{ formatCurrency(t.amount) }}</span>
                </template>
                <template v-else>
                  <div class="tx-val-row">
                    <span class="tx-interest-arrow">↑{{ store.expenseTaxRate }}%</span>
                    <span class="tx-val-original">R$ {{ formatCurrency(t.amount) }}</span>
                  </div>
                  <span class="tx-val-counted">R$ {{ formatCurrency(t.amount * (1 + store.expenseTaxRate / 100)) }}</span>
                </template>
              </div>
              <button v-if="!t.isFixed" class="btn-delete" @click="store.deleteTransaction(t.id)" title="Excluir">
                ✕
              </button>
              <span v-else class="fixed-lock-icon" title="Item Fixo do Sistema">🔒</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWalletStore } from '../stores/walletStore'

const store = useWalletStore()

const desc = ref('')
const amount = ref(null)
const expenseType = ref('compra')
const category = ref('Alimentação')
const selectFocused = ref(false)

const filterType = ref('all')
const filterCategory = ref('all')
const showFilters = ref(false)

const typeOptions = [
  { value: 'compra', short: 'Compra', full: 'Compra (Gasto Comum)' },
  { value: 'passivo', short: 'Passivo', full: 'Passivo (Dívidas/Compromissos)' }
]

onMounted(() => {
  store.loadFromLocalStorage()
})

const allTransactions = computed(() => {
  const list = [...store.transactions.filter(t => t.type === 'expense')]
  if (store.investmentBonus > 0) {
    list.unshift({
      id: 'fixed-bonus-incentivo',
      description: 'Bônus de Incentivo ao Investimento (Fixo)',
      amount: store.investmentBonus,
      type: 'expense',
      expenseType: 'compra',
      category: 'Investimentos',
      isFixed: true
    })
  }
  return list
})

const availableCategories = computed(() => {
  const cats = new Set(allTransactions.value.map(t => t.category).filter(Boolean))
  return [...cats].sort()
})

const filteredTransactions = computed(() => {
  let list = allTransactions.value
  if (filterType.value !== 'all') {
    list = list.filter(t => t.expenseType === filterType.value)
  }
  if (filterCategory.value !== 'all') {
    list = list.filter(t => t.category === filterCategory.value)
  }
  return list
})

const formatCurrency = (val) => {
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (isoString) => {
  const d = new Date(isoString)
  return d.toLocaleDateString('pt-BR')
}

const handleSubmit = () => {
  if (!desc.value || !amount.value || amount.value <= 0) return
  
  const success = store.addTransaction(
    desc.value, 
    amount.value, 
    expenseType.value, 
    category.value
  )
  
  if (success) {
    desc.value = ''
    amount.value = null
    expenseType.value = 'compra'
    category.value = 'Alimentação'
  }
}
</script>

<style scoped>
.transactions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.header-section {
  text-align: left;
}

.header-section h2 {
  font-size: 1.6rem;
  margin-bottom: 0.25rem;
}

.quick-totals {
  gap: 1rem;
}

.total-badge {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 1rem;
  border-radius: 3px;
  text-align: right;
  min-width: 120px;
  border: 1px solid var(--border-color);
  background: #ffffff;
  position: relative;
}

.total-badge::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border: 1px solid rgba(138, 111, 62, 0.15);
  pointer-events: none;
}

.badge-compra-lg small, .badge-passivo-lg small {
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: bold;
}

.badge-compra-lg span {
  font-size: 1.15rem;
  font-weight: bold;
  color: var(--text-primary);
}

.badge-passivo-lg span {
  font-size: 1.15rem;
  font-weight: bold;
  color: var(--accent-color);
}

.form-card, .list-card {
  text-align: left;
}

.form-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.expense-form {
  display: flex;
  flex-direction: column;
}

.btn-block {
  width: 100%;
  padding: 0.85rem;
  margin-top: 0.5rem;
}

.count-badge {
  background: #ffffff;
  border: 1px solid var(--border-color);
  padding: 0.2rem 0.6rem;
  border-radius: 2px;
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--text-primary);
  text-transform: uppercase;
}

.count-area {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.filter-toggle-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  padding: 0.2rem 0.35rem;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  transition: all 0.15s;
  line-height: 1;
}

.filter-toggle-btn:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-type-tabs {
  display: flex;
  gap: 0.25rem;
}

.filter-tab {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.4rem 0.75rem;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.filter-tab:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.filter-tab.active {
  background: var(--text-primary);
  color: #fff;
  border-color: var(--text-primary);
}

.filter-category {
  width: auto;
  min-width: 160px;
  margin-bottom: 0;
  height: 34px;
  padding: 0.3rem 1.8rem 0.3rem 0.6rem;
  font-size: 0.8rem;
  background-position: right 0.4rem center;
  background-size: 0.8em;
}

.empty-state {
  padding: 3rem 0;
  text-align: center;
  color: var(--text-secondary);
}

.tx-list {
  list-style: none;
  max-height: 480px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.tx-item:last-child {
  border-bottom: none;
}

.tx-main-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.tx-type-indicator {
  width: 36px;
  height: 36px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  border: 1px solid var(--border-color);
  background: #faf9f5;
}

.tx-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
}

.tx-desc-text {
  font-weight: bold;
  font-size: 0.95rem;
  color: var(--text-primary);
  display: block;
  width: 100%;
  line-height: 1.2;
}

.tx-labels {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cat-label-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: bold;
  text-transform: uppercase;
  flex: 0 0 100%;
}

.date-text {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.tx-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tx-val-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.tx-val-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tx-interest-arrow {
  color: var(--danger-color);
  font-size: 0.55rem;
  font-weight: bold;
  opacity: 0.8;
  white-space: nowrap;
  line-height: 1;
}

.tx-val-original {
  color: var(--text-secondary);
  font-size: 0.75rem;
  white-space: nowrap;
}

.tx-val-counted {
  font-weight: bold;
  font-size: 0.95rem;
  color: var(--text-primary);
  white-space: nowrap;
}

.btn-delete {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  font-size: 0.75rem;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: var(--danger-color);
  color: #fff;
  border-color: var(--danger-color);
}

.fixed-row {
  background: #fdfcf7;
  border-left: 3px solid var(--accent-color);
}

.fixed-lock-icon {
  color: var(--accent-color);
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
}

@media (max-width: 600px) {
  .header-section { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .quick-totals { flex-direction: column; gap: 0.4rem; align-items: stretch; width: 100%; }
  .total-badge { display: flex; justify-content: space-between; }
  .tx-list { max-height: 300px; }
  .tx-item { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
  .tx-actions { width: 100%; justify-content: flex-end; }
}
</style>
