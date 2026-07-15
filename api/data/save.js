import { verifyToken } from '../_lib/jwt.js'
import { saveWallet } from '../_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { walletData } = req.body
    if (!walletData) {
      return res.status(400).json({ error: 'Dados da carteira são obrigatórios.' })
    }

    walletData._updatedAt = Date.now()
    await saveWallet(payload.userId, walletData)

    return res.json({ success: true, updatedAt: walletData._updatedAt })
  } catch (err) {
    console.error('Save error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
