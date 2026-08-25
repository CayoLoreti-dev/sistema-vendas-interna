import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const entradaInicial = {
  vendedorId: '',
  produtoId: '',
  quantidade: '',
  fornecedor: '',
  precoPago: '',
  tipoCompra: 'CAIXA',
  quantidadeCaixas: '',
  quantidadePacotes: '',
}

const vendaInicial = {
  item: null,
  quantidade: '',
}

function tipoMovimentacaoLabel(tipo) {
  return tipo === 'COLOCOU_PRA_VENDA' ? 'Colocou pra venda' : 'Entrada'
}

function tipoCompraLabel(tipoCompra) {
  return tipoCompra === 'PACOTE' ? 'Pacotes' : 'Caixas'
}

function EstoqueInternoPage() {
  const { usuario } = useAuth()
  const [estoque, setEstoque] = useState([])
  const [produtos, setProdutos] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [filtroVendedorId, setFiltroVendedorId] = useState('')
  const [entrada, setEntrada] = useState(entradaInicial)
  const [venda, setVenda] = useState(vendaInicial)
  const [historico, setHistorico] = useState({ item: null, movimentacoes: [] })
  const [carregando, setCarregando] = useState(true)
  const [salvandoEntrada, setSalvandoEntrada] = useState(false)
  const [salvandoVenda, setSalvandoVenda] = useState(false)
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const isMaster = usuario?.papel === 'ADMIN'

  const vendedoresDisponiveis = useMemo(
    () => vendedores.filter((vendedor) => vendedor.papel === 'VENDEDOR'),
    [vendedores],
  )

  const carregarDados = useCallback(async (vendedorId = filtroVendedorId) => {
    setErro('')
    setCarregando(true)

    try {
      const query = isMaster && vendedorId ? `?vendedorId=${vendedorId}` : ''
      const [estoqueDados, produtosDados, usuariosDados] = await Promise.all([
        api.get(`/estoque-interno${query}`),
        api.get('/produtos'),
        isMaster ? api.get('/usuarios') : Promise.resolve([]),
      ])

      setEstoque(estoqueDados)
      setProdutos(produtosDados)
      setVendedores(usuariosDados)
    } catch {
      setErro('Não foi possível carregar o estoque interno.')
    } finally {
      setCarregando(false)
    }
  }, [filtroVendedorId, isMaster])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  function atualizarEntrada(campo, valor) {
    setEntrada((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  async function adicionarEntrada(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setSalvandoEntrada(true)

    try {
      await api.post('/estoque-interno/entrada', {
        produtoId: entrada.produtoId,
        quantidade: Number(entrada.quantidade),
        fornecedor: entrada.fornecedor,
        precoPago: entrada.precoPago,
        tipoCompra: entrada.tipoCompra,
        quantidadeCaixas: entrada.tipoCompra === 'CAIXA' ? Number(entrada.quantidadeCaixas) : null,
        quantidadePacotes: entrada.tipoCompra === 'PACOTE' ? Number(entrada.quantidadePacotes) : null,
        ...(isMaster && { vendedorId: entrada.vendedorId }),
      })

      setEntrada(entradaInicial)
      setMensagem('Entrada adicionada ao estoque interno.')
      await carregarDados()
    } catch (error) {
      setErro(error.message || 'Não foi possível adicionar essa entrada.')
    } finally {
      setSalvandoEntrada(false)
    }
  }

  async function colocarParaVenda(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setSalvandoVenda(true)

    try {
      await api.post(`/estoque-interno/${venda.item.id}/colocar-venda`, {
        quantidade: Number(venda.quantidade),
      })

      setVenda(vendaInicial)
      setMensagem('Produto colocado para venda.')
      await carregarDados()
    } catch (error) {
      setErro(error.message || 'Não foi possível colocar esse produto para venda.')
    } finally {
      setSalvandoVenda(false)
    }
  }

  async function abrirHistorico(item) {
    setHistorico({ item, movimentacoes: [] })
    setCarregandoHistorico(true)
    setErro('')

    try {
      const movimentacoes = await api.get(`/estoque-interno/${item.id}/historico`)
      setHistorico({ item, movimentacoes })
    } catch {
      setErro('Não foi possível carregar o histórico.')
    } finally {
      setCarregandoHistorico(false)
    }
  }

  async function filtrarVendedor(vendedorId) {
    setFiltroVendedorId(vendedorId)
    await carregarDados(vendedorId)
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Meu estoque</p>
        <h1>Estoque interno</h1>
      </div>

      {isMaster && (
        <div className="form-panel">
          <h2>Filtrar por vendedor</h2>
          <label>
            Vendedor
            <select
              onChange={(event) => filtrarVendedor(event.target.value)}
              value={filtroVendedorId}
            >
              <option value="">Todos os vendedores</option>
              {vendedoresDisponiveis.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <form className="form-panel" onSubmit={adicionarEntrada}>
        <h2>Cadastrar produto no estoque</h2>
        <div className="form-grid">
          {isMaster && (
            <label>
              Vendedor
              <select
                onChange={(event) => atualizarEntrada('vendedorId', event.target.value)}
                required
                value={entrada.vendedorId}
              >
                <option value="">Selecione</option>
                {vendedoresDisponiveis.map((vendedor) => (
                  <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>
                ))}
              </select>
            </label>
          )}

          <label>
            Produto
            <select
              onChange={(event) => atualizarEntrada('produtoId', event.target.value)}
              required
              value={entrada.produtoId}
            >
              <option value="">Selecione</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>{produto.nome}</option>
              ))}
            </select>
          </label>

          <label>
            Quantidade
            <input
              className="valor-mono"
              min="1"
              onChange={(event) => atualizarEntrada('quantidade', event.target.value)}
              required
              step="1"
              type="number"
              value={entrada.quantidade}
            />
          </label>

          <label>
            Fornecedor
            <input
              onChange={(event) => atualizarEntrada('fornecedor', event.target.value)}
              required
              type="text"
              value={entrada.fornecedor}
            />
          </label>

          <label>
            Preço pago
            <input
              className="valor-mono"
              min="0.01"
              onChange={(event) => atualizarEntrada('precoPago', event.target.value)}
              required
              step="0.01"
              type="number"
              value={entrada.precoPago}
            />
          </label>

          <label>
            Tipo da compra
            <select
              onChange={(event) => atualizarEntrada('tipoCompra', event.target.value)}
              required
              value={entrada.tipoCompra}
            >
              <option value="CAIXA">Caixa</option>
              <option value="PACOTE">Pacote</option>
            </select>
          </label>

          {entrada.tipoCompra === 'CAIXA' ? (
            <label>
              Quantas caixas
              <input
                className="valor-mono"
                min="1"
                onChange={(event) => atualizarEntrada('quantidadeCaixas', event.target.value)}
                required
                step="1"
                type="number"
                value={entrada.quantidadeCaixas}
              />
            </label>
          ) : (
            <label>
              Quantos pacotes
              <input
                className="valor-mono"
                min="1"
                onChange={(event) => atualizarEntrada('quantidadePacotes', event.target.value)}
                required
                step="1"
                type="number"
                value={entrada.quantidadePacotes}
              />
            </label>
          )}
        </div>
        <button disabled={salvandoEntrada || produtos.length === 0} type="submit">
          {salvandoEntrada ? 'Salvando...' : 'Cadastrar no estoque'}
        </button>
      </form>

      {erro && <p className="error">{erro}</p>}
      {mensagem && <p className="success">{mensagem}</p>}

      <div className="table-panel">
        {carregando ? (
          <p>Carregando estoque...</p>
        ) : estoque.length === 0 ? (
          <p>Nenhum item no estoque interno.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {isMaster && <th>Vendedor</th>}
                <th>Produto</th>
                <th>Estoque interno</th>
                <th>À venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {estoque.map((item) => (
                <tr key={item.id}>
                  {isMaster && <td>{item.vendedor.nome}</td>}
                  <td>{item.produto.nome}</td>
                  <td className="valor-mono">{item.quantidade}</td>
                  <td className="valor-mono">{item.produto.estoqueAtual}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        disabled={item.quantidade <= 0}
                        onClick={() => setVenda({ item, quantidade: '' })}
                        type="button"
                      >
                        Colocar pra venda
                      </button>
                      <button className="secondary-button" onClick={() => abrirHistorico(item)} type="button">
                        Histórico
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {historico.item && (
        <section className="page-panel">
          <div className="section-title">
            <h2>Histórico de {historico.item.produto.nome}</h2>
            <button
              className="secondary-button"
              onClick={() => setHistorico({ item: null, movimentacoes: [] })}
              type="button"
            >
              Fechar
            </button>
          </div>

          {carregandoHistorico ? (
            <p className="muted">Carregando histórico...</p>
          ) : historico.movimentacoes.length === 0 ? (
            <p className="muted">Nenhuma movimentação registrada.</p>
          ) : (
            <ul className="items-list">
              {historico.movimentacoes.map((movimentacao) => (
                <li key={movimentacao.id}>
                  <div>
                    <span>{tipoMovimentacaoLabel(movimentacao.tipo)}</span>
                    {movimentacao.tipo === 'ENTRADA' && (
                      <p className="muted">
                        {movimentacao.fornecedor} · {tipoCompraLabel(movimentacao.tipoCompra)}:{' '}
                        <span className="valor-mono">
                          {movimentacao.tipoCompra === 'CAIXA'
                            ? movimentacao.quantidadeCaixas
                            : movimentacao.quantidadePacotes}
                        </span>
                        {' '}· pago: <span className="valor-mono">R$ {Number(movimentacao.precoPago).toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                  <strong className="valor-mono">{movimentacao.quantidade} un.</strong>
                  <small>{new Date(movimentacao.criadoEm).toLocaleString('pt-BR')}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {venda.item && (
        <div className="checkout-backdrop" role="presentation">
          <form className="checkout-panel" onSubmit={colocarParaVenda}>
            <div className="section-title">
              <h2>Colocar pra venda</h2>
              <button
                className="secondary-button"
                disabled={salvandoVenda}
                onClick={() => setVenda(vendaInicial)}
                type="button"
              >
                Fechar
              </button>
            </div>

            <p className="muted">
              Produto: <strong>{venda.item.produto.nome}</strong>
            </p>

            <label>
              Quantidade
              <input
                className="valor-mono"
                max={venda.item.quantidade}
                min="1"
                onChange={(event) => setVenda((atual) => ({
                  ...atual,
                  quantidade: event.target.value,
                }))}
                required
                step="1"
                type="number"
                value={venda.quantidade}
              />
            </label>

            <button disabled={salvandoVenda} type="submit">
              {salvandoVenda ? 'Movendo...' : 'Colocar pra venda'}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

export default EstoqueInternoPage
