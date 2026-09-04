const prisma = require('../lib/prisma')

const FUSO_APP = 'America/Sao_Paulo'

function dataLocalISO(data = new Date()) {
  return data.toLocaleDateString('sv-SE', {
    timeZone: FUSO_APP,
  })
}

function parseDataPeriodo(valor, fimDia = false) {
  const data = String(valor || dataLocalISO()).trim()
  const horario = fimDia ? '23:59:59.999' : '00:00:00.000'
  const parsed = new Date(`${data}T${horario}-03:00`)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function periodoDaQuery(query) {
  const inicio = parseDataPeriodo(query.inicio, false)
  const fim = parseDataPeriodo(query.fim, true)

  if (!inicio || !fim || inicio > fim) {
    return null
  }

  return { inicio, fim }
}

function pedidoIncludeRelatorio() {
  return {
    usuario: {
      select: {
        id: true,
        nome: true,
        telefone: true,
      },
    },
    itens: {
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            categoria: true,
          },
        },
      },
    },
  }
}

function custoMedio(custosPorProduto, produtoId) {
  const custo = custosPorProduto.get(produtoId)

  if (!custo || custo.quantidade <= 0) {
    return 0
  }

  return custo.totalPago / custo.quantidade
}

function montarResumo(pedidos, custosPorProduto = new Map()) {
  const produtosPorId = new Map()

  const totais = pedidos.reduce((acumulado, pedido) => {
    const valorPedido = Number(pedido.valorTotal)

    acumulado.totalVendido += valorPedido
    acumulado.totalPedidos += 1

    if (pedido.status === 'PAGO') {
      acumulado.totalPago += valorPedido
    } else {
      acumulado.totalEmAberto += valorPedido
    }

    if (pedido.metodoPagamento === 'PIX') {
      acumulado.totalPix += valorPedido
    } else {
      acumulado.totalFiado += valorPedido
    }

    for (const item of pedido.itens) {
      const subtotal = Number(item.precoUnitario) * item.quantidade
      const custoUnitarioEstimado = custoMedio(custosPorProduto, item.produtoId)
      const custoTotalEstimado = custoUnitarioEstimado * item.quantidade
      const lucroEstimado = subtotal - custoTotalEstimado
      const produtoAtual = produtosPorId.get(item.produtoId) || {
        produtoId: item.produtoId,
        nome: item.produto.nome,
        categoria: item.produto.categoria,
        quantidade: 0,
        total: 0,
        custoMedio: custoUnitarioEstimado,
        custoTotal: 0,
        lucro: 0,
      }

      produtoAtual.quantidade += item.quantidade
      produtoAtual.total += subtotal
      produtoAtual.custoTotal += custoTotalEstimado
      produtoAtual.lucro += lucroEstimado
      acumulado.totalItens += item.quantidade
      acumulado.custoEstimado += custoTotalEstimado
      acumulado.lucroEstimado += lucroEstimado
      produtosPorId.set(item.produtoId, produtoAtual)
    }

    return acumulado
  }, {
    totalVendido: 0,
    totalPago: 0,
    totalEmAberto: 0,
    totalPix: 0,
    totalFiado: 0,
    totalPedidos: 0,
    totalItens: 0,
    custoEstimado: 0,
    lucroEstimado: 0,
  })

  totais.margemLucro = totais.totalVendido > 0
    ? (totais.lucroEstimado / totais.totalVendido) * 100
    : 0

  return {
    totais,
    produtos: Array.from(produtosPorId.values()).sort((a, b) => b.quantidade - a.quantidade),
    pedidos,
  }
}

async function buscarCustosMedios(produtoIds) {
  if (produtoIds.length === 0) {
    return new Map()
  }

  const entradas = await prisma.movimentacaoEstoque.findMany({
    where: {
      tipo: 'ENTRADA',
      produtoId: {
        in: produtoIds,
      },
      precoPago: {
        not: null,
      },
      quantidade: {
        gt: 0,
      },
    },
    select: {
      produtoId: true,
      quantidade: true,
      precoPago: true,
    },
  })

  return entradas.reduce((custos, entrada) => {
    const atual = custos.get(entrada.produtoId) || {
      quantidade: 0,
      totalPago: 0,
    }

    atual.quantidade += entrada.quantidade
    atual.totalPago += Number(entrada.precoPago)
    custos.set(entrada.produtoId, atual)

    return custos
  }, new Map())
}

async function buscarPedidosPeriodo(periodo) {
  return prisma.pedido.findMany({
    where: {
      criadoEm: {
        gte: periodo.inicio,
        lte: periodo.fim,
      },
    },
    include: pedidoIncludeRelatorio(),
    orderBy: {
      criadoEm: 'desc',
    },
  })
}

async function fechamento(req, res) {
  const periodo = periodoDaQuery(req.query)

  if (!periodo) {
    return res.status(400).json({ mensagem: 'Periodo invalido' })
  }

  const pedidos = await buscarPedidosPeriodo(periodo)
  const produtoIds = [...new Set(pedidos.flatMap((pedido) => pedido.itens.map((item) => item.produtoId)))]
  const custosPorProduto = await buscarCustosMedios(produtoIds)

  return res.json({
    inicio: periodo.inicio,
    fim: periodo.fim,
    ...montarResumo(pedidos, custosPorProduto),
  })
}

function csvCell(valor) {
  return `"${String(valor ?? '').replace(/"/g, '""')}"`
}

function linhaCsv(colunas) {
  return colunas.map(csvCell).join(';')
}

async function fechamentoCsv(req, res) {
  const periodo = periodoDaQuery(req.query)

  if (!periodo) {
    return res.status(400).json({ mensagem: 'Periodo invalido' })
  }

  const pedidos = await buscarPedidosPeriodo(periodo)
  const produtoIds = [...new Set(pedidos.flatMap((pedido) => pedido.itens.map((item) => item.produtoId)))]
  const custosPorProduto = await buscarCustosMedios(produtoIds)
  const linhas = [
    linhaCsv([
      'Data',
      'Cliente',
      'Telefone',
      'Status',
      'Pagamento',
      'Produto',
      'Quantidade',
      'Preco unitario',
      'Custo unitario estimado',
      'Subtotal',
      'Lucro estimado',
      'Total pedido',
    ]),
  ]

  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      const subtotal = Number(item.precoUnitario) * item.quantidade
      const custoUnitarioEstimado = custoMedio(custosPorProduto, item.produtoId)
      const lucroEstimado = subtotal - custoUnitarioEstimado * item.quantidade

      linhas.push(linhaCsv([
        pedido.criadoEm.toISOString(),
        pedido.usuario.nome,
        pedido.usuario.telefone,
        pedido.status,
        pedido.metodoPagamento,
        item.produto.nome,
        item.quantidade,
        Number(item.precoUnitario).toFixed(2),
        custoUnitarioEstimado.toFixed(2),
        subtotal.toFixed(2),
        lucroEstimado.toFixed(2),
        Number(pedido.valorTotal).toFixed(2),
      ]))
    }
  }

  const nomeArquivo = `fechamento-${dataLocalISO(new Date(periodo.inicio))}-${dataLocalISO(new Date(periodo.fim))}.csv`

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
  return res.send(`\uFEFF${linhas.join('\n')}`)
}

module.exports = {
  fechamento,
  fechamentoCsv,
}
