const API_BASE = import.meta.env.VITE_API_URL || ''

function getToken() {
  try { return localStorage.getItem('breyne_token') } catch { return null }
}

function setToken(token) {
  try { localStorage.setItem('breyne_token', token) } catch {}
}

function clearToken() {
  try { localStorage.removeItem('breyne_token') } catch {}
}

function decodeToken(token) {
  try {
    const part = token.split('.')[1]
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch { return null }
}

function isTokenExpired(token) {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return false
  return Date.now() >= payload.exp * 1000
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }
  const res = await fetch(API_BASE + path, { ...options, headers })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição.')
  }
  return data
}

export const api = {
  async register(name, email, password) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    })
    if (data.token) setToken(data.token)
    return data
  },

  async login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    if (data.token) setToken(data.token)
    return data
  },

  async me() {
    return await request('/api/auth/me')
  },

  async forgotPassword(email) {
    return await request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  },

  async saveWallet(walletData) {
    return await request('/api/data/save', {
      method: 'POST',
      body: JSON.stringify({ walletData })
    })
  },

  async loadWallet() {
    return await request('/api/data/load')
  },

  async updateProfile(name) {
    return await request('/api/data/update-profile', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  },

  async updatePassword(currentPassword, newPassword) {
    return await request('/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    })
  },

  logout() {
    clearToken()
  },

  getToken,
  setToken,
  isTokenExpired
}
