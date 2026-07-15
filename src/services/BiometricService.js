import { supabase } from '../supabase'

const STORAGE_KEYS = {
  CACHE: 'breyne_bio_cache',
  ENABLED: 'breyne_bio_enabled',
  SAVED_ACCOUNTS: 'breyne_saved_accounts',
  USER: 'breyne_user',
  TOKENS: 'breyne_bio_tokens'
}

const SERVER_ID = 'breyne-wallet'

function uid() {
  try { return crypto.randomUUID() } catch { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }
}

function getPlugin() {
  try { return window.Capacitor?.Plugins?.NativeBiometric ?? null } catch { return null }
}

function loadTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOKENS)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveTokens(data) {
  localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(data))
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.TOKENS)
}

async function restoreSession(tokens) {
  let session = null

  try {
    const res = await supabase.auth.setSession({
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token
    })
    if (!res.error && res.data?.session) session = res.data.session
  } catch {}

  if (!session) {
    const apiKey = supabase.auth.headers?.apikey || ''
    const authUrl = supabase.auth.url || ''
    const res = await fetch(`${authUrl}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey, Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ refresh_token: tokens.refresh_token })
    })
    const json = await res.json()
    if (res.ok) session = json
  }

  return session
}

class BiometricService {
  #getCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CACHE)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  #setCache(creds) {
    localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(creds))
    localStorage.setItem(STORAGE_KEYS.ENABLED, creds.length > 0 ? 'true' : 'false')
  }

  saveAccount(account) {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_ACCOUNTS)
    const accounts = raw ? JSON.parse(raw) : []
    if (!accounts.find(a => a.id === account.id)) {
      accounts.push({ id: account.id, name: account.name, email: account.email, savedAt: new Date().toISOString() })
      localStorage.setItem(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(accounts))
    }
  }

  getSavedAccounts() {
    try { const raw = localStorage.getItem(STORAGE_KEYS.SAVED_ACCOUNTS); return raw ? JSON.parse(raw) : [] } catch { return [] }
  }

  getSavedAccountIds() {
    return this.getSavedAccounts().map(a => a.id).filter(Boolean)
  }

  removeSavedAccount(userId) {
    const accounts = this.getSavedAccounts()
    localStorage.setItem(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(accounts.filter(a => a.id !== userId)))
  }

  async isSupported() {
    const p = getPlugin()
    if (p) { try { const r = await p.isAvailable(); return !!r.isAvailable } catch { return false } }
    return !!loadTokens()
  }

  async isAvailable() { return this.isSupported() }

  async hasCredential(userId) {
    if (this.#getCache().some(c => c.user_id === userId)) {
      if (!getPlugin() && !loadTokens()) {
        this.#setCache(this.#getCache().filter(c => c.user_id !== userId))
        return false
      }
      return true
    }
    const p = getPlugin()
    if (p) { try { const creds = await p.getCredentials({ server: SERVER_ID }); return !!creds?.password } catch { return false } }
    return !!loadTokens()
  }

  async listCredentials(userId) {
    const cache = this.#getCache().filter(c => c.user_id === userId && !c.revoked)
    if (!getPlugin() && cache.length > 0 && !loadTokens()) {
      this.#setCache(this.#getCache().filter(c => c.user_id !== userId))
      return []
    }
    return cache
  }

  async syncWithSupabase() {
    return { success: true, credentials: this.#getCache() }
  }

  async register(userId, userEmail, userName) {
    try {
      let tokens = null

      try {
        const raw = localStorage.getItem('breyne_session_tokens')
        if (raw) tokens = JSON.parse(raw)
      } catch {}

      if (!tokens?.refresh_token) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.refresh_token) {
          tokens = { refresh_token: session.refresh_token, access_token: session.access_token }
        }
      }

      if (!tokens?.refresh_token) {
        return { success: false, message: 'Sessão expirada. Faça login novamente.' }
      }

      const p = getPlugin()
      if (p) {
        await p.verifyIdentity({
          reason: 'Confirme sua identidade para cadastrar a biometria',
          title: 'Cadastro Biométrico',
          subtitle: 'Toque no sensor para confirmar',
          description: 'Autentique-se para armazenar sua credencial'
        })

        await p.setCredentials({
          username: userEmail,
          password: JSON.stringify(tokens),
          server: SERVER_ID
        })
      } else {
        saveTokens(tokens)
      }
    } catch (err) {
      return { success: false, message: err?.message || 'Falha ao cadastrar biometria.' }
    }

    const entryId = uid()
    const cacheEntry = {
      id: entryId,
      user_id: userId,
      credential_id: 'bio-' + entryId,
      device_name: getPlugin() ? 'Android' : 'Navegador',
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      synced: true
    }
    const cache = this.#getCache()
    cache.push(cacheEntry)
    this.#setCache(cache)
    return { success: true, message: 'Biometria cadastrada com sucesso!' }
  }

  async authenticate() {
    try {
      const p = getPlugin()
      let tokens = null

      if (p) {
        await p.verifyIdentity({
          reason: 'Para acessar sua carteira',
          title: 'Autenticação Biométrica',
          subtitle: 'Use sua digital ou rosto para entrar',
          description: 'Toque no sensor biométrico'
        })

        const credentials = await p.getCredentials({ server: SERVER_ID })
        if (!credentials?.password) {
          return { success: false, message: 'Nenhuma credencial encontrada. Cadastre a biometria primeiro.' }
        }
        try { tokens = JSON.parse(credentials.password) } catch { tokens = { refresh_token: credentials.password } }
      } else {
        tokens = loadTokens()
        if (!tokens) {
          return { success: false, message: 'Nenhuma credencial encontrada. Cadastre a biometria primeiro.' }
        }
      }

      if (!tokens?.refresh_token) {
        return { success: false, message: 'Token inválido. Cadastre a biometria novamente.' }
      }

      const session = await restoreSession(tokens)
      if (!session?.user?.id || !session?.refresh_token) {
        return { success: false, message: 'Sessão expirada. Faça login novamente.' }
      }

      const user = session.user
      const tokenData = JSON.stringify({ refresh_token: session.refresh_token, access_token: session.access_token })

      if (p) {
        await p.setCredentials({ username: user.email, password: tokenData, server: SERVER_ID })
      } else {
        saveTokens({ refresh_token: session.refresh_token, access_token: session.access_token })
      }

      return {
        success: true,
        user: {
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0]
        }
      }
    } catch (err) {
      return { success: false, message: err?.message || 'Erro na autenticação biométrica.' }
    }
  }

  async deleteCredential(recordId, credentialId) {
    const cache = this.#getCache()
    this.#setCache(cache.filter(c => c.id !== recordId))

    const p = getPlugin()
    if (p) { try { await p.deleteCredentials({ server: SERVER_ID }) } catch {} }
    clearTokens()
    return { success: true, message: 'Biometria removida.' }
  }

  async replaceCredential(userId, userEmail, userName, oldRecordId, oldCredentialId) {
    await this.deleteCredential(oldRecordId, oldCredentialId)
    return this.register(userId, userEmail, userName)
  }
}

export const biometricService = new BiometricService()
