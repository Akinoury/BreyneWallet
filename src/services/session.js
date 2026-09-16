import { api } from './api'

let pendingPromise = null

function run() {
  const token = api.getToken()
  if (token && api.isTokenExpired(token)) api.logout()
  const t = api.getToken()
  if (!t) return Promise.resolve(null)
  return api.me().then(r => (r?.user ?? null), () => {
    api.logout()
    return null
  })
}

export function ensureSession() {
  if (!pendingPromise) pendingPromise = run()
  return pendingPromise
}

export function replaceSession(user) {
  pendingPromise = Promise.resolve(user || null)
  return pendingPromise
}

export function clearSession() {
  return replaceSession(null)
}