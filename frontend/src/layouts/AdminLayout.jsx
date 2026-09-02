import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import StoreIdentity from '../components/StoreIdentity'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useStoreConfig } from '../context/StoreConfigContext'
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
  const { config } = useStoreConfig()
  const [subscriptionAtiva, setSubscriptionAtiva] = useState(false)
  const [verificandoNotificacao, setVerificandoNotificacao] = useState(true)
  const [notificacaoMensagem, setNotificacaoMensagem] = useState('')
  const [ativandoNotificacao, setAtivandoNotificacao] = useState(false)
  const isMaster = usuario?.papel === 'ADMIN'
  const basePath = isMaster ? '/admin' : '/vendedor'

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
      setNotificacaoMensagem('Este navegador não permite notificações push.')
      return
    }

    setAtivandoNotificacao(true)

    try {
      const permissao = await Notification.requestPermission()

      if (permissao !== 'granted') {
        setNotificacaoMensagem('Permissão negada. As notificações não foram ativadas.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscriptionExistente = await registration.pushManager.getSubscription()

      if (subscriptionExistente) {
        await api.post('/push/subscribe', subscriptionExistente.toJSON())
        setSubscriptionAtiva(true)
        setNotificacaoMensagem('Notificações ativadas neste aparelho.')
        return
      }

      const { publicKey } = await api.get('/push/vapid-public-key')

      if (!publicKey) {
        setNotificacaoMensagem('Notificações ainda não foram configuradas no servidor.')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await api.post('/push/subscribe', subscription.toJSON())
      setSubscriptionAtiva(true)
      setNotificacaoMensagem('Notificações ativadas neste aparelho.')
    } catch (error) {
      setNotificacaoMensagem(error.message || 'Não foi possível ativar as notificações agora.')
    } finally {
      setAtivandoNotificacao(false)
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <StoreIdentity config={config} />
          <span className="sidebar-context">{isMaster ? 'Painel master' : 'Painel do vendedor'}</span>
        </div>

        <div className="sidebar-user">
          <span>Usuário</span>
          <strong>{usuario?.nome}</strong>
          <small>{isMaster ? 'Master' : 'Vendedor'}</small>
        </div>

        <nav className="admin-nav sidebar-nav" aria-label="Navegação administrativa">
          <NavLink to={basePath} end>Dashboard</NavLink>
          <NavLink to={`${basePath}/produtos`}>Produtos</NavLink>
          <NavLink to={`${basePath}/estoque`}>Meu estoque</NavLink>
          <NavLink to={`${basePath}/funcionarios`}>Clientes</NavLink>
          <NavLink to={`${basePath}/pedidos`}>Pedidos</NavLink>
          <NavLink to={`${basePath}/faturas`}>Faturas</NavLink>
          <NavLink to={`${basePath}/configuracoes`}>Configurações da loja</NavLink>
          <NavLink to={`${basePath}/senha`}>Alterar senha</NavLink>
        </nav>

        <div className="admin-actions sidebar-actions">
          {!verificandoNotificacao && !subscriptionAtiva && (
            <button
              className="secondary-button"
              disabled={ativandoNotificacao}
              onClick={ativarNotificacoes}
              type="button"
            >
              {ativandoNotificacao ? 'Ativando...' : 'Ativar notificações'}
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
