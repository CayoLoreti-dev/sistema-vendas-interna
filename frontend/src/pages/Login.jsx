import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const auth = await login(telefone, senha)
      navigate(auth.usuario.papel === 'ADMIN' ? '/admin' : '/funcionario', {
        replace: true,
      })
    } catch {
      setErro('Telefone ou senha invalidos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow brand-name">Vendas Interna</p>
          <h1>Entrar</h1>
        </div>

        <label>
          Telefone
          <input
            autoComplete="tel"
            inputMode="numeric"
            maxLength={11}
            onChange={(event) => setTelefone(event.target.value.replace(/\D/g, ''))}
            required
            type="tel"
            value={telefone}
          />
        </label>

        <label>
          Senha
          <input
            autoComplete="current-password"
            onChange={(event) => setSenha(event.target.value)}
            required
            type="password"
            value={senha}
          />
        </label>

        {erro && <p className="error">{erro}</p>}

        <button disabled={carregando} type="submit">
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="auth-link">
          Primeiro acesso? <Link to="/cadastro">Criar conta</Link>
        </p>
      </form>
    </main>
  )
}

export default Login
