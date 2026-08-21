const prisma = require('../lib/prisma')

function vapidPublicKey(req, res) {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ mensagem: 'Notificações ainda não foram configuradas no servidor' })
  }

  return res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
}

async function subscribe(req, res) {
  const { endpoint, keys } = req.body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ mensagem: 'Inscrição de notificação inválida' })
  }

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      usuárioId: req.usuário.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      usuárioId: req.usuário.id,
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
