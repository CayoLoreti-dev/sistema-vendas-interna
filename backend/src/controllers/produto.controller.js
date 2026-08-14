const prisma = require('../lib/prisma')

async function listarProdutos(req, res) {
  const produtos = await prisma.produto.findMany({
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
      },
    })

    return res.status(201).json(produto)
  } catch {
    return res.status(500).json({ mensagem: 'Erro ao criar produto' })
  }
}

async function atualizarProduto(req, res) {
  const { id } = req.params
  const { nome, categoria, preco, estoqueAtual } = req.body

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(categoria !== undefined && { categoria }),
        ...(preco !== undefined && { preco }),
        ...(estoqueAtual !== undefined && { estoqueAtual }),
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

async function deletarProduto(req, res) {
  const { id } = req.params

  try {
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
  deletarProduto,
}
