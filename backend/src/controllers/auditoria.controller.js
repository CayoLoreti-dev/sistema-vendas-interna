const prisma = require('../lib/prisma')

function parseData(valor, fimDia = false) {
  if (!valor) {
    return null
  }

  const horario = fimDia ? '23:59:59.999' : '00:00:00.000'
  const data = new Date(`${valor}T${horario}-03:00`)

  if (Number.isNaN(data.getTime())) {
    return null
  }

  return data
}

async function listarAuditoria(req, res) {
  const { acao, usuarioId, inicio, fim } = req.query
  const where = {}
  const take = Math.min(Number(req.query.take) || 100, 200)

  if (acao) {
    where.acao = acao
  }

  if (usuarioId) {
    where.usuarioId = usuarioId
  }

  const dataInicio = parseData(inicio)
  const dataFim = parseData(fim, true)

  if ((inicio && !dataInicio) || (fim && !dataFim)) {
    return res.status(400).json({ mensagem: 'Periodo invalido' })
  }

  if (dataInicio || dataFim) {
    where.criadoEm = {
      ...(dataInicio && { gte: dataInicio }),
      ...(dataFim && { lte: dataFim }),
    }
  }

  const auditorias = await prisma.auditoria.findMany({
    where,
    take,
    orderBy: {
      criadoEm: 'desc',
    },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          papel: true,
        },
      },
    },
  })

  return res.json(auditorias)
}

module.exports = {
  listarAuditoria,
}
