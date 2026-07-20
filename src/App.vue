<template>
  <BiometricGate :visible="showBiometricGate" @authenticated="onBioAuthenticated" @skip="onBioSkip" />
  <header v-if="isAuthenticated && !showBiometricGate" class="app-header animate-fade-in">
    <div class="logo" @click="router.push('/')" style="cursor: pointer;">
      <img src="/icon-header.png" alt="" class="logo-icon" />
      <span><span class="logo-accent">Breyne</span>Wallet</span>
    </div>

    <!-- DROPDOWN MENU -->
    <div class="user-menu-container" v-click-outside="closeDropdown">
      <button @click="toggleDropdown" class="user-menu-btn">
        <img v-if="store.profilePhotoUrl" :src="store.profilePhotoUrl" alt="Foto de perfil" class="profile-thumb" />
        <span v-else class="profile-initial">{{ store.currentUser?.name?.charAt(0).toUpperCase() || 'U' }}</span>
        <span class="chevron">▼</span>
      </button>

      <div v-if="isDropdownOpen" class="user-dropdown-menu">
        <div class="dropdown-header">
          <strong>{{ store.currentUser?.name }}</strong>
          <small>{{ store.currentUser?.email }}</small>
        </div>
        
        <router-link to="/settings" class="dropdown-item-link" @click="isDropdownOpen = false">
          ⚙️ Configurações
        </router-link>
        
        <div class="dropdown-divider"></div>
        <div class="dropdown-section-title">👥 Contas Autenticadas</div>
        
        <div class="dropdown-accounts-list">
          <div 
            v-for="acc in store.savedAccounts" 
            :key="acc.id" 
            class="dropdown-account-row"
            :class="{ 'active-account': acc.id === store.currentUser?.id }"
          >
            <button 
              class="dropdown-account-option"
              :disabled="acc.id === store.currentUser?.id"
              @click="handleSwitchAccount(acc.email)"
            >
              <div class="acc-info">
                <span class="acc-name">{{ acc.name }}</span>
                <span class="acc-email">{{ acc.email }}</span>
              </div>
            </button>
            <span v-if="acc.id === store.currentUser?.id" class="current-label">Atual</span>
          </div>
        </div>
        
        <button @click="navigateToAddAccount" class="dropdown-action-btn">
          ➕ Adicionar Conta
        </button>
        
        <div class="dropdown-divider"></div>
        
        <button @click="logout" class="dropdown-action-btn logout-item">
          🚪 Encerrar Sessão
        </button>
      </div>
    </div>

    <nav>
      <router-link to="/" class="nav-link">Home</router-link>
      <router-link to="/transactions" class="nav-link">Despesas</router-link>
      <router-link to="/investments" class="nav-link">Investimentos</router-link>
      <router-link to="/cupons" class="nav-link">Cupons</router-link>
    </nav>
  </header>
  <main v-if="!showBiometricGate" class="app-container">
    <router-view />
  </main>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useWalletStore } from './stores/walletStore'
import { biometricService } from './services/BiometricService'
import BiometricGate from './components/BiometricGate.vue'

const router = useRouter()
const route = useRoute()
const store = useWalletStore()

const isDropdownOpen = ref(false)
const showBiometricGate = ref(false)

onMounted(async () => {
  await store.loadFromLocalStorage()
  const platform = Capacitor.getPlatform()
  const isNative = platform === 'android' || platform === 'ios'
  if (
    isNative &&
    store.currentUser &&
    store.isBiometricEnabled
  ) {
    await nextTick()
    showBiometricGate.value = true
  }
})

function onBioAuthenticated() {
  showBiometricGate.value = false
}

function onBioSkip() {
  showBiometricGate.value = false
}

const isAuthenticated = computed(() => {
  const publicRoutes = ['/login', '/register', '/forgot-password']
  return store.currentUser !== null && !publicRoutes.includes(route.path)
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const handleSwitchAccount = async (email) => {
  isDropdownOpen.value = false
  const ok = await store.switchAccount(email)
  if (!ok) {
    router.push({ name: 'login', query: { email } })
  }
}

const navigateToAddAccount = async () => {
  isDropdownOpen.value = false
  await store.logoutUser()
  router.push('/login')
}

const logout = async () => {
  isDropdownOpen.value = false
  await store.logoutUser()
  router.push({ name: 'login' })
}

// Custom directive to click outside
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 10px rgba(11, 29, 51, 0.04);
  position: relative;
  z-index: 100;
}
.app-header::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 3px;
  right: 3px;
  height: 1px;
  background: rgba(138, 111, 62, 0.3);
  border-radius: 28px;
  pointer-events: none;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Playfair Display", "Times New Roman", Times, serif;
  font-weight: bold;
  font-size: 1.4rem;
  letter-spacing: 1px;
  color: var(--text-primary);
  order: 1;
}
.logo-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  order: 2;
  margin-left: auto;
  margin-right: 1.5rem;
}
/* User Menu Dropdown Styles */
.user-menu-container {
  position: relative;
  order: 3;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: "Times New Roman", Times, Georgia, serif;
  font-weight: bold;
  color: var(--text-primary);
  transition: all 0.2s;
}

.user-menu-btn:hover {
  opacity: 0.8;
}

.profile-thumb {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-initial {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--text-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
}

.chevron {
  font-size: 0.6rem;
  color: var(--accent-color);
}

.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 230px;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  box-shadow: 0 4px 15px rgba(11, 29, 51, 0.12);
  z-index: 1000;
  padding: 0.75rem 0;
  text-align: left;
}

.user-dropdown-menu::before {
  content: '';
  position: absolute;
  top: 3px; left: 3px; right: 3px; bottom: 3px;
  border: 1px solid rgba(138, 111, 62, 0.15);
  border-radius: 1px;
  pointer-events: none;
}

.dropdown-header {
  padding: 0.5rem 1rem 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.dropdown-header strong {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.dropdown-header small {
  font-size: 0.78rem;
  color: var(--text-secondary);
  word-break: break-all;
}

.dropdown-item-link, .dropdown-action-btn {
  display: block;
  width: 100%;
  padding: 0.6rem 1rem;
  background: transparent;
  border: none;
  text-align: left;
  font-family: "Times New Roman", Times, Georgia, serif;
  font-size: 0.88rem;
  font-weight: bold;
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.dropdown-item-link:hover, .dropdown-action-btn:hover {
  background-color: #fdfcf7;
  color: var(--accent-color);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 0.5rem 0;
}

.dropdown-section-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-weight: bold;
  letter-spacing: 0.5px;
  padding: 0.25rem 1rem;
}

.dropdown-accounts-list {
  display: flex;
  flex-direction: column;
  max-height: 150px;
  overflow-y: auto;
}

.dropdown-account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 1rem;
  transition: background 0.2s;
}

.dropdown-account-row:hover:not(.active-account) {
  background: #fdfcf7;
}

.dropdown-account-option {
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  padding: 0;
  width: 100%;
}

.acc-info {
  display: flex;
  flex-direction: column;
}

.acc-name {
  font-size: 0.82rem;
  font-weight: bold;
  color: var(--text-primary);
}

.acc-email {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.dropdown-account-row.active-account .acc-name {
  color: var(--accent-color);
}

.current-label {
  font-size: 0.68rem;
  color: var(--success-color);
  font-weight: bold;
  text-transform: uppercase;
  border: 1px solid rgba(26, 66, 37, 0.3);
  padding: 0.05rem 0.25rem;
  border-radius: 2px;
}

.logout-item {
  color: var(--danger-color);
}

.logout-item:hover {
  background-color: #fdf2f2;
  color: var(--danger-color);
}

.app-container {
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0.65rem 1rem 0.55rem 1rem;
    padding-top: calc(0.65rem + env(safe-area-inset-top, 0px));
    padding-left: calc(1rem + env(safe-area-inset-left, 0px));
    padding-right: calc(1rem + env(safe-area-inset-right, 0px));
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    border-radius: 0 0 20px 20px;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 12px rgba(11, 29, 51, 0.04);
  }
  
  .app-header::after {
    left: 8px;
    right: 8px;
    bottom: 3px;
    border-radius: 0 0 16px 16px;
  }

  nav {
    width: 100%;
    order: 3;
    justify-content: space-around;
    gap: 0.5rem;
    margin-top: 0.65rem;
    margin-left: 0;
    margin-right: 0;
  }

  .nav-link {
    font-size: 0.78rem;
    letter-spacing: 0.5px;
    padding: 0.2rem 0.4rem;
  }

  .user-menu-container {
    order: 2;
  }

  .user-dropdown-menu {
    top: calc(100% + 6px);
    right: 0;
  }

  .app-container {
    padding: 0 1.5rem 1.5rem 1.5rem;
    padding-left: calc(1.5rem + env(safe-area-inset-left, 0px));
    padding-right: calc(1.5rem + env(safe-area-inset-right, 0px));
  }
}

@media (max-width: 600px) {
  .app-container {
    padding: 0 0.75rem 1rem 0.75rem;
    padding-left: calc(0.75rem + env(safe-area-inset-left, 0px));
    padding-right: calc(0.75rem + env(safe-area-inset-right, 0px));
  }
}
</style>
