const prisma = require('../lib/prisma')

async function listarProdutos(req, res) {
  const where = req.usuario.papel === 'FUNCIONARIO' ? { ativo: true } : {}

  const produtos = await prisma.produto.findMany({
    where,
    orderBy: { nome: 'asc' },
  })

  return res.json(produtos)
}

async function criarProduto(req, res) {
  const { nome, categoria, preco, estoqueAtual } = req.body

  if (!nome || preco === undefined) {
    return res.status(400).json({ mensagem: 'Nome e preco sao obrigatorios' })
  }

  try {
    const produto = await prisma.produto.create({
      data: {
        nome,
        categoria,
        preco,
        estoqueAtual,
        ativo: true,
      },
    })

    return res.status(201).json(produto)
  } catch {
    return res.status(500).json({ mensagem: 'Erro ao criar produto' })
  }
}

async function atualizarProduto(req, res) {
  const { id } = req.params
  const { nome, categoria, preco, estoqueAtual, ativo } = req.body

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(categoria !== undefined && { categoria }),
        ...(preco !== undefined && { preco }),
        ...(estoqueAtual !== undefined && { estoqueAtual }),
        ...(ativo !== undefined && { ativo: Boolean(ativo) }),
      },
    })

    return res.json(produto)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ mensagem: 'Produto nao encontrado' })
    }

    return res.status(500).json({ mensagem: 'Erro ao atualizar produto' })
  }
}

async function ativarProduto(req, res) {
  const { id } = req.params

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ativo: true,
      },
    })

    return res.json(produto)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ mensagem: 'Produto nao encontrado' })
    }

    return res.status(500).json({ mensagem: 'Erro ao ativar produto' })
  }
}

async function atualizarPromocao(req, res) {
  const { id } = req.params
  const { promocaoAtiva, precoPromocional } = req.body

  if (promocaoAtiva) {
    if (precoPromocional === undefined || Number(precoPromocional) <= 0) {
      return res.status(400).json({ mensagem: 'Informe um preco promocional valido' })
    }
  }

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        promocaoAtiva: Boolean(promocaoAtiva),
        precoPromocional: promocaoAtiva ? precoPromocional : null,
      },
    })

    return res.json(produto)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ mensagem: 'Produto nao encontrado' })
    }

    return res.status(500).json({ mensagem: 'Erro ao atualizar promocao' })
  }
}

async function deletarProduto(req, res) {
  const { id } = req.params

  try {
    const historico = await prisma.produto.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            itensPedido: true,
            estoquesInternos: true,
            movimentacoesEstoque: true,
          },
        },
      },
    })

    if (!historico) {
      return res.status(404).json({ mensagem: 'Produto nao encontrado' })
    }

    const temHistorico = Object.values(historico._count).some((quantidade) => quantidade > 0)

    if (temHistorico) {
      const produto = await prisma.produto.update({
        where: { id },
        data: {
          ativo: false,
          estoqueAtual: 0,
          promocaoAtiva: false,
          precoPromocional: null,
        },
      })

      return res.json({
        mensagem: 'Produto inativado para preservar o historico',
        produto,
      })
    }

    await prisma.produto.delete({
      where: { id },
    })

    return res.status(204).send()
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ mensagem: 'Produto nao encontrado' })
    }

    return res.status(500).json({ mensagem: 'Erro ao deletar produto' })
  }
}

module.exports = {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  atualizarPromocao,
  ativarProduto,
  deletarProduto,
}
