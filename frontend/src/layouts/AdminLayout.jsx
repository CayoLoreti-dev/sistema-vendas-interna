import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminLayout() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
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

        <button type="button" onClick={handleLogout}>Sair</button>
      </header>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
