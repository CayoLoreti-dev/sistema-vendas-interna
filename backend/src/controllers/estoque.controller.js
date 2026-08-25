const prisma = require('../lib/prisma')

class EstoqueError extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.status = status
    this.mensagem = mensagem
  }
}

function estoqueInclude() {
  return {
    produto: true,
    vendedor: {
      select: {
        id: true,
        nome: true,
        papel: true,
      },
    },
  }
}

function quantidadeValida(quantidade) {
  return Number.isInteger(quantidade) && quantidade > 0
}

function responderErro(error, res) {
  if (error instanceof EstoqueError) {
    return res.status(error.status).json({ mensagem: error.mensagem })
  }

  return res.status(500).json({ mensagem: 'Erro ao atualizar estoque interno' })
}

async function obterVendedorAlvo(req, vendedorIdRecebido) {
  if (req.usuario.papel === 'VENDEDOR') {
    return req.usuario.id
  }

  if (!vendedorIdRecebido) {
    throw new EstoqueError(400, 'Escolha um vendedor')
  }

  const vendedor = await prisma.usuario.findUnique({
    where: { id: vendedorIdRecebido },
    select: {
      id: true,
      papel: true,
    },
  })

  if (!vendedor || vendedor.papel !== 'VENDEDOR') {
    throw new EstoqueError(400, 'Escolha um vendedor valido')
  }

  return vendedor.id
}

async function listarEstoque(req, res) {
  const where = {}

  if (req.usuario.papel === 'VENDEDOR') {
    where.vendedorId = req.usuario.id
  } else if (req.query.vendedorId) {
    where.vendedorId = req.query.vendedorId
  }

  const itens = await prisma.estoqueInterno.findMany({
    where,
    include: estoqueInclude(),
    orderBy: [
      { atualizadoEm: 'desc' },
    ],
  })

  return res.json(itens)
}

async function adicionarEntrada(req, res) {
  const quantidade = Number(req.body?.quantidade)
  const produtoId = req.body?.produtoId

  if (!produtoId || !quantidadeValida(quantidade)) {
    return res.status(400).json({ mensagem: 'Escolha um produto e uma quantidade positiva' })
  }

  try {
    const vendedorId = await obterVendedorAlvo(req, req.body?.vendedorId)

    const item = await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({
        where: { id: produtoId },
        select: { id: true },
      })

      if (!produto) {
        throw new EstoqueError(404, 'Produto nao encontrado')
      }

      const estoque = await tx.estoqueInterno.upsert({
        where: {
          vendedorId_produtoId: {
            vendedorId,
            produtoId,
          },
        },
        update: {
          quantidade: {
            increment: quantidade,
          },
        },
        create: {
          vendedorId,
          produtoId,
          quantidade,
        },
      })

      await tx.movimentacaoEstoque.create({
        data: {
          estoqueId: estoque.id,
          vendedorId,
          produtoId,
          tipo: 'ENTRADA',
          quantidade,
        },
      })

      return tx.estoqueInterno.findUnique({
        where: { id: estoque.id },
        include: estoqueInclude(),
      })
    })

    return res.status(201).json(item)
  } catch (error) {
    return responderErro(error, res)
  }
}

async function colocarParaVenda(req, res) {
  const quantidade = Number(req.body?.quantidade)

  if (!quantidadeValida(quantidade)) {
    return res.status(400).json({ mensagem: 'Informe uma quantidade positiva' })
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      const estoque = await tx.estoqueInterno.findUnique({
        where: { id: req.params.id },
        include: estoqueInclude(),
      })

      if (!estoque) {
        throw new EstoqueError(404, 'Item de estoque nao encontrado')
      }

      if (req.usuario.papel === 'VENDEDOR' && estoque.vendedorId !== req.usuario.id) {
        throw new EstoqueError(403, 'Acesso negado')
      }

      const atualizado = await tx.estoqueInterno.updateMany({
        where: {
          id: estoque.id,
          quantidade: {
            gte: quantidade,
          },
        },
        data: {
          quantidade: {
            decrement: quantidade,
          },
        },
      })

      if (atualizado.count !== 1) {
        throw new EstoqueError(400, 'Quantidade maior que o estoque interno disponivel')
      }

      await tx.produto.update({
        where: { id: estoque.produtoId },
        data: {
          estoqueAtual: {
            increment: quantidade,
          },
        },
      })

      await tx.movimentacaoEstoque.create({
        data: {
          estoqueId: estoque.id,
          vendedorId: estoque.vendedorId,
          produtoId: estoque.produtoId,
          tipo: 'COLOCOU_PRA_VENDA',
          quantidade,
        },
      })

      return tx.estoqueInterno.findUnique({
        where: { id: estoque.id },
        include: estoqueInclude(),
      })
    })

    return res.json(item)
  } catch (error) {
    return responderErro(error, res)
  }
}

async function listarHistorico(req, res) {
  const estoque = await prisma.estoqueInterno.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      vendedorId: true,
    },
  })

  if (!estoque) {
    return res.status(404).json({ mensagem: 'Item de estoque nao encontrado' })
  }

  if (req.usuario.papel === 'VENDEDOR' && estoque.vendedorId !== req.usuario.id) {
    return res.status(403).json({ mensagem: 'Acesso negado' })
  }

  const movimentacoes = await prisma.movimentacaoEstoque.findMany({
    where: { estoqueId: estoque.id },
    include: {
      produto: true,
      vendedor: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
    orderBy: { criadoEm: 'desc' },
    take: 30,
  })

  return res.json(movimentacoes)
}

module.exports = {
  listarEstoque,
  adicionarEntrada,
  colocarParaVenda,
  listarHistorico,
}
