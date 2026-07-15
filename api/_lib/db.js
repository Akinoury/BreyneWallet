import { Redis } from '@upstash/redis'
import IORedis from 'ioredis'

function createClient() {
  const url = process.env.REDIS_URL || process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN

  if (!url) {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN
    if (restUrl) {
      return { type: 'rest', client: new Redis({ url: restUrl, token: restToken || '' }) }
    }
    throw new Error('Nenhuma configuração Redis encontrada.')
  }

  if (url.startsWith('redis://')) {
    return { type: 'redis', client: new IORedis(url, { maxRetriesPerRequest: 1, retryStrategy: () => null }) }
  }

  return { type: 'rest', client: new Redis({ url, token: token || '' }) }
}

let connection
try {
  connection = createClient()
} catch (e) {
  console.error('Redis init error:', e)
  connection = null
}

function getClient() {
  if (!connection) throw new Error('Redis não configurado.')
  return connection.client
}

function isRedis() {
  return connection?.type === 'redis'
}

function isRest() {
  return connection?.type === 'rest'
}

const USER_PREFIX = 'user:'
const WALLET_PREFIX = 'wallet:'
const ACCOUNTS_KEY = 'breyne_accounts'
const EMAIL_PREFIX = 'email:'

function serialize(obj) {
  return JSON.stringify(obj)
}

function deserialize(str) {
  if (!str) return null
  if (typeof str === 'object' && str.type === 'Buffer') {
    str = Buffer.from(str.data || str).toString()
  }
  if (Buffer.isBuffer(str)) str = str.toString()
  if (typeof str !== 'string') return str
  try { return JSON.parse(str) } catch { return str }
}

export async function createUser(id, name, email, passwordHash) {
  const client = getClient()
  const user = { id, name, email, passwordHash, createdAt: new Date().toISOString() }
  const userStr = serialize(user)
  if (isRedis()) {
    await client.set(USER_PREFIX + id, userStr)
    await client.sadd(ACCOUNTS_KEY, id)
    await client.set(EMAIL_PREFIX + email.toLowerCase(), id)
  } else {
    await client.set(USER_PREFIX + id, user)
    await client.sadd(ACCOUNTS_KEY, id)
    await client.set(EMAIL_PREFIX + email.toLowerCase(), id)
  }
  return { id, name, email, createdAt: user.createdAt }
}

export async function findUserByEmail(email) {
  const client = getClient()
  const id = await client.get(EMAIL_PREFIX + email.toLowerCase())
  if (!id) return null
  const raw = await client.get(USER_PREFIX + id)
  return deserialize(raw)
}

export async function findUserById(id) {
  const client = getClient()
  const raw = await client.get(USER_PREFIX + id)
  return deserialize(raw)
}

export async function updateUserName(userId, newName) {
  const client = getClient()
  const raw = await client.get(USER_PREFIX + userId)
  const user = deserialize(raw)
  if (!user) return null
  user.name = newName
  if (isRedis()) {
    await client.set(USER_PREFIX + userId, serialize(user))
  } else {
    await client.set(USER_PREFIX + userId, user)
  }
  return { id: user.id, name: user.name, email: user.email }
}

export async function updateUserPassword(userId, newPasswordHash) {
  const client = getClient()
  const raw = await client.get(USER_PREFIX + userId)
  const user = deserialize(raw)
  if (!user) return false
  user.passwordHash = newPasswordHash
  if (isRedis()) {
    await client.set(USER_PREFIX + userId, serialize(user))
  } else {
    await client.set(USER_PREFIX + userId, user)
  }
  return true
}

export async function saveWallet(userId, walletData) {
  const client = getClient()
  if (isRedis()) {
    await client.set(WALLET_PREFIX + userId, serialize(walletData))
  } else {
    await client.set(WALLET_PREFIX + userId, walletData)
  }
}

export async function loadWallet(userId) {
  const client = getClient()
  const raw = await client.get(WALLET_PREFIX + userId)
  return deserialize(raw)
}

export async function getAllAccounts() {
  const client = getClient()
  const ids = await client.smembers(ACCOUNTS_KEY)
  const accounts = []
  for (const id of ids) {
    const raw = await client.get(USER_PREFIX + id)
    const user = deserialize(raw)
    if (user) {
      accounts.push({ id: user.id, name: user.name, email: user.email })
    }
  }
  return accounts
}
