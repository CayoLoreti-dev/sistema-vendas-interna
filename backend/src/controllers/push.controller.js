const prisma = require('../lib/prisma')

function vapidPublicKey(req, res) {
  return res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
}

async function subscribe(req, res) {
  const { endpoint, keys } = req.body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ mensagem: 'Inscricao de notificacao invalida' })
  }

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      usuarioId: req.usuario.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      usuarioId: req.usuario.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  })

  return res.status(200).json({ id: subscription.id })
}

module.exports = {
  vapidPublicKey,
  subscribe,
}
