import { verifyToken } from '../_lib/jwt.js'
import { loadWallet } from '../_lib/db.js'
import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido.' })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' })
    }

    const walletData = await loadWallet(payload.userId)
    return res.json({ success: true, data: walletData || null })
  } catch (err) {
    console.error('Load error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
