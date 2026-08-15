import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const produtoInicialQuantidade = 1

function CatalogoPage() {
  const [produtos, setProdutos] = useState([])
  const [quantidades, setQuantidades] = useState({})
  const [carrinho, setCarrinho] = useState([])
  const [checkoutAberto, setCheckoutAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmacao, setConfirmacao] = useState('')

  const totalCarrinho = useMemo(() => carrinho.reduce(
    (total, item) => total + Number(item.produto.preco) * item.quantidade,
    0,
  ), [carrinho])

  async function carregarProdutos() {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get('/produtos')
      setProdutos(dados)
    } catch {
      setErro('Nao foi possivel carregar os produtos. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  function quantidadeSelecionada(produto) {
    return Number(quantidades[produto.id] || produtoInicialQuantidade)
  }

  function atualizarQuantidade(produto, valor) {
    const quantidade = Math.max(1, Math.min(Number(valor), produto.estoqueAtual))

    setQuantidades((atual) => ({
      ...atual,
      [produto.id]: quantidade,
    }))
  }

  function adicionarAoCarrinho(produto) {
    const quantidade = quantidadeSelecionada(produto)
    setConfirmacao('')
    setErro('')

    setCarrinho((atual) => {
      const itemExistente = atual.find((item) => item.produto.id === produto.id)
      const quantidadeAtual = itemExistente?.quantidade || 0
      const novaQuantidade = Math.min(quantidadeAtual + quantidade, produto.estoqueAtual)

      if (itemExistente) {
        return atual.map((item) => (
          item.produto.id === produto.id
            ? { ...item, quantidade: novaQuantidade }
            : item
        ))
      }

      return [...atual, { produto, quantidade: novaQuantidade }]
    })
  }

  function atualizarItemCarrinho(produtoId, quantidade) {
    setCarrinho((atual) => atual.map((item) => {
      if (item.produto.id !== produtoId) {
        return item
      }

      return {
        ...item,
        quantidade: Math.max(1, Math.min(Number(quantidade), item.produto.estoqueAtual)),
      }
    }))
  }

  function removerItem(produtoId) {
    setCarrinho((atual) => atual.filter((item) => item.produto.id !== produtoId))
  }

  async function finalizarPedido(metodoPagamento) {
    setErro('')
    setConfirmacao('')
    setEnviando(true)

    try {
      await api.post('/pedidos', {
        metodoPagamento,
        itens: carrinho.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
        })),
      })

      setCarrinho([])
      setCheckoutAberto(false)
      await carregarProdutos()

      if (metodoPagamento === 'FIADO') {
        setConfirmacao('Pedido registrado! Vai ficar no fiado ate voce acertar com a vendedora.')
      } else {
        setConfirmacao('Pedido registrado! Combine o Pix com a vendedora - em breve o pagamento por Pix vai ficar automatico aqui direto no app.')
      }
    } catch (error) {
      setErro(error.message || 'Nao foi possivel registrar o pedido. Confira os itens e tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="page-stack catalog-page">
      <div className="page-heading">
        <p className="eyebrow">Catalogo</p>
        <h1>Escolha seus produtos</h1>
      </div>

      {erro && <p className="error">{erro}</p>}
      {confirmacao && <p className="success">{confirmacao}</p>}

      {carregando ? (
        <div className="page-panel">
          <p className="muted">Carregando produtos...</p>
        </div>
      ) : produtos.length === 0 ? (
        <div className="page-panel">
          <p className="muted">Nenhum produto disponivel no momento.</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {produtos.map((produto) => {
            const semEstoque = produto.estoqueAtual === 0

            return (
              <article className={`product-card ${semEstoque ? 'disabled' : ''}`} key={produto.id}>
                <div>
                  <span>{produto.categoria || 'Produto'}</span>
                  <h2>{produto.nome}</h2>
                  <strong className="valor-mono">{moeda.format(Number(produto.preco))}</strong>
                  <p>{semEstoque ? 'Sem estoque no momento' : <><span className="valor-mono">{produto.estoqueAtual}</span> disponivel</>}</p>
                </div>

                {!semEstoque && (
                  <div className="product-actions">
                    <label>
                      Quantidade
                      <input
                        max={produto.estoqueAtual}
                        min="1"
                        onChange={(event) => atualizarQuantidade(produto, event.target.value)}
                        className="valor-mono"
                        type="number"
                        value={quantidadeSelecionada(produto)}
                      />
                    </label>

                    <button type="button" onClick={() => adicionarAoCarrinho(produto)}>
                      Adicionar
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {carrinho.length > 0 && (
        <aside className="cart-panel" aria-label="Carrinho">
          <div className="cart-header">
            <strong>Carrinho</strong>
            <span className="valor-mono">{moeda.format(totalCarrinho)}</span>
          </div>

          <ul>
            {carrinho.map((item) => (
              <li key={item.produto.id}>
                <span>{item.produto.nome}</span>
                <input
                  aria-label={`Quantidade de ${item.produto.nome}`}
                  className="valor-mono"
                  max={item.produto.estoqueAtual}
                  min="1"
                  onChange={(event) => atualizarItemCarrinho(item.produto.id, event.target.value)}
                  type="number"
                  value={item.quantidade}
                />
                <button
                  className="secondary-button"
                  onClick={() => removerItem(item.produto.id)}
                  type="button"
                >
                  Tirar
                </button>
              </li>
            ))}
          </ul>

          <button type="button" onClick={() => setCheckoutAberto(true)}>
            Finalizar pedido
          </button>
        </aside>
      )}

      {checkoutAberto && (
        <div className="checkout-backdrop" role="presentation">
          <section className="checkout-panel" aria-label="Finalizar pedido">
            <div className="section-title">
              <h2>Finalizar pedido</h2>
              <button
                className="secondary-button"
                disabled={enviando}
                onClick={() => setCheckoutAberto(false)}
                type="button"
              >
                Voltar
              </button>
            </div>

            <ul className="checkout-list">
              {carrinho.map((item) => (
                <li key={item.produto.id}>
                  <span>{item.produto.nome} x <span className="valor-mono">{item.quantidade}</span></span>
                  <strong className="valor-mono">{moeda.format(Number(item.produto.preco) * item.quantidade)}</strong>
                </li>
              ))}
            </ul>

            <div className="checkout-total">
              <span>Total</span>
              <strong className="valor-mono">{moeda.format(totalCarrinho)}</strong>
            </div>

            <div className="payment-options">
              <button
                disabled={enviando}
                onClick={() => finalizarPedido('FIADO')}
                type="button"
              >
                Deixar fiado
              </button>
              <button
                disabled={enviando}
                onClick={() => finalizarPedido('PIX')}
                type="button"
              >
                Pagar com Pix
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

export default CatalogoPage
