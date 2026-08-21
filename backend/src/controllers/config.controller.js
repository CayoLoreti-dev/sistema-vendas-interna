const prisma = require('../lib/prisma')

const CONFIG_DEFAULTS = {
  nomeLoja: 'VendeMais',
  imagemUrl: '',
}

function normalizarConfiguracoes(configuracoes) {
  return configuracoes.reduce((resultado, configuracao) => ({
    ...resultado,
    [configuracao.chave]: configuracao.valor,
  }), { ...CONFIG_DEFAULTS })
}

async function obterConfiguracoes(req, res) {
  const configuracoes = await prisma.configuracao.findMany({
    where: {
      chave: {
        in: Object.keys(CONFIG_DEFAULTS),
      },
    },
  })

  return res.json(normalizarConfiguracoes(configuracoes))
}

async function atualizarConfiguracoes(req, res) {
  const nomeLoja = String(req.body.nomeLoja || '').trim()
  const imagemUrl = String(req.body.imagemUrl || '').trim()

  if (!nomeLoja || nomeLoja.length > 40) {
    return res.status(400).json({ mensagem: 'Informe um nome de loja com ate 40 caracteres' })
  }

  const imagemValida = /^https?:\/\/.+/i.test(imagemUrl)
    || /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(imagemUrl)

  if (imagemUrl && !imagemValida) {
    return res.status(400).json({ mensagem: 'Informe uma URL ou arquivo de imagem valido' })
  }

  await prisma.$transaction([
    prisma.configuracao.upsert({
      where: { chave: 'nomeLoja' },
      update: { valor: nomeLoja },
      create: { chave: 'nomeLoja', valor: nomeLoja },
    }),
    prisma.configuracao.upsert({
      where: { chave: 'imagemUrl' },
      update: { valor: imagemUrl },
      create: { chave: 'imagemUrl', valor: imagemUrl },
    }),
  ])

  return obterConfiguracoes(req, res)
}

module.exports = {
  obterConfiguracoes,
  atualizarConfiguracoes,
}
