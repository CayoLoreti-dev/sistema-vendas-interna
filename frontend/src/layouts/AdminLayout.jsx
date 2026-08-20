import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
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
  const [verificandoNotificacao, setVerificandoNotificacao] = useState(true)
  const [notificacaoMensagem, setNotificacaoMensagem] = useState('')
  const [ativandoNotificacao, setAtivandoNotificacao] = useState(false)
  const isMaster = usuario?.papel === 'ADMIN'

  useEffect(() => {
    async function conferirSubscription() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setVerificandoNotificacao(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      const ativa = Notification.permission === 'granted' && Boolean(subscription)

      setSubscriptionAtiva(ativa)

      if (ativa) {
        await api.post('/push/subscribe', subscription.toJSON())
      }
    }

    conferirSubscription().catch(() => {
      setSubscriptionAtiva(false)
    }).finally(() => {
      setVerificandoNotificacao(false)
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
        await api.post('/push/subscribe', subscriptionExistente.toJSON())
        setSubscriptionAtiva(true)
        setNotificacaoMensagem('Notificacoes ativadas neste aparelho.')
        return
      }

      const { publicKey } = await api.get('/push/vapid-public-key')

      if (!publicKey) {
        setNotificacaoMensagem('Notificacoes ainda nao foram configuradas no servidor.')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await api.post('/push/subscribe', subscription.toJSON())
      setSubscriptionAtiva(true)
      setNotificacaoMensagem('Notificacoes ativadas neste aparelho.')
    } catch (error) {
      setNotificacaoMensagem(error.message || 'Nao foi possivel ativar as notificacoes agora.')
    } finally {
      setAtivandoNotificacao(false)
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow brand-name">Vendas Interna</p>
          <span>{isMaster ? 'Painel master' : 'Painel do vendedor'}</span>
        </div>

        <div className="sidebar-user">
          <span>Usuario</span>
          <strong>{usuario?.nome}</strong>
          <small>{isMaster ? 'Master' : 'Vendedor'}</small>
        </div>

        <nav className="admin-nav sidebar-nav" aria-label="Navegacao administrativa">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/produtos">Produtos</NavLink>
          <NavLink to="/admin/funcionarios">Clientes</NavLink>
          <NavLink to="/admin/pedidos">Pedidos</NavLink>
          <NavLink to="/admin/faturas">Faturas</NavLink>
        </nav>

        <div className="admin-actions sidebar-actions">
          {!verificandoNotificacao && !subscriptionAtiva && (
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
      </aside>

      <main className="admin-content app-content">
        <div className="app-topbar">
          <ThemeToggle />
        </div>

        {notificacaoMensagem && (
          <p className={subscriptionAtiva ? 'success' : 'error'}>{notificacaoMensagem}</p>
        )}
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
