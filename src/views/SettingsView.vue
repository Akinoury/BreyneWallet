<template>
  <div class="settings-wrapper animate-fade-in">
    <div class="header-section">
      <h2>Painel de Configurações</h2>
      <p>Gerencie seus parâmetros financeiros, taxas tributárias e informações de perfil.</p>
    </div>

    <!-- NOTIFICATIONS -->
    <div v-if="errorMsg" class="alert-box alert-error">
      {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="alert-box alert-success">
      {{ successMsg }}
    </div>

    <div class="grid-2">
      <!-- PARAMETROS FINANCEIROS -->
      <div class="settings-card glass-panel full-width-card">
        <h3>Parâmetros da Carteira</h3>
        <p class="section-subtitle">
          Configure como o Salário (X = R$ {{ formatCurrency(salary) }}) é distribuído nos 100% do ciclo financeiro.
          A soma das taxas principais não deve ultrapassar 100%.
        </p>

        <!-- DISTRIBUIÇÃO VISUAL -->
        <div class="distribution-bar-container">
          <div class="distribution-bar-track">
            <div class="dist-bar-segment seg-consumption" :style="{ width: consumptionRateLocal + '%' }" :title="`Limite de Consumo: ${consumptionRateLocal}%`"></div>
            <div class="dist-bar-segment seg-investment" :style="{ width: investmentRateLocal + '%' }" :title="`Investimento: ${investmentRateLocal}%`"></div>
            <div class="dist-bar-segment seg-remainder" :style="{ width: Math.max(0, 100 - totalAllocated) + '%' }" :title="`Não alocado: ${Math.max(0, 100 - totalAllocated).toFixed(2)}%`"></div>
          </div>
          <div class="distribution-legend">
            <span class="legend-item"><span class="legend-dot dot-consumption"></span>Consumo {{ consumptionRateLocal }}%</span>
            <span class="legend-item"><span class="legend-dot dot-investment"></span>Investimento {{ investmentRateLocal }}%</span>
            <span class="legend-item" v-if="(100 - totalAllocated) > 0"><span class="legend-dot dot-remainder"></span>Livre {{ (100 - totalAllocated).toFixed(2) }}%</span>
          </div>
          <div v-if="totalAllocated > 100" class="allocation-warning">
            ⚠️ A soma das taxas ({{ totalAllocated.toFixed(2) }}%) ultrapassa 100% do salário. Revise os valores.
          </div>
        </div>

        <form @submit.prevent="saveFinancialSettings" class="settings-form">
          <!-- SALÁRIO BASE -->
          <div class="rate-section-title">💰 Salário Base</div>
          <div class="form-group">
            <label for="salary">Salário de Entrada (X)</label>
            <div class="input-prefix-group">
              <span class="prefix">R$</span>
              <input type="number" id="salary" v-model.number="salary" class="input-field-inline" step="0.01" required />
            </div>
          </div>

          <!-- TAXAS SOBRE O SALÁRIO -->
          <div class="rate-section-title">📊 Distribuição do Salário (% sobre X)</div>
          <p class="golden-rule-notice">As taxas abaixo são baseadas na "Regra de Ouro" de 50 30 20. Caso mude essas porcentagens marcadas isso poderá prejudicar sua independencia futura.</p>

          <div class="rate-row">
            <div class="rate-info">
              <label for="consumption-rate">Limite de Consumo</label>
              <small class="help-text">Máximo permitido para gastos no ciclo. Base: 70%</small>
            </div>
            <div class="rate-input-group">
              <input type="number" id="consumption-rate" v-model.number="consumptionRateLocal" @input="onRateChange('consumption')" class="rate-input" step="0.01" min="0" max="100" />
              <span class="rate-suffix">%</span>
              <span class="rate-rs-value">= R$ {{ formatCurrency((salary * consumptionRateLocal / 100)) }}</span>
            </div>
          </div>

          <div class="rate-row">
            <div class="rate-info">
              <label for="investment-rate">Destinado a Investimentos</label>
              <small class="help-text">Percentual do salário alocado para a carteira. Base: 30%</small>
            </div>
            <div class="rate-input-group">
              <input type="number" id="investment-rate" v-model.number="investmentRateLocal" @input="onRateChange('investment')" class="rate-input" step="0.01" min="0" max="100" />
              <span class="rate-suffix">%</span>
              <span class="rate-rs-value">= R$ {{ formatCurrency((salary * investmentRateLocal / 100)) }}</span>
            </div>
          </div>


          <!-- TAXAS OPERACIONAIS -->
          <div class="rate-section-title">⚙️ Taxas Operacionais</div>

          <div class="rate-row">
            <div class="rate-info">
              <label for="bonus-rate">Bônus de Incentivo ao Investimento</label>
              <small class="help-text">% sobre o valor investido como bônus. Base: 5%</small>
            </div>
            <div class="rate-input-group">
              <input type="number" id="bonus-rate" v-model.number="investmentBonusRateLocal" class="rate-input" step="0.01" min="0" max="100" />
              <span class="rate-suffix">%</span>
              <span class="rate-rs-value">= R$ {{ formatCurrency((salary * investmentRateLocal / 100) * (investmentBonusRateLocal / 100)) }}</span>
            </div>
          </div>

          <div class="rate-row">
            <div class="rate-info">
              <label for="expense-tax-rate">Juros sobre Gastos (Compras e Passivos)</label>
              <small class="help-text">Aplicado sobre o total de compras e passivos. Base: 15%</small>
            </div>
            <div class="rate-input-group">
              <input type="number" id="expense-tax-rate" v-model.number="taxRate" class="rate-input" step="0.01" min="0" max="100" />
              <span class="rate-suffix">%</span>
            </div>
          </div>

          <div class="rate-row">
            <div class="rate-info">
              <label for="penalty-rate">Penalidade sobre Excedente de Consumo</label>
              <small class="help-text">% cobrado sobre o valor que ultrapassou o limite. Base: 30%</small>
            </div>
            <div class="rate-input-group">
              <input type="number" id="penalty-rate" v-model.number="penaltyRateLocal" class="rate-input" step="0.01" min="0" max="200" />
              <span class="rate-suffix">%</span>
            </div>
          </div>

          <button type="submit" class="btn-primary btn-block" :disabled="isSavingFinancial || totalAllocated > 100">
            {{ isSavingFinancial ? 'Salvando...' : (totalAllocated > 100 ? 'Corrija as taxas (> 100%)' : 'Salvar Parâmetros') }}
          </button>
        </form>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 1.5rem;">
      <!-- PERFIL DE USUÁRIO -->
      <div class="settings-card glass-panel">
        <h3>Informações do Perfil</h3>
        <p class="section-subtitle">Atualize seu nome de exibição e foto corporativa de perfil.</p>

        <form @submit.prevent="saveProfileSettings" class="settings-form">
          <div class="form-group">
            <label for="profile-name">Nome Completo / Exibição</label>
            <input type="text" id="profile-name" v-model="profileName" class="input-field" required />
          </div>

          <div class="form-group">
            <label for="profile-photo">Link da Foto de Perfil (URL)</label>
            <input type="url" id="profile-photo" v-model="profilePhoto" placeholder="https://exemplo.com/suafoto.jpg" class="input-field" />
            <div v-if="profilePhoto" class="photo-preview-box">
              <img :src="profilePhoto" alt="Preview da Foto" class="photo-preview-img" @error="handlePhotoError" />
            </div>
          </div>

          <button type="submit" class="btn-primary btn-block" :disabled="isSavingProfile">
            {{ isSavingProfile ? 'Salvando...' : 'Atualizar Perfil' }}
          </button>
        </form>
      </div>

      <!-- SEGURANÇA DA CONTA -->
      <div class="settings-card glass-panel">
        <h3>Segurança e Credenciais</h3>
        <p class="section-subtitle">Altere sua senha de acesso e gerencie a biometria do dispositivo.</p>

        <form @submit.prevent="saveSecuritySettings" class="settings-form">
          <div class="form-group">
            <label for="new-password">Nova Senha</label>
            <input 
              type="password" 
              id="new-password" 
              v-model="newPassword" 
              placeholder="Mínimo 6 caracteres"
              class="input-field" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirmar Nova Senha</label>
            <input 
              type="password" 
              id="confirm-password" 
              v-model="confirmPassword" 
              placeholder="Digite novamente"
              class="input-field" 
              required 
            />
          </div>

          <button type="submit" class="btn-primary btn-block" :disabled="isSavingSecurity">
            {{ isSavingSecurity ? 'Atualizando...' : 'Alterar Senha' }}
          </button>
        </form>

        <hr class="section-divider" />

        <div class="bio-section">
          <label class="bio-label">🔐 Biometria</label>
          <p class="section-subtitle">Vincule a impressão digital ou reconhecimento facial do seu dispositivo para acessar o app rapidamente.</p>
          <button
            v-if="!store.isBiometricEnabled"
            class="btn-primary btn-block"
            :disabled="isBioWorking"
            @click="handleEnrollBiometric"
          >
            {{ isBioWorking ? 'Verificando...' : 'Cadastrar Biometria' }}
          </button>
          <div v-else class="bio-enrolled">
            <span class="bio-success">✅ Biometria cadastrada</span>
            <button class="btn-remove-bio" @click="handleRemoveBiometric">Remover</button>
          </div>
        </div>

        <hr class="section-divider" />

        <div class="bio-section">
          <label class="bio-label">📋 Credenciais Registradas</label>
          <p class="section-subtitle">Dispositivos com acesso biométrico à sua conta.</p>

          <div v-if="registeredCredentials.length === 0" class="empty-state">
            <p>Nenhuma credencial registrada.</p>
          </div>

          <div v-else class="credentials-list">
              <div v-for="cred in registeredCredentials" :key="cred.id" class="credential-item">
              <div class="credential-info">
                <span class="credential-device">{{ cred.device_name || 'Dispositivo' }}</span>
                <span v-if="cred.synced === false" class="credential-sync-warn" title="Não sincronizado com o servidor">⚠️ Offline</span>
                <span v-else class="credential-sync-ok" title="Sincronizado com o servidor">☁️ Ok</span>
                <span class="credential-meta">
                  Registrado em: {{ formatDate(cred.created_at) }}
                </span>
                <span v-if="cred.last_used_at" class="credential-meta">
                  Último uso: {{ formatDate(cred.last_used_at) }}
                </span>
                <span v-if="cred.counter > 0" class="credential-counter">
                  Usos: {{ cred.counter }}
                </span>
              </div>
              <div class="credential-actions">
                <button class="btn-remove-bio" @click="handleDeleteCredential(cred.id, cred.credential_id)" title="Remover credencial">
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div class="credential-actions-bar">
            <button
              class="btn-secondary btn-sm"
              :disabled="isBioWorking"
              @click="handleRegisterNewCredential"
            >
              {{ isBioWorking ? 'Registrando...' : '➕ Registrar Nova Credencial' }}
            </button>
          </div>
        </div>
      </div>

      <!-- OUTROS CONECTORES / CONTAS SALVAS -->
      <div class="settings-card glass-panel">
        <h3>Contas Autenticadas</h3>
        <p class="section-subtitle">Gerencie suas contas salvas neste dispositivo.</p>

        <div v-if="store.savedAccounts.length <= 1" class="empty-state">
          <p>Nenhuma outra conta cadastrada neste dispositivo.</p>
        </div>
        <ul v-else class="accounts-list">
          <li v-for="acc in store.savedAccounts" :key="acc.id" class="account-item">
            <div class="account-details">
              <span class="account-name text-bold">{{ acc.name }}</span>
              <span class="account-email">{{ acc.email }}</span>
            </div>
            <div class="account-actions">
              <button 
                v-if="acc.id !== store.currentUser?.id" 
                class="btn-switch-inline" 
                @click="handleSwitchAccount(acc.email)"
              >
                Entrar
              </button>
              <button 
                class="btn-remove-inline" 
                @click="store.removeFromSavedAccounts(acc.id)"
                title="Remover conta"
              >
                ✕
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- NOTIFICACOES -->
    <div class="grid-2" style="margin-top: 1.5rem;">
      <div class="settings-card glass-panel full-width-card">
        <h3>Notificacoes</h3>
        <p class="section-subtitle">Configure as notificacoes diarias no seu dispositivo Android para gerenciar suas financas.</p>

        <div class="settings-form">
          <div class="form-group toggle-group-row">
            <div class="toggle-text-container">
              <label>Notificacoes Diarias</label>
              <small class="help-text">Receba lembretes diarios e alertas sobre sua saude financeira.</small>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="notificationsEnabled" @change="handleNotificationsToggle" />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="rate-row" v-if="isAndroid">
            <div class="rate-info">
              <label>Horario do Lembrete Diario</label>
              <small class="help-text">Horario em que voce recebera a notificacao diaria.</small>
            </div>
            <div class="rate-input-group">
              <select v-model.number="notificationHour" @change="handleNotificationHourChange" class="rate-input hour-select">
                <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
              </select>
            </div>
          </div>

          <div v-if="isAndroid" class="bio-section" style="margin-top: 1rem;">
            <button class="btn-primary btn-block" @click="handleTestNotification" :disabled="isTestingNotification">
              {{ isTestingNotification ? 'Enviando...' : 'Enviar Notificacao de Teste' }}
            </button>
            <div v-if="testStatus" class="test-feedback" :class="testStatus.type">
              {{ testStatus.message }}
            </div>
          </div>

          <div v-if="!isAndroid" class="empty-state">
            <p>Notificacoes nativas disponiveis apenas no aplicativo Android.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useWalletStore } from '../stores/walletStore'
import { biometricService } from '../services/BiometricService'
import { notificationService } from '../services/NotificationService'

const store = useWalletStore()
const router = useRouter()

// Parâmetros básicos
const salary = ref(store.salary)
const taxRate = ref(store.expenseTaxRate)
// Taxas configuráveis (cópias locais para edição)
const consumptionRateLocal = ref(store.consumptionRate)
const investmentRateLocal = ref(store.investmentRate)
const investmentBonusRateLocal = ref(store.investmentBonusRate)
const penaltyRateLocal = ref(store.penaltyRate)

// Soma das taxas principais (sempre 100% com auto-balanceamento)
const totalAllocated = computed(() =>
  Number((consumptionRateLocal.value + investmentRateLocal.value).toFixed(4))
)

function onRateChange(changed) {
  if (changed === 'consumption') {
    const c = Number(consumptionRateLocal.value)
    if (isNaN(c)) return
    const clamped = Math.min(100, Math.max(0, c))
    consumptionRateLocal.value = Number(clamped.toFixed(2))
    investmentRateLocal.value = Number((100 - consumptionRateLocal.value).toFixed(2))
  } else {
    const i = Number(investmentRateLocal.value)
    if (isNaN(i)) return
    const clamped = Math.min(100, Math.max(0, i))
    investmentRateLocal.value = Number(clamped.toFixed(2))
    consumptionRateLocal.value = Number((100 - investmentRateLocal.value).toFixed(2))
  }
}

// Perfil
const profileName = ref('')
const profilePhoto = ref('')

// Segurança
const newPassword = ref('')
const confirmPassword = ref('')

// Credenciais biométricas registradas
const registeredCredentials = ref([])

// Feedbacks
const errorMsg = ref('')
const successMsg = ref('')
const isSavingFinancial = ref(false)
const isSavingProfile = ref(false)
const isSavingSecurity = ref(false)
const isBioWorking = ref(false)

const isAndroid = Capacitor.getPlatform() === 'android'
const notificationsEnabled = ref(true)
const notificationHour = ref(9)
const isTestingNotification = ref(false)
const testStatus = ref(null)

onMounted(async () => {
  if (isAndroid) {
    notificationsEnabled.value = notificationService.enabled
    notificationHour.value = notificationService.notificationHour
  }
})

async function handleNotificationsToggle() {
  notificationService.enabled = notificationsEnabled.value
  if (notificationsEnabled.value) {
    await notificationService.scheduleDailyNotification()
  } else {
    await notificationService.cancelAll()
  }
}

async function handleNotificationHourChange() {
  notificationService.notificationHour = notificationHour.value
  await notificationService.reschedule()
}

async function handleTestNotification() {
  isTestingNotification.value = true
  testStatus.value = null
  try {
    const result = await notificationService.sendTestNotification()
    if (result?.success) {
      testStatus.value = { type: 'success', message: 'Notificacao enviada! Verifique a central.' }
    } else {
      testStatus.value = { type: 'error', message: result?.error || 'Falha ao enviar.' }
    }
  } catch (err) {
    testStatus.value = { type: 'error', message: 'Erro: ' + (err?.message || err || 'desconhecido') }
  }
  isTestingNotification.value = false
  setTimeout(() => { testStatus.value = null }, 8000)
}

const formatCurrency = (val) =>
  Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

onMounted(async () => {
  await store.loadFromLocalStorage()
  salary.value = store.salary
  taxRate.value = store.expenseTaxRate
  consumptionRateLocal.value = store.consumptionRate
  investmentRateLocal.value = store.investmentRate
  investmentBonusRateLocal.value = store.investmentBonusRate
  penaltyRateLocal.value = store.penaltyRate

  if (store.currentUser) {
    profileName.value = store.currentUser.name || ''
    profilePhoto.value = store.profilePhotoUrl || ''
    await loadRegisteredCredentials()
  }
})

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const loadRegisteredCredentials = async () => {
  if (!store.currentUser?.id) return
  registeredCredentials.value = await biometricService.listCredentials(store.currentUser.id)
  store.isBiometricEnabled = registeredCredentials.value.some(c => !c.revoked)
}

const handlePhotoError = () => {
  console.warn('Erro ao renderizar imagem do link informado.')
}

const saveFinancialSettings = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isSavingFinancial.value = true

  try {
    store.salary = Number(salary.value)
    store.expenseTaxRate = Number(taxRate.value)
    store.consumptionRate = Number(consumptionRateLocal.value)
    store.investmentRate = Number(investmentRateLocal.value)
    store.investmentBonusRate = Number(investmentBonusRateLocal.value)
    store.penaltyRate = Number(penaltyRateLocal.value)
    await store.saveToLocalStorage()

    successMsg.value = 'Parâmetros da carteira salvos com sucesso!'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch (err) {
    errorMsg.value = 'Erro ao salvar parâmetros financeiros.'
  } finally {
    isSavingFinancial.value = false
  }
}

const saveProfileSettings = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isSavingProfile.value = true

  try {
    const nameSuccess = await store.updateUserName(profileName.value)
    // Só salva a foto se o campo não estiver vazio, ou se foi explicitamente limpo
    if (profilePhoto.value || profilePhoto.value !== store.profilePhotoUrl) {
      await store.updateProfilePhoto(profilePhoto.value)
    }

    if (nameSuccess) {
      successMsg.value = 'Perfil atualizado com sucesso!'
      setTimeout(() => { successMsg.value = '' }, 3000)
    } else {
      errorMsg.value = 'Erro ao atualizar nome do perfil.'
    }
  } catch (err) {
    errorMsg.value = 'Erro ao salvar alterações do perfil.'
  } finally {
    isSavingProfile.value = false
  }
}

const saveSecuritySettings = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (newPassword.value.length < 6) {
    errorMsg.value = 'A nova senha deve possuir ao menos 6 caracteres.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = 'As senhas informadas não coincidem.'
    return
  }

  isSavingSecurity.value = true
  try {
    const res = await store.updatePassword(newPassword.value, '')
    if (res.success) {
      successMsg.value = 'Senha atualizada com sucesso!'
      newPassword.value = ''
      confirmPassword.value = ''
      setTimeout(() => { successMsg.value = '' }, 3000)
    } else {
      errorMsg.value = res.message || 'Erro ao redefinir senha.'
    }
  } catch (err) {
    errorMsg.value = 'Erro ao redefinir senha.'
  } finally {
    isSavingSecurity.value = false
  }
}

const handleSwitchAccount = async (email) => {
  const ok = await store.switchAccount(email)
  if (!ok) {
    router.push({ name: 'login', query: { email } })
  }
}

const handleEnrollBiometric = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isBioWorking.value = true
  try {
    const result = await store.enrollBiometric()
    if (result.success) {
      successMsg.value = result.message
      await loadRegisteredCredentials()
    } else {
      errorMsg.value = result.message
    }
  } catch (err) {
    errorMsg.value = err?.message || 'Erro inesperado.'
  }
  isBioWorking.value = false
  setTimeout(() => { errorMsg.value = ''; successMsg.value = '' }, 4000)
}

const handleRemoveBiometric = async () => {
  await store.removeBiometric()
  successMsg.value = 'Biometria removida.'
  registeredCredentials.value = []
  setTimeout(() => { successMsg.value = '' }, 3000)
}

const handleDeleteCredential = async (id, credentialId) => {
  errorMsg.value = ''
  successMsg.value = ''
  const result = await biometricService.deleteCredential(id, credentialId)
  await loadRegisteredCredentials()
  if (result.success) {
    successMsg.value = 'Credencial removida.'
  } else {
    errorMsg.value = result.message
  }
  setTimeout(() => { errorMsg.value = ''; successMsg.value = '' }, 3000)
}

const handleRegisterNewCredential = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isBioWorking.value = true
  try {
    const result = await store.enrollBiometric()
    if (result.success) {
      successMsg.value = 'Nova credencial registrada!'
      await loadRegisteredCredentials()
    } else {
      errorMsg.value = result.message
    }
  } catch (err) {
    errorMsg.value = err?.message || 'Erro inesperado.'
  }
  isBioWorking.value = false
  setTimeout(() => { errorMsg.value = ''; successMsg.value = '' }, 4000)
}

</script>

<style scoped>
.settings-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.header-section {
  text-align: left;
}

.header-section h2 {
  font-size: 1.6rem;
  margin-bottom: 0.25rem;
}

.settings-card {
  text-align: left;
}

.section-subtitle {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
}

.input-prefix-group {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.65rem 0.85rem;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.input-field-inline {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: bold;
  width: 100%;
  outline: none;
}

.prefix {
  margin-right: 0.5rem;
  color: var(--text-secondary);
  font-weight: bold;
}

.suffix {
  margin-left: 0.5rem;
  color: var(--text-secondary);
  font-weight: bold;
}

.help-text {
  display: block;
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 0.35rem;
}

.golden-rule-notice {
  font-size: 0.8rem;
  color: var(--accent-color);
  background: #fdfcf7;
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--accent-color);
  padding: 0.6rem 0.85rem;
  border-radius: 2px;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.toggle-group-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border-color);
  background: #ffffff;
  padding: 1rem;
  border-radius: 3px;
  margin-bottom: 1.25rem;
}

.toggle-text-container {
  display: flex;
  flex-direction: column;
}

.toggle-text-container label {
  margin-bottom: 0 !important;
}

/* Switch Styles */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #cdc7b1;
  transition: .4s;
  border-radius: 24px;
  border: 1px solid var(--border-color);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
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
  transform: translateX(22px);
  background-color: #ffffff;
}

/* Photo preview */
.photo-preview-box {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  border: 1px dashed var(--border-color);
  padding: 0.75rem;
  background: #fdfcf7;
  border-radius: 3px;
}

.photo-preview-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent-color);
}

/* Saved Accounts */
.accounts-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  background: #ffffff;
  border-radius: 3px;
  position: relative;
}

.account-item::before {
  content: '';
  position: absolute;
  top: 2px; left: 2px; right: 2px; bottom: 2px;
  border: 1px solid rgba(138, 111, 62, 0.1);
  border-radius: 1px;
  pointer-events: none;
}

.account-details {
  display: flex;
  flex-direction: column;
}

.account-name {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.account-email {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.account-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-switch-inline {
  background: var(--text-primary);
  color: #fff;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 2px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-switch-inline:hover {
  background: var(--accent-color);
}

.btn-remove-inline {
  background: transparent;
  border: 1px solid var(--danger-color);
  color: var(--danger-color);
  width: 24px;
  height: 24px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove-inline:hover {
  background: var(--danger-color);
  color: #fff;
}

.section-divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1.5rem 0;
}

.bio-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bio-label {
  font-size: 0.88rem;
  font-weight: bold;
  color: var(--text-primary);
}

.bio-enrolled {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid var(--border-color);
  background: #ffffff;
  padding: 0.75rem 1rem;
  border-radius: 3px;
}

.bio-success {
  font-size: 0.85rem;
  color: var(--success-color);
  font-weight: bold;
}

.btn-remove-bio {
  background: transparent;
  border: 1px solid var(--danger-color);
  color: var(--danger-color);
  padding: 0.35rem 0.75rem;
  border-radius: 2px;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove-bio:hover {
  background: var(--danger-color);
  color: #fff;
}

.empty-state {
  padding: 1rem;
  background: #fdfcf7;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.credentials-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.credential-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  background: #ffffff;
  border-radius: 3px;
  position: relative;
}

.credential-item::before {
  content: '';
  position: absolute;
  top: 2px; left: 2px; right: 2px; bottom: 2px;
  border: 1px solid rgba(138, 111, 62, 0.1);
  border-radius: 1px;
  pointer-events: none;
}

.credential-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.credential-device {
  font-size: 0.88rem;
  font-weight: bold;
  color: var(--text-primary);
}

.credential-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.credential-counter {
  font-size: 0.72rem;
  color: var(--accent-color);
  font-weight: bold;
}

.credential-sync-ok {
  font-size: 0.72rem;
  color: #2e7d32;
  margin-left: 0.25rem;
}

.credential-sync-warn {
  font-size: 0.72rem;
  color: #e65100;
  margin-left: 0.25rem;
}

.credential-actions-bar {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.82rem;
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

/* Full-width card for Parâmetros da Carteira */
.full-width-card {
  grid-column: 1 / -1;
}

/* Salary distribution visual bar */
.distribution-bar-container {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #fdfcf7;
  border: 1px solid var(--border-color);
  border-radius: 3px;
}

.distribution-bar-track {
  display: flex;
  height: 28px;
  border-radius: 3px;
  overflow: hidden;
  background: #e8e3d7;
  border: 1px solid var(--border-color);
  margin-bottom: 0.75rem;
}

.dist-bar-segment {
  height: 100%;
  transition: width 0.4s ease;
  min-width: 1px;
}

.seg-consumption { background: var(--text-primary); }
.seg-investment  { background: var(--accent-color); }
.seg-fund        { background: var(--success-color); }
.seg-remainder   { background: #cdc7b1; }

.distribution-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.78rem;
  font-weight: bold;
  color: var(--text-primary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dot-consumption { background: var(--text-primary); }
.dot-investment  { background: var(--accent-color); }
.dot-fund        { background: var(--success-color); }
.dot-remainder   { background: #cdc7b1; }

.allocation-warning {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fdf2f2;
  border: 1px solid #f8b4b4;
  color: var(--danger-color);
  border-radius: 3px;
  font-size: 0.82rem;
  font-weight: bold;
}

/* Rate section title divider */
.rate-section-title {
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.4rem;
  margin: 1.25rem 0 0.75rem;
}

/* Rate row layout */
.rate-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(205, 199, 177, 0.4);
}

.rate-row:last-of-type {
  border-bottom: none;
}

.rate-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.rate-info label {
  font-size: 0.88rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.15rem;
}

.rate-input-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.4rem 0.6rem;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);
}

.rate-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: bold;
  width: 60px;
  text-align: right;
  outline: none;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.rate-input::-webkit-outer-spin-button,
.rate-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.rate-suffix {
  font-weight: bold;
  color: var(--accent-color);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.rate-rs-value {
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
  margin-left: 0.25rem;
  border-left: 1px solid var(--border-color);
  padding-left: 0.5rem;
}

.hour-select {
  width: auto;
  min-width: 80px;
  text-align: center;
  cursor: pointer;
  font-family: "Times New Roman", Times, Georgia, serif;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238a6f3e'/%3E%3C/svg%3E") no-repeat right center;
  padding-right: 1.2rem;
}

.test-feedback {
  margin-top: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 3px;
  font-size: 0.85rem;
  font-weight: bold;
  text-align: center;
  line-height: 1.3;
}

.test-feedback.success {
  background: #f3faf5;
  color: var(--success-color);
  border: 1px solid #def7ec;
}

.test-feedback.error {
  background: #fdf2f2;
  color: var(--danger-color);
  border: 1px solid #f8b4b4;
}

@media (max-width: 600px) {
  .rate-row { flex-direction: column; gap: 0.5rem; }
  .rate-input-group { width: 100%; }
  .rate-input { width: 100%; text-align: left; }
  .rate-rs-value { border-left: none; padding-left: 0; margin-left: 0; }
  .credential-actions-bar {
    flex-wrap: wrap;
  }
  .credential-actions-bar .btn-sm {
    flex: 1 1 100%;
  }
  .credential-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .bio-enrolled {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
