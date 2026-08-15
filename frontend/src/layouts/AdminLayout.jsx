import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

function AdminLayout() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [subscriptionAtiva, setSubscriptionAtiva] = useState(false)
  const [notificacaoMensagem, setNotificacaoMensagem] = useState('')
  const [ativandoNotificacao, setAtivandoNotificacao] = useState(false)

  useEffect(() => {
    async function conferirSubscription() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setSubscriptionAtiva(Boolean(subscription))
    }

    conferirSubscription().catch(() => {
      setSubscriptionAtiva(false)
    })
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function ativarNotificacoes() {
    setNotificacaoMensagem('')

    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotificacaoMensagem('Este navegador nao permite notificacoes push.')
      return
    }

    setAtivandoNotificacao(true)

    try {
      const permissao = await Notification.requestPermission()

      if (permissao !== 'granted') {
        setNotificacaoMensagem('Permissao negada. As notificacoes nao foram ativadas.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscriptionExistente = await registration.pushManager.getSubscription()

      if (subscriptionExistente) {
        setSubscriptionAtiva(true)
        setNotificacaoMensagem('Notificacoes ja estavam ativadas neste aparelho.')
        return
      }

      const { publicKey } = await api.get('/push/vapid-public-key')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await api.post('/push/subscribe', subscription.toJSON())
      setSubscriptionAtiva(true)
      setNotificacaoMensagem('Notificacoes ativadas neste aparelho.')
    } catch {
      setNotificacaoMensagem('Nao foi possivel ativar as notificacoes agora.')
    } finally {
      setAtivandoNotificacao(false)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Vendas Interna</p>
          <strong>{usuario?.nome}</strong>
        </div>

        <nav className="admin-nav" aria-label="Navegacao administrativa">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/produtos">Produtos</NavLink>
          <NavLink to="/admin/funcionarios">Funcionarios</NavLink>
          <NavLink to="/admin/pedidos">Pedidos</NavLink>
        </nav>

        <div className="admin-actions">
          {!subscriptionAtiva && (
            <button
              className="secondary-button"
              disabled={ativandoNotificacao}
              onClick={ativarNotificacoes}
              type="button"
            >
              {ativandoNotificacao ? 'Ativando...' : 'Ativar notificacoes'}
            </button>
          )}
          <button type="button" onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="admin-content">
        {notificacaoMensagem && (
          <p className={subscriptionAtiva ? 'success' : 'error'}>{notificacaoMensagem}</p>
        )}
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
