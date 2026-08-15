import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
      <header className="funcionario-topbar">
        <div>
          <p className="eyebrow brand-name">Vendas Interna</p>
          <strong>{usuario?.nome}</strong>
        </div>

        <nav className="funcionario-nav" aria-label="Navegacao do funcionario">
          <NavLink to="/funcionario" end>Catalogo</NavLink>
          <NavLink to="/funcionario/saldo">Meu saldo</NavLink>
        </nav>

        <button type="button" onClick={handleLogout}>Sair</button>
      </header>

      <main className="funcionario-content">
        <Outlet />
      </main>
    </div>
  )
}

export default FuncionarioLayout
