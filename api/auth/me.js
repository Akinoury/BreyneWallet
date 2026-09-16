import { verifyToken } from '../_lib/jwt.js'
import { findUserById } from '../_lib/db.js'
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
      console.warn('Me 401: token não fornecido no header Authorization')
      return res.status(401).json({ error: 'Token não fornecido.' })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      console.warn('Me 401: token inválido ou expirado', String(token).slice(0, 25) + '...')
      return res.status(401).json({ error: 'Token inválido ou expirado.' })
    }

    const user = await findUserById(payload.userId)
    if (!user) {
      console.warn('Me 401: usuário não encontrado no Blob', payload.userId)
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
