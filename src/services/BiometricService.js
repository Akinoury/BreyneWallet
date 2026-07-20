const STORAGE_KEYS = {
  CACHE: 'breyne_bio_cache',
  ENABLED: 'breyne_bio_enabled',
  SAVED_ACCOUNTS: 'breyne_saved_accounts',
  USER: 'breyne_user',
  TOKENS: 'breyne_bio_tokens',
  ACCOUNT_TOKENS: 'breyne_account_tokens'
}

const SERVER_ID = 'breyne-wallet'

function uid() {
  try { return crypto.randomUUID() } catch { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }
}

function getPlugin() {
  try { return window.Capacitor?.Plugins?.NativeBiometric ?? null } catch { return null }
}

function getJwtToken() {
  try { return localStorage.getItem('breyne_token') } catch { return null }
}

function setJwtToken(token) {
  try { localStorage.setItem('breyne_token', token) } catch {}
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

function getRpId() {
  return window.location.hostname || 'localhost'
}

function getDeviceName() {
  const ua = navigator.userAgent
  if (/Windows/.test(ua)) return 'Windows Hello'
  if (/Mac OS/.test(ua)) return 'Touch ID'
  if (/Linux/.test(ua) && /CrOS/.test(ua)) return 'ChromeOS'
  if (/Linux/.test(ua)) return 'Linux (PIN)'
  if (/Android/.test(ua)) return 'Android Biométrico'
  if (/iPhone|iPad|iPod/.test(ua)) return 'Face ID / Touch ID'
  return 'Autenticador do Navegador'
}

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Uint8Array.from(atob(str), c => c.charCodeAt(0)).buffer
}

async function isWebAuthnAvailable() {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

async function webAuthnCreate(userId, userEmail, userName) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'BreyneWallet', id: getRpId() },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userName
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged'
      },
      timeout: 60000,
      attestation: 'none'
    }
  })
  return credential
}

async function webAuthnGet(credentialId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{
        type: 'public-key',
        id: typeof credentialId === 'string' ? base64urlToBytes(credentialId) : credentialId,
        transports: ['internal']
      }],
      userVerification: 'required',
      timeout: 60000
    }
  })
  return assertion
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
    const account = accounts.find(a => a.id === userId)
    if (account) this.removeAccountToken(account.email)
    localStorage.setItem(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(accounts.filter(a => a.id !== userId)))
  }

  saveAccountToken(email, token) {
    if (!email || !token) return
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT_TOKENS)
      const tokens = raw ? JSON.parse(raw) : {}
      tokens[email] = token
      localStorage.setItem(STORAGE_KEYS.ACCOUNT_TOKENS, JSON.stringify(tokens))
    } catch {}
  }

  getAccountToken(email) {
    if (!email) return null
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT_TOKENS)
      const tokens = raw ? JSON.parse(raw) : {}
      return tokens[email] || null
    } catch { return null }
  }

  removeAccountToken(email) {
    if (!email) return
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT_TOKENS)
      const tokens = raw ? JSON.parse(raw) : {}
      delete tokens[email]
      localStorage.setItem(STORAGE_KEYS.ACCOUNT_TOKENS, JSON.stringify(tokens))
    } catch {}
  }

  async isSupported() {
    const p = getPlugin()
    if (p) { try { const r = await p.isAvailable(); return !!r.isAvailable } catch { return false } }
    return isWebAuthnAvailable()
  }

  async isAvailable() { return this.isSupported() }

  async hasCredential(userId) {
    const cache = this.#getCache()
    const match = cache.find(c => c.user_id === userId && !c.revoked)
    if (!match) return false

    if (match.credential_type === 'webauthn') {
      const tokens = loadTokens()
      return !!tokens && tokens.user_id === userId
    }

    if (match.credential_type === 'native') {
      const p = getPlugin()
      if (p) { try { const creds = await p.getCredentials({ server: SERVER_ID }); return !!creds?.password } catch { return false } }
      return false
    }

    return false
  }

  async hasAnyCredential() {
    const active = this.#getCache().filter(c => !c.revoked)
    if (active.length === 0) return false
    for (const c of active) {
      if (await this.hasCredential(c.user_id)) return true
    }
    return false
  }

  getCachedUserIds() {
    return [...new Set(this.#getCache().filter(c => !c.revoked).map(c => c.user_id))]
  }

  async listCredentials(userId) {
    let cache = this.#getCache().filter(c => c.user_id === userId && !c.revoked)

    if (!getPlugin()) {
      const tokens = loadTokens()
      if (cache.length > 0 && !tokens) {
        this.#setCache(this.#getCache().filter(c => c.user_id !== userId))
        return []
      }
    }

    return cache
  }

  async syncWithLocalStorage() {
    return { success: true, credentials: this.#getCache() }
  }

  async register(userId, userEmail, userName) {
    try {
      const jwt = getJwtToken()
      if (!jwt) {
        return { success: false, message: 'Faça login antes de cadastrar a biometria.' }
      }

      const tokenData = {
        token: jwt,
        user_id: userId,
        email: userEmail,
        name: userName
      }

      const p = getPlugin()
      let cacheEntry = null

      if (p) {
        await p.verifyIdentity({
          reason: 'Confirme sua identidade para cadastrar a biometria',
          title: 'Cadastro Biométrico',
          subtitle: 'Toque no sensor para confirmar',
          description: 'Autentique-se para armazenar sua credencial'
        })

        await p.setCredentials({
          username: userEmail,
          password: JSON.stringify(tokenData),
          server: SERVER_ID
        })

        cacheEntry = {
          id: uid(),
          user_id: userId,
          credential_id: 'bio-' + uid(),
          device_name: 'Dispositivo Móvel',
          credential_type: 'native',
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          synced: true
        }
      } else if (await isWebAuthnAvailable()) {
        const credential = await webAuthnCreate(userId, userEmail, userName)

        saveTokens(tokenData)

        cacheEntry = {
          id: 'wa-' + uid(),
          user_id: userId,
          credential_id: credential.id,
          device_name: getDeviceName(),
          credential_type: 'webauthn',
          webauthn_id: credential.id,
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          synced: true
        }
      } else {
        return { success: false, message: 'Autenticação biométrica não disponível neste dispositivo.' }
      }

      if (cacheEntry) {
        const cache = this.#getCache()
        cache.push(cacheEntry)
        this.#setCache(cache)
        this.saveAccount({ id: userId, name: userName, email: userEmail })
      }

      return { success: true, message: 'Biometria cadastrada com sucesso!' }
    } catch (err) {
      return { success: false, message: err?.message || 'Falha ao cadastrar biometria.' }
    }
  }

  async authenticate(userIds) {
    try {
      const p = getPlugin()
      let tokenData = null

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
        try { tokenData = JSON.parse(credentials.password) } catch { tokenData = null }
      } else {
        const cache = this.#getCache()
        const ids = Array.isArray(userIds) && userIds.length > 0 ? userIds : cache.map(c => c.user_id)
        const webauthnCred = cache.find(c =>
          c.credential_type === 'webauthn' && !c.revoked && ids.includes(c.user_id)
        )
        if (!webauthnCred) {
          return { success: false, message: 'Nenhuma credencial biométrica encontrada. Cadastre a biometria primeiro.' }
        }

        await webAuthnGet(webauthnCred.webauthn_id)

        tokenData = loadTokens()
        if (!tokenData) {
          return { success: false, message: 'Sessão expirada. Faça login novamente.' }
        }

        webauthnCred.last_used_at = new Date().toISOString()
        this.#setCache(cache)
      }

      if (!tokenData?.token) {
        return { success: false, message: 'Token inválido. Cadastre a biometria novamente.' }
      }

      setJwtToken(tokenData.token)

      return {
        success: true,
        user: {
          user_id: tokenData.user_id,
          email: tokenData.email,
          name: tokenData.name
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
