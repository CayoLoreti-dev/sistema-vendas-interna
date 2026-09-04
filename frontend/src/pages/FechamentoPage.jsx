import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function dataLocalISO(data = new Date()) {
  const offset = data.getTimezoneOffset()
  const dataLocal = new Date(data.getTime() - offset * 60 * 1000)

  return dataLocal.toISOString().slice(0, 10)
}

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function FechamentoPage() {
  const hoje = useMemo(() => dataLocalISO(), [])
  const [inicio, setInicio] = useState(hoje)
  const [fim, setFim] = useState(hoje)
  const [relatorio, setRelatorio] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [baixando, setBaixando] = useState(false)
  const [erro, setErro] = useState('')

  const query = useMemo(() => (
    `inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`
  ), [inicio, fim])

  const carregarFechamento = useCallback(async () => {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get(`/relatorios/fechamento?${query}`)
      setRelatorio(dados)
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar o fechamento.')
    } finally {
      setCarregando(false)
    }
  }, [query])

  useEffect(() => {
    carregarFechamento()
  }, [carregarFechamento])

  async function filtrar(event) {
    event.preventDefault()
    await carregarFechamento()
  }

  async function baixarCsv() {
    setErro('')
    setBaixando(true)

    try {
      await api.download(`/relatorios/fechamento.csv?${query}`, `fechamento-${inicio}-${fim}.csv`)
    } catch (error) {
      setErro(error.message || 'Não foi possível baixar o fechamento.')
    } finally {
      setBaixando(false)
    }
  }

  const totais = relatorio?.totais || {
    totalVendido: 0,
    totalPago: 0,
    totalEmAberto: 0,
    totalPix: 0,
    totalFiado: 0,
    totalPedidos: 0,
    totalItens: 0,
    custoEstimado: 0,
    lucroEstimado: 0,
    margemLucro: 0,
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Fechamento</p>
        <h1>Resumo financeiro</h1>
      </div>

      <form className="filter-panel" onSubmit={filtrar}>
        <label>
          Início
          <input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} required />
        </label>
        <label>
          Fim
          <input type="date" value={fim} onChange={(event) => setFim(event.target.value)} required />
        </label>
        <div className="actions">
          <button disabled={carregando} type="submit">
            {carregando ? 'Carregando...' : 'Filtrar'}
          </button>
          <button className="secondary-button" disabled={baixando || carregando} onClick={baixarCsv} type="button">
            {baixando ? 'Baixando...' : 'Baixar CSV'}
          </button>
        </div>
      </form>

      {erro && <p className="error">{erro}</p>}

      <div className="summary-grid">
        <section className="summary-card">
          <span>Total vendido</span>
          <strong className="valor-mono">{moeda.format(totais.totalVendido)}</strong>
          <p>{totais.totalPedidos} pedido(s), {totais.totalItens} item(ns).</p>
        </section>

        <section className="summary-card">
          <span>Pago</span>
          <strong className="valor-mono">{moeda.format(totais.totalPago)}</strong>
          <p>Pedidos já marcados como pagos.</p>
        </section>

        <section className={`summary-card ${totais.totalEmAberto > 0 ? 'attention' : ''}`}>
          <span>Em aberto</span>
          <strong className="valor-mono">{moeda.format(totais.totalEmAberto)}</strong>
          <p>Valor ainda fiado.</p>
        </section>

        <section className="summary-card">
          <span>Pix / Fiado</span>
          <strong className="valor-mono">{moeda.format(totais.totalPix)}</strong>
          <p>Fiado: <span className="valor-mono">{moeda.format(totais.totalFiado)}</span></p>
        </section>

        <section className="summary-card">
          <span>Custo estimado</span>
          <strong className="valor-mono">{moeda.format(totais.custoEstimado)}</strong>
          <p>Calculado pelo custo médio das entradas do estoque.</p>
        </section>

        <section className={`summary-card ${totais.lucroEstimado > 0 ? 'positive-panel' : ''}`}>
          <span>Lucro estimado</span>
          <strong className="valor-mono">{moeda.format(totais.lucroEstimado)}</strong>
          <p>Margem: <span className="valor-mono">{Number(totais.margemLucro).toFixed(1)}%</span></p>
        </section>
      </div>

      <section className="table-panel">
        <div className="section-title">
          <h2>Produtos vendidos</h2>
        </div>

        {carregando ? (
          <p className="muted">Carregando produtos vendidos...</p>
        ) : !relatorio?.produtos?.length ? (
          <p className="muted">Nenhum produto vendido nesse período.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Total</th>
                <th>Custo estimado</th>
                <th>Lucro estimado</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.produtos.map((produto) => (
                <tr key={produto.produtoId}>
                  <td>{produto.nome}</td>
                  <td>{produto.categoria || '-'}</td>
                  <td className="valor-mono">{produto.quantidade} un.</td>
                  <td className="valor-mono">{moeda.format(produto.total)}</td>
                  <td className="valor-mono">{moeda.format(produto.custoTotal)}</td>
                  <td className="valor-mono">{moeda.format(produto.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="orders-list">
        <div className="section-title">
          <h2>Pedidos do período</h2>
        </div>

        {carregando ? (
          <div className="page-panel">
            <p className="muted">Carregando pedidos...</p>
          </div>
        ) : !relatorio?.pedidos?.length ? (
          <div className="page-panel">
            <p className="muted">Nenhum pedido nesse período.</p>
          </div>
        ) : (
          relatorio.pedidos.map((pedido) => (
            <article className="order-card" key={pedido.id}>
              <div className="order-header">
                <div>
                  <strong>{pedido.usuario.nome}</strong>
                  <span>{formatarData(pedido.criadoEm)}</span>
                </div>
                <span className={`status-badge ${pedido.status === 'PAGO' ? 'paid' : 'open'}`}>
                  {pedido.status === 'PAGO' ? 'Pago' : 'Em aberto'}
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
                <span className={`method-badge ${pedido.metodoPagamento === 'PIX' ? 'pix' : 'fiado'}`}>
                  {pedido.metodoPagamento === 'PIX' ? 'Pix' : 'Fiado'}
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </section>
  )
}

export default FechamentoPage
