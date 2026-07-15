import bcrypt from 'bcryptjs'
import { findUserByEmail } from '../_lib/db.js'
import { signToken } from '../_lib/jwt.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
    }

    const token = signToken({ userId: user.id, email: user.email })

    return res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      token
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
