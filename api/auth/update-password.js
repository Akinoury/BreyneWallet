import bcrypt from 'bcryptjs'
import { verifyToken } from '../_lib/jwt.js'
import { findUserById, updateUserPassword } from '../_lib/db.js'
import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
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

    const { currentPassword, newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres.' })
    }

    const user = await findUserById(payload.userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    if (currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isValid) {
        return res.status(401).json({ error: 'Senha atual incorreta.' })
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await updateUserPassword(payload.userId, newHash)

    return res.json({ success: true, message: 'Senha atualizada com sucesso!' })
  } catch (err) {
    console.error('Update password error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
