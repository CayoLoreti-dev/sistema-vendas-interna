import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

const funcionarioInicial = {
  nome: '',
  telefone: '',
  senha: '',
  papel: 'FUNCIONARIO',
}

function FuncionariosPage() {
  const { usuario } = useAuth()
  const [funcionarios, setFuncionarios] = useState([])
  const [form, setForm] = useState(funcionarioInicial)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [alterandoStatusId, setAlterandoStatusId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function carregarFuncionarios() {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get('/usuarios')
      setFuncionarios(dados)
    } catch {
      setErro('Não foi possível carregar os funcionários.')
    } finally {
      setCarregando(false)
    }
  }

  async function alterarStatus(funcionario, status) {
    setErro('')
    setMensagem('')
    setAlterandoStatusId(funcionario.id)

    try {
      await api.patch(`/usuarios/${funcionario.id}/status`, { status })
      setMensagem(`Status de ${funcionario.nome} atualizado.`)
      await carregarFuncionarios()
    } catch (error) {
      setErro(error.message || 'Não foi possível alterar o status desse acesso.')
    } finally {
      setAlterandoStatusId(null)
    }
  }

  function statusLabel(status) {
    const labels = {
      ATIVO: 'Ativo',
      PENDENTE: 'Pendente',
      BLOQUEADO: 'Bloqueado',
    }

    return labels[status] || 'Ativo'
  }

  useEffect(() => {
    carregarFuncionarios()
  }, [])

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  async function cadastrarFuncionario(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')

    if (!/^\d{11}$/.test(form.telefone)) {
      setErro('O telefone deve ter exatamente 11 números.')
      return
    }

    setSalvando(true)

    try {
      await api.post('/usuarios', {
        nome: form.nome,
        telefone: form.telefone,
        senha: form.senha,
        papel: usuario?.papel === 'ADMIN' ? form.papel : 'FUNCIONARIO',
      })

      setForm(funcionarioInicial)
      setMensagem('Acesso cadastrado com sucesso.')
      await carregarFuncionarios()
    } catch (error) {
      if (error.message === 'Telefone já cadastrado') {
        setErro('Esse telefone já está cadastrado.')
      } else {
        setErro('Não foi possível cadastrar o funcionario.')
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Acessos</p>
        <h1>Clientes e vendedores</h1>
      </div>

      <form className="form-panel" onSubmit={cadastrarFuncionario}>
        <h2>Novo acesso</h2>

        <div className="form-grid">
          <label>
            Nome
            <input
              onChange={(event) => atualizarCampo('nome', event.target.value)}
              required
              type="text"
              value={form.nome}
            />
          </label>

          <label>
            Telefone
            <input
              inputMode="numeric"
              maxLength={11}
              onChange={(event) => atualizarCampo('telefone', event.target.value.replace(/\D/g, ''))}
              required
              type="tel"
              value={form.telefone}
            />
          </label>

          <label>
            Senha
            <input
              onChange={(event) => atualizarCampo('senha', event.target.value)}
              required
              type="password"
              value={form.senha}
            />
          </label>

          {usuario?.papel === 'ADMIN' && (
            <label>
              Tipo de acesso
              <select
                onChange={(event) => atualizarCampo('papel', event.target.value)}
                required
                value={form.papel}
              >
                <option value="FUNCIONARIO">Cliente</option>
                <option value="VENDEDOR">Vendedor</option>
                <option value="ADMIN">Master</option>
              </select>
            </label>
          )}
        </div>

        <button disabled={salvando} type="submit">
          {salvando ? 'Salvando...' : 'Cadastrar acesso'}
        </button>
      </form>

      {erro && <p className="error">{erro}</p>}
      {mensagem && <p className="success">{mensagem}</p>}

      <div className="table-panel">
        {carregando ? (
          <p>Carregando acessos...</p>
        ) : funcionarios.length === 0 ? (
          <p>Nenhum acesso cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Papel</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((funcionario) => (
                <tr key={funcionario.id}>
                  <td>{funcionario.nome}</td>
                  <td className="valor-mono">{funcionario.telefone}</td>
                  <td>{funcionario.papel}</td>
                  <td>
                    <span className={`status-pill ${funcionario.status?.toLowerCase() || 'ativo'}`}>
                      {statusLabel(funcionario.status)}
                    </span>
                  </td>
                  <td>{new Date(funcionario.criadoEm).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className="table-actions">
                      {funcionario.status !== 'ATIVO' && (
                        <button
                          className="compact-button secondary-button"
                          disabled={alterandoStatusId === funcionario.id}
                          onClick={() => alterarStatus(funcionario, 'ATIVO')}
                          type="button"
                        >
                          Ativar
                        </button>
                      )}
                      {funcionario.status !== 'PENDENTE' && (
                        <button
                          className="compact-button secondary-button"
                          disabled={alterandoStatusId === funcionario.id}
                          onClick={() => alterarStatus(funcionario, 'PENDENTE')}
                          type="button"
                        >
                          Pendência
                        </button>
                      )}
                      {funcionario.status !== 'BLOQUEADO' && (
                        <button
                          className="compact-button danger-button"
                          disabled={alterandoStatusId === funcionario.id}
                          onClick={() => alterarStatus(funcionario, 'BLOQUEADO')}
                          type="button"
                        >
                          Bloquear
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default FuncionariosPage
