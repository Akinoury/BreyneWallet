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
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
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
  } else {
    hasBiometricCredential.value = await biometricService.hasAnyCredential()
  }

  if (hasBiometricCredential.value) {
    bioStatusLabel.value = 'Toque para autenticar'
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
    const cachedIds = biometricService.getCachedUserIds()
    if (cachedIds.length === 0) {
      scanError.value = true
      bioStatusLabel.value = 'Nenhuma conta cadastrada!'
      errorMsg.value = 'Faça login com e-mail e senha primeiro.'
      setTimeout(() => {
        scanError.value = false
        bioStatusLabel.value = 'Autenticação Biométrica'
      }, 4000)
      return
    }
    userIds.push(...cachedIds)
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
      try { await store.loadWalletState() } catch (e) { console.warn('Load wallet after biometric:', e) }
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
