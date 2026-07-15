<template>
  <div class="auth-wrapper animate-fade-in">
    <div class="auth-card glass-panel">
      <div class="auth-header">
        <h1 class="logo-title"><span class="logo-accent">Breyne</span>Wallet</h1>
        <p class="auth-subtitle">Recuperação de Senha de Acesso</p>
      </div>

      <div v-if="errorMsg" class="alert-box alert-error">
        {{ errorMsg }}
      </div>
      <div v-if="successMsg" class="alert-box alert-success">
        {{ successMsg }}
      </div>

      <div v-if="!emailSent" class="reset-flow">
        <p class="info-text">
          Insira o endereço de e-mail associado à sua conta. Enviaremos instruções para redefinir sua senha de acesso.
        </p>

        <form @submit.prevent="handleReset" class="auth-form">
          <div class="form-group">
            <label for="email">Seu E-mail Cadastrado</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="exemplo@email.com" 
              class="input-field" 
              required 
            />
          </div>

          <button type="submit" class="btn-primary btn-block" :disabled="isLoading">
            {{ isLoading ? 'Processando solicitação...' : 'Enviar Link de Redefinição' }}
          </button>
        </form>
      </div>

      <!-- SUCCESS SCREEN WITH PROGRESS BAR -->
      <div v-else class="success-flow animate-fade-in">
        <div class="success-icon-wrapper">
          <svg class="success-icon" viewBox="0 0 24 24">
            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
          </svg>
        </div>
        <h3>E-mail Enviado!</h3>
        <p class="success-info">
          As instruções de recuperação de senha foram enviadas para <strong>{{ email }}</strong>. 
          <br /><br />
          <em>Em breve você receberá instruções para redefinir sua senha.</em>
        </p>
        
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <small class="progress-label">Redirecionando para login em {{ countdown }} segundos...</small>
      </div>

      <div class="auth-footer">
        <router-link to="/login" class="auth-link">Voltar para o Login</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '../stores/walletStore'

const router = useRouter()
const store = useWalletStore()

const email = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const isLoading = ref(false)
const emailSent = ref(false)

const countdown = ref(5)
const progressPercent = ref(0)

const handleReset = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  try {
    const result = await store.forgotPassword(email.value)
    isLoading.value = false
    if (result.success) {
      emailSent.value = true
      startCountdown()
    } else {
      errorMsg.value = result.error || 'E-mail não encontrado.'
    }
  } catch (err) {
    isLoading.value = false
    errorMsg.value = err.message || 'Erro ao processar solicitação.'
  }
}

const startCountdown = () => {
  const duration = 5000 // 5 seconds
  const intervalTime = 50
  let elapsed = 0

  const timer = setInterval(() => {
    elapsed += intervalTime
    progressPercent.value = (elapsed / duration) * 100
    countdown.value = Math.ceil((duration - elapsed) / 1000)

    if (elapsed >= duration) {
      clearInterval(timer)
      router.push('/login')
    }
  }, intervalTime)
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

.info-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 1.5rem;
  text-align: left;
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

/* Success Flow styles */
.success-flow {
  text-align: center;
  padding: 1rem 0;
}

.success-icon-wrapper {
  width: 60px;
  height: 60px;
  background: #f3faf5;
  border: 2px solid var(--success-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.success-icon {
  width: 32px;
  height: 32px;
  fill: var(--success-color);
}

.success-info {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.05s linear;
}

.redirect-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

@media (max-width: 600px) {
  .auth-wrapper { padding: 0.5rem; }
  .logo-title { font-size: 1.8rem; }
}
</style>
