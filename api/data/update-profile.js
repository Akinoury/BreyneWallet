import { verifyToken } from '../_lib/jwt.js'
import { updateUserName } from '../_lib/db.js'

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

    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório.' })
    }

    const user = await updateUserName(payload.userId, name)
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    return res.json({ success: true, user })
  } catch (err) {
    console.error('Update profile error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
