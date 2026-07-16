<template>
  <div class="coupons-wrapper animate-fade-in">
    <div class="coupons-header glass-panel">
      <div class="header-top">
        <div>
          <h2>🏷️ Cupons e Promoções</h2>
          <p>Os melhores descontos das suas lojas favoritas, reunidos aqui.</p>
        </div>
        <div class="sort-control">
          <button
            class="sort-btn"
            :class="{ active: sortRecent }"
            @click="sortRecent = !sortRecent; applyFilters()"
          >
            📅 {{ sortRecent ? 'Mais Recentes' : 'Todas' }}
          </button>
        </div>
      </div>

      <div class="store-chips">
        <button
          class="store-chip"
          :class="{ active: selectedStore === null }"
          @click="selectedStore = null; applyFilters()"
        >
          Todas
        </button>
        <button
          v-for="s in stores"
          :key="s.id"
          class="store-chip"
          :class="{ active: selectedStore === s.id }"
          :style="selectedStore === s.id ? { borderColor: s.color, color: s.color } : {}"
          @click="selectedStore = s.id; applyFilters()"
        >
          <span class="chip-icon">
            <img
              :src="s.logo"
              alt=""
              class="chip-logo"
              @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='inline'"
            />
            <span class="chip-fallback" style="display:none">{{ s.fallbackIcon }}</span>
          </span>
          {{ s.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="loading-text">Buscando cupons...</span>
    </div>

    <div v-else-if="error" class="alert-box alert-error">
      {{ error }}
    </div>

    <div v-else-if="filteredCoupons.length === 0" class="empty-state glass-panel">
      <span class="empty-icon">🏷️</span>
      <p>Nenhum cupom encontrado para este filtro.</p>
    </div>

    <div v-else class="coupons-grid">
      <div
        v-for="c in filteredCoupons"
        :key="c.id"
        class="coupon-card glass-panel"
      >
        <div class="card-store-bar" :style="{ background: getStore(c.storeId)?.color || '#888' }"></div>
        <div class="card-body">
          <div class="card-store-row">
            <span class="store-logo">
              <img
                :src="getStore(c.storeId)?.logo"
                alt=""
                class="store-logo-img"
                @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'"
              />
              <span class="store-logo-fallback" style="display:none">{{ getStore(c.storeId)?.fallbackIcon }}</span>
            </span>
            <div class="card-top">
              <span class="store-badge">
                {{ getStore(c.storeId)?.name }}
              </span>
              <span class="discount-badge">{{ c.discount }}</span>
            </div>
          </div>

          <h4 class="card-title">{{ c.title }}</h4>
          <p class="card-desc">{{ c.description }}</p>

          <div class="card-meta">
            <span class="meta-expiry" :class="{ expired: isExpired(c.expiresAt) }">
              {{ isExpired(c.expiresAt) ? 'Expirado' : `Válido até ${formatDate(c.expiresAt)}` }}
            </span>
            <span class="meta-used">{{ c.usedCount.toLocaleString('pt-BR') }} usos</span>
          </div>

          <div class="code-row">
            <code class="coupon-code">{{ c.code }}</code>
            <button class="btn-copy" @click="copyCode(c.code)">
              {{ copied === c.code ? 'Copiado!' : 'Copiar' }}
            </button>
          </div>

          <div v-if="c.minPurchase > 0" class="min-purchase">
            Mínimo: R$ {{ formatCurrency(c.minPurchase) }}
          </div>

          <a
            :href="c.couponUrl || getStore(c.storeId)?.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-store"
          >
            Aplicar Cupom na Loja →
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useWalletStore } from '../stores/walletStore'

const API_BASE = import.meta.env.VITE_API_URL || ''

const store = useWalletStore()

const stores = ref([])
const allCoupons = ref([])
const filteredCoupons = ref([])
const selectedStore = ref(null)
const sortRecent = ref(true)
const loading = ref(true)
const error = ref('')
const copied = ref('')

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatCurrency(val) {
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isExpired(iso) {
  return new Date(iso) < new Date()
}

function getStore(storeId) {
  return stores.value.find(s => s.id === storeId)
}

function applyFilters() {
  let result = [...allCoupons.value]
  if (selectedStore.value) {
    result = result.filter(c => c.storeId === selectedStore.value)
  }
  if (sortRecent.value) {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else {
    result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }
  filteredCoupons.value = result
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = code
    setTimeout(() => { copied.value = '' }, 2000)
  } catch {}
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ sort: 'recent' })
    const res = await fetch(`${API_BASE}/api/coupons?${params}`)
    if (!res.ok) throw new Error('Erro ao carregar cupons')
    const data = await res.json()
    stores.value = data.stores
    allCoupons.value = data.coupons
    applyFilters()
  } catch (e) {
    error.value = 'Não foi possível carregar os cupons. Tente novamente mais tarde.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.coupons-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 3rem;
}

.coupons-header {
  text-align: left;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.header-top h2 {
  font-size: 1.3rem;
  margin-bottom: 0.25rem;
}

.header-top p {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.sort-btn {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  font-family: "Times New Roman", Times, Georgia, serif;
  color: var(--text-primary);
  transition: all 0.2s;
  white-space: nowrap;
}

.sort-btn.active {
  background: var(--text-primary);
  color: #fff;
  border-color: var(--text-primary);
}

.store-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip-icon {
  font-size: 1.2rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
}

.chip-logo {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.chip-fallback {
  font-size: 1.1rem;
  line-height: 1;
}

.store-chip {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  font-family: "Times New Roman", Times, Georgia, serif;
  color: var(--text-primary);
  transition: all 0.15s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.store-chip:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.store-chip.active {
  background: #fdfcf7;
  border-color: var(--text-primary);
}

.loading-state {
  text-align: center;
  padding: 3rem 0;
}

.loading-text {
  font-size: 0.9rem;
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

.coupons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

@media (max-width: 600px) {
  .coupons-grid {
    grid-template-columns: 1fr;
  }
}

.coupon-card {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.card-store-bar {
  height: 4px;
  flex-shrink: 0;
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.card-store-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.store-logo {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.store-logo-img {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}

.store-logo-fallback {
  font-size: 2rem;
  line-height: 1;
}

.card-top {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.store-badge {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.discount-badge {
  background: rgba(30, 70, 37, 0.1);
  color: var(--success-color);
  border: 1px solid rgba(30, 70, 37, 0.2);
  border-radius: 3px;
  padding: 0.15rem 0.5rem;
  font-size: 0.85rem;
  font-weight: bold;
  white-space: nowrap;
}

.card-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.card-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.meta-expiry.expired {
  color: var(--danger-color);
  font-weight: bold;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f0e6;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.3rem;
  margin-top: 0.25rem;
}

.coupon-code {
  flex: 1;
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-primary);
  text-align: center;
  letter-spacing: 1.5px;
  font-family: "Courier New", monospace;
  user-select: all;
}

.btn-copy {
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 2px;
  padding: 0.3rem 0.75rem;
  font-size: 0.72rem;
  font-weight: bold;
  cursor: pointer;
  font-family: "Times New Roman", Times, Georgia, serif;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-copy:hover {
  background: #0f2740;
}

.min-purchase {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-style: italic;
}

.btn-store {
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
  font-family: "Times New Roman", Times, Georgia, serif;
  text-decoration: none;
  transition: background 0.15s;
  margin-top: 0.25rem;
}

.btn-store:hover {
  background: #0f2740;
}
</style>
