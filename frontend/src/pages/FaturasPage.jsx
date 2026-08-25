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
  const [produtos, setProdutos] = useState([])
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('')
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [carregando, setCarregando] = useState(true)
  const [pagandoId, setPagandoId] = useState(null)
  const [removendoItemId, setRemovendoItemId] = useState(null)
  const [adicionandoProduto, setAdicionandoProduto] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const faturaSelecionada = useMemo(() => {
    if (!clienteSelecionadoId) {
      return faturas[0] || null
    }

    return faturas.find((fatura) => fatura.usuario.id === clienteSelecionadoId) || null
  }, [clienteSelecionadoId, faturas])

  const produtoSelecionado = useMemo(() => (
    produtos.find((produto) => produto.id === produtoSelecionadoId) || null
  ), [produtoSelecionadoId, produtos])

  const totalGeral = useMemo(() => (
    faturas.reduce((total, fatura) => total + Number(fatura.total), 0)
  ), [faturas])

  async function carregarFaturas() {
    setErro('')
    setCarregando(true)

    try {
      const [usuarios, produtosCarregados] = await Promise.all([
        api.get('/usuarios'),
        api.get('/produtos'),
      ])
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
      setProdutos(produtosCarregados)
      setClienteSelecionadoId((atual) => {
        if (atual && saldos.some((fatura) => fatura.usuario.id === atual)) {
          return atual
        }

        return saldos[0]?.usuario.id || ''
      })
      setProdutoSelecionadoId((atual) => {
        if (atual && produtosCarregados.some((produto) => produto.id === atual && produto.estoqueAtual > 0)) {
          return atual
        }

        return produtosCarregados.find((produto) => produto.estoqueAtual > 0)?.id || ''
      })
    } catch {
      setErro('Não foi possível carregar as faturas. Tente novamente em instantes.')
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
      setErro('Não foi possível marcar esse pedido como pago.')
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
      setErro('Não foi possível fechar a fatura inteira. Confira os pedidos e tente novamente.')
    } finally {
      setPagandoId(null)
    }
  }

  async function adicionarProdutoNaFatura(event) {
    event.preventDefault()

    const quantidadeNumerica = Number(quantidade)

    if (!faturaSelecionada || !produtoSelecionado) {
      setErro('Escolha um cliente e um produto para adicionar na fatura.')
      return
    }

    if (!Number.isInteger(quantidadeNumerica) || quantidadeNumerica <= 0) {
      setErro('Informe uma quantidade válida.')
      return
    }

    if (quantidadeNumerica > produtoSelecionado.estoqueAtual) {
      setErro(`So existem ${produtoSelecionado.estoqueAtual} unidade(s) desse produto em estoque.`)
      return
    }

    setErro('')
    setMensagem('')
    setAdicionandoProduto(true)

    try {
      await api.post('/pedidos/admin', {
        usuarioId: faturaSelecionada.usuario.id,
        metodoPagamento: 'FIADO',
        itens: [
          {
            produtoId: produtoSelecionado.id,
            quantidade: quantidadeNumerica,
          },
        ],
      })

      setMensagem(`Produto adicionado na fatura de ${faturaSelecionada.usuario.nome}.`)
      setQuantidade('1')
      await carregarFaturas()
    } catch (error) {
      setErro(error?.mensagem || 'Não foi possível adicionar o produto na fatura.')
    } finally {
      setAdicionandoProduto(false)
    }
  }

  async function retirarItemDaFatura(pedido, item) {
    const confirmou = window.confirm(`Retirar "${item.produto.nome}" da fatura de ${faturaSelecionada.usuario.nome}?`)

    if (!confirmou) {
      return
    }

    setErro('')
    setMensagem('')
    setRemovendoItemId(item.id)

    try {
      await api.delete(`/pedidos/${pedido.id}/itens/${item.id}`)
      setMensagem('Produto retirado da fatura.')
      await carregarFaturas()
    } catch (error) {
      setErro(error.message || 'Não foi possível retirar esse produto da fatura.')
    } finally {
      setRemovendoItemId(null)
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
      ) : faturas.length === 0 ? (
        <div className="page-panel positive-panel">
          <h2>Nenhum funcionário cadastrado</h2>
          <p>Cadastre um funcionário antes de lançar produtos em uma fatura.</p>
        </div>
      ) : (
        <div className="invoice-layout">
          <aside className="invoice-list" aria-label="Clientes">
            <div className="invoice-total-card">
              <span>Total em aberto</span>
              <strong className="valor-mono">{moeda.format(totalGeral)}</strong>
            </div>

            {faturas.map((fatura) => (
              <button
                className={faturaSelecionada?.usuario.id === fatura.usuario.id ? 'invoice-client active' : 'invoice-client'}
                key={fatura.usuario.id}
                onClick={() => setClienteSelecionadoId(fatura.usuario.id)}
                type="button"
              >
                <span className="invoice-client-name">{fatura.usuario.nome}</span>
                <span className="invoice-client-meta">
                  <strong className="valor-mono">{moeda.format(fatura.total)}</strong>
                  <small className="valor-mono">{fatura.pedidos.length} pedido(s)</small>
                </span>
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

              <form className="invoice-add-panel" onSubmit={adicionarProdutoNaFatura}>
                <div>
                  <p className="eyebrow">Lançamento manual</p>
                  <h3>Adicionar produto na fatura</h3>
                  <p className="muted">Use quando a vendedora entregar um produto direto para o cliente.</p>
                </div>

                <div className="invoice-add-form">
                  <label>
                    Produto
                    <select
                      onChange={(event) => setProdutoSelecionadoId(event.target.value)}
                      required
                      value={produtoSelecionadoId}
                    >
                      <option value="">Selecione</option>
                      {produtos.map((produto) => (
                        <option disabled={produto.estoqueAtual <= 0} key={produto.id} value={produto.id}>
                          {produto.nome} - {moeda.format(Number(produto.preco))} - estoque {produto.estoqueAtual}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Quantidade
                    <input
                      className="valor-mono"
                      min="1"
                      onChange={(event) => setQuantidade(event.target.value)}
                      required
                      step="1"
                      type="number"
                      value={quantidade}
                    />
                  </label>

                  <button disabled={adicionandoProduto || produtos.length === 0} type="submit">
                    {adicionandoProduto ? 'Adicionando...' : 'Adicionar na fatura'}
                  </button>
                </div>
              </form>

              {faturaSelecionada.pedidos.length === 0 ? (
                <div className="page-panel positive-panel">
                  <h2>Cliente em dia</h2>
                  <p>Essa fatura ainda não tem pedidos em aberto.</p>
                </div>
              ) : (
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
                          <span className="invoice-item-main">
                            <span>{item.produto.nome}</span>
                            <small>{formatarData(pedido.criadoEm)}</small>
                          </span>
                          <span className="invoice-item-values">
                            <strong className="valor-mono">{item.quantidade} un.</strong>
                            <span className="valor-mono">{moeda.format(Number(item.precoUnitario) * item.quantidade)}</span>
                          </span>
                          <button
                            className="danger-button compact-button"
                            disabled={removendoItemId === item.id}
                            onClick={() => retirarItemDaFatura(pedido, item)}
                            type="button"
                          >
                            {removendoItemId === item.id ? 'Retirando...' : 'Retirar'}
                          </button>
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
              )}
            </section>
          )}
        </div>
      )}
    </section>
  )
}

export default FaturasPage
