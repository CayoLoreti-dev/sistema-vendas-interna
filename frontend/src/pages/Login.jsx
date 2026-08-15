import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [telefone, setTelefone] = useState('')
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const auth = await login(telefone, pin)
      navigate(auth.usuario.papel === 'ADMIN' ? '/admin' : '/funcionario', {
        replace: true,
      })
    } catch {
      setErro('Telefone ou PIN invalidos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Vendas Interna</p>
          <h1>Entrar</h1>
        </div>

        <label>
          Telefone
          <input
            autoComplete="tel"
            inputMode="tel"
            onChange={(event) => setTelefone(event.target.value)}
            required
            type="tel"
            value={telefone}
          />
        </label>

        <label>
          PIN
          <input
            autoComplete="current-password"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setPin(event.target.value)}
            pattern="[0-9]*"
            required
            type="password"
            value={pin}
          />
        </label>

        {erro && <p className="error">{erro}</p>}

        <button disabled={carregando} type="submit">
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

export default Login
