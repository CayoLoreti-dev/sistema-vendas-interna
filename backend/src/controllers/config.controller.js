const prisma = require('../lib/prisma')

const CONFIG_DEFAULTS = {
  nomeLoja: 'VendeMais',
  imagemUrl: '',
  pixChave: '',
  pixQrCode: '',
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
  const pixChave = String(req.body.pixChave || '').trim()
  const pixQrCode = String(req.body.pixQrCode || '').trim()

  if (!nomeLoja || nomeLoja.length > 40) {
    return res.status(400).json({ mensagem: 'Informe um nome de loja com ate 40 caracteres' })
  }

  const imagemValida = (valor) => /^https?:\/\/.+/i.test(valor)
    || /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(valor)

  if (imagemUrl && !imagemValida(imagemUrl)) {
    return res.status(400).json({ mensagem: 'Informe uma URL ou arquivo de imagem valido' })
  }

  if (pixChave.length > 160) {
    return res.status(400).json({ mensagem: 'Informe uma chave Pix com ate 160 caracteres' })
  }

  if (pixQrCode && !imagemValida(pixQrCode)) {
    return res.status(400).json({ mensagem: 'Informe uma imagem valida para o QR Code do Pix' })
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
    prisma.configuracao.upsert({
      where: { chave: 'pixChave' },
      update: { valor: pixChave },
      create: { chave: 'pixChave', valor: pixChave },
    }),
    prisma.configuracao.upsert({
      where: { chave: 'pixQrCode' },
      update: { valor: pixQrCode },
      create: { chave: 'pixQrCode', valor: pixQrCode },
    }),
  ])

  return obterConfiguracoes(req, res)
}

module.exports = {
  obterConfiguracoes,
  atualizarConfiguracoes,
}
