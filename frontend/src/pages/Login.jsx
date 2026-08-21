import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StoreIdentity from '../components/StoreIdentity'
import { useAuth } from '../context/AuthContext'
import { useStoreConfig } from '../context/StoreConfigContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { config } = useStoreConfig()
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
      navigate(['ADMIN', 'VENDEDOR'].includes(auth.usuario.papel) ? '/admin' : '/funcionario', {
        replace: true,
      })
    } catch {
      setErro('Telefone ou senha inválidos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <StoreIdentity config={config} />
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
