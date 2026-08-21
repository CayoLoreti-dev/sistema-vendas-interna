const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')

function removerSenha(usuário) {
  const { senha, ...usuárioSemSenha } = usuário
  return usuárioSemSenha
}

function obterSenha(req) {
  return req.body.senha ?? req.body.pin
}

async function criarUsuario(req, res) {
  const { nome, telefone, papel } = req.body
  const senhaInformada = obterSenha(req)
  const papelSolicitado = papel || 'FUNCIONARIO'

  if (!nome || !telefone || !senhaInformada) {
    return res.status(400).json({ mensagem: 'Nome, telefone e senha são obrigatórios' })
  }

  if (!/^\d{11}$/.test(telefone)) {
    return res.status(400).json({ mensagem: 'Telefone deve conter exatamente 11 números' })
  }

  if (!['ADMIN', 'VENDEDOR', 'FUNCIONARIO'].includes(papelSolicitado)) {
    return res.status(400).json({ mensagem: 'Papel inválido' })
  }

  if (req.usuário.papel !== 'ADMIN' && papelSolicitado !== 'FUNCIONARIO') {
    return res.status(403).json({ mensagem: 'Somente o master pode criar vendedor ou master' })
  }

  try {
    const senha = await bcrypt.hash(senhaInformada, 10)

    const usuário = await prisma.usuário.create({
      data: {
        nome,
        telefone,
        senha,
        papel: papelSolicitado,
      },
    })

    return res.status(201).json(removerSenha(usuário))
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ mensagem: 'Telefone já cadastrado' })
    }

    return res.status(500).json({ mensagem: 'Erro ao criar usuário' })
  }
}

async function cadastrarFuncionario(req, res) {
  const { nome, telefone } = req.body
  const senhaInformada = obterSenha(req)

  if (!nome || !telefone || !senhaInformada) {
    return res.status(400).json({ mensagem: 'Nome, telefone e senha são obrigatórios' })
  }

  if (!/^\d{11}$/.test(telefone)) {
    return res.status(400).json({ mensagem: 'Telefone deve conter exatamente 11 números' })
  }

  try {
    const senha = await bcrypt.hash(senhaInformada, 10)

    const usuário = await prisma.usuário.create({
      data: {
        nome,
        telefone,
        senha,
        papel: 'FUNCIONARIO',
      },
    })

    return res.status(201).json(removerSenha(usuário))
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ mensagem: 'Telefone já cadastrado' })
    }

    return res.status(500).json({ mensagem: 'Erro ao criar usuário' })
  }
}

async function listarUsuarios(req, res) {
  const where = req.usuário.papel === 'ADMIN' ? {} : { papel: 'FUNCIONARIO' }

  const usuários = await prisma.usuário.findMany({
    where,
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

  return res.json(usuários)
}

module.exports = {
  cadastrarFuncionario,
  criarUsuario,
  listarUsuarios,
}
