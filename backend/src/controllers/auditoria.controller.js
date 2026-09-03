const prisma = require('../lib/prisma')

async function listarAuditoria(req, res) {
  const auditorias = await prisma.auditoria.findMany({
    take: 100,
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
