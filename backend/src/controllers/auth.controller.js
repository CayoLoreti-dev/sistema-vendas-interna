const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

async function login(req, res) {
  const { telefone, pin, senha } = req.body
  const senhaInformada = senha ?? pin

  if (!telefone || !senhaInformada) {
    return res.status(401).json({ mensagem: 'Credenciais invalidas' })
  }

  const usuario = await prisma.usuario.findUnique({
    where: { telefone },
  })

  if (!usuario) {
    return res.status(401).json({ mensagem: 'Credenciais invalidas' })
  }

  const senhaValida = await bcrypt.compare(senhaInformada, usuario.senha)

  if (!senhaValida) {
    return res.status(401).json({ mensagem: 'Credenciais invalidas' })
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      papel: usuario.papel,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  )

  return res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      papel: usuario.papel,
    },
  })
}

module.exports = {
  login,
}
