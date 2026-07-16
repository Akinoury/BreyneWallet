import bcrypt from 'bcryptjs'
import { createUser, findUserByEmail } from '../_lib/db.js'
import { signToken } from '../_lib/jwt.js'
import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de e-mail inválido.' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' })
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const user = await createUser(userId, name || email.split('@')[0], email, passwordHash)

    const token = signToken({ userId: user.id, email: user.email })

    return res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      token
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
