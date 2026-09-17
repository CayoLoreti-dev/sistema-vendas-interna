import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, assetUrl } from '../services/api'

const filtros = [
  { label: 'Todos', value: '' },
  { label: 'Em aberto', value: 'FIADO' },
  { label: 'Pago', value: 'PAGO' },
]

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

function statusLabel(status) {
  return status === 'PAGO' ? 'Pago' : 'Em aberto'
}

function metodoLabel(metodoPagamento) {
  return metodoPagamento === 'PIX' ? 'Pix combinado' : 'Fiado'
}

function PedidosPage() {
  const [status, setStatus] = useState('')
  const [metodoPagamento, setMetodoPagamento] = useState('')
  const [busca, setBusca] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [pagandoId, setPagandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const query = useMemo(() => {
    const params = new URLSearchParams()

    if (status) params.set('status', status)
    if (metodoPagamento) params.set('metodoPagamento', metodoPagamento)
    if (busca.trim()) params.set('busca', busca.trim())
    if (inicio) params.set('inicio', inicio)
    if (fim) params.set('fim', fim)

    return params.toString()
  }, [busca, fim, inicio, metodoPagamento, status])

  const carregarPedidos = useCallback(async () => {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get(`/pedidos${query ? `?${query}` : ''}`)
      setPedidos(dados)
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar os pedidos. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }, [query])

  useEffect(() => {
    carregarPedidos()
  }, [carregarPedidos])

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
      await carregarPedidos()
    } catch (error) {
      setErro(error.message || 'Não foi possível marcar esse pedido como pago.')
    } finally {
      setPagandoId(null)
    }
  }

  function limparFiltros() {
    setStatus('')
    setMetodoPagamento('')
    setBusca('')
    setInicio('')
    setFim('')
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

      <form className="filter-panel" onSubmit={(event) => event.preventDefault()}>
        <label>
          Buscar
          <input
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Cliente, telefone ou produto"
            type="search"
            value={busca}
          />
        </label>

        <label>
          Pagamento
          <select onChange={(event) => setMetodoPagamento(event.target.value)} value={metodoPagamento}>
            <option value="">Todos</option>
            <option value="FIADO">Fiado</option>
            <option value="PIX">Pix</option>
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
      {mensagem && <p className="success">{mensagem}</p>}

      <div className="orders-list">
        {carregando ? (
          <div className="page-panel">
            <p className="muted">Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="page-panel empty-state">
            <h2>Nenhum pedido encontrado</h2>
            <p className="muted">Ajuste os filtros ou limpe a busca para ver outros pedidos.</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <article className="order-card" key={pedido.id}>
              <div className="order-header">
                <div>
                  <strong>{pedido.usuario.nome}</strong>
                  <span>{pedido.usuario.telefone}</span>
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
                <div className="order-footer-info">
                  <strong className="valor-mono">{moeda.format(Number(pedido.valorTotal))}</strong>
                  {pedido.comprovantePix && (
                    <a className="proof-link" href={assetUrl(pedido.comprovantePix)} rel="noreferrer" target="_blank">
                      Ver comprovante Pix
                    </a>
                  )}
                </div>
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
