import { kv } from '@vercel/kv'

const USER_PREFIX = 'user:'
const WALLET_PREFIX = 'wallet:'
const ACCOUNTS_KEY = 'breyne_accounts'

export async function createUser(id, name, email, passwordHash) {
  const user = { id, name, email, passwordHash, createdAt: new Date().toISOString() }
  await kv.set(USER_PREFIX + id, user)
  await kv.sadd(ACCOUNTS_KEY, id)
  const emailIndex = 'email:' + email.toLowerCase()
  await kv.set(emailIndex, id)
  return { id, name, email, createdAt: user.createdAt }
}

export async function findUserByEmail(email) {
  const emailIndex = 'email:' + email.toLowerCase()
  const id = await kv.get(emailIndex)
  if (!id) return null
  const user = await kv.get(USER_PREFIX + id)
  return user
}

export async function findUserById(id) {
  return await kv.get(USER_PREFIX + id)
}

export async function updateUserName(userId, newName) {
  const user = await kv.get(USER_PREFIX + userId)
  if (!user) return null
  user.name = newName
  await kv.set(USER_PREFIX + userId, user)
  return { id: user.id, name: user.name, email: user.email }
}

export async function updateUserPassword(userId, newPasswordHash) {
  const user = await kv.get(USER_PREFIX + userId)
  if (!user) return false
  user.passwordHash = newPasswordHash
  await kv.set(USER_PREFIX + userId, user)
  return true
}

export async function saveWallet(userId, walletData) {
  await kv.set(WALLET_PREFIX + userId, walletData)
}

export async function loadWallet(userId) {
  return await kv.get(WALLET_PREFIX + userId)
}

export async function getAllAccounts() {
  const ids = await kv.smembers(ACCOUNTS_KEY)
  const accounts = []
  for (const id of ids) {
    const user = await kv.get(USER_PREFIX + id)
    if (user) {
      accounts.push({ id: user.id, name: user.name, email: user.email })
    }
  }
  return accounts
}
