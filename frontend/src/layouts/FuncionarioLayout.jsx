import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'

function FuncionarioLayout() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="funcionario-shell">
      <aside className="funcionario-sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow brand-name">Vendas Interna</p>
          <span>Área do funcionário</span>
        </div>

        <div className="sidebar-user">
          <span>Usuário</span>
          <strong>{usuario?.nome}</strong>
        </div>

        <nav className="funcionario-nav sidebar-nav" aria-label="Navegação do funcionário">
          <NavLink to="/funcionario" end>Catálogo</NavLink>
          <NavLink to="/funcionario/saldo">Meu saldo</NavLink>
        </nav>

        <div className="admin-actions sidebar-actions">
          <button type="button" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      <main className="funcionario-content app-content">
        <div className="app-topbar">
          <ThemeToggle />
        </div>

        <Outlet />
      </main>
    </div>
  )
}

export default FuncionarioLayout
