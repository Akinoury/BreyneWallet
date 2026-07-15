import { verifyToken } from '../_lib/jwt.js'
import { findUserById } from '../_lib/db.js'

export default async function handler(req, res) {
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

    const user = await findUserById(payload.userId)
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' })
    }

    return res.json({
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (err) {
    console.error('Me error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
