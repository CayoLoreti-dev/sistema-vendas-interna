const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')

function removerSenha(usuario) {
  const { senha, ...usuarioSemSenha } = usuario
  return usuarioSemSenha
}

function obterSenha(req) {
  return req.body.senha ?? req.body.pin
}

async function criarUsuario(req, res) {
  const { nome, telefone, papel } = req.body
  const senhaInformada = obterSenha(req)

  if (!nome || !telefone || !senhaInformada) {
    return res.status(400).json({ mensagem: 'Nome, telefone e senha sao obrigatorios' })
  }

  if (!/^\d{9}$/.test(telefone)) {
    return res.status(400).json({ mensagem: 'Telefone deve conter exatamente 9 numeros' })
  }

  if (!['ADMIN', 'FUNCIONARIO'].includes(papel)) {
    return res.status(400).json({ erro: 'Papel inválido. Use ADMIN ou FUNCIONARIO.' })
  }

  try {
    const senha = await bcrypt.hash(senhaInformada, 10)

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

async function cadastrarFuncionario(req, res) {
  const { nome, telefone } = req.body
  const senhaInformada = obterSenha(req)

  if (!nome || !telefone || !senhaInformada) {
    return res.status(400).json({ mensagem: 'Nome, telefone e senha sao obrigatorios' })
  }

  if (!/^\d{9}$/.test(telefone)) {
    return res.status(400).json({ mensagem: 'Telefone deve conter exatamente 9 numeros' })
  }

  try {
    const senha = await bcrypt.hash(senhaInformada, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        telefone,
        senha,
        papel: 'FUNCIONARIO',
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

async function listarUsuarios(req, res) {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      telefone: true,
      papel: true,
      criadoEm: true,
    },
    orderBy: {
      nome: 'asc',
    },
  })

  return res.json(usuarios)
}

module.exports = {
  cadastrarFuncionario,
  criarUsuario,
  listarUsuarios,
}
