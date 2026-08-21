const { Prisma } = require('@prisma/client')
const { enviarNotificacaoAdmins } = require('../lib/push')
const prisma = require('../lib/prisma')

class PedidoError extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.status = status
    this.mensagem = mensagem
  }
}

function válidarEAgruparItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new PedidoError(400, 'Itens deve ser um array não vazio')
  }

  const itensAgrupados = new Map()

  for (const item of itens) {
    if (!item?.produtoId || !Number.isInteger(item.quantidade) || item.quantidade <= 0) {
      throw new PedidoError(400, 'Cada item deve ter produtoId e quantidade inteira positiva')
    }

    const quantidadeAtual = itensAgrupados.get(item.produtoId) || 0
    itensAgrupados.set(item.produtoId, quantidadeAtual + item.quantidade)
  }

  return Array.from(itensAgrupados, ([produtoId, quantidade]) => ({
    produtoId,
    quantidade,
  }))
}

function pedidoInclude() {
  return {
    itens: {
      include: {
        produto: true,
      },
    },
    usuário: {
      select: {
        id: true,
        nome: true,
      },
    },
  }
}

function válidarMetodoPagamento(metodoPagamento) {
  if (!['FIADO', 'PIX'].includes(metodoPagamento)) {
    throw new PedidoError(400, 'Escolha uma forma de pagamento válida')
  }

  return metodoPagamento
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor))
}

function metodoPagamentoLabel(metodoPagamento) {
  return metodoPagamento === 'PIX' ? 'Aguardando Pix' : 'Fiado'
}

async function criarPedidoParaUsuario(usuárioId, itensRecebidos, metodoPagamentoRecebido) {
  const itens = válidarEAgruparItens(itensRecebidos)
  const metodoPagamento = válidarMetodoPagamento(metodoPagamentoRecebido)

  return prisma.$transaction(async (tx) => {
    const usuário = await tx.usuário.findUnique({
      where: { id: usuárioId },
      select: { id: true },
    })

    if (!usuário) {
      throw new PedidoError(404, 'Cliente não encontrado')
    }

    const produtos = await tx.produto.findMany({
      where: {
        id: {
          in: itens.map((item) => item.produtoId),
        },
      },
    })

    const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]))

    for (const item of itens) {
      const produto = produtosPorId.get(item.produtoId)

      if (!produto) {
        throw new PedidoError(400, `Produto ${item.produtoId} não encontrado`)
      }

      if (produto.estoqueAtual < item.quantidade) {
        throw new PedidoError(400, `Estoque insuficiente para o produto ${produto.nome}`)
      }
    }

    const valorTotal = itens.reduce((total, item) => {
      const produto = produtosPorId.get(item.produtoId)
      return total.add(produto.preco.mul(item.quantidade))
    }, new Prisma.Decimal(0))

    const pedidoCriado = await tx.pedido.create({
      data: {
        usuárioId,
        status: 'FIADO',
        metodoPagamento,
        valorTotal,
      },
    })

    for (const item of itens) {
      const produto = produtosPorId.get(item.produtoId)

      const atualizacao = await tx.produto.updateMany({
        where: {
          id: item.produtoId,
          estoqueAtual: {
            gte: item.quantidade,
          },
        },
        data: {
          estoqueAtual: {
            decrement: item.quantidade,
          },
        },
      })

      if (atualizacao.count !== 1) {
        throw new PedidoError(400, `Estoque insuficiente para o produto ${produto.nome}`)
      }

      await tx.itemPedido.create({
        data: {
          pedidoId: pedidoCriado.id,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: produto.preco,
        },
      })
    }

    return tx.pedido.findUnique({
      where: { id: pedidoCriado.id },
      include: pedidoInclude(),
    })
  })
}

function responderErroPedido(error, res) {
  if (error instanceof PedidoError) {
    return res.status(error.status).json({ mensagem: error.mensagem })
  }

  return res.status(500).json({ mensagem: 'Erro ao criar pedido' })
}

async function criarPedido(req, res) {
  try {
    const pedido = await criarPedidoParaUsuario(
      req.usuário.id,
      req.body.itens,
      req.body.metodoPagamento,
    )

    enviarNotificacaoAdmins({
      title: 'Novo pedido!',
      body: `${pedido.usuário.nome} comprou por ${formatarMoeda(pedido.valorTotal)} - ${metodoPagamentoLabel(pedido.metodoPagamento)}`,
    }).catch((error) => {
      console.error('Erro ao disparar notificação de novo pedido', error)
    })

    return res.status(201).json(pedido)
  } catch (error) {
    return responderErroPedido(error, res)
  }
}

async function criarPedidoAdmin(req, res) {
  if (!req.body.usuárioId) {
    return res.status(400).json({ mensagem: 'Escolha um cliente para a fatura' })
  }

  try {
    const pedido = await criarPedidoParaUsuario(
      req.body.usuárioId,
      req.body.itens,
      req.body.metodoPagamento || 'FIADO',
    )

    return res.status(201).json(pedido)
  } catch (error) {
    return responderErroPedido(error, res)
  }
}

async function listarPedidos(req, res) {
  const { status } = req.query
  const where = {}

  if (status) {
    if (!['FIADO', 'PAGO'].includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido' })
    }

    where.status = status
  }

  if (!['ADMIN', 'VENDEDOR'].includes(req.usuário.papel)) {
    where.usuárioId = req.usuário.id
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    include: pedidoInclude(),
    orderBy: { criadoEm: 'desc' },
  })

  return res.json(pedidos)
}

async function buscarPedido(req, res) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: req.params.id },
    include: pedidoInclude(),
  })

  if (!pedido) {
    return res.status(404).json({ mensagem: 'Pedido não encontrado' })
  }

  if (!['ADMIN', 'VENDEDOR'].includes(req.usuário.papel) && pedido.usuárioId !== req.usuário.id) {
    return res.status(403).json({ mensagem: 'Acesso negado' })
  }

  return res.json(pedido)
}

async function pagarPedido(req, res) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: req.params.id },
  })

  if (!pedido) {
    return res.status(404).json({ mensagem: 'Pedido não encontrado' })
  }

  if (pedido.status === 'PAGO') {
    return res.status(400).json({ mensagem: 'Pedido já está pago' })
  }

  const pedidoPago = await prisma.pedido.update({
    where: { id: req.params.id },
    data: {
      status: 'PAGO',
      pagoEm: new Date(),
    },
    include: pedidoInclude(),
  })

  return res.json(pedidoPago)
}

async function saldoPorUsuario(usuárioId) {
  const pedidos = await prisma.pedido.findMany({
    where: {
      usuárioId,
      status: 'FIADO',
    },
    include: pedidoInclude(),
    orderBy: { criadoEm: 'desc' },
  })

  const totalDecimal = pedidos.reduce(
    (total, pedido) => total.add(pedido.valorTotal),
    new Prisma.Decimal(0),
  )

  return {
    total: totalDecimal.toNumber(),
    pedidos,
  }
}

async function meuSaldo(req, res) {
  const saldo = await saldoPorUsuario(req.usuário.id)
  return res.json(saldo)
}

async function saldoUsuario(req, res) {
  const saldo = await saldoPorUsuario(req.params.usuárioId)
  return res.json(saldo)
}

module.exports = {
  criarPedido,
  criarPedidoAdmin,
  listarPedidos,
  buscarPedido,
  pagarPedido,
  meuSaldo,
  saldoUsuario,
}
