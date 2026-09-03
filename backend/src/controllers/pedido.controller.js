const { Prisma } = require('@prisma/client')
const { registrarAuditoria } = require('../lib/auditoria')
const { enviarNotificacaoAdmins } = require('../lib/push')
const prisma = require('../lib/prisma')

class PedidoError extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.status = status
    this.mensagem = mensagem
  }
}

function validarEAgruparItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new PedidoError(400, 'Itens deve ser um array nao vazio')
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
    usuario: {
      select: {
        id: true,
        nome: true,
      },
    },
  }
}

function validarMetodoPagamento(metodoPagamento) {
  if (!['FIADO', 'PIX'].includes(metodoPagamento)) {
    throw new PedidoError(400, 'Escolha uma forma de pagamento valida')
  }

  return metodoPagamento
}

function validarComprovantePix(metodoPagamento, dados = {}) {
  if (metodoPagamento !== 'PIX') {
    return {}
  }

  const comprovantePix = String(dados.comprovantePix || '').trim()
  const comprovantePixNome = String(dados.comprovantePixNome || 'comprovante-pix').trim().slice(0, 120)

  if (!comprovantePix) {
    throw new PedidoError(400, 'Anexe o comprovante do Pix antes de finalizar o pedido')
  }

  const comprovanteValido = /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(comprovantePix)

  if (!comprovanteValido) {
    throw new PedidoError(400, 'Anexe um comprovante em imagem valida')
  }

  if (comprovantePix.length > 6_000_000) {
    throw new PedidoError(400, 'O comprovante precisa ter no maximo 4 MB')
  }

  return {
    comprovantePix,
    comprovantePixNome,
    comprovantePixEnviadoEm: new Date(),
  }
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

function precoAtualProduto(produto) {
  if (produto.promocaoAtiva && produto.precoPromocional) {
    return produto.precoPromocional
  }

  return produto.preco
}

function normalizarIdempotencyKey(idempotencyKey) {
  const chave = String(idempotencyKey || '').trim()

  if (!chave) {
    return null
  }

  return chave.slice(0, 120)
}

async function buscarPedidoIdempotente(idempotencyKey, usuarioId) {
  const pedido = await prisma.pedido.findUnique({
    where: {
      idempotencyKey,
    },
    include: pedidoInclude(),
  })

  if (!pedido) {
    return null
  }

  if (pedido.usuarioId !== usuarioId) {
    throw new PedidoError(409, 'Essa tentativa de pedido ja foi usada em outra conta')
  }

  return {
    ...pedido,
    pedidoJaRegistrado: true,
  }
}

async function criarPedidoParaUsuario(
  usuarioId,
  itensRecebidos,
  metodoPagamentoRecebido,
  dadosPagamento = {},
  opcoes = {},
) {
  const itens = validarEAgruparItens(itensRecebidos)
  const metodoPagamento = validarMetodoPagamento(metodoPagamentoRecebido)
  const comprovantePix = validarComprovantePix(metodoPagamento, dadosPagamento)
  const idempotencyKey = normalizarIdempotencyKey(opcoes.idempotencyKey)
  const auditoriaUsuarioId = opcoes.auditoriaUsuarioId || usuarioId

  if (idempotencyKey) {
    const pedidoExistente = await buscarPedidoIdempotente(idempotencyKey, usuarioId)

    if (pedidoExistente) {
      return pedidoExistente
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true },
      })

      if (!usuario) {
        throw new PedidoError(404, 'Cliente nao encontrado')
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
          throw new PedidoError(400, `Produto ${item.produtoId} nao encontrado`)
        }

        if (produto.estoqueAtual < item.quantidade) {
          throw new PedidoError(400, `Estoque insuficiente para o produto ${produto.nome}`)
        }
      }

      const valorTotal = itens.reduce((total, item) => {
        const produto = produtosPorId.get(item.produtoId)
        return total.add(precoAtualProduto(produto).mul(item.quantidade))
      }, new Prisma.Decimal(0))

      const pedidoCriado = await tx.pedido.create({
        data: {
          usuarioId,
          status: 'FIADO',
          metodoPagamento,
          valorTotal,
          idempotencyKey: idempotencyKey || undefined,
          ...comprovantePix,
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
            precoUnitario: precoAtualProduto(produto),
          },
        })
      }

      await registrarAuditoria(tx, {
        usuarioId: auditoriaUsuarioId,
        acao: 'PEDIDO_CRIADO',
        entidade: 'Pedido',
        entidadeId: pedidoCriado.id,
        detalhes: {
          usuarioId,
          metodoPagamento,
          valorTotal: valorTotal.toString(),
          itens,
        },
      })

      return tx.pedido.findUnique({
        where: { id: pedidoCriado.id },
        include: pedidoInclude(),
      })
    })
  } catch (error) {
    if (error.code === 'P2002' && idempotencyKey) {
      const pedidoExistente = await buscarPedidoIdempotente(idempotencyKey, usuarioId)

      if (pedidoExistente) {
        return pedidoExistente
      }
    }

    throw error
  }
}

function responderErroPedido(error, res) {
  if (error instanceof PedidoError) {
    return res.status(error.status).json({ mensagem: error.mensagem })
  }

  console.error('Erro inesperado ao criar pedido:', error)
  return res.status(500).json({ mensagem: 'Erro ao criar pedido' })
}

async function criarPedido(req, res) {
  try {
    const pedido = await criarPedidoParaUsuario(
      req.usuario.id,
      req.body.itens,
      req.body.metodoPagamento,
      {
        comprovantePix: req.body.comprovantePix,
        comprovantePixNome: req.body.comprovantePixNome,
      },
      {
        idempotencyKey: req.body.idempotencyKey || req.headers['idempotency-key'],
        auditoriaUsuarioId: req.usuario.id,
      },
    )

    if (!pedido.pedidoJaRegistrado) {
      enviarNotificacaoAdmins({
        title: 'Novo pedido!',
        body: `${pedido.usuario.nome} comprou por ${formatarMoeda(pedido.valorTotal)} - ${metodoPagamentoLabel(pedido.metodoPagamento)}`,
      }).catch((error) => {
        console.error('Erro ao disparar notificacao de novo pedido', error)
      })
    }

    return res.status(pedido.pedidoJaRegistrado ? 200 : 201).json(pedido)
  } catch (error) {
    return responderErroPedido(error, res)
  }
}

async function criarPedidoAdmin(req, res) {
  if (!req.body.usuarioId) {
    return res.status(400).json({ mensagem: 'Escolha um cliente para a fatura' })
  }

  try {
    const pedido = await criarPedidoParaUsuario(
      req.body.usuarioId,
      req.body.itens,
      req.body.metodoPagamento || 'FIADO',
      {},
      {
        idempotencyKey: req.body.idempotencyKey || req.headers['idempotency-key'],
        auditoriaUsuarioId: req.usuario.id,
      },
    )

    return res.status(pedido.pedidoJaRegistrado ? 200 : 201).json(pedido)
  } catch (error) {
    return responderErroPedido(error, res)
  }
}

async function listarPedidos(req, res) {
  const { status } = req.query
  const where = {}

  if (status) {
    if (!['FIADO', 'PAGO'].includes(status)) {
      return res.status(400).json({ mensagem: 'Status invalido' })
    }

    where.status = status
  }

  if (!['ADMIN', 'VENDEDOR'].includes(req.usuario.papel)) {
    where.usuarioId = req.usuario.id
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
    return res.status(404).json({ mensagem: 'Pedido nao encontrado' })
  }

  if (!['ADMIN', 'VENDEDOR'].includes(req.usuario.papel) && pedido.usuarioId !== req.usuario.id) {
    return res.status(403).json({ mensagem: 'Acesso negado' })
  }

  return res.json(pedido)
}

async function pagarPedido(req, res) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: req.params.id },
  })

  if (!pedido) {
    return res.status(404).json({ mensagem: 'Pedido nao encontrado' })
  }

  if (pedido.status === 'PAGO') {
    return res.status(400).json({ mensagem: 'Pedido ja esta pago' })
  }

  const pedidoPago = await prisma.pedido.update({
    where: { id: req.params.id },
    data: {
      status: 'PAGO',
      pagoEm: new Date(),
    },
    include: pedidoInclude(),
  })

  await registrarAuditoria(prisma, {
    usuarioId: req.usuario.id,
    acao: 'PEDIDO_PAGO',
    entidade: 'Pedido',
    entidadeId: pedidoPago.id,
    detalhes: {
      usuarioId: pedidoPago.usuarioId,
      valorTotal: pedidoPago.valorTotal.toString(),
    },
  })

  return res.json(pedidoPago)
}

async function removerItemPedido(req, res) {
  const { pedidoId, itemId } = req.params

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const item = await tx.itemPedido.findUnique({
        where: { id: itemId },
        include: {
          pedido: {
            include: {
              itens: true,
            },
          },
          produto: {
            select: {
              nome: true,
            },
          },
        },
      })

      if (!item || item.pedidoId !== pedidoId) {
        throw new PedidoError(404, 'Item da fatura nao encontrado')
      }

      if (item.pedido.status === 'PAGO') {
        throw new PedidoError(400, 'Nao e possivel retirar item de uma fatura ja paga')
      }

      await tx.produto.update({
        where: { id: item.produtoId },
        data: {
          estoqueAtual: {
            increment: item.quantidade,
          },
        },
      })

      await tx.itemPedido.delete({
        where: { id: item.id },
      })

      await registrarAuditoria(tx, {
        usuarioId: req.usuario.id,
        acao: 'ITEM_PEDIDO_REMOVIDO',
        entidade: 'Pedido',
        entidadeId: pedidoId,
        detalhes: {
          produtoId: item.produtoId,
          produto: item.produto.nome,
          quantidade: item.quantidade,
        },
      })

      if (item.pedido.itens.length === 1) {
        await tx.pedido.delete({
          where: { id: pedidoId },
        })

        return {
          pedidoRemovido: true,
          mensagem: `${item.produto.nome} retirado da fatura.`,
        }
      }

      const valorRemovido = item.precoUnitario.mul(item.quantidade)

      const pedidoAtualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          valorTotal: item.pedido.valorTotal.sub(valorRemovido),
        },
        include: pedidoInclude(),
      })

      return {
        pedidoRemovido: false,
        mensagem: `${item.produto.nome} retirado da fatura.`,
        pedido: pedidoAtualizado,
      }
    })

    return res.json(resultado)
  } catch (error) {
    if (error instanceof PedidoError) {
      return res.status(error.status).json({ mensagem: error.mensagem })
    }

    return res.status(500).json({ mensagem: 'Nao foi possivel retirar o item da fatura' })
  }
}

async function saldoPorUsuario(usuarioId) {
  const pedidos = await prisma.pedido.findMany({
    where: {
      usuarioId,
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
  const saldo = await saldoPorUsuario(req.usuario.id)
  return res.json(saldo)
}

async function saldoUsuario(req, res) {
  const saldo = await saldoPorUsuario(req.params.usuarioId)
  return res.json(saldo)
}

module.exports = {
  criarPedido,
  criarPedidoAdmin,
  listarPedidos,
  buscarPedido,
  pagarPedido,
  removerItemPedido,
  meuSaldo,
  saldoUsuario,
}
