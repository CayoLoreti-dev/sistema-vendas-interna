import { useState } from 'react'
import { api } from '../services/api'

function AlterarSenhaPage() {
  const [senha, setSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function salvarSenha(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')

    if (senha.length < 4) {
      setErro('A nova senha precisa ter pelo menos 4 caracteres.')
      return
    }

    if (senha !== confirmacaoSenha) {
      setErro('As senhas digitadas não são iguais.')
      return
    }

    setSalvando(true)

    try {
      await api.patch('/usuarios/me/senha', { senha })
      setSenha('')
      setConfirmacaoSenha('')
      setMensagem('Senha alterada com sucesso.')
    } catch (error) {
      setErro(error.message || 'Não foi possível alterar a senha agora.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Conta</p>
        <h1>Alterar senha</h1>
      </div>

      <form className="form-panel password-panel" onSubmit={salvarSenha}>
        <div>
          <h2>Nova senha</h2>
          <p className="muted">Digite a nova senha que você quer usar para entrar no sistema.</p>
        </div>

        <div className="form-grid">
          <label>
            Nova senha
            <input
              autoComplete="new-password"
              minLength={4}
              onChange={(event) => setSenha(event.target.value)}
              required
              type="password"
              value={senha}
            />
          </label>

          <label>
            Repetir nova senha
            <input
              autoComplete="new-password"
              minLength={4}
              onChange={(event) => setConfirmacaoSenha(event.target.value)}
              required
              type="password"
              value={confirmacaoSenha}
            />
          </label>
        </div>

        {erro && <p className="error">{erro}</p>}
        {mensagem && <p className="success">{mensagem}</p>}

        <div className="actions">
          <button disabled={salvando} type="submit">
            {salvando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AlterarSenhaPage
