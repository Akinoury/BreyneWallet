<template>
  <div class="transaction-list glass-panel">
    <h3>Últimas Transações</h3>
    <div v-if="transactions.length === 0" class="empty-state">
      <p>Nenhuma transação encontrada.</p>
    </div>
    <ul v-else class="list">
      <li v-for="t in transactions" :key="t.id" class="list-item">
        <div class="tx-info">
          <div class="tx-icon" :class="t.type">
            {{ t.type === 'deposit' || t.type === 'salary' ? '↓' : '↑' }}
          </div>
          <div>
            <div class="tx-desc">{{ t.description }}</div>
            <div class="tx-date">{{ formatDate(t.date) }}</div>
          </div>
        </div>
        <div class="tx-amount" :class="t.type === 'deposit' || t.type === 'salary' ? 'text-success' : 'text-danger'">
          {{ t.type === 'deposit' || t.type === 'salary' ? '+' : '-' }} R$ {{ formatCurrency(t.amount) }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  transactions: { type: Array, required: true }
})

const formatCurrency = (val) => {
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (isoString) => {
  const d = new Date(isoString)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.transaction-list h3 {
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}
.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem 0;
}
.list {
  list-style: none;
}
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}
.list-item:last-child {
  border-bottom: none;
}
.tx-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
}
.tx-icon.deposit, .tx-icon.salary {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}
.tx-icon.withdraw {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}
.tx-desc {
  font-weight: 500;
  color: var(--text-primary);
}
.tx-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.tx-amount {
  font-weight: 600;
}
</style>
