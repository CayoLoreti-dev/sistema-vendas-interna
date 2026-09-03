import { useEffect, useState } from 'react'
import { api } from '../services/api'

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function AuditoriaPage() {
  const [eventos, setEventos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarAuditoria() {
      setErro('')
      setCarregando(true)

      try {
        const dados = await api.get('/auditoria')
        setEventos(dados)
      } catch (error) {
        setErro(error.message || 'Não foi possível carregar a auditoria.')
      } finally {
        setCarregando(false)
      }
    }

    carregarAuditoria()
  }, [])

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Auditoria</p>
        <h1>Atividades recentes</h1>
      </div>

      {erro && <p className="error">{erro}</p>}

      <div className="table-panel">
        {carregando ? (
          <p className="muted">Carregando auditoria...</p>
        ) : eventos.length === 0 ? (
          <p className="muted">Nenhuma atividade registrada ainda.</p>
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
