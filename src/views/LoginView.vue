<template>
  <div class="auth-wrapper animate-fade-in">
    <div class="auth-split-container">
      
      <!-- ESQUERDA: FORMULÁRIO -->
      <div class="auth-form-side">
        <div class="auth-card glass-panel">
          <div class="auth-header">
            <h1 class="logo-title"><span class="logo-accent">Breyne</span>Wallet</h1>
            <p class="auth-subtitle">Controle financeiro inteligente de alta fidelidade</p>
          </div>

          <div v-if="errorMsg" class="alert-box alert-error">
            {{ errorMsg }}
          </div>
          <div v-if="successMsg" class="alert-box alert-success">
            {{ successMsg }}
          </div>

          <!-- FORM DE LOGIN -->
          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="form-group">
              <label for="email">Endereço de E-mail</label>
              <input 
                type="email" 
                id="email" 
                v-model="email" 
                placeholder="exemplo@email.com" 
                class="input-field" 
                required 
              />
            </div>

            <div class="form-group">
              <div class="flex-between" style="margin-bottom: 0.5rem;">
                <label for="password" style="margin-bottom: 0;">Senha de Acesso</label>
                <router-link to="/forgot-password" class="auth-link-sm">Esqueceu a senha?</router-link>
              </div>
              <input 
                type="password" 
                id="password" 
                v-model="password" 
                placeholder="Digite sua senha" 
                class="input-field" 
                required 
              />
            </div>

            <button type="submit" class="btn-primary btn-block" :disabled="isLoading">
              {{ isLoading ? 'Autenticando...' : 'Fazer Login' }}
            </button>

            <!-- BIOMETRIC SENSOR -->
            <div class="biometric-singelo" :class="{ 'error-sensor': scanError }" @click="triggerBiometricScan">
              <svg class="fingerprint-icon-sm" :class="{ 'scanning': isScanning, 'success': scanSuccess, 'error': scanError }" viewBox="0 0 24 24">
                <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06a1 1 0 0 1-.36-1.36A8.94 8.94 0 0 1 21 5.5a1 1 0 0 1-1.36 1.37 6.94 6.94 0 0 0-1.88-1.28.96.96 0 0 1-.45-.6c-.15-.5-.23-1-.24-1.52v-.04M12 10a1 1 0 0 1 1 1c0 .8-.08 1.6-.24 2.38a1 1 0 0 1-.97.76h-.03a1 1 0 0 1-.97-.76A11.6 11.6 0 0 1 11 11a1 1 0 0 1 1-1m6.24 2.88a1 1 0 0 1-.51-1.33 6.9 6.9 0 0 0 .27-4.56 1 1 0 0 1 .62-1.27 1 1 0 0 1 1.27.62 8.9 8.9 0 0 1-.36 6.03 1 1 0 0 1-.91.62c-.1 0-.2-.02-.3-.06l-.08-.05M12 3a8.99 8.99 0 0 1 8.86 7.74 1 1 0 1 1-1.98-.24A7.01 7.01 0 0 0 5.25 10a1 1 0 0 1-2 0A9.13 9.13 0 0 1 12 3m-4.52 1.85a1 1 0 0 1-.36-1.36 8.98 8.98 0 0 1 3.06-2.83 1 1 0 1 1 .96 1.76 6.96 6.96 0 0 0-2.3 2.08 1 1 0 0 1-1.36.35M5.18 8.06a1 1 0 0 1-.27-1.38 8.95 8.95 0 0 1 2.5-2.58 1 1 0 0 1 1.2 1.6 6.94 6.94 0 0 0-1.98 2.1 1 1 0 0 1-1.36.36l-.09-.1M4.26 14.6a1 1 0 0 1-.42-1.35A8.94 8.94 0 0 1 6.8 9.67a1 1 0 1 1 .94 1.77 6.95 6.95 0 0 0-2.42 2.74 1 1 0 0 1-1.06.52M12 17.27a2.99 2.99 0 0 1-2.63-1.51 1 1 0 0 1 .54-1.33 1 1 0 0 1 1.2.26 1 1 0 0 0 1.54-.17 1 1 0 0 1 1.38-.35 1 1 0 0 1 .35 1.37A4.98 4.98 0 0 1 12 17.27Z"/>
              </svg>
              <span class="bio-text-sm">{{ bioStatusLabel }}</span>
              <span v-if="!hasBiometricCredential" class="bio-hint">Nenhuma biometria cadastrada. Faça login e vá em Configurações.</span>
            </div>
          </form>

          <div class="auth-footer">
            <span>Não tem uma conta? </span>
            <router-link to="/register" class="auth-link">Cadastre-se</router-link>
          </div>
        </div>
      </div>

      <!-- DIREITA: ILUSTRAÇÃO/FOTO (Desktop) -->
      <div class="auth-visual-side">
        <div class="auth-visual-overlay"></div>
        <img src="/welcome_illustration.png" alt="BreyneWallet" class="auth-visual-img" />
        <div class="auth-visual-text">
          <h2>Alcance a Liberdade Financeira</h2>
          <p>Gerencie seus fundos, projete sua rentabilidade baseada na Selic e controle seus gastos em tempo real.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWalletStore } from '../stores/walletStore'
import { biometricService } from '../services/BiometricService'
import { api } from '../services/api'

const router = useRouter()
const route = useRoute()
const store = useWalletStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const isLoading = ref(false)

// Biometrics states
const isScanning = ref(false)
const scanSuccess = ref(false)
const scanError = ref(false)
const bioStatusLabel = ref('Autenticação Biométrica')
const hasBiometricCredential = ref(false)

onMounted(async () => {
  await store.loadFromLocalStorage()
  
  if (route.query.email) {
    email.value = route.query.email
  }

  const userIds = biometricService.getSavedAccountIds()
  if (userIds.length > 0) {
    const results = await Promise.all(userIds.map(uid => biometricService.hasCredential(uid)))
    hasBiometricCredential.value = results.some(Boolean)
  }

  if (hasBiometricCredential.value) {
    const accounts = biometricService.getSavedAccounts()
    if (accounts.length > 0) {
      bioStatusLabel.value = `Olá, ${accounts[0].name}! Toque para autenticar`
    }
  } else {
    bioStatusLabel.value = 'Autenticação Biométrica'
  }
})

const handleLogin = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  try {
    const result = await store.loginUser(email.value, password.value)
    isLoading.value = false

    if (result.success) {
      successMsg.value = 'Login efetuado com sucesso! Redirecionando...'
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      errorMsg.value = result.message || 'E-mail ou senha incorretos.'
    }
  } catch (err) {
    isLoading.value = false
    errorMsg.value = err.message || 'Erro ao tentar fazer login.'
  }
}

const triggerBiometricScan = async () => {
  if (isScanning.value) return

  if (!hasBiometricCredential.value) {
    errorMsg.value = 'Nenhuma biometria cadastrada. Vá em Configurações após fazer login para cadastrar.'
    scanError.value = true
    setTimeout(() => {
      scanError.value = false
      errorMsg.value = ''
    }, 4000)
    return
  }

  const userIds = biometricService.getSavedAccountIds()
  if (userIds.length === 0) {
    scanError.value = true
    bioStatusLabel.value = 'Nenhuma conta cadastrada!'
    errorMsg.value = 'Faça login com e-mail e senha primeiro.'
    setTimeout(() => {
      scanError.value = false
      bioStatusLabel.value = 'Autenticação Biométrica'
    }, 4000)
    return
  }

  isScanning.value = true
  scanSuccess.value = false
  scanError.value = false
  bioStatusLabel.value = 'Verificando identidade...'
  errorMsg.value = ''

  let result
  try {
    result = await biometricService.authenticate(userIds)
  } catch (err) {
    result = { success: false, message: err?.message || 'Erro na autenticação biométrica.' }
  }
  isScanning.value = false

  if (result.success) {
    scanSuccess.value = true
    bioStatusLabel.value = 'Acesso Autorizado!'
    successMsg.value = 'Biometria verificada! Redirecionando...'
    playBeep(880, 'sine', 0.15)

    if (result.user) {
      store.currentUser = {
        id: result.user.user_id || result.user.id,
        name: result.user.name,
        email: result.user.email
      }
      await store.loadWalletState()
    }

    setTimeout(() => {
      router.push('/')
    }, 1200)
  } else {
    scanError.value = true
    bioStatusLabel.value = 'Falha na validação'
    errorMsg.value = result.message
    playBeep(220, 'sawtooth', 0.25)

    setTimeout(() => {
      scanError.value = false
      bioStatusLabel.value = 'Toque para tentar novamente'
    }, 3000)
  }
}

// Emissão de som refinado para UI premium
const playBeep = (freq, type, duration) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    oscillator.type = type
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime)
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration)
    
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + duration)
  } catch (e) {
    // Silencia se o browser bloquear audio sem interação
  }
}
</script>

<style scoped>
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 1rem;
}

.auth-split-container {
  display: flex;
  width: 100%;
  max-width: 960px;
  background: #fdfaf3;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(11, 29, 51, 0.08);
}

.auth-form-side {
  flex: 1.1;
  padding: 3rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-visual-side {
  flex: 0.9;
  position: relative;
  overflow: hidden;
  background: var(--text-primary);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 3rem 2.5rem;
  box-sizing: border-box;
}

.auth-visual-img {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

.auth-visual-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(11, 29, 51, 0.9) 20%, rgba(11, 29, 51, 0.3) 100%);
  z-index: 1;
}

.auth-visual-text {
  position: relative;
  z-index: 2;
  color: #fff;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.auth-visual-text h2 {
  font-size: 1.8rem;
  margin-bottom: 0.75rem;
  color: var(--accent-color);
}

.auth-visual-text p {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0;
}

@media (max-width: 850px) {
  .auth-visual-side {
    display: none;
  }
  .auth-split-container {
    max-width: 460px;
  }
  .auth-form-side {
    padding: 2rem 1.5rem;
  }
}

.auth-card {
  width: 100%;
  max-width: 440px;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo-title {
  font-size: 2.2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.auth-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.alert-box {
  padding: 0.75rem 1rem;
  border-radius: 3px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
  text-align: left;
  line-height: 1.4;
}

.alert-error {
  background: #fdf2f2;
  color: var(--danger-color);
  border: 1px solid #f8b4b4;
}

.alert-success {
  background: #f3faf5;
  color: var(--success-color);
  border: 1px solid #def7ec;
}

.bio-label {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.bio-help {
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}

.divider:not(:empty)::before {
  margin-right: .75em;
}

.divider:not(:empty)::after {
  margin-left: .75em;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.btn-block {
  width: 100%;
  padding: 0.85rem;
}

.auth-link {
  color: var(--accent-color);
  text-decoration: underline;
  font-weight: bold;
  transition: color 0.2s;
}

.auth-link:hover {
  color: var(--accent-hover);
}

.auth-link-sm {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-decoration: underline;
  transition: color 0.2s;
}

.auth-link-sm:hover {
  color: var(--text-primary);
}

.auth-footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}

.biometric-singelo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1.25rem;
  cursor: pointer;
  padding: 0.65rem;
  border-radius: 3px;
  background: #fdfcf7;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
  flex-wrap: wrap;
}

.biometric-singelo:hover {
  background: #f3efe2;
  border-color: var(--accent-color);
}

.biometric-singelo.error-sensor {
  border-color: var(--danger-color);
  background: #fdf2f2;
}

.biometric-singelo.error-sensor:hover {
  background: #fce8e8;
}

.fingerprint-icon-sm {
  width: 22px;
  height: 22px;
  fill: var(--text-secondary);
  transition: fill 0.2s;
}

.fingerprint-icon-sm.scanning {
  fill: var(--accent-color);
  animation: pulseScan 1.2s infinite alternate;
}

.fingerprint-icon-sm.success {
  fill: var(--success-color);
}

.fingerprint-icon-sm.error {
  fill: var(--danger-color);
}

.bio-text-sm {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bio-hint {
  font-size: 0.72rem;
  color: var(--text-secondary);
  width: 100%;
  text-align: center;
  text-transform: none;
  letter-spacing: 0;
  font-weight: normal;
}

@keyframes pulseScan {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}

@media (max-width: 480px) {
  .auth-wrapper { padding: 0.5rem; }
  .auth-form-side { padding: 1.25rem 1rem; }
  .auth-card { max-width: 100%; }
  .logo-title { font-size: 1.6rem; }
  .auth-subtitle { font-size: 0.8rem; }
}
</style>
