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
          <button
            class="sort-btn verified-filter"
            :class="{ active: onlyVerified }"
            @click="onlyVerified = !onlyVerified; applyFilters()"
          >
            ✓ Verificados
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
          v-for="s in visibleStores"
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
        <button
          v-if="hasExtraStores"
          class="store-chip show-more-chip"
          @click="showAllStores = !showAllStores"
        >
          {{ showAllStores ? '− Ver menos' : `+${extraCount} Ver mais` }}
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

          <span v-if="c.id?.startsWith('cupomdesconto')" class="verified-badge">✓ Verificado</span>

          <h4 class="card-title">{{ c.title }}</h4>
          <p class="card-desc">{{ c.description }}</p>

          <div class="card-meta">
            <span class="meta-expiry" :class="{ expired: isExpired(c.expiresAt) }">
              {{ isExpired(c.expiresAt) ? 'Expirado' : `Válido até ${formatDate(c.expiresAt)}` }}
            </span>
            <span class="meta-used">{{ c.usedCount.toLocaleString('pt-BR') }} usos</span>
          </div>

          <div v-if="c.code" class="code-row">
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
            {{ c.code ? 'Aplicar Cupom na Loja →' : 'Ver Ofertas na Loja →' }}
          </a>
        </div>
      </div>
    </div>

    <div class="bonus-section">
      <div class="bonus-header">
        <div class="bonus-icon">🎁</div>
        <div class="bonus-text">
          <strong>Não encontrou o cupom ideal?</strong>
          <p>Você não encontrou o cupom que queria mas não quer perder a compra? Então teste estes cupons no Cuponomia, site parceiro com milhares de ofertas!</p>
        </div>
      </div>
      <div class="coupons-grid">
        <button
          v-for="s in cuponomiaStores"
          :key="s.id"
          class="coupon-card glass-panel cuponomia-card"
          @click="openCuponomia(s.url)"
        >
          <div class="card-store-bar" :style="{ background: s.color }"></div>
          <div class="card-body">
            <div class="card-store-row">
              <span class="store-logo">
                <img
                  :src="s.logo"
                  alt=""
                  class="store-logo-img"
                  @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'"
                />
                <span class="store-logo-fallback" style="display:none">{{ s.icon }}</span>
              </span>
              <div class="card-top">
                <span class="store-badge">{{ s.name }}</span>
                <span class="discount-badge">Cuponomia</span>
              </div>
            </div>
            <p class="card-desc">Ver cupons disponíveis no Cuponomia →</p>
          </div>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWalletStore } from '../stores/walletStore'
import { openInAppBrowser } from '../utils/browser'

const API_BASE = import.meta.env.VITE_API_URL || ''

const store = useWalletStore()

const stores = ref([])
const allCoupons = ref([])
const filteredCoupons = ref([])
const selectedStore = ref(null)
const sortRecent = ref(true)
const onlyVerified = ref(false)
const showAllStores = ref(false)
const loading = ref(true)
const error = ref('')
const copied = ref('')

const famousStoreIds = 
['shopee','magalu','amazon','mercadolivre','americanas','submarino','ifood','netshoes','aliexpress','casasbahia']

const FAV = 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://'
const CUPONOMIA_BASE = 'https://www.cuponomia.com.br/desconto'
const cuponomiaStores = [
  { id: 'shopee',        name: 'Shopee',          icon: '🛒', color: '#ee4d2d', url: `${CUPONOMIA_BASE}/shopee`,        logo: `${FAV}shopee.com.br&size=128` },
  { id: 'magalu',        name: 'Magazine Luiza',  icon: '📱', color: '#0054a0', url: `${CUPONOMIA_BASE}/magazine-luiza`, logo: `${FAV}magazineluiza.com.br&size=128` },
  { id: 'amazon',        name: 'Amazon Brasil',   icon: '📦', color: '#ff9900', url: `${CUPONOMIA_BASE}/amazon`,        logo: `${FAV}amazon.com.br&size=128` },
  { id: 'mercadolivre',  name: 'Mercado Livre',   icon: '🟡', color: '#ffe600', url: `${CUPONOMIA_BASE}/mercadolivre`,   logo: `${FAV}mercadolivre.com.br&size=128` },
  { id: 'americanas',    name: 'Americanas',      icon: '🔴', color: '#cc0000', url: `${CUPONOMIA_BASE}/americanas`,     logo: `${FAV}americanas.com.br&size=128` },
  { id: 'submarino',     name: 'Submarino',       icon: '🔵', color: '#004b8d', url: `${CUPONOMIA_BASE}/submarino`,      logo: `${FAV}submarino.com.br&size=128` },
  { id: 'ifood',         name: 'iFood',           icon: '🍔', color: '#ea1d2c', url: `${CUPONOMIA_BASE}/ifood`,          logo: `${FAV}ifood.com.br&size=128` },
  { id: 'netshoes',      name: 'Netshoes',        icon: '👟', color: '#005b9e', url: `${CUPONOMIA_BASE}/netshoes`,       logo: `${FAV}netshoes.com.br&size=128` },
  { id: 'aliexpress',    name: 'AliExpress',      icon: '🌍', color: '#ff4747', url: `${CUPONOMIA_BASE}/aliexpress`,     logo: `${FAV}aliexpress.com&size=128` },
  { id: 'casasbahia',    name: 'Casas Bahia',     icon: '🏠', color: '#e60014', url: `${CUPONOMIA_BASE}/casas-bahia`,    logo: `${FAV}casasbahia.com.br&size=128` }
]

function openCuponomia(url) {
  openInAppBrowser(url)
}

const visibleStores = computed(() => {
  if (showAllStores.value) return stores.value
  return stores.value.filter(s => famousStoreIds.includes(s.id))
})
const extraCount = computed(() => stores.value.filter(s => !famousStoreIds.includes(s.id)).length)
const hasExtraStores = computed(() => extraCount.value > 0)

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
  result = result.filter(c => {
    const store = stores.value.find(s => s.id === c.storeId)
    const name = store?.name?.toLowerCase() || ''
    const id = c.storeId?.toLowerCase() || ''
    return !name.includes('uber eats') && !id.includes('uber-eats') && !id.includes('uber_eats')
  })
  if (selectedStore.value) {
    result = result.filter(c => c.storeId === selectedStore.value)
  }
  if (onlyVerified.value) {
    result = result.filter(c => c.id?.startsWith('cupomdesconto'))
  }
  if (sortRecent.value) {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else {
    result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }
  filteredCoupons.value = result
}

async function copyCode(code) {
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
  } catch {
    const el = document.createElement('textarea')
    el.value = code
    el.style.position = 'fixed'
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = code
  setTimeout(() => { copied.value = '' }, 2500)
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ sort: 'recent' })
    const res = await fetch(`${API_BASE}/api/coupons?${params}`)
    if (!res.ok) throw new Error('Erro ao carregar cupons')
    const data = await res.json()
    stores.value = (data.stores || []).filter(s => s.id !== 'submarino').map(s => {
      if (s.name?.toLowerCase().includes('submarino')) {
        return { ...s, id: 'submarino', name: 'Submarino', color: '#004b8d', logo: `${FAV}submarino.com.br&size=128`, fallbackIcon: '🔵' }
      }
      return s
    })
    if (!stores.value.find(s => s.id === 'submarino')) {
      stores.value.push({ id: 'submarino', name: 'Submarino', color: '#004b8d', logo: `${FAV}submarino.com.br&size=128`, fallbackIcon: '🔵' })
    }
    allCoupons.value = (data.coupons || []).map(c => {
      const texto = ((c.title || '') + ' ' + (c.description || '')).toLowerCase()
      if (texto.includes('submarino') && c.storeId !== 'submarino') {
        return { ...c, storeId: 'submarino' }
      }
      return c
    })
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

.sort-control {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
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

.verified-filter.active {
  background: var(--success-color);
  border-color: var(--success-color);
  color: #fff;
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

.show-more-chip {
  border-style: dashed;
  color: var(--text-secondary);
  font-weight: normal;
}

.show-more-chip:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
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

.verified-badge {
  display: inline-block;
  background: rgba(30, 70, 37, 0.08);
  color: var(--success-color);
  font-size: 0.68rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 0.1rem 0.4rem;
  border-radius: 2px;
  align-self: flex-start;
  margin-bottom: 0.15rem;
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

.cuponomia-card {
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: all 0.15s;
  text-align: left;
  width: 100%;
  font-family: inherit;
}

.cuponomia-card:hover {
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.cuponomia-card .card-desc {
  color: var(--accent-color);
  font-weight: bold;
  margin-top: 0.25rem;
}

.bonus-section {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.bonus-header {
  background: #fdfcf7;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.bonus-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.bonus-text {
  flex: 1;
}

.bonus-text strong {
  display: block;
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.bonus-text p {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

</style>
