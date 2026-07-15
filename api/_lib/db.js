import { Redis } from '@upstash/redis'

const REDIS_URL = process.env.REDIS_URL || process.env.KV_REST_API_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN

let redis
if (REDIS_URL?.startsWith('redis://')) {
  redis = new Redis({ url: REDIS_URL })
} else if (REDIS_URL) {
  redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN || '' })
} else {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || 'http://localhost:8079',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
  })
}

const USER_PREFIX = 'user:'
const WALLET_PREFIX = 'wallet:'
const ACCOUNTS_KEY = 'breyne_accounts'
const EMAIL_PREFIX = 'email:'

export async function createUser(id, name, email, passwordHash) {
  const user = { id, name, email, passwordHash, createdAt: new Date().toISOString() }
  await redis.set(USER_PREFIX + id, user)
  await redis.sadd(ACCOUNTS_KEY, id)
  await redis.set(EMAIL_PREFIX + email.toLowerCase(), id)
  return { id, name, email, createdAt: user.createdAt }
}

export async function findUserByEmail(email) {
  const id = await redis.get(EMAIL_PREFIX + email.toLowerCase())
  if (!id) return null
  return await redis.get(USER_PREFIX + id)
}

export async function findUserById(id) {
  return await redis.get(USER_PREFIX + id)
}

export async function updateUserName(userId, newName) {
  const user = await redis.get(USER_PREFIX + userId)
  if (!user) return null
  user.name = newName
  await redis.set(USER_PREFIX + userId, user)
  return { id: user.id, name: user.name, email: user.email }
}

export async function updateUserPassword(userId, newPasswordHash) {
  const user = await redis.get(USER_PREFIX + userId)
  if (!user) return false
  user.passwordHash = newPasswordHash
  await redis.set(USER_PREFIX + userId, user)
  return true
}

export async function saveWallet(userId, walletData) {
  await redis.set(WALLET_PREFIX + userId, walletData)
}

export async function loadWallet(userId) {
  return await redis.get(WALLET_PREFIX + userId)
}

export async function getAllAccounts() {
  const ids = await redis.smembers(ACCOUNTS_KEY)
  const accounts = []
  for (const id of ids) {
    const user = await redis.get(USER_PREFIX + id)
    if (user) {
      accounts.push({ id: user.id, name: user.name, email: user.email })
    }
  }
  return accounts
}
