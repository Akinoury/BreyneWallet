<template>
  <div class="bio-gate-overlay" v-if="visible">
    <div class="bio-gate-card">
      <div class="bio-gate-header">
        <div class="bio-gate-logo">
          <span class="logo-accent">Breyne</span>Wallet
        </div>
        <p class="bio-gate-subtitle">Verificação de identidade necessária</p>
      </div>

      <div class="bio-gate-body">
        <div class="fingerprint-circle" :class="{ scanning: status === 'scanning', success: status === 'success', error: status === 'error' }" @click="startScan">
          <svg class="fingerprint-icon-lg" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>

        <p class="bio-gate-status">{{ statusLabel }}</p>
        <p v-if="errorMessage" class="bio-gate-error">{{ errorMessage }}</p>

        <button v-if="status === 'error'" class="btn-primary" @click="startScan">
          Tentar Novamente
        </button>

        <button v-if="status === 'error'" class="btn-link" @click="handleLogout">
          Usar senha
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useWalletStore } from '../stores/walletStore'
import { biometricService } from '../services/BiometricService'

const router = useRouter()
const store = useWalletStore()

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['authenticated', 'skip'])

const status = ref('idle')
const statusLabel = ref('Toque no sensor para autenticar')
const errorMessage = ref('')

watch(() => props.visible, async (val) => {
  if (val) {
    const platform = Capacitor.getPlatform()
    if (platform !== 'android' && platform !== 'ios') {
      emit('skip')
      return
    }
    if (!store.currentUser || !store.isBiometricEnabled) {
      emit('skip')
      return
    }
    await startScan()
  }
})

async function startScan() {
  if (status.value === 'scanning') return

  status.value = 'scanning'
  statusLabel.value = 'Verificando identidade...'
  errorMessage.value = ''

  const userIds = biometricService.getSavedAccountIds()
  if (userIds.length === 0) {
    const cachedIds = biometricService.getCachedUserIds()
    if (cachedIds.length > 0) {
      userIds.push(...cachedIds)
    }
  }

  let result
  try {
    result = await biometricService.authenticate(userIds)
  } catch (err) {
    result = { success: false, message: err?.message || 'Erro na autenticação' }
  }

  if (result.success) {
    status.value = 'success'
    statusLabel.value = 'Acesso Autorizado!'

    if (result.user) {
      store.currentUser = {
        id: result.user.user_id || result.user.id,
        name: result.user.name,
        email: result.user.email
      }
      try { await store.loadWalletState() } catch {}
    }

    setTimeout(() => {
      emit('authenticated')
    }, 800)
  } else {
    status.value = 'error'
    statusLabel.value = 'Falha na autenticação'
    errorMessage.value = result.message || 'Não foi possível verificar sua identidade'
  }
}

async function handleLogout() {
  await store.logoutUser()
  router.push('/login')
  emit('skip')
}
</script>

<style scoped>
.bio-gate-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--text-primary, #0b1d33);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bio-gate-card {
  background: #ffffff;
  border: 1px solid var(--border-color, #cdc7b1);
  border-radius: 6px;
  padding: 2.5rem 2rem;
  max-width: 360px;
  width: 90%;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.bio-gate-header {
  margin-bottom: 2rem;
}

.bio-gate-logo {
  font-family: "Playfair Display", "Times New Roman", Times, serif;
  font-size: 1.8rem;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--text-primary, #0b1d33);
}

.logo-accent {
  color: var(--accent-color, #8a6f3e);
}

.bio-gate-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary, #6b6560);
  margin-top: 0.5rem;
}

.bio-gate-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.fingerprint-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fdfcf7;
  border: 2px solid var(--border-color, #cdc7b1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fingerprint-circle:hover {
  border-color: var(--accent-color, #8a6f3e);
  background: #f3efe2;
}

.fingerprint-circle.scanning {
  border-color: var(--accent-color, #8a6f3e);
  animation: gatePulse 1s infinite alternate;
}

.fingerprint-circle.success {
  border-color: var(--success-color, #2e7d32);
  background: #f3faf5;
}

.fingerprint-circle.error {
  border-color: var(--danger-color, #c62828);
  background: #fdf2f2;
}

.fingerprint-icon-lg {
  width: 40px;
  height: 40px;
  fill: var(--text-secondary, #6b6560);
  transition: fill 0.3s;
}

.fingerprint-circle.scanning .fingerprint-icon-lg {
  fill: var(--accent-color, #8a6f3e);
}

.fingerprint-circle.success .fingerprint-icon-lg {
  fill: var(--success-color, #2e7d32);
}

.fingerprint-circle.error .fingerprint-icon-lg {
  fill: var(--danger-color, #c62828);
}

.bio-gate-status {
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--text-primary, #0b1d33);
}

.bio-gate-error {
  font-size: 0.82rem;
  color: var(--danger-color, #c62828);
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: var(--text-primary, #0b1d33);
  color: #fff;
  border: none;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.btn-primary:hover {
  background: var(--accent-color, #8a6f3e);
}

.btn-link {
  background: transparent;
  border: none;
  color: var(--text-secondary, #6b6560);
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.btn-link:hover {
  color: var(--accent-color, #8a6f3e);
}

@keyframes gatePulse {
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
}
</style>
