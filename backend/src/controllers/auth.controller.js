const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { registrarAuditoria } = require('../lib/auditoria')
const prisma = require('../lib/prisma')

async function login(req, res) {
  const { telefone, pin, senha } = req.body || {}
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

  if (usuario.status === 'PENDENTE') {
    return res.status(403).json({ mensagem: 'Conta aguardando aprovacao da vendedora' })
  }

  if (usuario.status === 'BLOQUEADO') {
    return res.status(403).json({ mensagem: 'Conta bloqueada. Fale com a vendedora' })
  }

  const senhaValida = await bcrypt.compare(senhaInformada, usuario.senha)

  if (!senhaValida) {
    return res.status(401).json({ mensagem: 'Credenciais invalidas' })
  }

  registrarAuditoria(prisma, {
    usuarioId: usuario.id,
    acao: 'LOGIN_SUCESSO',
    entidade: 'Usuario',
    entidadeId: usuario.id,
  }).catch((error) => {
    console.error('Erro ao registrar auditoria de login:', error)
  })

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
      status: usuario.status,
    },
  })
}

module.exports = {
  login,
}
