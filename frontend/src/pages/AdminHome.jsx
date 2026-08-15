import { useAuth } from '../context/AuthContext'

function AdminHome() {
  const { usuario, logout } = useAuth()

  return (
    <main className="home-page">
      <section>
        <p className="eyebrow">Ola, {usuario?.nome}</p>
        <h1>Painel administrativo - em construcao</h1>
        <button type="button" onClick={logout}>Sair</button>
      </section>
    </main>
  )
}

export default AdminHome
