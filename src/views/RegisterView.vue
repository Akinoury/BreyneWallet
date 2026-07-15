<template>
  <div class="auth-wrapper animate-fade-in">
    <div class="auth-card glass-panel">
      <div class="auth-header">
        <h1 class="logo-title"><span class="logo-accent">Breyne</span>Wallet</h1>
        <p class="auth-subtitle">Crie sua conta e organize sua vida financeira</p>
      </div>

      <div v-if="errorMsg" class="alert-box alert-error">
        {{ errorMsg }}
      </div>
      <div v-if="successMsg" class="alert-box alert-success">
        {{ successMsg }}
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="name">Nome Completo</label>
          <input 
            type="text" 
            id="name" 
            v-model="name" 
            placeholder="Seu nome completo" 
            class="input-field" 
            required 
          />
        </div>

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

        <div class="form-row">
          <div class="form-group">
            <label for="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="Mín. 6 caracteres" 
              class="input-field" 
              required 
            />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirmar Senha</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              placeholder="Repita a senha" 
              class="input-field" 
              required 
            />
          </div>
        </div>

        <!-- BIOMETRICS REGISTRATION ENABLE -->
        <div class="bio-registration-box">
          <div class="flex-between">
            <div>
              <span class="bio-reg-title">Ativar Login Biométrico</span>
              <p class="bio-reg-desc">Permite acessar rapidamente via impressão digital</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="enableBiometrics" @change="handleBioToggle" />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- SCANNER SIMULATOR FOR REGISTRATION -->
          <div v-if="showBioScanner" class="scanner-setup-area animate-fade-in">
            <div class="biometric-container">
              <span class="bio-label">{{ bioStatusLabel }}</span>
              <div 
                class="fingerprint-scanner" 
                :class="{ 
                  'scanning': isScanning, 
                  'success': scanSuccess, 
                  'error-scanner': scanError 
                }"
                @click="startBioRegistration"
              >
                <!-- SVG Impressão Digital -->
                <svg class="fingerprint-icon" viewBox="0 0 24 24">
                  <path d="M12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,2.19,6.17,1,1,0,1,0,1.62-1.18,7.92,7.92,0,0,1-1.81-4.99,8,8,0,0,1,16,0,7.91,7.91,0,0,1-1.63,4.89,1,1,0,0,0,1.57,1.24A9.89,9.89,0,0,0,22,12,10,10,0,0,0,12,2Zm0,4a6,6,0,0,0-6,6,5.88,5.88,0,0,0,1,3.25,1,1,0,0,0,1.67-1.1,3.87,3.87,0,0,1-.67-2.15,4,4,0,0,1,8,0,3.82,3.82,0,0,1-.83,2.37,1,1,0,0,0,.16,1.4,1,1,0,0,0,1.4-.16A5.82,5.82,0,0,0,18,12,6,6,0,0,0,12,6Zm0,4a2,2,0,0,0-2,2,1.91,1.91,0,0,0,.29,1,1,0,0,0,1.71-1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,.29,1,2,2,0,0,0,0-4Z"/>
                </svg>
                <div class="scanning-line"></div>
              </div>
              <small class="bio-help">Toque para cadastrar sua digital de teste</small>
            </div>
          </div>
        </div>

        <button type="submit" class="btn-primary btn-block" :disabled="isLoading">
          {{ isLoading ? 'Cadastrando...' : 'Criar Conta' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>Já possui uma conta? </span>
        <router-link to="/login" class="auth-link">Fazer Login</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '../stores/walletStore'
import { biometricService } from '../services/BiometricService'

const router = useRouter()
const store = useWalletStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const enableBiometrics = ref(false)
const showBioScanner = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const isLoading = ref(false)

// Biometric states
const isScanning = ref(false)
const scanSuccess = ref(false)
const scanError = ref(false)
const bioStatusLabel = ref('Registrar Impressão Digital')
const biometricsCompleted = ref(false)

const handleBioToggle = () => {
  if (enableBiometrics.value) {
    showBioScanner.value = true
    biometricsCompleted.value = false
    bioStatusLabel.value = 'Toque no sensor para escanear'
  } else {
    showBioScanner.value = false
    biometricsCompleted.value = false
  }
}

const startBioRegistration = () => {
  if (isScanning.value || biometricsCompleted.value) return

  isScanning.value = true
  scanSuccess.value = false
  scanError.value = false
  bioStatusLabel.value = 'Analisando padrões da digital...'

  setTimeout(() => {
    isScanning.value = false
    scanSuccess.value = true
    biometricsCompleted.value = true
    bioStatusLabel.value = 'Digital Cadastrada!'
    
    // Som premium de confirmação
    playBeep(1200, 'sine', 0.2)
  }, 2000)
}

const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'As senhas digitadas não coincidem.'
    return
  }

  if (password.value.length < 6) {
    errorMsg.value = 'A senha deve ter pelo menos 6 caracteres.'
    return
  }

  if (enableBiometrics.value && !biometricsCompleted.value) {
    errorMsg.value = 'Por favor, finalize o escaneamento da impressão digital ou desmarque a biometria.'
    return
  }

  isLoading.value = true

  try {
    const result = await store.registerUser(
      name.value, 
      email.value, 
      password.value, 
      enableBiometrics.value
    )
    isLoading.value = false

    if (result.success) {
      if (result.autoSignedIn && enableBiometrics.value) {
        successMsg.value = 'Conta criada! Configurando biometria...'
        const bioResult = await store.enrollBiometric()
        if (bioResult.success) {
          successMsg.value = 'Conta criada e biometria cadastrada!'
        } else {
          successMsg.value = 'Conta criada! Biometria não foi cadastrada: ' + bioResult.message
        }
      } else if (result.autoSignedIn) {
        successMsg.value = 'Conta criada com sucesso!'
      } else {
        successMsg.value = 'Conta criada! Verifique seu e-mail para confirmar.'
      }

      setTimeout(() => {
        if (result.autoSignedIn) {
          router.push('/')
        } else {
          router.push('/login')
        }
      }, 2000)
    } else {
      errorMsg.value = result.message || 'Erro ao registrar usuário.'
    }
  } catch (err) {
    isLoading.value = false
    errorMsg.value = err.message || 'Erro ao registrar usuário.'
  }
}

const playBeep = (freq, type, duration) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    oscillator.type = type
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime)
    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration)
    
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + duration)
  } catch (e) {}
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

.auth-card {
  width: 100%;
  max-width: 460px;
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

.bio-registration-box {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  text-align: left;
  position: relative;
}

.bio-registration-box::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  border: 1px solid rgba(138, 111, 62, 0.15);
  pointer-events: none;
}

.bio-reg-title {
  font-weight: bold;
  font-size: 0.95rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bio-reg-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}

/* Toggle Switch Styles */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cdc7b1;
  transition: .4s;
  border-radius: 34px;
  border: 1px solid var(--border-color);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--text-primary);
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--accent-color);
  border-color: var(--accent-hover);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
  background-color: #ffffff;
}

.scanner-setup-area {
  margin-top: 1rem;
}

.bio-label {
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.bio-help {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.4rem;
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
}

.auth-link:hover {
  color: var(--accent-hover);
}

.auth-footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}

@media (max-width: 600px) {
  .auth-wrapper { padding: 0.5rem; }
  .logo-title { font-size: 1.8rem; }
  .bio-registration-box .flex-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
