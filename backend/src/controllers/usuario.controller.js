const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')

function removerSenha(usuario) {
  const { senha, ...usuarioSemSenha } = usuario
  return usuarioSemSenha
}

async function criarUsuario(req, res) {
  const { nome, telefone, pin, papel } = req.body

  if (!nome || !telefone || !pin) {
    return res.status(400).json({ mensagem: 'Nome, telefone e pin sao obrigatorios' })
  }

  if (!/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ mensagem: 'PIN deve conter entre 4 e 6 digitos numericos' })
  }

  try {
    const senha = await bcrypt.hash(pin, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        telefone,
        senha,
        papel,
      },
    })

    return res.status(201).json(removerSenha(usuario))
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ mensagem: 'Telefone ja cadastrado' })
    }

    return res.status(500).json({ mensagem: 'Erro ao criar usuario' })
  }
}

module.exports = {
  criarUsuario,
}
