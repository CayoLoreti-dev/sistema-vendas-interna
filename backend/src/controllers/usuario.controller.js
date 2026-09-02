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
  const papelSolicitado = papel || 'FUNCIONARIO'

  if (!nome || !telefone || !senhaInformada) {
    return res.status(400).json({ mensagem: 'Nome, telefone e senha sao obrigatorios' })
  }

  if (!/^\d{11}$/.test(telefone)) {
    return res.status(400).json({ mensagem: 'Telefone deve conter exatamente 11 numeros' })
  }

  if (!['ADMIN', 'VENDEDOR', 'FUNCIONARIO'].includes(papelSolicitado)) {
    return res.status(400).json({ mensagem: 'Papel invalido' })
  }

  if (req.usuario.papel !== 'ADMIN' && papelSolicitado !== 'FUNCIONARIO') {
    return res.status(403).json({ mensagem: 'Somente o master pode criar vendedor ou master' })
  }

  try {
    const senha = await bcrypt.hash(senhaInformada, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        telefone,
        senha,
        papel: papelSolicitado,
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

  if (!/^\d{11}$/.test(telefone)) {
    return res.status(400).json({ mensagem: 'Telefone deve conter exatamente 11 numeros' })
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
  const where = req.usuario.papel === 'ADMIN' ? {} : { papel: 'FUNCIONARIO' }

  const usuarios = await prisma.usuario.findMany({
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

  return res.json(usuarios)
}

async function alterarMinhaSenha(req, res) {
  const senhaInformada = obterSenha(req)

  if (!senhaInformada) {
    return res.status(400).json({ mensagem: 'Informe a nova senha' })
  }

  if (String(senhaInformada).length < 4) {
    return res.status(400).json({ mensagem: 'A nova senha precisa ter pelo menos 4 caracteres' })
  }

  const senha = await bcrypt.hash(String(senhaInformada), 10)

  await prisma.usuario.update({
    where: {
      id: req.usuario.id,
    },
    data: {
      senha,
    },
  })

  return res.json({ mensagem: 'Senha alterada com sucesso' })
}

module.exports = {
  alterarMinhaSenha,
  cadastrarFuncionario,
  criarUsuario,
  listarUsuarios,
}
