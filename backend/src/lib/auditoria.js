const prisma = require('./prisma')

async function registrarAuditoria(client = prisma, dados = {}) {
  const { usuarioId, acao, entidade, entidadeId, detalhes } = dados

  if (!acao || !entidade) {
    return null
  }

  return client.auditoria.create({
    data: {
      usuarioId: usuarioId || null,
      acao,
      entidade,
      entidadeId: entidadeId || null,
      detalhes: detalhes || undefined,
    },
  })
}

module.exports = {
  registrarAuditoria,
}
