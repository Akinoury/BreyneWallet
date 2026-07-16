import { findUserByEmail } from '../_lib/db.js'
import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(404).json({ error: 'Nenhuma conta encontrada com este e-mail.' })
    }

    return res.json({
      success: true,
      message: 'Se o e-mail existir em nossa base, enviaremos instruções de recuperação.'
    })
  } catch (err) {
    console.error('Forgot password error:', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
