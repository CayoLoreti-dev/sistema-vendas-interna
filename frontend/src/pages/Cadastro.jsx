import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function Cadastro() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')

    if (!/^\d{11}$/.test(telefone)) {
      setErro('Informe um telefone com exatamente 11 numeros.')
      return
    }

    setCarregando(true)

    try {
      await api.post('/usuarios/cadastro', {
        nome,
        telefone,
        senha,
      })

      await login(telefone, senha)
      navigate('/funcionario', { replace: true })
    } catch (error) {
      if (error.message === 'Telefone ja cadastrado') {
        setErro('Esse telefone ja esta cadastrado.')
      } else {
        setErro('Nao foi possivel criar sua conta agora.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow brand-name">Vendas Interna</p>
          <h1>Criar conta</h1>
        </div>

        <label>
          Nome
          <input
            autoComplete="name"
            onChange={(event) => setNome(event.target.value)}
            required
            type="text"
            value={nome}
          />
        </label>

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
            autoComplete="new-password"
            onChange={(event) => setSenha(event.target.value)}
            required
            type="password"
            value={senha}
          />
        </label>

        {erro && <p className="error">{erro}</p>}

        <button disabled={carregando} type="submit">
          {carregando ? 'Criando...' : 'Criar conta'}
        </button>

        <p className="auth-link">
          Ja tenho conta. <Link to="/login">Entrar</Link>
        </p>
      </form>
    </main>
  )
}

export default Cadastro
