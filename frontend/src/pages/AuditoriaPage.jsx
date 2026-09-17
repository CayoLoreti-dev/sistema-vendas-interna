import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const acoesAuditoria = [
  'LOGIN_SUCESSO',
  'PEDIDO_CRIADO',
  'PEDIDO_PAGO',
  'ITEM_PEDIDO_REMOVIDO',
  'USUARIO_CRIADO',
  'USUARIO_STATUS_ALTERADO',
  'SENHA_ALTERADA',
]

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function AuditoriaPage() {
  const [eventos, setEventos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [acao, setAcao] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const query = useMemo(() => {
    const params = new URLSearchParams()

    if (acao) params.set('acao', acao)
    if (usuarioId) params.set('usuarioId', usuarioId)
    if (inicio) params.set('inicio', inicio)
    if (fim) params.set('fim', fim)

    return params.toString()
  }, [acao, fim, inicio, usuarioId])

  const carregarAuditoria = useCallback(async () => {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get(`/auditoria${query ? `?${query}` : ''}`)
      setEventos(dados)
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar a auditoria.')
    } finally {
      setCarregando(false)
    }
  }, [query])

  useEffect(() => {
    carregarAuditoria()
  }, [carregarAuditoria])

  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const dados = await api.get('/usuarios')
        setUsuarios(dados)
      } catch {
        setUsuarios([])
      }
    }

    carregarUsuarios()
  }, [])

  function limparFiltros() {
    setAcao('')
    setUsuarioId('')
    setInicio('')
    setFim('')
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Auditoria</p>
        <h1>Atividades recentes</h1>
      </div>

      <form className="filter-panel" onSubmit={(event) => event.preventDefault()}>
        <label>
          Ação
          <select onChange={(event) => setAcao(event.target.value)} value={acao}>
            <option value="">Todas</option>
            {acoesAuditoria.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Usuário
          <select onChange={(event) => setUsuarioId(event.target.value)} value={usuarioId}>
            <option value="">Todos</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Início
          <input onChange={(event) => setInicio(event.target.value)} type="date" value={inicio} />
        </label>

        <label>
          Fim
          <input onChange={(event) => setFim(event.target.value)} type="date" value={fim} />
        </label>

        <button className="secondary-button" onClick={limparFiltros} type="button">
          Limpar filtros
        </button>
      </form>

      {erro && <p className="error">{erro}</p>}

      <div className="table-panel">
        {carregando ? (
          <p className="muted">Carregando auditoria...</p>
        ) : eventos.length === 0 ? (
          <div className="empty-state">
            <h2>Nenhuma atividade encontrada</h2>
            <p className="muted">Altere os filtros para ver outros registros do sistema.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Entidade</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id}>
                  <td>{formatarData(evento.criadoEm)}</td>
                  <td>{evento.usuario?.nome || 'Sistema'}</td>
                  <td>{evento.acao}</td>
                  <td>{evento.entidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default AuditoriaPage
