<template>
  <div class="wallet-card glass-panel">
    <div class="flex-between">
      <span class="card-title">Fundo de Emergência / Saldo</span>
      <button class="toggle-btn" @click="showBalance = !showBalance">
        {{ showBalance ? 'Ocultar' : 'Mostrar' }}
      </button>
    </div>
    <div class="balance-display">
      <h2 class="balance" v-if="showBalance">R$ {{ formatCurrency(balance) }}</h2>
      <h2 class="balance hidden" v-else>R$ &bull;&bull;&bull;&bull;</h2>
    </div>
    <div class="card-footer">
      <div class="footer-info">
        <small>Juros Aplicados: {{ formatCurrency(interestEarned) }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  balance: { type: Number, required: true },
  interestEarned: { type: Number, default: 0 }
})

const showBalance = ref(true)

const formatCurrency = (val) => {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.wallet-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.05) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}
.wallet-card::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  background: var(--accent-color);
  filter: blur(80px);
  opacity: 0.5;
  border-radius: 50%;
  pointer-events: none;
}
.card-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.toggle-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  font-size: 0.9rem;
}
.balance-display {
  margin: 1.5rem 0;
}
.balance {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
}
.balance.hidden {
  letter-spacing: 4px;
}
.card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  margin-top: 1rem;
}
.footer-info small {
  color: var(--text-secondary);
}
</style>
