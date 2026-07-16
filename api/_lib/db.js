import { put, get } from '@vercel/blob'

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const BLOB_STORE_ID = process.env.BLOB_STORE_ID

function blobOptions() {
  const opts = { access: 'private' }
  if (BLOB_TOKEN) opts.token = BLOB_TOKEN
  if (BLOB_STORE_ID) opts.storeId = BLOB_STORE_ID
  return opts
}

function serialize(obj) {
  return JSON.stringify(obj)
}

function deserialize(str) {
  if (!str) return null
  try { return JSON.parse(str) } catch { return str }
}

function userPath(id) {
  return `u/${id}.json`
}

function emailPath(email) {
  return `e/${email.toLowerCase()}.json`
}

function walletPath(userId) {
  return `w/${userId}.json`
}

const ACCOUNTS_PATH = '_accounts.json'

async function putJSON(path, data) {
  await put(path, serialize(data), {
    ...blobOptions(),
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  })
}

async function getJSON(path) {
  const result = await get(path, blobOptions())
  if (!result || !result.stream) return null
  const text = await new Response(result.stream).text()
  return deserialize(text)
}

export async function createUser(id, name, email, passwordHash) {
  const user = { id, name, email, passwordHash, createdAt: new Date().toISOString() }

  await putJSON(userPath(id), user)
  await putJSON(emailPath(email), id)

  const accounts = await getJSON(ACCOUNTS_PATH) || []
  accounts.push({ id: user.id, name: user.name, email: user.email })
  await putJSON(ACCOUNTS_PATH, accounts)

  return { id, name, email, createdAt: user.createdAt }
}

export async function findUserByEmail(email) {
  const id = await getJSON(emailPath(email))
  if (!id) return null
  return getJSON(userPath(id))
}

export async function findUserById(id) {
  return getJSON(userPath(id))
}

export async function updateUserName(userId, newName) {
  const user = await getJSON(userPath(userId))
  if (!user) return null

  user.name = newName
  await putJSON(userPath(userId), user)

  const accounts = await getJSON(ACCOUNTS_PATH) || []
  const idx = accounts.findIndex(a => a.id === userId)
  if (idx !== -1) {
    accounts[idx].name = newName
    await putJSON(ACCOUNTS_PATH, accounts)
  }

  return { id: user.id, name: user.name, email: user.email }
}

export async function updateUserPassword(userId, newPasswordHash) {
  const user = await getJSON(userPath(userId))
  if (!user) return false

  user.passwordHash = newPasswordHash
  await putJSON(userPath(userId), user)
  return true
}

export async function saveWallet(userId, walletData) {
  await putJSON(walletPath(userId), walletData)
}

export async function loadWallet(userId) {
  return getJSON(walletPath(userId))
}

export async function getAllAccounts() {
  return getJSON(ACCOUNTS_PATH) || []
}
