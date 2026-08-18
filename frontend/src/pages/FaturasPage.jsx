import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function metodoLabel(metodoPagamento) {
  return metodoPagamento === 'PIX' ? 'Pix combinado' : 'Fiado'
}

function FaturasPage() {
  const [faturas, setFaturas] = useState([])
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [pagandoId, setPagandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const clientesComConta = useMemo(() => (
    faturas.filter((fatura) => fatura.total > 0 || fatura.pedidos.length > 0)
  ), [faturas])

  const faturaSelecionada = useMemo(() => {
    if (!clienteSelecionadoId) {
      return clientesComConta[0] || null
    }

    return clientesComConta.find((fatura) => fatura.usuario.id === clienteSelecionadoId) || null
  }, [clienteSelecionadoId, clientesComConta])

  const totalGeral = useMemo(() => (
    clientesComConta.reduce((total, fatura) => total + Number(fatura.total), 0)
  ), [clientesComConta])

  async function carregarFaturas() {
    setErro('')
    setCarregando(true)

    try {
      const usuarios = await api.get('/usuarios')
      const funcionarios = usuarios.filter((usuario) => usuario.papel === 'FUNCIONARIO')
      const saldos = await Promise.all(funcionarios.map(async (usuario) => {
        const saldo = await api.get(`/pedidos/saldo/${usuario.id}`)

        return {
          usuario,
          total: Number(saldo.total),
          pedidos: saldo.pedidos,
        }
      }))

      setFaturas(saldos)
      setClienteSelecionadoId((atual) => {
        if (atual && saldos.some((fatura) => fatura.usuario.id === atual && fatura.pedidos.length > 0)) {
          return atual
        }

        return saldos.find((fatura) => fatura.pedidos.length > 0)?.usuario.id || ''
      })
    } catch {
      setErro('Nao foi possivel carregar as faturas. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarFaturas()
  }, [])

  async function marcarPedidoPago(pedido) {
    const confirmou = window.confirm(`Marcar este pedido de ${faturaSelecionada.usuario.nome} como pago?`)

    if (!confirmou) {
      return
    }

    setErro('')
    setMensagem('')
    setPagandoId(pedido.id)

    try {
      await api.patch(`/pedidos/${pedido.id}/pagar`)
      setMensagem('Pedido marcado como pago.')
      await carregarFaturas()
    } catch {
      setErro('Nao foi possivel marcar esse pedido como pago.')
    } finally {
      setPagandoId(null)
    }
  }

  async function fecharFatura() {
    if (!faturaSelecionada || faturaSelecionada.pedidos.length === 0) {
      return
    }

    const confirmou = window.confirm(`Marcar toda a fatura de ${faturaSelecionada.usuario.nome} como paga?`)

    if (!confirmou) {
      return
    }

    setErro('')
    setMensagem('')
    setPagandoId('fatura')

    try {
      await Promise.all(faturaSelecionada.pedidos.map((pedido) => (
        api.patch(`/pedidos/${pedido.id}/pagar`)
      )))
      setMensagem('Fatura marcada como paga.')
      await carregarFaturas()
    } catch {
      setErro('Nao foi possivel fechar a fatura inteira. Confira os pedidos e tente novamente.')
    } finally {
      setPagandoId(null)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Faturas</p>
        <h1>Conta dos clientes</h1>
      </div>

      {erro && <p className="error">{erro}</p>}
      {mensagem && <p className="success">{mensagem}</p>}

      {carregando ? (
        <div className="page-panel">
          <p className="muted">Carregando faturas...</p>
        </div>
      ) : clientesComConta.length === 0 ? (
        <div className="page-panel positive-panel">
          <h2>Todo mundo esta em dia!</h2>
          <p>Nenhum cliente tem pedido em aberto agora.</p>
        </div>
      ) : (
        <div className="invoice-layout">
          <aside className="invoice-list" aria-label="Clientes com conta em aberto">
            <div className="invoice-total-card">
              <span>Total em aberto</span>
              <strong className="valor-mono">{moeda.format(totalGeral)}</strong>
            </div>

            {clientesComConta.map((fatura) => (
              <button
                className={faturaSelecionada?.usuario.id === fatura.usuario.id ? 'invoice-client active' : 'invoice-client'}
                key={fatura.usuario.id}
                onClick={() => setClienteSelecionadoId(fatura.usuario.id)}
                type="button"
              >
                <span>{fatura.usuario.nome}</span>
                <strong className="valor-mono">{moeda.format(fatura.total)}</strong>
                <small className="valor-mono">{fatura.pedidos.length} pedido(s)</small>
              </button>
            ))}
          </aside>

          {faturaSelecionada && (
            <section className="invoice-detail">
              <div className="invoice-detail-header">
                <div>
                  <p className="eyebrow">Fatura aberta</p>
                  <h2>{faturaSelecionada.usuario.nome}</h2>
                </div>

                <div className="invoice-actions">
                  <strong className="valor-mono">{moeda.format(faturaSelecionada.total)}</strong>
                  <button
                    disabled={pagandoId === 'fatura'}
                    onClick={fecharFatura}
                    type="button"
                  >
                    {pagandoId === 'fatura' ? 'Fechando...' : 'Marcar fatura como paga'}
                  </button>
                </div>
              </div>

              <div className="orders-list">
                {faturaSelecionada.pedidos.map((pedido) => (
                  <article className="order-card" key={pedido.id}>
                    <div className="order-header">
                      <div>
                        <strong>{formatarData(pedido.criadoEm)}</strong>
                        <span className={`method-badge ${pedido.metodoPagamento === 'PIX' ? 'pix' : 'fiado'}`}>
                          {metodoLabel(pedido.metodoPagamento)}
                        </span>
                      </div>

                      <span className="status-badge open">Em aberto</span>
                    </div>

                    <ul className="items-list">
                      {pedido.itens.map((item) => (
                        <li key={item.id}>
                          <span>{item.produto.nome}</span>
                          <strong className="valor-mono">{item.quantidade} un.</strong>
                        </li>
                      ))}
                    </ul>

                    <div className="order-footer">
                      <strong className="valor-mono">{moeda.format(Number(pedido.valorTotal))}</strong>
                      <button
                        className="secondary-button"
                        disabled={pagandoId === pedido.id}
                        onClick={() => marcarPedidoPago(pedido)}
                        type="button"
                      >
                        {pagandoId === pedido.id ? 'Salvando...' : 'Marcar pedido como pago'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  )
}

export default FaturasPage
