import { useEffect, useState } from 'react'
import { api } from '../services/api'

const filtros = [
  { label: 'Todos', value: '' },
  { label: 'Em aberto (fiado)', value: 'FIADO' },
  { label: 'Pago', value: 'PAGO' },
]

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    datéStyle: 'short',
    timeStyle: 'short',
  })
}

function statusLabel(status) {
  return status === 'PAGO' ? 'Pago' : 'Em aberto'
}

function metodoLabel(metodoPagamento) {
  return metodoPagamento === 'PIX' ? 'Pix combinado' : 'Fiado'
}

function PedidosPage() {
  const [status, setStatus] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [pagandoId, setPagandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function carregarPedidos(statusSelecionado = status) {
    setErro('')
    setCarregando(true)

    try {
      const query = statusSelecionado ? `?status=${statusSelecionado}` : ''
      const dados = await api.get(`/pedidos${query}`)
      setPedidos(dados)
    } catch {
      setErro('Não foi possível carregar os pedidos. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarPedidos(status)
  }, [status])

  async function marcarComoPago(pedido) {
    const confirmou = window.confirm(`Marcar o pedido de ${pedido.usuario.nome} como pago?`)

    if (!confirmou) {
      return
    }

    setErro('')
    setMensagem('')
    setPagandoId(pedido.id)

    try {
      await api.patch(`/pedidos/${pedido.id}/pagar`)
      setMensagem('Pedido marcado como pago.')
      await carregarPedidos(status)
    } catch {
      setErro('Não foi possível marcar esse pedido como pago.')
    } finally {
      setPagandoId(null)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Pedidos</p>
        <h1>Pedidos</h1>
      </div>

      <div className="tabs" role="tablist" aria-label="Filtrar pedidos por status">
        {filtros.map((filtro) => (
          <button
            aria-selected={status === filtro.value}
            className={status === filtro.value ? 'tab-button active' : 'tab-button'}
            key={filtro.value || 'todos'}
            onClick={() => setStatus(filtro.value)}
            role="tab"
            type="button"
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {erro && <p className="error">{erro}</p>}
      {mensagem && <p className="success">{mensagem}</p>}

      <div className="orders-list">
        {carregando ? (
          <div className="page-panel">
            <p className="muted">Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="page-panel">
            <p className="muted">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <article className="order-card" key={pedido.id}>
              <div className="order-header">
                <div>
                  <strong>{pedido.usuario.nome}</strong>
                  <span>{formatarData(pedido.criadoEm)}</span>
                  <span className={`method-badge ${pedido.metodoPagamento === 'PIX' ? 'pix' : 'fiado'}`}>
                    {metodoLabel(pedido.metodoPagamento)}
                  </span>
                </div>

                <span className={`status-badge ${pedido.status === 'PAGO' ? 'paid' : 'open'}`}>
                  {statusLabel(pedido.status)}
                </span>
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
                {pedido.status === 'FIADO' && (
                  <button
                    disabled={pagandoId === pedido.id}
                    onClick={() => marcarComoPago(pedido)}
                    type="button"
                  >
                    {pagandoId === pedido.id ? 'Salvando...' : 'Marcar como pago'}
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default PedidosPage
