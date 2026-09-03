import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStoreConfig } from '../context/StoreConfigContext'
import { api } from '../services/api'

const LIMITE_COMPROVANTE_MB = 4

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const produtoInicialQuantidade = 1

function criarIdempotencyKey() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function limparQuantidade(valor) {
  return String(valor).replace(/\D/g, '')
}

function limitarQuantidade(valor, estoqueAtual, fallback = produtoInicialQuantidade) {
  const quantidade = Number.parseInt(valor, 10)
  const estoque = Number(estoqueAtual) || 0

  if (!Number.isFinite(quantidade)) {
    return fallback
  }

  return Math.max(produtoInicialQuantidade, Math.min(quantidade, estoque))
}

function produtoEmPromocao(produto) {
  return Boolean(produto.promocaoAtiva && produto.precoPromocional)
}

function precoAtual(produto) {
  return Number(produtoEmPromocao(produto) ? produto.precoPromocional : produto.preco)
}

function CatalogoPage() {
  const checkoutPanelRef = useRef(null)
  const { config } = useStoreConfig()
  const [produtos, setProdutos] = useState([])
  const [quantidades, setQuantidades] = useState({})
  const [carrinho, setCarrinho] = useState([])
  const [comprovantePix, setComprovantePix] = useState('')
  const [comprovantePixNome, setComprovantePixNome] = useState('')
  const [pedidoIdempotencyKey, setPedidoIdempotencyKey] = useState('')
  const [checkoutAberto, setCheckoutAberto] = useState(false)
  const [promocoesAbertas, setPromocoesAbertas] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmacao, setConfirmacao] = useState('')

  const produtosEmPromocao = useMemo(
    () => produtos.filter(produtoEmPromocao),
    [produtos],
  )

  const totalCarrinho = useMemo(() => carrinho.reduce(
    (total, item) => total + precoAtual(item.produto) * limitarQuantidade(item.quantidade, item.produto.estoqueAtual),
    0,
  ), [carrinho])

  async function carregarProdutos() {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get('/produtos')
      setProdutos(dados)
      setPromocoesAbertas(dados.some(produtoEmPromocao))
    } catch {
      setErro('Não foi possível carregar os produtos. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  useEffect(() => {
    if (!checkoutAberto) {
      return
    }

    const scrollOptions = { top: 0, left: 0, behavior: 'auto' }
    const overflowOriginal = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    window.scrollTo(scrollOptions)

    window.scrollTo({ top: 0, behavior: 'smooth' })

    window.requestAnimationFrame(() => {
      checkoutPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    const timer = window.setTimeout(() => {
      checkoutPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 80)

    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = overflowOriginal
    }
  }, [checkoutAberto])

  function quantidadeSelecionada(produto) {
    return quantidades[produto.id] ?? ''
  }

  function atualizarQuantidade(produto, valor) {
    setQuantidades((atual) => ({
      ...atual,
      [produto.id]: limparQuantidade(valor),
    }))
  }

  function normalizarQuantidadeProduto(produto) {
    setQuantidades((atual) => ({
      ...atual,
      [produto.id]: atual[produto.id]
        ? String(limitarQuantidade(atual[produto.id], produto.estoqueAtual))
        : '',
    }))
  }

  function adicionarAoCarrinho(produto) {
    const quantidade = limitarQuantidade(quantidadeSelecionada(produto), produto.estoqueAtual)
    setConfirmacao('')
    setErro('')

    setCarrinho((atual) => {
      const itemExistente = atual.find((item) => item.produto.id === produto.id)
      const quantidadeAtual = itemExistente
        ? limitarQuantidade(itemExistente.quantidade, produto.estoqueAtual)
        : 0
      const novaQuantidade = Math.min(quantidadeAtual + quantidade, produto.estoqueAtual)
      const quantidadeCarrinho = novaQuantidade === produtoInicialQuantidade ? '' : String(novaQuantidade)

      if (itemExistente) {
        return atual.map((item) => (
          item.produto.id === produto.id
            ? { ...item, produto, quantidade: quantidadeCarrinho }
            : item
        ))
      }

      return [...atual, { produto, quantidade: quantidadeCarrinho }]
    })
  }

  function atualizarItemCarrinho(produtoId, quantidade) {
    setCarrinho((atual) => atual.map((item) => {
      if (item.produto.id !== produtoId) {
        return item
      }

      return {
        ...item,
        quantidade: limparQuantidade(quantidade),
      }
    }))
  }

  function normalizarItemCarrinho(produtoId) {
    setCarrinho((atual) => atual.map((item) => {
      if (item.produto.id !== produtoId) {
        return item
      }

      return {
        ...item,
        quantidade: item.quantidade
          ? limitarQuantidade(item.quantidade, item.produto.estoqueAtual)
          : '',
      }
    }))
  }

  function removerItem(produtoId) {
    setCarrinho((atual) => atual.filter((item) => item.produto.id !== produtoId))
  }

  function abrirCheckout() {
    setErro('')
    setConfirmacao('')
    setPedidoIdempotencyKey((chaveAtual) => chaveAtual || criarIdempotencyKey())
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    window.scrollTo(0, 0)
    setCheckoutAberto(true)
  }

  function fecharCheckout() {
    if (enviando) {
      return
    }

    setCheckoutAberto(false)
    setComprovantePix('')
    setComprovantePixNome('')
  }

  function carregarComprovantePix(event) {
    const arquivo = event.target.files?.[0]

    if (!arquivo) {
      return
    }

    if (!arquivo.type.startsWith('image/')) {
      setErro('Anexe uma imagem do comprovante do Pix.')
      return
    }

    if (arquivo.size > LIMITE_COMPROVANTE_MB * 1024 * 1024) {
      setErro(`O comprovante precisa ter no máximo ${LIMITE_COMPROVANTE_MB} MB.`)
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setComprovantePix(reader.result)
      setComprovantePixNome(arquivo.name)
      setErro('')
    }

    reader.onerror = () => {
      setErro('Não foi possível carregar o comprovante.')
    }

    reader.readAsDataURL(arquivo)
  }

  async function finalizarPedido(metodoPagamento) {
    setErro('')
    setConfirmacao('')

    const itensValidos = carrinho
      .map((item) => ({
        produtoId: item.produto.id,
        quantidade: limitarQuantidade(item.quantidade, item.produto.estoqueAtual),
      }))
      .filter((item) => item.produtoId && item.quantidade > 0)

    if (itensValidos.length === 0) {
      setErro('Seu carrinho está vazio. Escolha pelo menos um produto antes de finalizar.')
      return
    }

    if (metodoPagamento === 'PIX' && !comprovantePix) {
      setErro('Anexe o comprovante do Pix antes de finalizar.')
      return
    }

    setEnviando(true)

    try {
      const chavePedido = pedidoIdempotencyKey || criarIdempotencyKey()
      setPedidoIdempotencyKey(chavePedido)

      await api.post('/pedidos', {
        idempotencyKey: chavePedido,
        metodoPagamento,
        itens: itensValidos,
        comprovantePix: metodoPagamento === 'PIX' ? comprovantePix : undefined,
        comprovantePixNome: metodoPagamento === 'PIX' ? comprovantePixNome : undefined,
      })

      setCarrinho([])
      setCheckoutAberto(false)
      setComprovantePix('')
      setComprovantePixNome('')
      setPedidoIdempotencyKey('')
      await carregarProdutos()

      if (metodoPagamento === 'FIADO') {
        setConfirmacao('Pedido registrado! Vai ficar no fiado até você acertar com a vendedora.')
      } else {
        setConfirmacao('Pedido registrado! Combine o Pix com a vendedora.')
      }
    } catch (error) {
      setErro(error.message || 'Não foi possível registrar o pedido. Confira os itens e tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="page-stack catalog-page">
      <div className="page-heading">
        <p className="eyebrow">Catálogo</p>
        <h1>Escolha seus produtos</h1>
      </div>

      {erro && !checkoutAberto && <p className="error">{erro}</p>}
      {confirmacao && <p className="success">{confirmacao}</p>}

      {carregando ? (
        <div className="page-panel">
          <p className="muted">Carregando produtos...</p>
        </div>
      ) : produtos.length === 0 ? (
        <div className="page-panel">
          <p className="muted">Nenhum produto disponível no momento.</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {produtos.map((produto) => {
            const semEstoque = produto.estoqueAtual === 0
            const emPromocao = produtoEmPromocao(produto)

            return (
              <article className={`product-card ${semEstoque ? 'disabled' : ''} ${emPromocao ? 'promo-card' : ''}`} key={produto.id}>
                {emPromocao && <span className="promo-ribbon">Promoção</span>}
                <div>
                  <span>{produto.categoria || 'Produto'}</span>
                  <h2>{produto.nome}</h2>
                  {emPromocao ? (
                    <div className="promo-price">
                      <s>{moeda.format(Number(produto.preco))}</s>
                      <strong className="valor-mono">{moeda.format(Number(produto.precoPromocional))}</strong>
                    </div>
                  ) : (
                    <strong className="valor-mono">{moeda.format(Number(produto.preco))}</strong>
                  )}
                  <p>{semEstoque ? 'Sem estoque no momento' : <><span className="valor-mono">{produto.estoqueAtual}</span> disponível</>}</p>
                </div>

                {!semEstoque && (
                  <div className="product-actions">
                    <label>
                      Quantidade
                      <input
                        max={produto.estoqueAtual}
                        min="1"
                        className="valor-mono"
                        inputMode="numeric"
                        onBlur={() => normalizarQuantidadeProduto(produto)}
                        onChange={(event) => atualizarQuantidade(produto, event.target.value)}
                        pattern="[0-9]*"
                        placeholder="1"
                        type="text"
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

      {promocoesAbertas && produtosEmPromocao.length > 0 && (
        <div className="promo-popover" role="dialog" aria-label="Produtos em promoção">
          <div className="section-title">
            <h2>Promoções de hoje</h2>
            <button className="secondary-button" onClick={() => setPromocoesAbertas(false)} type="button">
              Fechar
            </button>
          </div>
          <ul>
            {produtosEmPromocao.map((produto) => (
              <li key={produto.id}>
                <span>{produto.nome}</span>
                <strong className="valor-mono">{moeda.format(Number(produto.precoPromocional))}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {carrinho.length > 0 && (
        <aside className="cart-panel" aria-label="Carrinho">
          <div className="cart-header">
            <strong>Carrinho</strong>
            <span className="valor-mono">{moeda.format(totalCarrinho)}</span>
          </div>

          <ul>
            {carrinho.map((item) => {
              const quantidadeItem = limitarQuantidade(item.quantidade, item.produto.estoqueAtual, 0)

              return (
                <li key={item.produto.id}>
                  <span>{item.produto.nome}</span>
                  <input
                    aria-label={`Quantidade de ${item.produto.nome}`}
                    className="valor-mono"
                    inputMode="numeric"
                    max={item.produto.estoqueAtual}
                    min="1"
                    onBlur={() => normalizarItemCarrinho(item.produto.id)}
                    onChange={(event) => atualizarItemCarrinho(item.produto.id, event.target.value)}
                    pattern="[0-9]*"
                    placeholder="1"
                    type="text"
                    value={item.quantidade}
                  />
                  <strong className="valor-mono">{moeda.format(precoAtual(item.produto) * quantidadeItem)}</strong>
                  <button
                    className="secondary-button"
                    onClick={() => removerItem(item.produto.id)}
                    type="button"
                  >
                    Tirar
                  </button>
                </li>
              )
            })}
          </ul>

        </aside>
      )}

      {carrinho.length > 0 && !checkoutAberto && createPortal(
        <div className="cart-checkout-dock" role="region" aria-label="Resumo do pedido">
          <div className="cart-checkout-dock-content">
            <div className="cart-checkout-summary">
              <small>{carrinho.length} {carrinho.length === 1 ? 'produto' : 'produtos'}</small>
              <strong className="valor-mono">{moeda.format(totalCarrinho)}</strong>
            </div>
            <button className="cart-submit" type="button" onClick={abrirCheckout}>
              Finalizar pedido
            </button>
          </div>
        </div>,
        document.body,
      )}

      {checkoutAberto && createPortal(
        <div className="checkout-backdrop" role="presentation">
          <section className="checkout-panel" aria-label="Finalizar pedido" ref={checkoutPanelRef}>
            <div className="section-title">
              <h2>Finalizar pedido</h2>
              <button
                className="secondary-button"
                disabled={enviando}
                onClick={fecharCheckout}
                type="button"
              >
                Voltar
              </button>
            </div>

            <div className="checkout-total">
              <span>Total</span>
              <strong className="valor-mono">{moeda.format(totalCarrinho)}</strong>
            </div>

            {erro && <p className="error" role="alert">{erro}</p>}

            <div className="payment-options">
              <button
                className="payment-option"
                disabled={enviando}
                onClick={() => finalizarPedido('FIADO')}
                type="button"
              >
                <strong>Comprar fiado</strong>
                <span>Você paga depois diretamente com a vendedora.</span>
              </button>
              <button
                className="payment-option"
                disabled={enviando}
                onClick={() => finalizarPedido('PIX')}
                type="button"
              >
                <strong>Pagar com Pix</strong>
                <span>Combine o pagamento com a vendedora.</span>
              </button>
            </div>

            <div className="pix-checkout-box">
              <div>
                <p className="eyebrow">Pix</p>
                <h3>Dados para pagamento</h3>
                <p className="muted">Envie o Pix para a vendedora e anexe o print do comprovante antes de finalizar.</p>
              </div>

              <div className="pix-payment-grid">
                {config.pixQrCode ? (
                  <img alt="QR Code Pix da loja" className="pix-qr" src={config.pixQrCode} />
                ) : (
                  <div className="pix-empty-qr">QR Code Pix não configurado</div>
                )}

                <div className="pix-details">
                  <span>Chave Pix</span>
                  <strong>{config.pixChave || 'Chave Pix não configurada'}</strong>
                  <label>
                    Comprovante do Pix
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      onChange={carregarComprovantePix}
                      type="file"
                    />
                  </label>
                  {comprovantePixNome && <small>Arquivo anexado: {comprovantePixNome}</small>}
                </div>
              </div>
            </div>

            <ul className="checkout-list">
              {carrinho.map((item) => (
                <li key={item.produto.id}>
                  <span>{item.produto.nome} x <span className="valor-mono">{limitarQuantidade(item.quantidade, item.produto.estoqueAtual)}</span></span>
                  <strong className="valor-mono">{moeda.format(precoAtual(item.produto) * limitarQuantidade(item.quantidade, item.produto.estoqueAtual))}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>,
        document.body,
      )}
    </section>
  )
}

export default CatalogoPage
