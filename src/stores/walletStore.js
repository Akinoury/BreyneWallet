import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { biometricService } from '../services/BiometricService'

// Hash SHA-256 no cliente para garantir que a senha nunca chegue pura no armazenamento local.
async function hashSHA256(str) {
  if (!str) return ''
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const useWalletStore = defineStore('wallet', () => {
  // --- STATE ---
  const salary = ref(1420.00)
  const useManualLimit = ref(true)
  const expenseTaxRate = ref(20)
  const emergencyFund = ref(250.00)
  const isSyncing = ref(false)
  const profilePhotoUrl = ref('')
  // Taxa de câmbio dólar comercial — atualizada pelo InvestmentsView via BCB AwesomeAPI
  const usdToBrl = ref(5.70)

  // Aporte mensal adicional para simulador (persistido)
  const monthlyContribution = ref(0)

  // --- TAXAS CONFIGURÁVEIS (% sobre o salário X) ---
  const consumptionRate = ref(59.01)   // % do salário para limite de consumo
  const fundReturnRate = ref(0.00)     // % do salário destinado ao fundo de emergência (removido)
  const investmentRate = ref(40.99)    // % do salário para investimentos
  const investmentBonusRate = ref(5.00) // % sobre o valor investido como bônus
  const penaltyRate = ref(50.00)       // % de penalidade sobre o excedente

  // Multi-account: contas salvas para troca rápida
  const savedAccounts = ref(JSON.parse(localStorage.getItem('breyne_saved_accounts') || '[]'))

  const investments = ref([
    { id: 1, name: 'WEGE3', amount: 1500.00, type: 'national', category: 'Ações' },
    { id: 2, name: 'MXRF11', amount: 800.00, type: 'national', category: 'FIIs' },
    { id: 3, name: 'Tesouro Selic', amount: 3000.00, type: 'national', category: 'Renda Fixa' },
    { id: 4, name: 'AAPL (Apple)', amount: 2500.00, type: 'international', category: 'Stocks' },
    { id: 5, name: 'O (Realty Income)', amount: 1200.00, type: 'international', category: 'REITs' },
    { id: 6, name: 'BTC (Bitcoin)', amount: 950.00, type: 'international', category: 'Crypto' }
  ])

  const transactions = ref([
    {
      id: 1,
      description: 'Compras Mensais Supermercado',
      amount: 400.00,
      type: 'expense',
      expenseType: 'compra',
      category: 'Alimentação',
      date: new Date().toISOString()
    },
    {
      id: 2,
      description: 'Parcelamento Fatura Cartão',
      amount: 276.39,
      type: 'expense',
      expenseType: 'passivo',
      category: 'Finanças',
      date: new Date(Date.now() - 86400000).toISOString()
    }
  ])

  const currentUser = ref(null)
  const isBiometricEnabled = ref(false)

  // --- COMPUTED (Regras de Negócio do Fechamento Financeiro) ---

  const limitConsumption = computed(() => {
    const rate = Number(consumptionRate.value) || 0
    const sal = Number(salary.value) || 0
    return Number((sal * (rate / 100)).toFixed(2))
  })

  // % do salário é destinado ao retorno para o fundo de emergência
  const fundReturnValue = computed(() => {
    const rate = Number(fundReturnRate.value) || 0
    const sal = Number(salary.value) || 0
    return Number((sal * (rate / 100)).toFixed(2))
  })

  const investedValue = computed(() => {
    const rate = Number(investmentRate.value) || 0
    const sal = Number(salary.value) || 0
    return Number((sal * (rate / 100)).toFixed(2))
  })

  const investmentBonus = computed(() => {
    const rate = Number(investmentBonusRate.value) || 0
    const inv = Number(investedValue.value) || 0
    return Number((inv * (rate / 100)).toFixed(2))
  })

  const totalCompras = computed(() =>
    transactions.value
      .filter(t => t.type === 'expense' && t.expenseType === 'compra')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  )

  const totalPassivos = computed(() =>
    transactions.value
      .filter(t => t.type === 'expense' && t.expenseType === 'passivo')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  )

  const gastosCorrentes = computed(() => {
    const comp = Number(totalCompras.value) || 0
    const pass = Number(totalPassivos.value) || 0
    return Number((comp + pass).toFixed(2))
  })

  const consumoAtual = computed(() => {
    const gast = Number(gastosCorrentes.value) || 0
    const bon = Number(investmentBonus.value) || 0
    return Number((gast + bon).toFixed(2))
  })

  const currentInterest = computed(() => {
    const rate = Number(expenseTaxRate.value) || 0
    const gast = Number(gastosCorrentes.value) || 0
    return Number((gast * (rate / 100)).toFixed(2))
  })

  const exceededValue = computed(() => {
    const cons = Number(consumoAtual.value) || 0
    const juros = Number(currentInterest.value) || 0
    const lim = Number(limitConsumption.value) || 0
    const baseReturn = Number((cons + juros).toFixed(2))
    if (baseReturn > lim) {
      return Number((baseReturn - lim).toFixed(2))
    }
    return 0.00
  })

  const penaltyValue = computed(() => {
    const rate = Number(penaltyRate.value) || 0
    const exc = Number(exceededValue.value) || 0
    return Number((exc * (rate / 100)).toFixed(2))
  })

  // Quanto sobra, de fato, para investir após descontar excedente e penalidade
  const availableToInvest = computed(() => {
    const inv = Number(investedValue.value) || 0
    const exc = Number(exceededValue.value) || 0
    const pen = Number(penaltyValue.value) || 0
    const lim = Number(limitConsumption.value) || 0
    const ret = Number(totalReturn.value) || 0
    const leftover = Math.max(0, lim - ret)
    return Number(Math.max(0, inv - exc - pen + leftover).toFixed(2))
  })

  const totalReturn = computed(() => {
    const cons = Number(consumoAtual.value) || 0
    const juros = Number(currentInterest.value) || 0
    const exc = Number(exceededValue.value) || 0
    const pen = Number(penaltyValue.value) || 0
    return Number((cons + juros + exc + pen).toFixed(2))
  })

  const nationalInvestmentsTotal = computed(() =>
    investments.value.filter(i => i.type === 'national').reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  )

  // internationalInvestmentsTotal: soma em USD (os ativos internacionais são armazenados em USD)
  const internationalInvestmentsTotal = computed(() =>
    investments.value.filter(i => i.type === 'international').reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  )

  // Valor em BRL dos investimentos internacionais (convertido pelo câmbio atual)
  const internationalInvestmentsTotalBrl = computed(() =>
    Number((internationalInvestmentsTotal.value * (Number(usdToBrl.value) || 5.70)).toFixed(2))
  )

  const totalInvestments = computed(() => {
    const gross = nationalInvestmentsTotal.value + internationalInvestmentsTotalBrl.value
    const penalty = exceededValue.value + penaltyValue.value
    return Number(Math.max(0, gross - penalty).toFixed(2))
  })

  // --- PERSISTÊNCIA LOCAL ---

  // Monta o objeto da carteira para salvar
  function buildWalletPayload() {
    return {
      salary: salary.value,
      useManualLimit: useManualLimit.value,
      expenseTaxRate: expenseTaxRate.value,
      emergencyFund: emergencyFund.value,
      investments: investments.value,
      transactions: transactions.value,
      profilePhotoUrl: profilePhotoUrl.value,
      consumptionRate: consumptionRate.value,
      fundReturnRate: fundReturnRate.value,
      investmentRate: investmentRate.value,
      investmentBonusRate: investmentBonusRate.value,
      penaltyRate: penaltyRate.value,
      monthlyContribution: monthlyContribution.value
    }
  }

  // Aplica os dados persistidos localmente no estado reativo
  function applyWalletData(w) {
    if (!w) return
    salary.value = w.salary ?? salary.value
    useManualLimit.value = w.useManualLimit ?? useManualLimit.value
    expenseTaxRate.value = w.expenseTaxRate ?? expenseTaxRate.value
    emergencyFund.value = w.emergencyFund ?? emergencyFund.value
    // Proteção: só substitui arrays se tiverem conteúdo ou se os atuais estiverem vazios
    if (w.investments?.length > 0 || !investments.value?.length) {
      investments.value = w.investments ?? investments.value
    }
    if (w.transactions?.length > 0 || !transactions.value?.length) {
      transactions.value = w.transactions ?? transactions.value
    }
    profilePhotoUrl.value = w.profilePhotoUrl ?? profilePhotoUrl.value
    consumptionRate.value = w.consumptionRate ?? consumptionRate.value
    fundReturnRate.value = w.fundReturnRate ?? fundReturnRate.value
    investmentRate.value = w.investmentRate ?? investmentRate.value
    investmentBonusRate.value = w.investmentBonusRate ?? investmentBonusRate.value
    penaltyRate.value = w.penaltyRate ?? penaltyRate.value
    monthlyContribution.value = w.monthlyContribution ?? monthlyContribution.value
  }

  async function saveWalletState() {
    const payload = buildWalletPayload()
    payload._cachedAt = Date.now()
    localStorage.setItem('breyne_wallet_cache', JSON.stringify(payload))
    localStorage.setItem('breyne_wallet_cache_backup', JSON.stringify(payload))
    isSyncing.value = false
  }

  async function loadWalletState() {
    const cachedRaw = localStorage.getItem('breyne_wallet_cache')
    let cached = null
    if (cachedRaw) {
      try { cached = JSON.parse(cachedRaw) } catch (_) {}
    }

    if (cached) {
      applyWalletData(cached)
      return true
    }

    return false
  }

  async function saveToLocalStorage() {
    await saveWalletState()
  }

  async function loadFromLocalStorage() {
    if (currentUser.value) return

    const explicitUser = localStorage.getItem('breyne_user')
    if (explicitUser) {
      try {
        const parsed = JSON.parse(explicitUser)
        if (parsed && parsed.id) {
          currentUser.value = parsed
          isBiometricEnabled.value = localStorage.getItem('breyne_bio_enabled') === 'true'
          const cached = localStorage.getItem('breyne_wallet_cache')
          if (cached) {
            await loadWalletState()
          }
        }
      } catch (_) {
        currentUser.value = null
        localStorage.removeItem('breyne_user')
      }
    } else {
      currentUser.value = null
    }
  }

  // --- ACTIONS DE DADOS ---

  async function addTransaction(description, amount, expenseType, category) {
    if (amount <= 0 || isNaN(amount)) return false

    transactions.value.unshift({
      id: Date.now(),
      description,
      amount: Number(amount),
      type: 'expense',
      expenseType,
      category,
      date: new Date().toISOString()
    })

    await saveToLocalStorage()
    return true
  }

  async function deleteTransaction(id) {
    transactions.value = transactions.value.filter(t => t.id !== id)
    await saveToLocalStorage()
  }

  async function addInvestment(name, amount, type, category) {
    if (amount <= 0 || isNaN(amount) || !name) return false

    investments.value.push({
      id: Date.now(),
      name,
      amount: Number(amount),
      type,
      category
    })

    await saveToLocalStorage()
    return true
  }

  async function deleteInvestment(id) {
    investments.value = investments.value.filter(i => i.id !== id)
    await saveToLocalStorage()
  }

  async function adjustEmergencyFund(amount, isDeposit) {
    const val = Number(amount)
    if (val <= 0 || isNaN(val)) return false

    if (isDeposit) {
      emergencyFund.value += val
      transactions.value.unshift({
        id: Date.now(),
        description: 'Aporte no Fundo de Emergência',
        amount: val,
        type: 'fund_deposit',
        expenseType: 'compra',
        category: 'Reserva',
        date: new Date().toISOString()
      })
    } else {
      if (emergencyFund.value < val) return false
      emergencyFund.value -= val
      transactions.value.unshift({
        id: Date.now(),
        description: 'Resgate do Fundo de Emergência',
        amount: val,
        type: 'fund_withdraw',
        expenseType: 'compra',
        category: 'Reserva',
        date: new Date().toISOString()
      })
    }

    await saveToLocalStorage()
    return true
  }

  async function simulateInterest(annualRate = 10.75) {
    const rate = Number(annualRate) || 10.75
    const monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1
    const interest = Number((emergencyFund.value * monthlyRate).toFixed(2))
    if (interest > 0) {
      emergencyFund.value = Number((emergencyFund.value + interest).toFixed(2))
      transactions.value.unshift({
        id: Date.now(),
        description: `Rendimento Selic Fundo (${(monthlyRate * 100).toFixed(3)}%)`,
        amount: interest,
        type: 'fund_interest',
        expenseType: 'compra',
        category: 'Rendimentos',
        date: new Date().toISOString()
      })
      await saveToLocalStorage()
    }
  }

  // --- AUTENTICAÇÃO ---

  async function registerMockUser(name, email, password, enableBio) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Por favor, insira um e-mail real válido (exemplo@dominio.com).')
    }

    const hashedPassword = await hashSHA256(password)
    const userId = `local-${Date.now()}`

    currentUser.value = {
      id: userId,
      name: name || email.split('@')[0],
      email
    }

    localStorage.setItem('breyne_user', JSON.stringify(currentUser.value))
    addToSavedAccounts(currentUser.value)
    localStorage.setItem('breyne_session_tokens', JSON.stringify({ refresh_token: hashedPassword, access_token: hashedPassword }))
    localStorage.setItem('breyne_bio_enabled', enableBio ? 'true' : 'false')
    isBiometricEnabled.value = enableBio

    await saveToLocalStorage()
    await loadWalletState()

    return { success: true, autoSignedIn: true, user: currentUser.value }
  }

  async function loginMockUser(email, password) {
    const savedUsersRaw = localStorage.getItem('breyne_saved_accounts') || '[]'
    const savedUsers = JSON.parse(savedUsersRaw)
    const matchingAccount = savedUsers.find(account => account.email === email)

    if (!matchingAccount) {
      return { success: false, message: 'E-mail ou senha incorretos.' }
    }

    const hashedPassword = await hashSHA256(password)
    const expectedHash = localStorage.getItem(`breyne_password_${matchingAccount.id}`)

    if (expectedHash !== hashedPassword) {
      return { success: false, message: 'E-mail ou senha incorretos.' }
    }

    currentUser.value = {
      id: matchingAccount.id,
      name: matchingAccount.name || email.split('@')[0],
      email
    }
    localStorage.setItem('breyne_user', JSON.stringify(currentUser.value))
    addToSavedAccounts(currentUser.value)
    localStorage.setItem('breyne_session_tokens', JSON.stringify({ refresh_token: hashedPassword, access_token: hashedPassword }))

    await loadWalletState()
    isBiometricEnabled.value = await biometricService.hasCredential(currentUser.value.id)
    return { success: true }
  }

  async function resetPasswordMock(email) {
    return false
  }

  async function logoutMock() {
    currentUser.value = null
    localStorage.removeItem('breyne_user')
    localStorage.removeItem('breyne_session_tokens')
    localStorage.removeItem('breyne_bio_tokens')
    localStorage.removeItem('breyne_bio_enabled')
  }

  // --- MULTI-ACCOUNT ---

  function addToSavedAccounts(user) {
    if (!user || !user.id) return
    const exists = savedAccounts.value.find(a => a.id === user.id)
    if (!exists) {
      savedAccounts.value.push({ id: user.id, name: user.name, email: user.email })
      localStorage.setItem('breyne_saved_accounts', JSON.stringify(savedAccounts.value))
    }
  }

  function removeFromSavedAccounts(accountId) {
    savedAccounts.value = savedAccounts.value.filter(a => a.id !== accountId)
    localStorage.setItem('breyne_saved_accounts', JSON.stringify(savedAccounts.value))
  }

  async function switchAccount(accountEmail) {
    currentUser.value = null
    localStorage.removeItem('breyne_user')
    return accountEmail
  }

  // --- CONFIGURAÇÕES ---

  async function updateUserName(newName) {
    if (!newName || !currentUser.value) return false
    currentUser.value.name = newName
    localStorage.setItem('breyne_user', JSON.stringify(currentUser.value))
    const acct = savedAccounts.value.find(a => a.id === currentUser.value.id)
    if (acct) {
      acct.name = newName
      localStorage.setItem('breyne_saved_accounts', JSON.stringify(savedAccounts.value))
    }
    return true
  }

  async function updatePassword(newPassword) {
    if (!newPassword) return { success: false, message: 'Senha não pode ser vazia.' }
    const hashedPassword = await hashSHA256(newPassword)
    localStorage.setItem(`breyne_password_${currentUser.value.id}`, hashedPassword)
    if (isBiometricEnabled.value) {
      await removeBiometric()
    }
    return { success: true }
  }

  async function updateProfilePhoto(url) {
    profilePhotoUrl.value = url || ''
    await saveToLocalStorage()
  }

  // --- BIOMETRIA (delegada ao BiometricService) ---

  async function enrollBiometric() {
    if (!currentUser.value || !currentUser.value.id) {
      return { success: false, message: 'Faça login antes de cadastrar a biometria.' }
    }
    const result = await biometricService.register(
      currentUser.value.id,
      currentUser.value.email,
      currentUser.value.name
    )
    if (result.success) {
      isBiometricEnabled.value = true
    }
    return result
  }

  async function removeBiometric() {
    const uid = currentUser.value?.id
    try {
      const credentials = await biometricService.listCredentials(uid)
      for (const cred of credentials) {
        if (!cred.revoked) {
          await biometricService.deleteCredential(cred.id, cred.credential_id)
        }
      }
    } catch (_) {}
    isBiometricEnabled.value = false
    return { success: true, message: 'Biometria removida.' }
  }

  return {
    salary,
    useManualLimit,
    expenseTaxRate,
    emergencyFund,
    investments,
    transactions,
    currentUser,
    isBiometricEnabled,
    usdToBrl,
    isSyncing,
    profilePhotoUrl,
    savedAccounts,
    monthlyContribution,

    // Taxas configuráveis
    consumptionRate,
    fundReturnRate,
    investmentRate,
    investmentBonusRate,
    penaltyRate,

    // Computeds
    limitConsumption,
    fundReturnValue,
    investedValue,
    investmentBonus,
    totalCompras,
    totalPassivos,
    gastosCorrentes,
    consumoAtual,
    exceededValue,
    penaltyValue,
    currentInterest,
    totalReturn,
    availableToInvest,
    nationalInvestmentsTotal,
    internationalInvestmentsTotal,
    internationalInvestmentsTotalBrl,
    totalInvestments,

    // Actions
    addTransaction,
    deleteTransaction,
    addInvestment,
    deleteInvestment,
    adjustEmergencyFund,
    simulateInterest,
    saveToLocalStorage,
    loadFromLocalStorage,

    // Auth
    registerMockUser,
    loginMockUser,
    resetPasswordMock,
    logoutMock,

    // Multi-account
    addToSavedAccounts,
    removeFromSavedAccounts,
    switchAccount,

    // Configurações
    updateUserName,
    updatePassword,
    updateProfilePhoto,

    // Biometria
    enrollBiometric,
    removeBiometric
  }
})
