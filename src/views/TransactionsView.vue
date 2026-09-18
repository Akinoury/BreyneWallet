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
            <div class="clear-menu-wrap" ref="clearMenuRef">
              <button class="filter-toggle-btn" :disabled="!hasAnyExpense" :title="hasAnyExpense ? 'Limpar despesas' : 'Nenhuma despesa para limpar'" @click="toggleClearMenu">
                🧹
              </button>
              <div v-if="clearMenuOpen" class="clear-menu">
                <button class="clear-menu-item" :disabled="!hasPassivos" @click="pickClear('passivo')">💸 Limpar Passivos</button>
                <button class="clear-menu-item" :disabled="!hasCompras" @click="pickClear('compra')">🛒 Limpar Compras</button>
                <button class="clear-menu-item clear-menu-item-danger" :disabled="!hasAnyExpense" @click="pickClear('all')">🗑️ Limpar Tudo</button>
              </div>
            </div>
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
                  <span class="badge" :class="'badge-' + t.expenseType">{{ t.expenseType === 'bonus' ? 'Bônus' : t.expenseType }}</span>
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

    <!-- CONFIRM CLEAR MODAL -->
    <div v-if="confirmOpen" class="confirm-overlay" @click.self="cancelConfirm">
      <div class="confirm-modal glass-panel">
        <h3>Confirmar Limpeza</h3>
        <p class="confirm-message">{{ confirmMessage }}</p>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="cancelConfirm">Cancelar</button>
          <button class="btn-danger" @click="confirmClear">Sim, Limpar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

const confirmOpen = ref(false)
const confirmMessage = ref('')
const pendingClear = ref(null)

const clearMenuOpen = ref(false)
const clearMenuRef = ref(null)

const typeOptions = [
  { value: 'compra', short: 'Compra', full: 'Compra (Gasto Comum)' },
  { value: 'passivo', short: 'Passivo', full: 'Passivo (Dívidas/Compromissos)' }
]

function onDocClick(e) {
  if (clearMenuOpen.value && clearMenuRef.value && !clearMenuRef.value.contains(e.target)) {
    clearMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  store.loadFromLocalStorage()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})

const allTransactions = computed(() => {
  const list = [...store.transactions.filter(t => t.type === 'expense')]
  if (store.investmentBonus > 0) {
    list.unshift({
      id: 'fixed-bonus-incentivo',
      description: 'Bônus de Incentivo ao Investimento (Fixo)',
      amount: store.investmentBonus,
      type: 'expense',
      expenseType: 'bonus',
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

const hasCompras = computed(() =>
  store.transactions.some(t => !t.isFixed && t.expenseType === 'compra')
)

const hasPassivos = computed(() =>
  store.transactions.some(t => !t.isFixed && t.expenseType === 'passivo')
)

const hasAnyExpense = computed(() => hasCompras.value || hasPassivos.value)

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

const toggleClearMenu = () => {
  clearMenuOpen.value = !clearMenuOpen.value
}

const pickClear = (type) => {
  clearMenuOpen.value = false
  requestClear(type)
}

const requestClear = (type) => {
  if (type === 'all') {
    confirmMessage.value = 'Todas suas despesas serão deletadas.'
  } else if (type === 'compra') {
    confirmMessage.value = 'Todas as compras serão deletadas.'
  } else {
    confirmMessage.value = 'Todos os passivos serão deletados.'
  }
  pendingClear.value = type
  confirmOpen.value = true
}

const cancelConfirm = () => {
  confirmOpen.value = false
  pendingClear.value = null
}

const confirmClear = async () => {
  const type = pendingClear.value
  confirmOpen.value = false
  pendingClear.value = null
  if (type === 'all') {
    await store.clearAllTransactions()
  } else if (type) {
    await store.clearTransactionsByType(type)
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
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-sm);
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

.clear-menu-wrap {
  position: relative;
}

.clear-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 190px;
  width: max-content;
  max-width: calc(100vw - 1.5rem);
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 15px rgba(11, 29, 51, 0.12);
  z-index: 120;
  padding: 0.35rem 0;
  text-align: left;
}

.clear-menu::before {
  content: '';
  position: absolute;
  top: 3px; left: 3px; right: 3px; bottom: 3px;
  border: 1px solid rgba(138, 111, 62, 0.15);
  border-radius: calc(var(--radius-lg) - 3px);
  pointer-events: none;
}

.clear-menu-item {
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-primary);
  cursor: pointer;
  font-family: "Times New Roman", Times, Georgia, serif;
  transition: all 0.15s;
}

.clear-menu-item:hover:not(:disabled) {
  background: #fdfcf7;
  color: var(--accent-color);
}

.clear-menu-item-danger:hover:not(:disabled) {
  background: #fdf2f2;
  color: var(--danger-color);
}

.clear-menu-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 29, 51, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 1rem;
}

.confirm-modal {
  width: 100%;
  max-width: 400px;
  text-align: center;
  padding: 2rem 2rem 1.5rem;
}

.confirm-message {
  font-size: 0.95rem;
  margin: 0.75rem 0 1.5rem;
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.confirm-actions .btn-secondary,
.confirm-actions .btn-danger {
  padding: 0.6rem 1.25rem;
  font-size: 0.85rem;
}

.btn-danger {
  background: var(--danger-color);
  color: #fff;
  border: 1px solid var(--danger-color);
  border-radius: var(--radius-sm);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #a93226;
  border-color: #a93226;
}

.filter-toggle-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
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

.filter-toggle-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.filter-toggle-btn:disabled:hover {
  border-color: var(--border-color);
  color: var(--text-secondary);
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
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-sm);
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
  .count-area { flex-wrap: wrap; }
  .clear-menu {
    position: fixed;
    top: auto;
    bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: min(280px, calc(100vw - 1.5rem));
    max-width: calc(100vw - 1.5rem);
    min-width: 0;
    padding: 0.4rem 0;
    border-radius: var(--radius-lg);
    box-shadow: 0 12px 40px rgba(11, 29, 51, 0.22);
    animation: menuPopIn 0.18s ease;
  }
  .clear-menu::before {
    border-radius: calc(var(--radius-lg) - 3px);
  }
  .tx-list { max-height: 300px; }
  .tx-item { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
  .tx-actions { width: 100%; justify-content: flex-end; }
}

@keyframes menuPopIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
