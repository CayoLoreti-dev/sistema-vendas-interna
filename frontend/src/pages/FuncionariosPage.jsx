import { useEffect, useState } from 'react'
import { api } from '../services/api'

const funcionarioInicial = {
  nome: '',
  telefone: '',
  senha: '',
}

function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState([])
  const [form, setForm] = useState(funcionarioInicial)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function carregarFuncionarios() {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get('/usuarios')
      setFuncionarios(dados)
    } catch {
      setErro('Nao foi possivel carregar os funcionarios.')
    } finally {
      setCarregando(false)
    }
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

    if (!/^\d{9}$/.test(form.telefone)) {
      setErro('O telefone deve ter exatamente 9 numeros.')
      return
    }

    setSalvando(true)

    try {
      await api.post('/usuarios', {
        nome: form.nome,
        telefone: form.telefone,
        senha: form.senha,
        papel: 'FUNCIONARIO',
      })

      setForm(funcionarioInicial)
      setMensagem('Funcionario cadastrado com sucesso.')
      await carregarFuncionarios()
    } catch (error) {
      if (error.message === 'Telefone ja cadastrado') {
        setErro('Esse telefone ja esta cadastrado.')
      } else {
        setErro('Nao foi possivel cadastrar o funcionario.')
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Funcionarios</p>
        <h1>Funcionarios</h1>
      </div>

      <form className="form-panel" onSubmit={cadastrarFuncionario}>
        <h2>Novo funcionario</h2>

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
              maxLength={9}
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
        </div>

        <button disabled={salvando} type="submit">
          {salvando ? 'Salvando...' : 'Cadastrar funcionario'}
        </button>
      </form>

      {erro && <p className="error">{erro}</p>}
      {mensagem && <p className="success">{mensagem}</p>}

      <div className="table-panel">
        {carregando ? (
          <p>Carregando funcionarios...</p>
        ) : funcionarios.length === 0 ? (
          <p>Nenhum funcionario cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Papel</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((funcionario) => (
                <tr key={funcionario.id}>
                  <td>{funcionario.nome}</td>
                  <td className="valor-mono">{funcionario.telefone}</td>
                  <td>{funcionario.papel}</td>
                  <td>{new Date(funcionario.criadoEm).toLocaleDateString('pt-BR')}</td>
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
