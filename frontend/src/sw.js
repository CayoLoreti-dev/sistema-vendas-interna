import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  const payload = event.data?.json() || {}
  const title = payload.title || 'Novo aviso'
  const body = payload.body || 'Voce tem uma nova notificacao.'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const appClient = clients.find((client) => client.url.includes(self.location.origin))

        if (appClient) {
          return appClient.focus()
        }

        return self.clients.openWindow('/')
      }),
  )
})
