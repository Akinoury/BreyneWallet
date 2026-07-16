export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res)
    res.status(200).end()
    return true
  }
  return false
}
