const webpush = require('web-push')
const prisma = require('./prisma')

function configurarWebPush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.warn('Push desativado: chaves VAPID não configuradas')
    return false
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  return true
}

const pushConfigurado = configurarWebPush()

async function enviarNotificacaoAdmins(payload) {
  if (!pushConfigurado) {
    return
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      usuario: {
        papel: {
          in: ['ADMIN', 'VENDEDOR'],
        },
      },
    },
  })

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
      )
    } catch (error) {
      console.error('Erro ao enviar notificação push', error)
    }
  }))
}

module.exports = {
  enviarNotificacaoAdmins,
}
