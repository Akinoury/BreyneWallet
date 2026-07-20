import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import { biometricService } from '../services/BiometricService'
import { notificationService } from '../services/NotificationService'

export const useWalletStore = defineStore('wallet', () => {
  const salary = ref(1420.00)
  const useManualLimit = ref(true)
  const expenseTaxRate = ref(15)
  const emergencyFund = ref(250.00)
  const isSyncing = ref(false)
  const profilePhotoUrl = ref('')
  const usdToBrl = ref(5.70)
  const monthlyContribution = ref(0)

  const consumptionRate = ref(70)
  const fundReturnRate = ref(0.00)
  const investmentRate = ref(30)
  const investmentBonusRate = ref(5.00)
  const penaltyRate = ref(30)

  const savedAccounts = ref([])

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
      category: 'Contas',
      date: new Date(Date.now() - 86400000).toISOString()
    }
  ])

  const currentUser = ref(null)
  const isBiometricEnabled = ref(false)

  const limitConsumption = computed(() => {
    const rate = Number(consumptionRate.value) || 0
    const sal = Number(salary.value) || 0
    return Number((sal * (rate / 100)).toFixed(2))
  })

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

  const internationalInvestmentsTotal = computed(() =>
    investments.value.filter(i => i.type === 'international').reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  )

  const internationalInvestmentsTotalBrl = computed(() =>
    Number((internationalInvestmentsTotal.value * (Number(usdToBrl.value) || 5.70)).toFixed(2))
  )

  const totalInvestments = computed(() => {
    const gross = nationalInvestmentsTotal.value + internationalInvestmentsTotalBrl.value
    const penalty = exceededValue.value + penaltyValue.value
    return Number(Math.max(0, gross - penalty).toFixed(2))
  })

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

  function applyWalletData(w) {
    if (!w) return
    salary.value = w.salary ?? salary.value
    useManualLimit.value = w.useManualLimit ?? useManualLimit.value
    expenseTaxRate.value = w.expenseTaxRate ?? expenseTaxRate.value
    emergencyFund.value = w.emergencyFund ?? emergencyFund.value
    if (w.investments !== undefined) {
      investments.value = w.investments ?? investments.value
    }
    if (w.transactions !== undefined) {
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
    if (!currentUser.value) return
    isSyncing.value = true
    try {
      const payload = buildWalletPayload()
      payload._cachedAt = Date.now()
      await api.saveWallet(payload)
    } catch (e) {
      console.warn('Save to server failed:', e)
    }
    isSyncing.value = false
  }

  async function loadWalletState() {
    if (!currentUser.value) return false
    try {
      const result = await api.loadWallet()
      if (result.data) {
        applyWalletData(result.data)
        return true
      }
    } catch (e) {
      console.warn('Load from server failed:', e)
    }
    return false
  }

  async function saveToLocalStorage() {
    await saveWalletState()
  }

  async function loadFromLocalStorage() {
    if (currentUser.value) return
    const token = api.getToken()
    if (!token) return

    try {
      const result = await api.me()
      if (result.user) {
        currentUser.value = result.user
        isBiometricEnabled.value = await biometricService.hasCredential(result.user.id)
        await loadWalletState()
      }
    } catch {
      api.logout()
      currentUser.value = null
    }
  }

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

    await saveWalletState()
    notificationService.checkAndNotify({
      exceededValue: exceededValue.value,
      limitConsumption: limitConsumption.value,
      consumoAtual: consumoAtual.value
    })
    return true
  }

  async function deleteTransaction(id) {
    transactions.value = transactions.value.filter(t => t.id !== id)
    await saveWalletState()
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

    await saveWalletState()
    return true
  }

  async function deleteInvestment(id) {
    investments.value = investments.value.filter(i => i.id !== id)
    await saveWalletState()
  }

  async function updateInvestment(id, updates) {
    const idx = investments.value.findIndex(i => i.id === id)
    if (idx === -1) return false
    investments.value[idx] = { ...investments.value[idx], ...updates }
    await saveWalletState()
    return true
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

    await saveWalletState()
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
      await saveWalletState()
    }
  }

  async function registerUser(name, email, password, enableBio) {
    const result = await api.register(name, email, password)
    if (result.success) {
      currentUser.value = result.user
      isBiometricEnabled.value = enableBio
      try { localStorage.setItem('breyne_bio_enabled', enableBio ? 'true' : 'false') } catch {}
      await saveWalletState()
    }
    return { success: result.success, autoSignedIn: true, user: result.user }
  }

  async function loginUser(email, password) {
    const result = await api.login(email, password)
    if (result.success) {
      currentUser.value = result.user
      isBiometricEnabled.value = await biometricService.hasCredential(result.user.id)
      await loadWalletState()
    }
    return result
  }

  async function forgotPassword(email) {
    return await api.forgotPassword(email)
  }

  async function logoutUser() {
    currentUser.value = null
    isBiometricEnabled.value = false
    api.logout()
    try {
      localStorage.removeItem('breyne_user')
      localStorage.removeItem('breyne_bio_enabled')
    } catch {}
  }

  function addToSavedAccounts(user) {
    if (!user || !user.id) return
    const exists = savedAccounts.value.find(a => a.id === user.id)
    if (!exists) {
      savedAccounts.value.push({ id: user.id, name: user.name, email: user.email })
    }
  }

  function removeFromSavedAccounts(accountId) {
    savedAccounts.value = savedAccounts.value.filter(a => a.id !== accountId)
  }

  async function switchAccount(accountEmail) {
    currentUser.value = null
    api.logout()
    return accountEmail
  }

  async function updateUserName(newName) {
    if (!newName || !currentUser.value) return false
    try {
      const result = await api.updateProfile(newName)
      if (result.success) {
        currentUser.value.name = newName
        return true
      }
    } catch {}
    return false
  }

  async function updatePassword(newPassword, currentPassword) {
    try {
      return await api.updatePassword(currentPassword || '', newPassword)
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  async function updateProfilePhoto(url) {
    profilePhotoUrl.value = url || ''
    await saveWalletState()
  }

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

    consumptionRate,
    fundReturnRate,
    investmentRate,
    investmentBonusRate,
    penaltyRate,

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

    addTransaction,
    deleteTransaction,
    addInvestment,
    deleteInvestment,
    updateInvestment,
    adjustEmergencyFund,
    simulateInterest,
    saveToLocalStorage,
    loadFromLocalStorage,
    loadWalletState,

    registerUser,
    loginUser,
    forgotPassword,
    logoutUser,

    addToSavedAccounts,
    removeFromSavedAccounts,
    switchAccount,

    updateUserName,
    updatePassword,
    updateProfilePhoto,

    enrollBiometric,
    removeBiometric
  }
})
